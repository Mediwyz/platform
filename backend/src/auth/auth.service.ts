import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './jwt.strategy';
import { UserType } from '../shared/user-types';
import { RolesResolverService } from '../shared/services/roles-resolver.service';
import { TreasuryService } from '../shared/services/treasury.service';
import { ProviderIndexService } from '../embeddings/provider-index.service';

// ─── Cookie/Prisma user type maps (from lib/auth/user-type-map.ts) ──────────

export const cookieToPrismaUserType: Record<string, string> = {
  'patient':          UserType.MEMBER,
  'doctor':           UserType.DOCTOR,
  'nurse':            UserType.NURSE,
  'child-care-nurse': UserType.NANNY,
  'pharmacy':         UserType.PHARMACIST,
  'lab':              UserType.LAB_TECHNICIAN,
  'ambulance':        UserType.EMERGENCY_WORKER,
  'admin':            UserType.REGIONAL_ADMIN,
  'regional-admin':   UserType.REGIONAL_ADMIN,
  'corporate':        UserType.CORPORATE_ADMIN,
  'insurance':        UserType.INSURANCE_REP,
  'referral-partner': UserType.REFERRAL_PARTNER,
  'caregiver':        UserType.CAREGIVER,
  'physiotherapist':  UserType.PHYSIOTHERAPIST,
  'dentist':          UserType.DENTIST,
  'optometrist':      UserType.OPTOMETRIST,
  'nutritionist':     UserType.NUTRITIONIST,
};

export const prismaUserTypeToCookie: Record<string, string> = {
  [UserType.MEMBER]:          'patient',
  [UserType.DOCTOR]:           'doctor',
  [UserType.NURSE]:            'nurse',
  [UserType.NANNY]:            'child-care-nurse',
  [UserType.PHARMACIST]:       'pharmacy',
  [UserType.LAB_TECHNICIAN]:   'lab',
  [UserType.EMERGENCY_WORKER]: 'ambulance',
  [UserType.REGIONAL_ADMIN]:   'regional-admin',
  [UserType.CORPORATE_ADMIN]:  'corporate',
  [UserType.INSURANCE_REP]:    'insurance',
  [UserType.REFERRAL_PARTNER]: 'referral-partner',
  [UserType.CAREGIVER]:        'caregiver',
  [UserType.PHYSIOTHERAPIST]:  'physiotherapist',
  [UserType.DENTIST]:          'dentist',
  [UserType.OPTOMETRIST]:      'optometrist',
  [UserType.NUTRITIONIST]:     'nutritionist',
};

export const userTypeToProfileRelation: Record<string, string> = {
  [UserType.MEMBER]:          'patientProfile',
  [UserType.DOCTOR]:           'doctorProfile',
  [UserType.NURSE]:            'nurseProfile',
  [UserType.NANNY]:            'nannyProfile',
  [UserType.PHARMACIST]:       'pharmacistProfile',
  [UserType.LAB_TECHNICIAN]:   'labTechProfile',
  [UserType.EMERGENCY_WORKER]: 'emergencyWorkerProfile',
  [UserType.INSURANCE_REP]:    'insuranceRepProfile',
  [UserType.CORPORATE_ADMIN]:  'corporateAdminProfile',
  [UserType.REFERRAL_PARTNER]: 'referralPartnerProfile',
  [UserType.REGIONAL_ADMIN]:   'regionalAdminProfile',
  [UserType.CAREGIVER]:        'caregiverProfile',
  [UserType.PHYSIOTHERAPIST]:  'physiotherapistProfile',
  [UserType.DENTIST]:          'dentistProfile',
  [UserType.OPTOMETRIST]:      'optometristProfile',
  [UserType.NUTRITIONIST]:     'nutritionistProfile',
};

// Signup form type string → Prisma enum
const signupTypeToPrisma: Record<string, string> = {
  'patient':          UserType.MEMBER,
  'doctor':           UserType.DOCTOR,
  'nurse':            UserType.NURSE,
  'nanny':            UserType.NANNY,
  'pharmacist':       UserType.PHARMACIST,
  'lab':              UserType.LAB_TECHNICIAN,
  'emergency':        UserType.EMERGENCY_WORKER,
  'insurance':        UserType.INSURANCE_REP,
  'corporate':        UserType.CORPORATE_ADMIN,
  'referral-partner': UserType.REFERRAL_PARTNER,
  'regional-admin':   UserType.REGIONAL_ADMIN,
  'caregiver':        UserType.CAREGIVER,
  'physiotherapist':  UserType.PHYSIOTHERAPIST,
  'dentist':          UserType.DENTIST,
  'optometrist':      UserType.OPTOMETRIST,
  'nutritionist':     UserType.NUTRITIONIST,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiry = '7d';

  constructor(
    private prisma: PrismaService,
    private rolesResolver: RolesResolverService,
    private treasury: TreasuryService,
    private providerIndex: ProviderIndexService,
  ) {
    this.jwtSecret = process.env.JWT_SECRET || 'mediwyz-dev-secret-change-in-production';
  }

  signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
  }

  // ─── Login ──────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();

    const dbUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        password: true, profileImage: true, userType: true, accountStatus: true,
      },
    });

    if (!dbUser || !(await bcrypt.compare(password, dbUser.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (dbUser.accountStatus === 'pending') {
      throw new ForbiddenException('Your account is pending approval. Please wait for admin verification.');
    }
    if (dbUser.accountStatus === 'suspended') {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }

    // Resolve cookie-style userType — DB-driven via ProviderRole.cookieValue,
    // falls back to the legacy in-memory map for safety during cache warm-up.
    let cookieUserType =
      (await this.rolesResolver.codeToCookieAsync(dbUser.userType)) ??
      prismaUserTypeToCookie[dbUser.userType];

    // Super admin override
    if (dbUser.userType === 'REGIONAL_ADMIN' && dbUser.email === process.env.SUPER_ADMIN_EMAIL) {
      cookieUserType = 'admin';
    }

    const token = this.signToken({ sub: dbUser.id, userType: cookieUserType, email: dbUser.email });
    const redirectPath = await this.computeRedirectPath(cookieUserType, dbUser.userType);

    return {
      token,
      cookieUserType,
      user: {
        id: dbUser.id,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        email: dbUser.email,
        profileImage: dbUser.profileImage,
        userType: cookieUserType,
        redirectPath,
      },
      redirectPath,
    };
  }

  private async computeRedirectPath(cookieType: string, prismaType: string): Promise<string> {
    const SPECIAL_PATHS: Record<string, string> = {
      corporate:          '/corporate/feed',
      insurance:          '/insurance/feed',
      'referral-partner': '/referral-partner/feed',
      'regional-admin':   '/regional/feed',
      admin:              '/admin/feed',
    };
    if (SPECIAL_PATHS[cookieType]) return SPECIAL_PATHS[cookieType];

    // Provider/patient — look up slug from ProviderRole for a direct link
    const role = await this.prisma.providerRole.findFirst({
      where: { code: prismaType.toUpperCase() },
      select: { slug: true },
    }).catch(() => null);

    return role?.slug ? `/provider/${role.slug}/feed` : '/provider/patients/feed';
  }

  // ─── In-app password reset (no email) ────────────────────────────────
  //
  // Flow: user enters email → we return the security question they chose at
  // signup (and nothing else, so unknown emails return a generic prompt to
  // prevent enumeration). User enters the answer → if correct we issue a
  // single-use reset token that the UI uses immediately. No email needed.

  /**
   * Return the security question for an email. To prevent account enumeration,
   * unknown emails get a stable fake question derived from the email hash.
   */
  async getSecurityQuestion(email: string): Promise<{ question: string }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { question: 'Please enter an email to continue.' };
    const user = await this.prisma.user.findUnique({
      where: { email: normalized }, select: { securityQuestion: true },
    });
    if (user?.securityQuestion) return { question: user.securityQuestion };

    // Deterministic fake question so attackers can't distinguish unknown emails
    // from accounts with no question set. Answer never matches.
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    const options = [
      'What is the name of your first pet?',
      'In what city were you born?',
      'What was the make of your first car?',
      'What is your mother\'s maiden name?',
      'What is the name of your favourite teacher?',
    ];
    return { question: options[parseInt(hash.slice(0, 2), 16) % options.length] };
  }

  /**
   * Verify the security answer and, on success, issue a single-use token.
   * Always returns `{ verified: false }` without a token on any failure so
   * attackers can't distinguish "wrong answer" from "no such account".
   */
  async verifySecurityAnswerAndIssueToken(
    email: string,
    answer: string,
  ): Promise<{ verified: boolean; resetToken?: string }> {
    const normalized = email.trim().toLowerCase();
    const cleanAnswer = answer.trim().toLowerCase();
    if (!normalized || !cleanAnswer) return { verified: false };

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, securityAnswerHash: true },
    });
    if (!user?.securityAnswerHash) return { verified: false };

    const ok = await bcrypt.compare(cleanAnswer, user.securityAnswerHash);
    if (!ok) return { verified: false };

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15m — short since surfaced in-app
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
    return { verified: true, resetToken: token };
  }

  /** Set or change the security question + answer for the authenticated user. */
  async setSecurityQuestion(userId: string, question: string, answer: string): Promise<void> {
    if (!question || question.trim().length < 5) {
      throw new BadRequestException('Security question must be at least 5 characters');
    }
    if (!answer || answer.trim().length < 3) {
      throw new BadRequestException('Security answer must be at least 3 characters');
    }
    const hashed = await bcrypt.hash(answer.trim().toLowerCase(), 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { securityQuestion: question.trim(), securityAnswerHash: hashed },
    });
  }

  /**
   * Complete the reset: verify the token + expiry, update the password, clear the token.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token) throw new BadRequestException('Token is required');
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
      select: { id: true, passwordResetExpires: true },
    });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  // ─── Get current user ─────────────────────────────────────────────────

  async getMe(payload: JwtPayload) {
    const prismaUserType =
      (await this.rolesResolver.cookieToCodeAsync(payload.userType)) ??
      cookieToPrismaUserType[payload.userType];
    if (!prismaUserType) {
      throw new BadRequestException('Invalid user type');
    }

    const profileRelation = userTypeToProfileRelation[prismaUserType];

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        [profileRelation]: true,
        region: { select: { countryCode: true, currency: true, currencySymbol: true, language: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _password, region, ...safeUser } = user as any;

    return {
      ...safeUser,
      userType: payload.userType, // Keep cookie-style value from JWT
      // Canonical ProviderRole.code (e.g. DOCTOR, NURSE, CAREGIVER) —
      // resolved from the DB above via `rolesResolver.cookieToCodeAsync`.
      // Clients that need to query role-scoped endpoints
      // (e.g. /api/services/catalog) should use this, NOT `userType`.
      // Avoids hardcoded cookie→code maps on the frontend.
      userTypeCode: prismaUserType,
      // Surface region at the top level so the frontend can use it to filter
      // region-scoped resources (subscription plans, services) without a
      // second fetch. `regionCode` is the canonical identifier.
      regionCode: region?.countryCode ?? null,
      regionCurrency: region?.currency ?? null,
      regionCurrencySymbol: region?.currencySymbol ?? null,
      regionLanguage: region?.language ?? null,
    };
  }

  // ─── Register ─────────────────────────────────────────────────────────

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    userType: string;
    regionId?: string;
    profileImage?: string;
    licenseNumber?: string;
    specialization?: string;
    institution?: string;
    experience?: string;
    companyName?: string;
    companyRegistrationNumber?: string;
    targetCountry?: string;
    targetRegion?: string;
    countryCode?: string;
    businessType?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    referralCode?: string;
    selectedPlanId?: string;
    enrolledInCompany?: boolean;
    companyId?: string;
    documentUrls?: Array<{ name: string; type: string; url: string; size?: number }>;
    skippedDocuments?: string[];
    trackingId?: string;
  }) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const prismaUserType =
      (await this.rolesResolver.signupToCodeAsync(data.userType)) ??
      signupTypeToPrisma[data.userType];
    if (!prismaUserType) {
      throw new BadRequestException('Unsupported user type');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const nameParts = data.fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const requiresManualApproval = prismaUserType === UserType.REGIONAL_ADMIN;
    const requiresCorporateApproval = prismaUserType === UserType.MEMBER && data.enrolledInCompany && data.companyId;
    const hasSkippedDocuments = (data.skippedDocuments || []).length > 0;

    const accountStatus = requiresManualApproval
      ? 'pending'
      : requiresCorporateApproval
        ? 'pending_corporate'
        : 'active';

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          password: hashedPassword,
          phone: data.phone,
          userType: prismaUserType as any,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          address: data.address,
          verified: false,
          accountStatus,
          ...(data.regionId ? { regionId: data.regionId } : {}),
          ...(data.profileImage ? { profileImage: data.profileImage } : {}),
        },
      });

      // Create type-specific profile
      await this.createProfile(tx, newUser.id, prismaUserType, data);

      // Create trial wallet
      let walletCurrency = 'MUR';
      let walletCredit = 4500;
      if (data.regionId) {
        const region = await tx.region.findUnique({
          where: { id: data.regionId },
          select: { currency: true, trialCredit: true },
        });
        if (region) {
          walletCurrency = region.currency;
          walletCredit = region.trialCredit;
        }
      }

      // Create the wallet + seed a matching ledger row. Previously the wallet
      // was created with a non-zero balance but NO `WalletTransaction`, which
      // meant the invariant "sum(ledger) === balance" was broken from day one
      // for every user. Audit Apr 2026 flagged this as a reconciliation gap.
      const createdWallet = await tx.userWallet.create({
        data: { userId: newUser.id, balance: walletCredit, currency: walletCurrency, initialCredit: walletCredit },
        select: { id: true },
      });
      if (walletCredit > 0) {
        await tx.walletTransaction.create({
          data: {
            walletId: createdWallet.id, type: 'credit', amount: walletCredit,
            description: 'Trial balance — welcome bonus', serviceType: 'trial',
            status: 'completed', balanceBefore: 0, balanceAfter: walletCredit,
          },
        });
      }

      // Auto-assign default platform services for providers (dynamic from DB, no hardcoded list)
      const providerRole = await tx.providerRole.findUnique({ where: { code: prismaUserType }, select: { isProvider: true } });
      if (providerRole?.isProvider) {
        const defaultServices = await tx.platformService.findMany({
          where: { providerType: prismaUserType as any, isDefault: true, isActive: true },
          select: { id: true },
        });
        if (defaultServices.length > 0) {
          await tx.providerServiceConfig.createMany({
            data: defaultServices.map(svc => ({
              platformServiceId: svc.id,
              providerUserId: newUser.id,
              priceOverride: null,
              isActive: true,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Subscribe to selected plan
      if (data.selectedPlanId) {
        const plan = await tx.subscriptionPlan.findUnique({
          where: { id: data.selectedPlanId },
          select: { id: true, price: true },
        });
        if (plan) {
          // If the plan has a price, we MUST successfully debit before
          // activating. Previously this block silently skipped the debit on
          // insufficient balance and left the user with a free active plan.
          // Audit Apr 2026 flagged this. Now: throw + rollback (the `$transaction`
          // will unwind the whole signup) unless the trial wallet covers it.
          if (plan.price > 0) {
            const wallet = await tx.userWallet.findUnique({
              where: { userId: newUser.id },
              select: { id: true, balance: true },
            });
            if (!wallet || wallet.balance < plan.price) {
              throw new BadRequestException(
                `Insufficient trial balance for selected plan (need ${plan.price}, have ${wallet?.balance ?? 0}). ` +
                `Choose a cheaper plan or top up before subscribing.`,
              );
            }
            const newBalance = wallet.balance - plan.price;
            await tx.userWallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id, type: 'debit', amount: plan.price,
                description: 'Subscription — first month', serviceType: 'subscription',
                referenceId: plan.id, balanceBefore: wallet.balance, balanceAfter: newBalance, status: 'completed',
              },
            });
            // Subscription revenue → PlatformTreasury.
            await this.treasury.creditPlatformFee(tx, {
              amount: plan.price,
              source: 'subscription_individual',
              referenceId: plan.id,
              description: `Individual plan "${plan.id}" first month`,
            });
          }
          await tx.userSubscription.create({
            data: { userId: newUser.id, planId: plan.id, status: 'active', startDate: new Date(), autoRenew: true },
          });
        }
      }

      // Create Document records
      if (data.documentUrls && data.documentUrls.length > 0) {
        await tx.document.createMany({
          data: data.documentUrls.map(doc => ({
            userId: newUser.id, name: doc.name, type: doc.type, url: doc.url, size: doc.size ?? null,
          })),
        });
      }

      // Language preference from region
      if (data.regionId) {
        const region = await tx.region.findUnique({ where: { id: data.regionId }, select: { language: true } });
        if (region) {
          await tx.userPreference.create({
            data: { userId: newUser.id, language: region.language as 'en' | 'fr' | 'mfe' },
          });
        }
      }

      // Process referral code
      if (data.referralCode) {
        const referrer = await tx.referralPartnerProfile.findUnique({
          where: { referralCode: data.referralCode },
          select: { id: true, userId: true },
        });
        if (referrer) {
          await tx.user.update({ where: { id: newUser.id }, data: { referredByCode: data.referralCode } });
          // Configurable bonus (default 500 MUR) — env-driven so admins can
          // tune it without code changes. Dashboard sums totalCommissionEarned.
          const bonus = Number(process.env.REFERRAL_SIGNUP_BONUS_MUR || 500);
          await tx.referralPartnerProfile.update({
            where: { id: referrer.id },
            data: {
              totalReferrals: { increment: 1 },
              totalCommissionEarned: { increment: bonus },
            },
          });
          const referrerWallet = await tx.userWallet.findUnique({
            where: { userId: referrer.userId },
            select: { id: true, balance: true },
          });
          if (referrerWallet) {
            await tx.userWallet.update({ where: { id: referrerWallet.id }, data: { balance: referrerWallet.balance + bonus } });
            await tx.walletTransaction.create({
              data: {
                walletId: referrerWallet.id, type: 'credit', amount: bonus,
                description: `Referral signup bonus — ${firstName} ${lastName}`, serviceType: 'referral',
                referenceId: newUser.id, balanceBefore: referrerWallet.balance, balanceAfter: referrerWallet.balance + bonus, status: 'completed',
              },
            });
          }
          if (data.trackingId) {
            try {
              await tx.referralClick.update({ where: { id: data.trackingId }, data: { convertedUserId: newUser.id, convertedAt: new Date() } });
            } catch { /* trackingId might be invalid */ }
          }
        }
      }

      // Corporate enrollment
      if (requiresCorporateApproval && data.companyId) {
        const corpProfile = await tx.corporateAdminProfile.findUnique({
          where: { id: data.companyId },
          select: { userId: true },
        });
        if (corpProfile) {
          await tx.corporateEmployee.create({
            data: { corporateAdminId: corpProfile.userId, userId: newUser.id, status: 'pending' },
          });
          await tx.notification.create({
            data: {
              userId: corpProfile.userId, title: 'New Employee Enrollment Request',
              message: `${firstName} ${lastName} has requested to join your company wellness program.`, type: 'corporate_enrollment',
            },
          });
        }
      }

      return newUser;
    });

    let message: string;
    if (requiresManualApproval) {
      message = 'Registration submitted. Your account requires super-admin approval and will be reviewed within 2-5 business days.';
    } else if (requiresCorporateApproval) {
      message = 'Registration submitted. Your corporate administrator has been notified and will approve your enrollment shortly.';
    } else if (hasSkippedDocuments) {
      message = 'Registration successful! You can log in now. Please upload your remaining documents from your account settings.';
    } else {
      message = 'Registration successful! You can now log in.';
    }

    // Embed-on-write: index new providers for semantic search (self-skips members).
    this.providerIndex.reembedProvider(user.id).catch(() => {});

    return { userId: user.id, accountStatus, hasSkippedDocuments, message };
  }

  // ─── Create type-specific profile ─────────────────────────────────────

  // ─── Activate a provider category for an existing member ──────────────────
  // Any MEMBER can turn on a service-provider category from their profile (the
  // user keeps their patient data; a role profile is added and userType flips so
  // they reach the provider dashboard). Mirrors the signup auto-login: returns a
  // fresh token + cookie userType so routing updates without a re-login.
  private static readonly SELF_ACTIVATABLE_PROVIDERS = new Set([
    'doctor', 'nurse', 'child-care-nurse', 'pharmacy', 'lab', 'ambulance',
    'caregiver', 'physiotherapist', 'dentist', 'optometrist', 'nutritionist',
  ]);

  async activateProvider(userId: string, providerCookieType: string) {
    const cookieType = (providerCookieType || '').toLowerCase().trim();
    if (!AuthService.SELF_ACTIVATABLE_PROVIDERS.has(cookieType)) {
      throw new BadRequestException('Unknown or non-activatable provider category');
    }
    const prismaUserType = cookieToPrismaUserType[cookieType];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, userType: true, address: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.userType !== UserType.MEMBER) {
      throw new BadRequestException('Only members can activate a provider category');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.createProfile(tx, userId, prismaUserType, {
        firstName: user.firstName, lastName: user.lastName, email: user.email, address: user.address,
      });
      await tx.user.update({ where: { id: userId }, data: { userType: prismaUserType } });
    });

    // Embed-on-write: index the brand-new provider so they're semantically searchable.
    this.providerIndex.reembedProvider(userId).catch(() => {});

    const cookieUserType =
      (await this.rolesResolver.codeToCookieAsync(prismaUserType)) ??
      prismaUserTypeToCookie[prismaUserType];
    const token = this.signToken({ sub: user.id, userType: cookieUserType, email: user.email });
    const redirectPath = await this.computeRedirectPath(cookieUserType, prismaUserType);

    return {
      token,
      cookieUserType,
      user: {
        id: user.id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, userType: cookieUserType, redirectPath,
      },
      redirectPath,
    };
  }

  private async createProfile(tx: any, userId: string, userType: string, data: any) {
    switch (userType) {
      case UserType.MEMBER:
        await tx.patientProfile.create({
          data: { userId, nationalId: `PAT-${userId.slice(0, 8).toUpperCase()}`, bloodType: 'Unknown', allergies: [], chronicConditions: [] },
        });
        if (data.emergencyContactName && data.emergencyContactPhone) {
          const pp = await tx.patientProfile.findUnique({ where: { userId }, select: { id: true } });
          if (pp) {
            await tx.patientEmergencyContact.create({
              data: { patientId: pp.id, name: data.emergencyContactName, phone: data.emergencyContactPhone, relationship: data.emergencyContactRelation || 'Not specified' },
            });
          }
        }
        break;
      case UserType.DOCTOR:
        await tx.doctorProfile.create({
          data: {
            userId, specialty: data.specialization ? [data.specialization] : ['General Practice'], subSpecialties: [],
            licenseNumber: data.licenseNumber || `DOC-${userId.slice(0, 8).toUpperCase()}`,
            licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            clinicAffiliation: data.institution || 'Not specified', hospitalPrivileges: [],
            experience: data.experience || '0 years', publications: [], awards: [],
            location: data.address, languages: [], consultationFee: 0, videoConsultationFee: 0,
            emergencyConsultationFee: 0, consultationTypes: ['video'], specialInterests: [], bio: '',
          },
        });
        break;
      case UserType.NURSE:
        await tx.nurseProfile.create({
          data: { userId, licenseNumber: data.licenseNumber || `NRS-${userId.slice(0, 8).toUpperCase()}`, experience: parseInt(data.experience, 10) || 0, specializations: data.specialization ? [data.specialization] : [] },
        });
        break;
      case UserType.NANNY:
        await tx.nannyProfile.create({ data: { userId, experience: parseInt(data.experience, 10) || 0, certifications: [] } });
        break;
      case UserType.PHARMACIST:
        await tx.pharmacistProfile.create({
          data: { userId, licenseNumber: data.licenseNumber || `PHR-${userId.slice(0, 8).toUpperCase()}`, pharmacyName: data.institution || 'Not specified', pharmacyAddress: data.address, specializations: data.specialization ? [data.specialization] : [] },
        });
        break;
      case UserType.LAB_TECHNICIAN:
        await tx.labTechProfile.create({
          data: { userId, licenseNumber: data.licenseNumber || `LAB-${userId.slice(0, 8).toUpperCase()}`, labName: data.institution || 'Not specified', specializations: data.specialization ? [data.specialization] : [] },
        });
        break;
      case UserType.EMERGENCY_WORKER:
        await tx.emergencyWorkerProfile.create({ data: { userId, certifications: [] } });
        break;
      case UserType.INSURANCE_REP:
        await tx.insuranceRepProfile.create({
          data: { userId, companyName: data.companyName || data.institution || 'Not specified', licenseNumber: data.licenseNumber || null, coverageTypes: [] },
        });
        break;
      case UserType.CORPORATE_ADMIN:
        await tx.corporateAdminProfile.create({
          data: { userId, companyName: data.companyName || 'Not specified', registrationNumber: data.companyRegistrationNumber || null },
        });
        break;
      case UserType.REFERRAL_PARTNER:
        await tx.referralPartnerProfile.create({
          data: { userId, businessType: data.businessType || 'Individual', commissionRate: 0, referralCode: `REF-${userId.slice(0, 8).toUpperCase()}`, totalReferrals: 0 },
        });
        break;
      case UserType.REGIONAL_ADMIN:
        await tx.regionalAdminProfile.create({
          data: { userId, region: data.targetRegion || 'Not specified', country: data.targetCountry || 'Not specified', countryCode: data.countryCode || null },
        });
        break;
      case UserType.CAREGIVER:
        await tx.caregiverProfile.create({ data: { userId, experience: parseInt(data.experience, 10) || 0, specializations: data.specialization ? [data.specialization] : [], certifications: [] } });
        break;
      case UserType.PHYSIOTHERAPIST:
        await tx.physiotherapistProfile.create({
          data: { userId, licenseNumber: data.licenseNumber || `PT-${userId.slice(0, 8).toUpperCase()}`, experience: parseInt(data.experience, 10) || 0, specializations: data.specialization ? [data.specialization] : [], clinicName: data.institution || null },
        });
        break;
      case UserType.DENTIST:
        await tx.dentistProfile.create({
          data: { userId, licenseNumber: data.licenseNumber || `DN-${userId.slice(0, 8).toUpperCase()}`, experience: parseInt(data.experience, 10) || 0, specializations: data.specialization ? [data.specialization] : ['General Dentistry'], clinicName: data.institution || null },
        });
        break;
      case UserType.OPTOMETRIST:
        await tx.optometristProfile.create({
          data: { userId, licenseNumber: data.licenseNumber || `OP-${userId.slice(0, 8).toUpperCase()}`, experience: parseInt(data.experience, 10) || 0, specializations: data.specialization ? [data.specialization] : ['General Eye Care'], clinicName: data.institution || null },
        });
        break;
      case UserType.NUTRITIONIST:
        await tx.nutritionistProfile.create({ data: { userId, experience: parseInt(data.experience, 10) || 0, specializations: data.specialization ? [data.specialization] : [], certifications: [] } });
        break;
    }
  }
}
