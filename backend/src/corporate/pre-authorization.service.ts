import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TreasuryService } from '../shared/services/treasury.service';
import { MoneyFormatService } from '../shared/services/money-format.service';
import { ReimbursementService } from './reimbursement/reimbursement.service';

/**
 * Pre-authorization (tiers payant) — the provider asks the insurance
 * company to pre-approve a service BEFORE delivering it. Approved requests
 * reserve the eligible amount; when the provider marks the authorization
 * used after delivery, money flows treasury → provider wallet directly.
 * The patient never touches the money for a pre-authorized service.
 *
 * Flow:
 *   1. Provider calls `requestPreAuth(...)` → status `pending`.
 *   2. Insurance owner calls `approvePreAuth(...)` → reimbursement rules
 *      run; if they pass, `approvedAmount` is set and status becomes
 *      `approved` (or `denied`, or `pending_review` if fraud flag).
 *   3. After delivering the service, provider calls `usePreAuth(...)` →
 *      treasury debits and credits provider wallet; creates a paid claim;
 *      status becomes `used`.
 *   4. Unused authorizations past `expiresAt` are lapsed by `expireStale`.
 */
@Injectable()
export class PreAuthorizationService {
  private static readonly DEFAULT_EXPIRY_DAYS = 14;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private treasury: TreasuryService,
    private reimbursement: ReimbursementService,
    private money: MoneyFormatService,
  ) {}

  /**
   * Provider initiates a pre-authorization request. Accepts EITHER `memberId`
   * OR `memberEmail` so the UI can look up the member by the info the
   * provider actually has (usually the email printed on insurance cards).
   */
  async requestPreAuth(providerId: string, dto: {
    memberId?: string;
    memberEmail?: string;
    companyProfileId: string;
    serviceCode?: string;
    category?: string;
    description: string;
    requestedAmount: number;
    expiresInDays?: number;
  }) {
    if (!dto.description || dto.requestedAmount <= 0) {
      throw new BadRequestException('description and positive requestedAmount required');
    }
    if (!dto.memberId && !dto.memberEmail) {
      throw new BadRequestException('memberId or memberEmail is required');
    }
    const company = await this.prisma.corporateAdminProfile.findFirst({
      where: { id: dto.companyProfileId, isInsuranceCompany: true },
      select: { id: true, userId: true, companyName: true },
    });
    if (!company) throw new NotFoundException('Insurance company not found');

    const member = dto.memberId
      ? await this.prisma.user.findUnique({
          where: { id: dto.memberId }, select: { id: true, firstName: true, lastName: true },
        })
      : await this.prisma.user.findUnique({
          where: { email: dto.memberEmail!.trim().toLowerCase() },
          select: { id: true, firstName: true, lastName: true },
        });
    if (!member) throw new NotFoundException('Member not found');
    const memberId = member.id;

    const days = dto.expiresInDays ?? PreAuthorizationService.DEFAULT_EXPIRY_DAYS;
    const expiresAt = new Date(Date.now() + days * 24 * 3600e3);

    const preAuth = await this.prisma.preAuthorization.create({
      data: {
        memberId,
        providerId,
        companyProfileId: company.id,
        serviceCode: dto.serviceCode,
        category: dto.category,
        description: dto.description,
        requestedAmount: dto.requestedAmount,
        status: 'pending',
        expiresAt,
      },
    });

    // Notify insurance owner + member (each in their own currency).
    const [ownerAmount, memberAmount] = await Promise.all([
      this.money.formatForUser(dto.requestedAmount, company.userId),
      this.money.formatForUser(dto.requestedAmount, memberId),
    ]);
    this.notifications.createNotification({
      userId: company.userId,
      type: 'pre_auth_request',
      title: 'New pre-authorization request',
      message: `Provider requested ${ownerAmount} for ${member.firstName} ${member.lastName}: ${dto.description}`,
      referenceId: preAuth.id,
      referenceType: 'PreAuthorization',
    }).catch(() => {});
    this.notifications.createNotification({
      userId: memberId,
      type: 'pre_auth_request',
      title: 'Pre-authorization filed',
      message: `Your provider requested ${memberAmount} from ${company.companyName}. You'll be notified once reviewed.`,
      referenceId: preAuth.id,
      referenceType: 'PreAuthorization',
    }).catch(() => {});

    return preAuth;
  }

  /** Insurance owner approves — runs rules engine to compute eligible amount. */
  async approvePreAuth(ownerUserId: string, preAuthId: string) {
    const pa = await this.prisma.preAuthorization.findUnique({
      where: { id: preAuthId },
      include: { company: { select: { id: true, userId: true, companyName: true } } },
    });
    if (!pa) throw new NotFoundException('Pre-authorization not found');
    if (pa.company.userId !== ownerUserId) throw new ForbiddenException('Not your insurance company');
    if (pa.status !== 'pending') throw new BadRequestException(`Already ${pa.status}`);
    if (pa.expiresAt < new Date()) {
      await this.prisma.preAuthorization.update({
        where: { id: pa.id }, data: { status: 'expired' },
      });
      throw new BadRequestException('Pre-authorization expired');
    }

    const policy = await this.prisma.insurancePolicy.findFirst({
      where: { memberId: pa.memberId, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    const membership = await this.prisma.corporateEmployee.findUnique({
      where: { companyId_userId: { companyId: pa.company.id, userId: pa.memberId } },
      select: { joinedAt: true, status: true },
    });
    if (!membership || membership.status !== 'active') {
      throw new BadRequestException('Member is not active in this company');
    }

    const decision = this.reimbursement.evaluate({
      claim: {
        id: pa.id,
        amount: pa.requestedAmount,
        category: pa.category ?? undefined,
        description: pa.description,
        createdAt: pa.createdAt,
      },
      member: {
        id: pa.memberId,
        policyId: policy?.id ?? 'none',
        joinedAt: membership.joinedAt,
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
        annualCeiling: Number.MAX_SAFE_INTEGER,
        deductible: 0,
        coPayPercent: 0,
        waitingPeriodDays: 0,
        categoryLimits: {},
      },
      priorClaimsLast48h: 0,
      priorClaims90dMedian: 0,
      duplicateReceiptHash: false,
    });

    const newStatus = decision.decision === 'approved'
      ? 'approved'
      : decision.decision === 'pending_review'
        ? 'pending' // keep pending, owner must resolve fraud flag
        : 'denied';

    const updated = await this.prisma.preAuthorization.update({
      where: { id: pa.id },
      data: {
        status: newStatus,
        approvedAmount: decision.decision === 'approved' ? decision.payoutAmount : null,
        memberPaysAmount: decision.decision === 'approved' ? decision.memberPaysAmount : null,
        rulesApplied: decision.rulesApplied as any,
        denialReason: decision.decision === 'denied' ? decision.reason : null,
        reviewedAt: new Date(),
        reviewedBy: ownerUserId,
      },
    });

    // Notify provider + member about the decision.
    // Each recipient sees the amount in THEIR wallet currency. Provider and
    // member can theoretically be in different regions (cross-border care).
    for (const uid of [pa.providerId, pa.memberId]) {
      const message = decision.decision === 'approved'
        ? `Approved: ${await this.money.formatForUser(decision.payoutAmount, uid)} covered (member pays ${await this.money.formatForUser(decision.memberPaysAmount, uid)}).`
        : decision.decision === 'denied'
          ? `Declined: ${decision.reason ?? 'not eligible'}`
          : 'Under review — possible fraud signals.';
      this.notifications.createNotification({
        userId: uid,
        type: 'pre_auth_decision',
        title: `Pre-authorization ${newStatus}`,
        message,
        referenceId: pa.id,
        referenceType: 'PreAuthorization',
      }).catch(() => {});
    }
    return updated;
  }

  /** Insurance owner explicitly denies (e.g., after fraud review). */
  async denyPreAuth(ownerUserId: string, preAuthId: string, reason?: string) {
    const pa = await this.prisma.preAuthorization.findUnique({
      where: { id: preAuthId },
      include: { company: { select: { userId: true } } },
    });
    if (!pa) throw new NotFoundException('Pre-authorization not found');
    if (pa.company.userId !== ownerUserId) throw new ForbiddenException('Not your insurance company');
    if (pa.status === 'used') throw new BadRequestException('Already used');

    const updated = await this.prisma.preAuthorization.update({
      where: { id: pa.id },
      data: {
        status: 'denied',
        denialReason: reason ?? 'Denied by insurer',
        reviewedAt: new Date(),
        reviewedBy: ownerUserId,
      },
    });
    for (const uid of [pa.providerId, pa.memberId]) {
      this.notifications.createNotification({
        userId: uid,
        type: 'pre_auth_decision',
        title: 'Pre-authorization declined',
        message: updated.denialReason ?? 'Declined',
        referenceId: pa.id,
        referenceType: 'PreAuthorization',
      }).catch(() => {});
    }
    return updated;
  }

  /**
   * Provider has delivered the service — convert the approved authorization
   * into a paid claim. Direct billing: treasury → provider wallet.
   */
  async usePreAuth(providerId: string, preAuthId: string) {
    const pa = await this.prisma.preAuthorization.findUnique({
      where: { id: preAuthId },
      include: { company: { select: { id: true, companyName: true } } },
    });
    if (!pa) throw new NotFoundException('Pre-authorization not found');
    if (pa.providerId !== providerId) throw new ForbiddenException('Not your pre-authorization');
    if (pa.status !== 'approved') throw new BadRequestException(`Cannot use a ${pa.status} authorization`);
    if (pa.expiresAt < new Date()) {
      await this.prisma.preAuthorization.update({
        where: { id: pa.id }, data: { status: 'expired' },
      });
      throw new BadRequestException('Authorization expired');
    }
    if (!pa.approvedAmount || pa.approvedAmount <= 0) {
      throw new BadRequestException('Authorization has no approved amount');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create a paid claim record so the audit trail matches the normal claim flow.
      const claim = await tx.insuranceClaimSubmission.create({
        data: {
          memberId: pa.memberId,
          companyProfileId: pa.companyProfileId,
          description: `Direct billing · ${pa.description}`,
          amount: pa.requestedAmount,
          status: 'paid',
          reviewerNote: `Tiers payant — paid ${await this.money.formatForUser(pa.approvedAmount!, providerId)} to provider`,
          reviewedBy: providerId,
          reviewedAt: new Date(),
          paidAt: new Date(),
        },
      });

      // Treasury → provider wallet.
      await this.treasury.payoutProviderDirect(tx, {
        companyProfileId: pa.companyProfileId,
        providerId,
        claimId: claim.id,
        amount: pa.approvedAmount!,
        description: `Tiers payant · ${pa.company.companyName} · ${pa.description}`,
      });

      // Bump member's policy YTD + deductibleUsed (same bookkeeping as regular claims).
      const policy = await tx.insurancePolicy.findFirst({
        where: { memberId: pa.memberId, status: 'active' },
        include: { plan: true },
      });
      if (policy) {
        const deductibleRemaining = policy.plan.deductible - policy.deductibleUsed;
        const deductibleDelta = deductibleRemaining > 0
          ? Math.min(deductibleRemaining, pa.requestedAmount)
          : 0;
        await tx.insurancePolicy.update({
          where: { id: policy.id },
          data: {
            ytdClaimsPaid: { increment: pa.approvedAmount! },
            deductibleUsed: { increment: deductibleDelta },
          },
        });
      }

      // Audit log.
      await tx.claimDecisionLog.create({
        data: {
          claimId: claim.id,
          decision: 'approved',
          payoutAmount: pa.approvedAmount!,
          rulesApplied: (pa.rulesApplied as any) ?? [],
          reason: 'Direct billing (pre-authorized)',
          decidedBy: providerId,
        },
      });

      const updated = await tx.preAuthorization.update({
        where: { id: pa.id },
        data: { status: 'used', usedAt: new Date(), claimId: claim.id },
      });

      // Notify member + provider — each in their own wallet currency.
      const memberCovered = await this.money.formatForUser(pa.approvedAmount!, pa.memberId);
      const memberCopay = await this.money.formatForUser(pa.memberPaysAmount ?? 0, pa.memberId);
      const providerCredited = await this.money.formatForUser(pa.approvedAmount!, providerId);
      this.notifications.createNotification({
        userId: pa.memberId,
        type: 'direct_billing',
        title: 'Insurance paid your provider directly',
        message: `${pa.company.companyName} covered ${memberCovered}. Member co-pay: ${memberCopay}.`,
        referenceId: pa.id,
        referenceType: 'PreAuthorization',
      }).catch(() => {});
      this.notifications.createNotification({
        userId: providerId,
        type: 'direct_billing',
        title: 'Direct payment received',
        message: `${providerCredited} credited to your Account Balance from ${pa.company.companyName}.`,
        referenceId: pa.id,
        referenceType: 'PreAuthorization',
      }).catch(() => {});

      return { preAuth: updated, claim };
    });
  }

  /** List pre-auths for a given viewer (owner / provider / member). */
  async list(userId: string, as: 'owner' | 'provider' | 'member') {
    if (as === 'owner') {
      const company = await this.prisma.corporateAdminProfile.findFirst({
        where: { userId, isInsuranceCompany: true }, select: { id: true },
      });
      if (!company) throw new NotFoundException('You do not own an insurance company');
      return this.prisma.preAuthorization.findMany({
        where: { companyProfileId: company.id },
        include: {
          member: { select: { firstName: true, lastName: true, email: true } },
          provider: { select: { firstName: true, lastName: true, email: true, userType: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (as === 'provider') {
      return this.prisma.preAuthorization.findMany({
        where: { providerId: userId },
        include: {
          member: { select: { firstName: true, lastName: true } },
          company: { select: { companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.preAuthorization.findMany({
      where: { memberId: userId },
      include: {
        provider: { select: { firstName: true, lastName: true, userType: true } },
        company: { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Called by the daily cron — flip stale pending/approved auths to expired. */
  async expireStale() {
    const now = new Date();
    const res = await this.prisma.preAuthorization.updateMany({
      where: { status: { in: ['pending', 'approved'] }, expiresAt: { lt: now } },
      data: { status: 'expired' },
    });
    return res.count;
  }
}
