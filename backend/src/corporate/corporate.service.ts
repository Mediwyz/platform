import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TreasuryService } from '../shared/services/treasury.service';
import { MoneyFormatService } from '../shared/services/money-format.service';
import { ReimbursementService } from './reimbursement/reimbursement.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ManageMemberDto } from './dto/manage-member.dto';

@Injectable()
export class CorporateService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private treasury: TreasuryService,
    private reimbursement: ReimbursementService,
    private money: MoneyFormatService,
  ) {}

  /**
   * Pro-rated refund for a monthly plan being cancelled mid-cycle. If the
   * user paid `price` on `startDate` and today is day D of a 30-day cycle,
   * we refund `price * (30 - D) / 30` (floored at 0). Designed to never
   * over-refund: past 30 days, returns 0.
   */
  private computeProratedRefund(startDate: Date, price: number): number {
    const CYCLE = 30 * 24 * 3600e3;
    const elapsed = Date.now() - startDate.getTime();
    if (elapsed <= 0) return price; // paid and immediately switched
    if (elapsed >= CYCLE) return 0;  // past one cycle — nothing to refund
    const unused = (CYCLE - elapsed) / CYCLE;
    return Math.round(price * unused * 100) / 100;
  }

  /**
   * Returns true if the user is allowed to act as a corporate admin.
   * Corporate-admin is a CAPABILITY (not a role): granted to any user who
   *   - owns a CorporateAdminProfile (already created a company), OR
   *   - has an active corporate/enterprise UserSubscription.
   * The legacy CORPORATE_ADMIN userType is also honored for backwards compat.
   */
  async userHasCorporateCapability(userId: string): Promise<boolean> {
    if (!userId) return false;

    // 1. Owns a company → has the capability.
    const profile = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId }, select: { id: true },
    });
    if (profile) return true;

    // 2. Has an active corporate/enterprise subscription as the buyer.
    const sub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'active',
        plan: { type: { in: ['corporate', 'enterprise'] } },
      },
      select: { id: true },
    }).catch(() => null);
    if (sub) return true;

    // 3. Legacy CORPORATE_ADMIN userType users keep working.
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { userType: true },
    });
    return user?.userType === 'CORPORATE_ADMIN';
  }

  /**
   * Returns true if the user runs an insurance company (i.e. owns a
   * CorporateAdminProfile flagged as isInsuranceCompany). Legacy
   * INSURANCE_REP userType is also honored for backwards compat.
   */
  async userHasInsuranceCapability(userId: string): Promise<boolean> {
    if (!userId) return false;
    const profile = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId, isInsuranceCompany: true }, select: { id: true },
    });
    if (profile) return true;
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { userType: true },
    });
    return user?.userType === 'INSURANCE_REP';
  }

  /** List companies for signup enrollment */
  async getCompanies() {
    try {
      const companies = await this.prisma.corporateAdminProfile.findMany({
        select: { id: true, companyName: true },
        orderBy: { companyName: 'asc' },
      });
      return companies;
    } catch {
      return [];
    }
  }

  /**
   * Companies the user OWNS (insurance + generic). Used by the "My
   * Organisations" grid to surface insurance under the Insurance category and
   * everything else under Other. Note: members are tracked per-owner
   * (CorporateEmployee.corporateAdminId = userId), so memberCount is the
   * owner's active-member total, shared across their companies.
   */
  async getOwnedCompanies(userId: string) {
    const companies = await this.prisma.corporateAdminProfile.findMany({
      where: { userId },
      select: { id: true, companyName: true, isInsuranceCompany: true, industry: true },
      orderBy: { companyName: 'asc' },
    });
    if (companies.length === 0) return [];
    // Active member count PER company.
    const grouped = await this.prisma.corporateEmployee.groupBy({
      by: ['companyId'],
      where: { companyId: { in: companies.map((c) => c.id) }, status: 'active' },
      _count: { _all: true },
    });
    const countBy = new Map(grouped.map((g) => [g.companyId, g._count._all]));
    return companies.map((c) => ({ ...c, memberCount: countBy.get(c.id) ?? 0 }));
  }

  /** Throw unless `userId` owns `companyId`. Returns the company. */
  private async assertCompanyOwner(companyId: string, userId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { id: companyId, userId },
      select: { id: true, companyName: true, isInsuranceCompany: true },
    });
    if (!company) throw new ForbiddenException('Company not found or not yours');
    return company;
  }

  /** Members of a specific company (founder only). */
  async getCompanyMembers(companyId: string, userId: string) {
    const company = await this.assertCompanyOwner(companyId, userId);
    const members = await this.prisma.corporateEmployee.findMany({
      where: { companyId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, profileImage: true } } },
      orderBy: { joinedAt: 'desc' },
    });
    return {
      company,
      members: members.map((m) => ({
        id: m.id, userId: m.userId, status: m.status,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(), email: m.user.email,
        profileImage: m.user.profileImage, joinedAt: m.joinedAt,
      })),
    };
  }

  /** Invite a user (by email) to a specific company (founder only). */
  async inviteCompanyMember(companyId: string, ownerUserId: string, email: string) {
    const company = await this.assertCompanyOwner(companyId, ownerUserId);
    const targetUser = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!targetUser) throw new NotFoundException('User not found — they need to register first');
    if (targetUser.id === ownerUserId) throw new BadRequestException('You cannot invite yourself');
    const existing = await this.prisma.corporateEmployee.findUnique({
      where: { corporateAdminId_userId: { corporateAdminId: ownerUserId, userId: targetUser.id } },
    });
    if (existing && existing.status !== 'removed') {
      throw new BadRequestException('User is already a member of one of your companies');
    }
    const member = existing
      ? await this.prisma.corporateEmployee.update({
          where: { id: existing.id },
          data: { status: 'pending', companyId, approvedAt: null, removedAt: null, joinedAt: new Date() },
        })
      : await this.prisma.corporateEmployee.create({
          data: { corporateAdminId: ownerUserId, companyId, userId: targetUser.id, status: 'pending' },
        });
    await this.notifications.createNotification({
      userId: targetUser.id, type: 'corporate_invitation', title: 'Company Invitation',
      message: `You have been invited to join ${company.companyName}. Accept or decline in your dashboard.`,
      referenceId: member.id, referenceType: 'corporate_employee',
    });
    return member;
  }

  /** Approve / reject / remove a company member (founder only). */
  async manageCompanyMember(companyId: string, ownerUserId: string, memberId: string, action: 'approve' | 'reject' | 'remove') {
    await this.assertCompanyOwner(companyId, ownerUserId);
    const member = await this.prisma.corporateEmployee.findFirst({ where: { id: memberId, companyId } });
    if (!member) throw new NotFoundException('Member not found');
    const now = new Date();
    const data = action === 'approve'
      ? { status: 'active' as const, approvedAt: now }
      : { status: 'removed' as const, removedAt: now };
    return this.prisma.corporateEmployee.update({ where: { id: memberId }, data });
  }

  /**
   * Create a new company OR update the user's only company.
   * Multi-company support: if the user already owns ≥2 companies, creating
   * a new one with the same `companyName` is a no-op (idempotent from the
   * current-flow perspective); a new company with a different name is
   * inserted. To update a specific company, pass `companyId` in the DTO.
   */
  async createCompany(userId: string, dto: CreateCompanyDto & { companyId?: string }) {
    const base = {
      companyName: dto.companyName,
      registrationNumber: dto.registrationNumber ?? null,
      industry: dto.industry ?? null,
      employeeCount: dto.employeeCount ?? null,
      subscriptionPlanId: dto.subscriptionPlanId ?? null,
      isInsuranceCompany: dto.isInsuranceCompany ?? false,
      monthlyContribution: dto.monthlyContribution ?? null,
      coverageDescription: dto.coverageDescription ?? null,
    };

    // If caller names a specific company and owns it, update.
    if (dto.companyId) {
      const mine = await this.prisma.corporateAdminProfile.findFirst({
        where: { id: dto.companyId, userId }, select: { id: true },
      });
      if (!mine) throw new NotFoundException('Company not found or not yours');
      return this.prisma.corporateAdminProfile.update({
        where: { id: dto.companyId }, data: base,
      });
    }

    // Otherwise: match-or-create by (userId, companyName) so repeated calls
    // from the signup flow don't spawn duplicate rows.
    const existing = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId, companyName: dto.companyName }, select: { id: true },
    });
    if (existing) {
      return this.prisma.corporateAdminProfile.update({
        where: { id: existing.id }, data: base,
      });
    }
    return this.prisma.corporateAdminProfile.create({
      data: { userId, ...base },
    });
  }

  // ─── Company analytics ────────────────────────────────────────────────

  async getCompanyAnalytics(ownerUserId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId: ownerUserId },
      select: { id: true, userId: true, companyName: true, monthlyContribution: true, isInsuranceCompany: true },
    });
    if (!company) throw new NotFoundException('You do not own a company');

    const [activeMembers, pendingMembers, removedMembers, totalMembers, claimsAgg] = await Promise.all([
      this.prisma.corporateEmployee.count({ where: { corporateAdminId: company.userId, status: 'active' } }),
      this.prisma.corporateEmployee.count({ where: { corporateAdminId: company.userId, status: 'pending' } }),
      this.prisma.corporateEmployee.count({ where: { corporateAdminId: company.userId, status: 'removed' } }),
      this.prisma.corporateEmployee.count({ where: { corporateAdminId: company.userId } }),
      this.prisma.insuranceClaimSubmission.groupBy({
        by: ['status'],
        where: { companyProfileId: company.id },
        _count: true,
        _sum: { amount: true },
      }).catch(() => [] as any[]),
    ]);

    const claimsSummary: Record<string, { count: number; totalAmount: number }> = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      denied: { count: 0, totalAmount: 0 },
      paid: { count: 0, totalAmount: 0 },
    };
    for (const row of claimsAgg) {
      claimsSummary[row.status] = { count: row._count, totalAmount: row._sum.amount ?? 0 };
    }

    return {
      company: { id: company.id, name: company.companyName, isInsuranceCompany: company.isInsuranceCompany },
      members: { active: activeMembers, pending: pendingMembers, removed: removedMembers, total: totalMembers },
      monthlyExpectedRevenue: (company.monthlyContribution ?? 0) * activeMembers,
      claimsByStatus: claimsSummary,
    };
  }

  // ─── Ownership management ────────────────────────────────────────────

  async transferCompany(ownerUserId: string, companyProfileId: string, newOwnerEmail: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { id: companyProfileId, userId: ownerUserId },
      select: { id: true, companyName: true },
    });
    if (!company) throw new NotFoundException('Company not found or not yours');

    const newOwner = await this.prisma.user.findUnique({
      where: { email: newOwnerEmail.trim().toLowerCase() },
      select: { id: true },
    });
    if (!newOwner) throw new NotFoundException('New owner user not found');
    if (newOwner.id === ownerUserId) throw new BadRequestException('Already the owner');

    // Current schema: CorporateAdminProfile.userId is @unique. Transfer requires
    // the new owner have no existing company. This is a stepping stone until
    // multi-company support is added.
    // Multi-company ownership is allowed — a user can own any number of
    // companies. No pre-existing-company check needed.

    const updated = await this.prisma.corporateAdminProfile.update({
      where: { id: company.id },
      data: { userId: newOwner.id },
    });
    this.notifications.createNotification({
      userId: newOwner.id, type: 'corporate',
      title: `You now own ${company.companyName}`,
      message: 'Company ownership has been transferred to you.',
      referenceId: company.id, referenceType: 'company',
    }).catch(() => {});
    return updated;
  }

  async deleteCompany(ownerUserId: string, companyProfileId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { id: companyProfileId, userId: ownerUserId },
      select: { id: true, userId: true },
    });
    if (!company) throw new NotFoundException('Company not found or not yours');

    await this.prisma.corporateEmployee.updateMany({
      where: { corporateAdminId: company.userId, status: { in: ['active', 'pending'] } },
      data: { status: 'removed', removedAt: new Date() },
    });
    await this.prisma.corporateAdminProfile.delete({ where: { id: company.id } });
    return { deleted: true, companyId: company.id };
  }

  // ─── Insurance (company-based) ─────────────────────────────────────────

  /** Public-ish search of all insurance companies (anyone can browse). */
  async searchInsuranceCompanies(q?: string) {
    const where: any = { isInsuranceCompany: true };
    if (q && q.trim()) {
      where.companyName = { contains: q.trim(), mode: 'insensitive' };
    }
    return this.prisma.corporateAdminProfile.findMany({
      where,
      select: {
        id: true, companyName: true, industry: true,
        monthlyContribution: true, coverageDescription: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { } },
      },
      orderBy: { companyName: 'asc' },
    });
  }

  /**
   * Returns ALL company partners — corporate companies + insurance companies
   * from both CorporateAdminProfile and InsuranceRepProfile (legacy).
   * type: 'all' | 'insurance' | 'corporate'
   */
  async searchAllCompanies(q?: string, type?: string) {
    const qTrim = q?.trim();

    // ── CorporateAdminProfile companies ───────────────────────────────────
    const corpWhere: any = {};
    if (type === 'insurance') corpWhere.isInsuranceCompany = true;
    if (type === 'corporate') corpWhere.isInsuranceCompany = false;
    if (qTrim) corpWhere.companyName = { contains: qTrim, mode: 'insensitive' };

    const corpCompanies = await this.prisma.corporateAdminProfile.findMany({
      where: corpWhere,
      select: {
        id: true, companyName: true, industry: true,
        isInsuranceCompany: true, monthlyContribution: true,
        coverageDescription: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { companyName: 'asc' },
    });

    // ── InsuranceRepProfile companies (legacy) ──────────────���─────────────
    // Only include when type is 'all' or 'insurance'
    let legacyInsurance: Array<{
      id: string; companyName: string; industry: string | null;
      isInsuranceCompany: boolean; monthlyContribution: null;
      coverageDescription: string | null;
      user: { id: string; firstName: string; lastName: string } | null;
    }> = [];

    if (!type || type === 'all' || type === 'insurance') {
      const insWhere: any = {};
      if (qTrim) insWhere.companyName = { contains: qTrim, mode: 'insensitive' };
      const reps = await this.prisma.insuranceRepProfile.findMany({
        where: insWhere,
        select: {
          id: true, companyName: true, coverageTypes: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { companyName: 'asc' },
      });
      legacyInsurance = reps.map(r => ({
        id: r.id,
        companyName: r.companyName,
        industry: 'Insurance',
        isInsuranceCompany: true,
        monthlyContribution: null,
        coverageDescription: r.coverageTypes?.join(', ') || null,
        user: r.user,
      }));
    }

    // Deduplicate by companyName (CorporateAdminProfile wins over legacy)
    const seen = new Set<string>();
    const merged: typeof legacyInsurance = [];
    for (const c of [...corpCompanies.map(c => ({ ...c, industry: c.industry ?? null, coverageDescription: c.coverageDescription ?? null, user: c.user ?? null })), ...legacyInsurance]) {
      const key = c.companyName.toLowerCase();
      if (!seen.has(key)) { seen.add(key); merged.push(c); }
    }
    return merged.sort((a, b) => a.companyName.localeCompare(b.companyName));
  }

  /** Member joins an insurance company — deducts first month from wallet. */
  async joinInsuranceCompany(userId: string, companyProfileId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { id: companyProfileId, isInsuranceCompany: true },
      select: { id: true, companyName: true, userId: true, monthlyContribution: true },
    });
    if (!company) throw new NotFoundException('Insurance company not found');
    if (company.userId === userId) throw new BadRequestException('You own this company');

    const amount = company.monthlyContribution ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId }, select: { id: true, balance: true } });
      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance for first month contribution');
      }

      if (amount > 0) {
        // Member wallet debit.
        await tx.userWallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'debit',
            amount,
            description: `Monthly contribution · ${company.companyName}`,
            status: 'completed',
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance - amount,
          },
        });
        // Credit the company treasury (minus platform fee).
        await this.treasury.creditContribution(tx, {
          companyProfileId: company.id,
          memberId: userId,
          amount,
          description: `Monthly contribution from member · ${company.companyName}`,
        });
      }

      // Upsert membership
      const now = new Date();
      const ym = now.toISOString().slice(0, 7);
      return tx.corporateEmployee.upsert({
        where: { corporateAdminId_userId: { corporateAdminId: company.userId, userId } },
        update: {
          status: 'active',
          lastContributionMonth: ym,
          lastContributionAt: now,
          removedAt: null,
        },
        create: {
          corporateAdminId: company.userId,
          userId,
          status: 'active',
          approvedAt: now,
          lastContributionMonth: ym,
          lastContributionAt: now,
        },
      });
    });
  }

  /** Pay the current month's contribution. */
  async contributeToInsurance(userId: string, companyProfileId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { id: companyProfileId, isInsuranceCompany: true },
      select: { userId: true, companyName: true, monthlyContribution: true },
    });
    if (!company) throw new NotFoundException('Insurance company not found');

    const amount = company.monthlyContribution ?? 0;
    const membership = await this.prisma.corporateEmployee.findUnique({
      where: { corporateAdminId_userId: { corporateAdminId: company.userId, userId } },
    });
    if (!membership) throw new BadRequestException('You are not a member of this company');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId }, select: { id: true, balance: true } });
      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      if (amount > 0) {
        await tx.userWallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'debit',
            amount,
            description: `Monthly contribution · ${company.companyName}`,
            status: 'completed',
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance - amount,
          },
        });
        await this.treasury.creditContribution(tx, {
          companyProfileId: (await tx.corporateAdminProfile.findFirst({
            where: { userId: company.userId, isInsuranceCompany: true },
            select: { id: true },
          }))!.id,
          memberId: userId,
          amount,
          description: `Monthly contribution from member · ${company.companyName}`,
        });
      }

      const now = new Date();
      return tx.corporateEmployee.update({
        where: { corporateAdminId_userId: { corporateAdminId: company.userId, userId } },
        data: {
          lastContributionMonth: now.toISOString().slice(0, 7),
          lastContributionAt: now,
        },
      });
    });
  }

  // ─── Insurance claim submissions (member → owner workflow) ──────────

  async submitInsuranceClaim(memberId: string, dto: {
    companyProfileId: string; description: string; amount: number; receiptUrl?: string;
  }) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { id: dto.companyProfileId, isInsuranceCompany: true },
      select: { id: true, userId: true, companyName: true, monthlyContribution: true },
    });
    if (!company) throw new NotFoundException('Insurance company not found');

    // Must be an active member of the company.
    const membership = await this.prisma.corporateEmployee.findUnique({
      where: { corporateAdminId_userId: { corporateAdminId: company.userId, userId: memberId } },
      select: { status: true },
    });
    if (!membership || membership.status !== 'active') {
      throw new BadRequestException('You must be an active member to file a claim');
    }

    const claim = await this.prisma.insuranceClaimSubmission.create({
      data: {
        memberId,
        companyProfileId: company.id,
        description: dto.description,
        amount: dto.amount,
        receiptUrl: dto.receiptUrl,
        status: 'pending',
      },
    });

    // Notify the insurance company owner.
    const ownerAmount = await this.money.formatForUser(dto.amount, company.userId);
    await this.notifications.createNotification({
      userId: company.userId,
      type: 'insurance',
      title: 'New claim filed',
      message: `A member filed a ${ownerAmount} claim.`,
      referenceId: claim.id,
      referenceType: 'claim_submission',
      groupKey: `insurance-claim:${company.id}`,
    }).catch(() => { /* non-fatal */ });

    return claim;
  }

  async listClaimsForCompany(ownerUserId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId: ownerUserId, isInsuranceCompany: true },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('You do not own an insurance company');
    return this.prisma.insuranceClaimSubmission.findMany({
      where: { companyProfileId: company.id },
      include: {
        member: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listClaimsForMember(memberId: string) {
    return this.prisma.insuranceClaimSubmission.findMany({
      where: { memberId },
      include: {
        company: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Owner approves a claim. Runs the reimbursement rules engine to compute
   * the payout (co-pay, ceiling, deductible, category limit, fraud signals),
   * pays from the company treasury, and logs a full audit trail.
   */
  async approveClaim(ownerUserId: string, claimId: string, reviewerNote?: string) {
    const claim = await this.prisma.insuranceClaimSubmission.findUnique({
      where: { id: claimId },
      include: {
        company: { select: { id: true, userId: true, companyName: true } },
      },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.company.userId !== ownerUserId) {
      throw new BadRequestException('You do not own this insurance company');
    }
    if (claim.status !== 'pending') {
      throw new BadRequestException(`Claim is already ${claim.status}`);
    }

    // Build the reimbursement context. If a policy exists for this member,
    // use its plan; otherwise fall back to a default (no-limit, no-co-pay)
    // policy derived from the company's monthlyContribution.
    const policy = await this.prisma.insurancePolicy.findFirst({
      where: { memberId: claim.memberId, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const member = await this.prisma.corporateEmployee.findUnique({
      where: { corporateAdminId_userId: { corporateAdminId: claim.company.userId, userId: claim.memberId } },
      select: { joinedAt: true },
    });

    // Fraud-signal context.
    const last48h = new Date(Date.now() - 48 * 3600 * 1000);
    const priorClaimsLast48h = await this.prisma.insuranceClaimSubmission.count({
      where: { memberId: claim.memberId, createdAt: { gte: last48h }, id: { not: claim.id } },
    });
    const prior90d = await this.prisma.insuranceClaimSubmission.findMany({
      where: {
        memberId: claim.memberId,
        createdAt: { gte: new Date(Date.now() - 90 * 86400 * 1000) },
        id: { not: claim.id },
      },
      select: { amount: true },
    });
    const priorClaims90dMedian = median(prior90d.map(p => p.amount));
    const duplicateReceiptHash = claim.receiptUrl
      ? (await this.prisma.insuranceClaimSubmission.count({
          where: { receiptUrl: claim.receiptUrl, id: { not: claim.id } },
        })) > 0
      : false;

    const decision = this.reimbursement.evaluate({
      claim: {
        id: claim.id,
        amount: claim.amount,
        category: (claim as any).category ?? undefined,
        description: claim.description,
        createdAt: claim.createdAt,
        receiptUrl: claim.receiptUrl,
      },
      member: {
        id: claim.memberId,
        policyId: policy?.id ?? 'none',
        joinedAt: member?.joinedAt ?? claim.createdAt,
        ytdClaimsPaid: policy?.ytdClaimsPaid ?? 0,
        deductibleUsed: policy?.deductibleUsed ?? 0,
      },
      plan: policy?.plan ? {
        annualCeiling: policy.plan.annualCeiling,
        deductible: policy.plan.deductible,
        coPayPercent: policy.plan.coPayPercent,
        waitingPeriodDays: policy.plan.waitingPeriodDays,
        categoryLimits: (policy.plan.categoryLimits as Record<string, number>) ?? {},
      } : {
        // Legacy fallback for pre-plan claims: no co-pay, no ceiling, no wait.
        annualCeiling: Number.MAX_SAFE_INTEGER,
        deductible: 0,
        coPayPercent: 0,
        waitingPeriodDays: 0,
        categoryLimits: {},
      },
      priorClaimsLast48h,
      priorClaims90dMedian,
      duplicateReceiptHash,
    });

    return this.prisma.$transaction(async (tx) => {
      // Persist the audit trail — every decision, even denied ones.
      await tx.claimDecisionLog.create({
        data: {
          claimId: claim.id,
          decision: decision.decision,
          payoutAmount: decision.payoutAmount,
          rulesApplied: decision.rulesApplied as any,
          reason: decision.reason,
          decidedBy: ownerUserId,
        },
      });

      // Denied — no money moves.
      if (decision.decision === 'denied') {
        const updated = await tx.insuranceClaimSubmission.update({
          where: { id: claimId },
          data: {
            status: 'denied',
            reviewerNote: reviewerNote ?? decision.reason ?? 'Rules engine rejection',
            reviewedAt: new Date(),
            reviewedBy: ownerUserId,
          },
        });
        this.notifications.createNotification({
          userId: claim.memberId, type: 'insurance',
          title: 'Claim declined',
          message: `${claim.company.companyName}: ${decision.reason ?? 'Not eligible'}`,
          referenceId: claim.id, referenceType: 'claim_submission',
          groupKey: `insurance-claim:${claim.companyProfileId}`,
        }).catch(() => {});
        return updated;
      }

      // pending_review — owner must review fraud flags manually.
      if (decision.decision === 'pending_review') {
        const updated = await tx.insuranceClaimSubmission.update({
          where: { id: claimId },
          data: {
            status: 'pending', // keep pending; owner sees fraud banner
            reviewerNote: `Review required: ${decision.rulesApplied.find(r => r.reviewFlag)?.reviewFlag}`,
          },
        });
        return updated;
      }

      // Approved — pay out from treasury.
      const memberCurrency = await this.money.currencyFor(claim.memberId);
      await this.treasury.payoutClaim(tx, {
        companyProfileId: claim.company.id,
        memberId: claim.memberId,
        claimId: claim.id,
        amount: decision.payoutAmount,
        description: `Insurance payout · ${claim.company.companyName}`,
      });

      // Bump member's YTD counter + deductible usage if they have a policy.
      if (policy) {
        const rawAmount = claim.amount;
        await tx.insurancePolicy.update({
          where: { id: policy.id },
          data: {
            ytdClaimsPaid: { increment: decision.payoutAmount },
            deductibleUsed: { increment: Math.min(
              policy.plan.deductible - policy.deductibleUsed,
              rawAmount,
            ) > 0 ? Math.min(
              policy.plan.deductible - policy.deductibleUsed,
              rawAmount,
            ) : 0 },
          },
        });
      }

      const updated = await tx.insuranceClaimSubmission.update({
        where: { id: claimId },
        data: {
          status: 'paid',
          reviewerNote: reviewerNote ?? `Paid ${this.money.format(decision.payoutAmount, memberCurrency)} (member covers ${this.money.format(decision.memberPaysAmount, memberCurrency)})`,
          reviewedAt: new Date(),
          reviewedBy: ownerUserId,
          paidAt: new Date(),
        },
      });

      this.notifications.createNotification({
        userId: claim.memberId, type: 'insurance',
        title: 'Claim approved — payment received',
        message: `${claim.company.companyName} paid ${this.money.format(decision.payoutAmount, memberCurrency)} to your Account Balance. You cover ${this.money.format(decision.memberPaysAmount, memberCurrency)}.`,
        referenceId: claim.id, referenceType: 'claim_submission',
        groupKey: `insurance-claim:${claim.companyProfileId}`,
      }).catch(() => {});

      return updated;
    });
  }

  async denyClaim(ownerUserId: string, claimId: string, reviewerNote?: string) {
    const claim = await this.prisma.insuranceClaimSubmission.findUnique({
      where: { id: claimId },
      include: { company: { select: { userId: true, companyName: true } } },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.company.userId !== ownerUserId) {
      throw new BadRequestException('You do not own this insurance company');
    }
    if (claim.status !== 'pending') {
      throw new BadRequestException(`Claim is already ${claim.status}`);
    }

    // Manual denial still has to leave an audit trail. Every claim decision
    // — automated or manual — writes a ClaimDecisionLog (rules-engine contract).
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.claimDecisionLog.create({
        data: {
          claimId: claim.id,
          decision: 'denied',
          payoutAmount: 0,
          rulesApplied: [{ rule: 'ManualDenial', pass: false, amount: 0, message: reviewerNote || 'Manual owner denial' }] as any,
          reason: reviewerNote || 'Manual owner denial',
          decidedBy: ownerUserId,
        },
      });
      return tx.insuranceClaimSubmission.update({
        where: { id: claimId },
        data: {
          status: 'denied',
          reviewerNote: reviewerNote || 'Claim denied',
          reviewedAt: new Date(),
          reviewedBy: ownerUserId,
        },
      });
    });

    await this.notifications.createNotification({
      userId: claim.memberId,
      type: 'insurance',
      title: 'Claim declined',
      message: `${claim.company.companyName} declined your ${await this.money.formatForUser(claim.amount, claim.memberId)} claim.`,
      referenceId: claim.id,
      referenceType: 'claim_submission',
      groupKey: `insurance-claim:${claim.companyProfileId}`,
    }).catch(() => {});

    return updated;
  }

  /** Per-member payment status for the current month (owner view). */
  async getInsuranceMembersStatus(ownerUserId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId: ownerUserId, isInsuranceCompany: true },
      select: { id: true, companyName: true, monthlyContribution: true, userId: true },
    });
    if (!company) throw new NotFoundException('You do not own an insurance company');

    const members = await this.prisma.corporateEmployee.findMany({
      where: { corporateAdminId: company.userId, status: 'active' },
      select: {
        id: true, userId: true, joinedAt: true,
        lastContributionMonth: true, lastContributionAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const rows = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: `${m.user.firstName} ${m.user.lastName}`.trim(),
      email: m.user.email,
      joinedAt: m.joinedAt,
      paidThisMonth: m.lastContributionMonth === currentMonth,
      lastContributionMonth: m.lastContributionMonth,
      lastContributionAt: m.lastContributionAt,
    }));

    const paidCount = rows.filter(r => r.paidThisMonth).length;
    const expectedRevenue = (company.monthlyContribution ?? 0) * members.length;
    const collectedRevenue = (company.monthlyContribution ?? 0) * paidCount;

    return {
      company: { id: company.id, name: company.companyName, monthlyContribution: company.monthlyContribution ?? 0 },
      currentMonth,
      members: rows,
      summary: { total: members.length, paid: paidCount, unpaid: members.length - paidCount, expectedRevenue, collectedRevenue },
    };
  }

  /** Invite a user by email to join a company */
  async inviteMember(corporateAdminId: string, email: string) {
    // Verify the admin actually has a corporate profile
    const adminProfile = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId: corporateAdminId },
      select: { id: true, companyName: true },
    });
    if (!adminProfile) {
      throw new BadRequestException('You do not have a company profile');
    }

    // Find the user by email
    const targetUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found — they need to register first');
    }

    if (targetUser.id === corporateAdminId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    // Check if already invited/active
    const existing = await this.prisma.corporateEmployee.findUnique({
      where: {
        corporateAdminId_userId: {
          corporateAdminId,
          userId: targetUser.id,
        },
      },
    });
    if (existing && existing.status !== 'removed') {
      throw new BadRequestException('User is already invited or a member of this company');
    }

    // Create or re-create the invitation
    const member = existing
      ? await this.prisma.corporateEmployee.update({
          where: { id: existing.id },
          data: { status: 'pending', approvedAt: null, removedAt: null, joinedAt: new Date() },
        })
      : await this.prisma.corporateEmployee.create({
          data: {
            corporateAdminId,
            userId: targetUser.id,
            status: 'pending',
          },
        });

    // Send notification to invited user
    await this.notifications.createNotification({
      userId: targetUser.id,
      type: 'corporate_invitation',
      title: 'Company Invitation',
      message: `You have been invited to join ${adminProfile.companyName}. Accept or decline in your dashboard.`,
      referenceId: member.id,
      referenceType: 'corporate_employee',
    });

    return member;
  }

  /** Admin manages a member: approve, reject, or remove */
  async manageMember(corporateAdminId: string, dto: ManageMemberDto) {
    const member = await this.prisma.corporateEmployee.findFirst({
      where: { id: dto.memberId, corporateAdminId },
      include: { user: { select: { id: true, firstName: true } } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const now = new Date();
    let updateData: any;

    switch (dto.action) {
      case 'approve':
        updateData = { status: 'active' as const, approvedAt: now };
        break;
      case 'reject':
      case 'remove':
        updateData = { status: 'removed' as const, removedAt: now };
        break;
    }

    const updated = await this.prisma.corporateEmployee.update({
      where: { id: dto.memberId },
      data: updateData,
    });

    // Notify the user
    const actionVerb = dto.action === 'approve' ? 'approved' : dto.action === 'reject' ? 'rejected' : 'removed from';
    await this.notifications.createNotification({
      userId: member.userId,
      type: 'corporate_membership_update',
      title: 'Membership Update',
      message: `Your company membership has been ${actionVerb}.`,
      referenceId: member.id,
      referenceType: 'corporate_employee',
    });

    return updated;
  }

  /** Employee accepts their own pending invitation */
  async acceptInvitation(userId: string, invitationId?: string) {
    const where = invitationId
      ? { id: invitationId, userId, status: 'pending' as const }
      : { userId, status: 'pending' as const };

    const invitation = await this.prisma.corporateEmployee.findFirst({ where });
    if (!invitation) {
      throw new NotFoundException('No pending invitation found');
    }

    const updated = await this.prisma.corporateEmployee.update({
      where: { id: invitation.id },
      data: { status: 'active', approvedAt: new Date() },
    });

    // Notify the corporate admin
    await this.notifications.createNotification({
      userId: invitation.corporateAdminId,
      type: 'corporate_invitation_accepted',
      title: 'Invitation Accepted',
      message: `An employee has accepted your invitation and joined the company.`,
      referenceId: invitation.id,
      referenceType: 'corporate_employee',
    });

    return updated;
  }

  /** Get all companies the current user belongs to as an employee */
  async getMyCompanies(userId: string) {
    const memberships = await this.prisma.corporateEmployee.findMany({
      where: { userId, status: 'active' },
      include: {
        corporateAdmin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            corporateAdminProfile: {
              select: { id: true, companyName: true, industry: true },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.id,
      corporateAdminId: m.corporateAdminId,
      companyName: m.corporateAdmin.corporateAdminProfile?.companyName ?? 'Unknown',
      industry: m.corporateAdmin.corporateAdminProfile?.industry ?? null,
      adminName: `${m.corporateAdmin.firstName} ${m.corporateAdmin.lastName}`,
      joinedAt: m.joinedAt,
      approvedAt: m.approvedAt,
    }));
  }

  /** Preview enrollment — get employees and optional plan */
  async getEnrollmentPreview(corporateAdminId: string, planId?: string) {
    const employees = await this.prisma.corporateEmployee.findMany({
      where: { corporateAdminId, status: 'active' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    const plan = planId
      ? await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      : null;
    return { employees, plan, employeeCount: employees.length };
  }

  /** Enroll all active employees in a subscription plan (with wallet deduction) */
  async enrollEmployees(corporateAdminId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return null;

    const employees = await this.prisma.corporateEmployee.findMany({
      where: { corporateAdminId, status: 'active' },
      select: { userId: true },
    });

    const totalCost = plan.price * employees.length;

    // Deduct from corporate admin's wallet
    const wallet = await this.prisma.userWallet.findUnique({
      where: { userId: corporateAdminId },
    });
    if (!wallet) {
      throw new BadRequestException('Wallet not found. Please top up your wallet first.');
    }
    if (wallet.balance < totalCost) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required: ${totalCost.toFixed(2)}, Available: ${wallet.balance.toFixed(2)}`,
      );
    }

    // Perform enrollment + wallet deduction in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct wallet
      const updatedWallet = await tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalCost } },
      });

      // Create wallet transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          amount: totalCost,
          description: `Corporate enrollment: ${employees.length} employees in "${plan.name}"`,
          serviceType: 'subscription',
          referenceId: planId,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          status: 'completed',
        },
      });

      // Subscriptions are 100% platform revenue — the whole `totalCost`
      // flows to PlatformTreasury so admin finance can reconcile MRR.
      await this.treasury.creditPlatformFee(tx, {
        amount: totalCost,
        source: 'subscription_corporate',
        referenceId: planId,
        description: `Corporate plan "${plan.name}" × ${employees.length}`,
      });

      // Enroll each employee. If they already have an ACTIVE INDIVIDUAL plan,
      // refund the pro-rated unused portion BEFORE switching them to the
      // corporate plan. Previously `upsert` silently wiped the prior plan
      // which meant users who'd just paid for a month lost the balance.
      // Corporate-paid plans (`corporateAdminId` set) are not refunded —
      // switching between two employer-paid plans is a company-level action.
      let enrolled = 0;
      let refundedCount = 0;
      for (const emp of employees) {
        const existing = await tx.userSubscription.findUnique({
          where: { userId: emp.userId },
          include: { plan: { select: { price: true, name: true } } },
        });
        if (existing && existing.status === 'active' && existing.corporateAdminId === null && existing.plan.price > 0) {
          const refund = this.computeProratedRefund(existing.startDate, existing.plan.price);
          if (refund > 0) {
            const empWallet = await tx.userWallet.findUnique({ where: { userId: emp.userId } });
            if (empWallet) {
              await tx.userWallet.update({
                where: { id: empWallet.id },
                data: { balance: empWallet.balance + refund },
              });
              await tx.walletTransaction.create({
                data: {
                  walletId: empWallet.id, type: 'credit', amount: refund,
                  description: `Refund: unused portion of ${existing.plan.name} (switched to ${plan.name})`,
                  serviceType: 'subscription_refund', referenceId: existing.id,
                  status: 'completed',
                  balanceBefore: empWallet.balance, balanceAfter: empWallet.balance + refund,
                },
              });
              refundedCount++;
              this.notifications.createNotification({
                userId: emp.userId,
                type: 'subscription_refund',
                title: 'Previous plan refunded',
                message: `We refunded ${refund.toFixed(0)} ${empWallet.currency} of your unused ${existing.plan.name} plan because your employer enrolled you in ${plan.name}.`,
                referenceId: existing.id,
                referenceType: 'UserSubscription',
              }).catch(() => {});
            }
          }
        }

        await tx.userSubscription.upsert({
          where: { userId: emp.userId },
          update: {
            planId: plan.id, status: 'active', corporateAdminId,
            startDate: new Date(), // reset start so pro-rating is correct next time
          },
          create: {
            userId: emp.userId,
            planId: plan.id,
            status: 'active',
            startDate: new Date(),
            autoRenew: true,
            corporateAdminId,
          },
        });
        enrolled++;
      }

      return { enrolled, refundedIndividualPlans: refundedCount, planName: plan.name, totalCost, walletBalance: updatedWallet.balance };
    });

    return result;
  }

  /** Get corporate admin dashboard data */
  async getDashboard(userId: string) {
    const profile = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId },
      select: { id: true, companyName: true, employeeCount: true },
    });

    const [employeeCount, activeEmployees] = await Promise.all([
      this.prisma.corporateEmployee.count({ where: { corporateAdminId: userId } }),
      this.prisma.corporateEmployee.count({ where: { corporateAdminId: userId, status: 'active' } }),
    ]);

    // Wallet + transactions
    const wallet = await this.prisma.userWallet
      .findUnique({
        where: { userId },
        select: { id: true, balance: true, currency: true },
      })
      .catch(() => null);

    let recentTransactions: any[] = [];
    let totalSpent = 0;
    if (wallet) {
      recentTransactions = await this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, amount: true, description: true, createdAt: true },
      });
      const spentAgg = await this.prisma.walletTransaction
        .aggregate({
          where: { walletId: wallet.id, type: 'debit' },
          _sum: { amount: true },
        })
        .catch(() => ({ _sum: { amount: 0 } }));
      totalSpent = spentAgg._sum?.amount || 0;
    }

    // Billing methods
    const billingMethods = await this.prisma.billingInfo
      .findMany({
        where: { userId },
        select: { id: true, type: true, lastFour: true, cardHolder: true, isDefault: true },
      })
      .catch(() => []);

    // Notifications
    const notifications = await this.prisma.notification
      .findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, message: true, read: true, createdAt: true },
      })
      .catch(() => []);

    return {
      company: profile,
      stats: { employeeCount, activeEmployees, totalSpent },
      wallet,
      billingMethods,
      recentTransactions,
      notifications,
    };
  }

  /** Get active employees for a corporate admin */
  async getEmployees(corporateAdminId: string) {
    const employees = await this.prisma.corporateEmployee.findMany({
      where: { corporateAdminId, status: 'active' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return employees.map((e) => ({
      id: e.id,
      name: `${e.user.firstName} ${e.user.lastName}`,
      email: e.user.email,
      status: e.status,
      joinDate: e.joinedAt,
    }));
  }

  /** Get all enrollments (any status) for a corporate admin */
  async getMembers(corporateAdminId: string) {
    const members = await this.prisma.corporateEmployee.findMany({
      where: { corporateAdminId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      status: m.status,
      user: { firstName: m.user.firstName, lastName: m.user.lastName, email: m.user.email },
    }));
  }

  /** Get insurance claims for all employees of a corporate admin */
  async getClaims(corporateAdminId: string) {
    const employees = await this.prisma.corporateEmployee.findMany({
      where: { corporateAdminId },
      select: { userId: true },
    });
    const userIds = employees.map((e) => e.userId);
    const profiles = await this.prisma.patientProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const patientIds = profiles.map((p) => p.id);

    const claims = await this.prisma.insuranceClaim.findMany({
      where: { patientId: { in: patientIds } },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { submittedDate: 'desc' },
      take: 50,
    });

    return claims;
  }

  /**
   * Compute fraud signals for a pending claim BEFORE the owner decides.
   * Used by the claim-review UI to show banners. Returns the same flags
   * FraudHeuristicRule would raise: duplicate_receipt, velocity_high,
   * amount_anomaly.
   */
  async getClaimFraudSignals(ownerUserId: string, claimId: string) {
    const claim = await this.prisma.insuranceClaimSubmission.findUnique({
      where: { id: claimId },
      include: { company: { select: { userId: true } } },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.company.userId !== ownerUserId) {
      throw new BadRequestException('You do not own this insurance company');
    }

    const last48h = new Date(Date.now() - 48 * 3600e3);
    const [priorClaimsLast48h, prior90d, duplicateCount] = await Promise.all([
      this.prisma.insuranceClaimSubmission.count({
        where: { memberId: claim.memberId, createdAt: { gte: last48h }, id: { not: claim.id } },
      }),
      this.prisma.insuranceClaimSubmission.findMany({
        where: {
          memberId: claim.memberId,
          createdAt: { gte: new Date(Date.now() - 90 * 86400e3) },
          id: { not: claim.id },
        },
        select: { amount: true },
      }),
      claim.receiptUrl
        ? this.prisma.insuranceClaimSubmission.count({
            where: { receiptUrl: claim.receiptUrl, id: { not: claim.id } },
          })
        : Promise.resolve(0),
    ]);

    const medianAmount = median(prior90d.map((p) => p.amount));
    const flags: Array<{ code: string; severity: 'low' | 'medium' | 'high'; message: string }> = [];

    if (duplicateCount > 0) {
      flags.push({
        code: 'duplicate_receipt', severity: 'high',
        message: `Receipt URL was already submitted ${duplicateCount} other time(s).`,
      });
    }
    if (priorClaimsLast48h > 3) {
      flags.push({
        code: 'velocity_high', severity: 'medium',
        message: `${priorClaimsLast48h} other claims from this member in the last 48 hours.`,
      });
    }
    if (medianAmount > 0 && claim.amount > medianAmount * 3) {
      const memberCurrency = await this.money.currencyFor(claim.memberId);
      flags.push({
        code: 'amount_anomaly', severity: 'medium',
        message: `Amount is ${(claim.amount / medianAmount).toFixed(1)}× the member's 90-day median (${this.money.format(medianAmount, memberCurrency)}).`,
      });
    }

    return {
      claimId: claim.id,
      amount: claim.amount,
      flags,
      riskLevel: flags.some(f => f.severity === 'high')
        ? 'high'
        : flags.length > 0 ? 'medium' : 'low',
      stats: { priorClaimsLast48h, priorClaims90dMedian: medianAmount, duplicateCount },
    };
  }

  /**
   * Insurance admin dashboard — loss ratio (payouts ÷ premiums collected),
   * claims-by-category, flagged-claims count, treasury health.
   */
  async getInsuranceDashboard(ownerUserId: string) {
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { userId: ownerUserId, isInsuranceCompany: true },
      select: { id: true, companyName: true, monthlyContribution: true },
    });
    if (!company) throw new NotFoundException('You do not own an insurance company');

    const treasury = await this.prisma.insuranceCompanyTreasury.findUnique({
      where: { companyProfileId: company.id },
    });

    const sinceYear = new Date(Date.now() - 365 * 86400e3);
    const sinceMonth = new Date(Date.now() - 30 * 86400e3);

    const [claims, preAuths, activePolicies, totalMembers, ytdClaimsAgg, flaggedLogs] = await Promise.all([
      this.prisma.insuranceClaimSubmission.findMany({
        where: { companyProfileId: company.id, createdAt: { gte: sinceYear } },
        select: { id: true, amount: true, status: true, createdAt: true, memberId: true },
      }),
      this.prisma.preAuthorization.findMany({
        where: { companyProfileId: company.id, createdAt: { gte: sinceYear } },
        select: { id: true, status: true, approvedAmount: true, createdAt: true },
      }),
      this.prisma.insurancePolicy.count({
        where: { plan: { companyProfileId: company.id }, status: 'active' },
      }),
      this.prisma.corporateEmployee.count({
        where: { corporateAdminId: ownerUserId, status: 'active' },
      }),
      this.prisma.insurancePolicy.aggregate({
        where: { plan: { companyProfileId: company.id }, status: 'active' },
        _sum: { ytdClaimsPaid: true },
      }),
      this.prisma.claimDecisionLog.findMany({
        where: { createdAt: { gte: sinceMonth } },
        select: { claimId: true, rulesApplied: true, decision: true },
      }),
    ]);

    const paidClaims = claims.filter(c => c.status === 'paid');
    const paidClaimsYear = paidClaims.reduce((sum, c) => sum + c.amount, 0);
    const paidClaimsMonth = paidClaims
      .filter(c => c.createdAt >= sinceMonth)
      .reduce((sum, c) => sum + c.amount, 0);

    // Premiums collected ≈ totalInflow on the treasury (rough proxy).
    const premiumsCollected = treasury?.totalInflow ?? 0;
    const lossRatio = premiumsCollected > 0 ? paidClaimsYear / premiumsCollected : null;

    // Flagged claims: logs where rulesApplied contains any reviewFlag.
    const flaggedCount = flaggedLogs.filter(log => {
      const rules = (log.rulesApplied as any[]) ?? [];
      return rules.some(r => !!r.reviewFlag);
    }).length;

    // Claims-by-status breakdown.
    const byStatus: Record<string, number> = {};
    for (const c of claims) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

    // Pre-auth funnel.
    const preAuthByStatus: Record<string, number> = {};
    for (const p of preAuths) preAuthByStatus[p.status] = (preAuthByStatus[p.status] ?? 0) + 1;

    return {
      company: { id: company.id, name: company.companyName },
      treasury: {
        balance: treasury?.balance ?? 0,
        totalInflow: treasury?.totalInflow ?? 0,
        totalOutflow: treasury?.totalOutflow ?? 0,
      },
      members: { total: totalMembers, activePolicies },
      claims: {
        last12Months: claims.length,
        paidAmount12m: paidClaimsYear,
        paidAmount30d: paidClaimsMonth,
        byStatus,
        flaggedLast30d: flaggedCount,
        ytdPaidPerPolicyAgg: ytdClaimsAgg._sum.ytdClaimsPaid ?? 0,
      },
      preAuth: { last12Months: preAuths.length, byStatus: preAuthByStatus },
      kpis: {
        lossRatio,
        lossRatioLabel: lossRatio == null ? 'n/a'
          : lossRatio < 0.6 ? 'healthy'
          : lossRatio < 0.85 ? 'warning'
          : 'critical',
        runwayMonths: treasury && treasury.totalOutflow > 0
          ? treasury.balance / (treasury.totalOutflow / 12)
          : null,
      },
    };
  }
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
