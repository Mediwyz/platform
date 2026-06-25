import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, Optional } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { userTypeToProfileRelation, cookieToPrismaUserType } from '../auth/auth.service';
import { PAYMENT_GATEWAY, PaymentGateway } from '../payments/payment-gateway.interface';
import { TreasuryService } from '../shared/services/treasury.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private treasury: TreasuryService,
    @Optional() @Inject(PAYMENT_GATEWAY) private gateway?: PaymentGateway,
  ) {}

  // ─── GET /users/:id ────────────────────────────────────────────────────

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        profileImage: true, coverImage: true, bio: true,
        dateOfBirth: true, gender: true, phone: true, address: true,
        verified: true, userType: true, accountStatus: true, createdAt: true,
        regionId: true,
        // Include provider rating + role flag for the profile hero.
        doctorProfile: { select: { rating: true, specialty: true, bio: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    // Flatten helpful bits onto the top-level response for the profile page.
    const specialty = user.doctorProfile?.specialty?.[0];
    const rating = user.doctorProfile?.rating;
    const providerBio = user.doctorProfile?.bio;
    const isProvider = !!user.doctorProfile;
    return {
      ...user,
      bio: user.bio ?? providerBio ?? null,
      specialty: specialty ?? null,
      rating: rating ?? null,
      isProvider,
    };
  }

  // ─── PATCH /users/:id ─────────────────────────────────────────────────

  // Top-level User string columns that the profile editor may update.
  private static readonly EDITABLE_STRING_FIELDS = [
    'firstName', 'lastName', 'phone', 'address', 'gender', 'profileImage', 'coverImage', 'bio',
    // Extended personal profile
    'middleName', 'preferredName', 'pronouns', 'maritalStatus', 'nationality',
    'secondaryPhone', 'secondaryEmail', 'website',
    'addressLine2', 'city', 'stateRegion', 'country', 'postalCode',
    'occupation', 'employer',
    'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship',
    'linkedinUrl', 'twitterUrl', 'facebookUrl', 'instagramUrl',
  ];

  async update(id: string, data: Record<string, any>) {
    const userData: Record<string, any> = {};
    for (const key of UsersService.EDITABLE_STRING_FIELDS) {
      if (data[key] !== undefined) userData[key] = data[key];
    }
    if (data.dateOfBirth) userData.dateOfBirth = new Date(data.dateOfBirth);
    if (Array.isArray(data.languages)) userData.languages = data.languages.filter((l: unknown) => typeof l === 'string');
    // Numeric biometrics: coerce, drop blanks/invalid.
    for (const numKey of ['heightCm', 'weightKg']) {
      if (data[numKey] === undefined) continue;
      if (data[numKey] === null || data[numKey] === '') { userData[numKey] = null; continue; }
      const n = Number(data[numKey]);
      if (!Number.isNaN(n)) userData[numKey] = numKey === 'heightCm' ? Math.round(n) : n;
    }

    const updated = await this.prisma.user.update({
      where: { id }, data: userData,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        profileImage: true, coverImage: true, bio: true,
        phone: true, address: true, gender: true, dateOfBirth: true,
        middleName: true, preferredName: true, pronouns: true, maritalStatus: true, nationality: true,
        secondaryPhone: true, secondaryEmail: true, website: true,
        addressLine2: true, city: true, stateRegion: true, country: true, postalCode: true,
        occupation: true, employer: true, languages: true,
        emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelationship: true,
        linkedinUrl: true, twitterUrl: true, facebookUrl: true, instagramUrl: true,
        heightCm: true, weightKg: true,
      },
    });
    return updated;
  }

  // ─── Notifications ─────────────────────────────────────────────────────

  async getNotifications(userId: string, opts: { unread?: boolean; limit?: number; page?: number; grouped?: boolean }) {
    const where: any = { userId };
    if (opts.unread) where.readAt = null;
    const take = opts.limit || 20;
    const skip = opts.page ? (opts.page - 1) * take : 0;
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    // Group same-day same-groupKey notifications into a single card.
    // Kept opt-in (opts.grouped) to preserve existing consumers.
    if (!opts.grouped) {
      return { notifications, meta: { total, unreadCount } };
    }
    type Row = typeof notifications[number];
    const buckets = new Map<string, Row[]>();
    for (const n of notifications) {
      if (!n.groupKey) {
        buckets.set(`single:${n.id}`, [n]);
        continue;
      }
      const day = n.createdAt.toISOString().slice(0, 10);
      const key = `${n.groupKey}:${day}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(n);
    }
    const grouped = Array.from(buckets.values()).map((rows) => {
      if (rows.length === 1) return { ...rows[0], count: 1, members: [rows[0].id] };
      // Collapse: use the most recent as the representative, prefix title with count.
      const latest = rows[0];
      return {
        ...latest,
        count: rows.length,
        members: rows.map(r => r.id),
        message: rows.length > 1
          ? `${latest.message} · +${rows.length - 1} update${rows.length > 2 ? 's' : ''} today`
          : latest.message,
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { notifications: grouped, meta: { total, unreadCount, groupedCount: grouped.length } };
  }

  async markNotificationsRead(userId: string, notificationIds: string[]) {
    await this.prisma.notification.updateMany({
      where: { id: { in: notificationIds }, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: result.count };
  }

  // ─── Wallet ────────────────────────────────────────────────────────────

  async getWallet(userId: string) {
    const wallet = await this.prisma.userWallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  /**
   * Top up the user's Account Balance. Flow:
   *   1. Ask the `PaymentGateway` to collect real money (mock today, MCB Juice later).
   *   2. If the gateway reports `completed`, credit the internal ledger in the same tx.
   *   3. If the gateway returns `pending` (e.g. 3DS / redirect), persist the external
   *      id + a pending `WalletTransaction` — the webhook flips it to completed.
   * The internal ledger is NEVER credited before the gateway confirms success.
   */
  async topUpWallet(userId: string, amount: number, channel: 'mcb_juice' | 'card' | 'mock' = 'mock', channelRef?: string) {
    if (amount <= 0 || amount > 50000) throw new BadRequestException('Amount must be between 1 and 50000');
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId }, select: { id: true, balance: true, currency: true } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const gateway = this.gateway;
    if (!gateway) throw new BadRequestException('Payment gateway unavailable');

    const result = await gateway.initiateTopUp({
      userId, amount, currency: wallet.currency, channel, channelRef,
    });

    if (result.status === 'failed') {
      throw new BadRequestException(result.failureReason ?? 'Top-up declined by gateway');
    }

    // Pending path — external redirect / 3DS. Persist the pending row so the
    // webhook can match it. No balance change yet.
    if (result.status === 'pending') {
      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id, type: 'credit', amount, description: `Wallet top-up (${channel})`,
          serviceType: 'topup', status: 'pending',
          balanceBefore: wallet.balance, balanceAfter: wallet.balance,
          referenceId: result.externalId,
        },
      });
      return { pending: true, externalId: result.externalId, redirectUrl: result.redirectUrl };
    }

    // Completed synchronously — credit the ledger atomically.
    const newBalance = wallet.balance + amount;
    await this.prisma.$transaction(async (tx) => {
      await tx.userWallet.update({ where: { userId }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id, type: 'credit', amount, description: `Wallet top-up (${channel})`,
          serviceType: 'topup', status: 'completed',
          balanceBefore: wallet.balance, balanceAfter: newBalance,
          referenceId: result.externalId,
        },
      });
    });
    return { newBalance, externalId: result.externalId };
  }

  /**
   * Webhook handler — called when the gateway confirms a previously-pending top-up.
   * Flips the pending `WalletTransaction` to `completed` and credits the balance.
   * Idempotent via the `referenceId` unique check.
   */
  async confirmPendingTopUp(externalId: string) {
    const gateway = this.gateway;
    if (!gateway) throw new BadRequestException('Payment gateway unavailable');
    const result = await gateway.verifyTopUp(externalId);
    if (result.status !== 'completed') {
      throw new BadRequestException(`Top-up ${externalId} not completed (${result.status})`);
    }

    const pending = await this.prisma.walletTransaction.findFirst({
      where: { referenceId: externalId, status: 'pending', serviceType: 'topup' },
    });
    if (!pending) return { alreadyProcessed: true }; // idempotency guard

    const wallet = await this.prisma.userWallet.findUnique({ where: { id: pending.walletId } });
    if (!wallet) throw new NotFoundException('Wallet vanished between initiate and confirm');

    const newBalance = wallet.balance + pending.amount;
    await this.prisma.$transaction(async (tx) => {
      await tx.userWallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
      await tx.walletTransaction.update({
        where: { id: pending.id },
        data: { status: 'completed', balanceBefore: wallet.balance, balanceAfter: newBalance },
      });
    });
    return { newBalance, externalId };
  }

  async resetWallet(userId: string, customAmount?: number) {
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (customAmount !== undefined && (customAmount < 0 || customAmount > 50000)) {
      throw new BadRequestException('Reset amount must be between 0 and 50000');
    }
    // When no amount is given, restore the trial credit. If the account was
    // created with no initial credit, fall back to a usable default so the
    // reset always leaves a balance the member can actually book with.
    const DEFAULT_TRIAL_CREDIT = 5000;
    const fallback = wallet.initialCredit > 0 ? wallet.initialCredit : DEFAULT_TRIAL_CREDIT;
    const resetAmount = customAmount ?? fallback;
    const delta = resetAmount - wallet.balance;
    if (delta === 0) return { balance: wallet.balance, initialCredit: wallet.initialCredit };

    // Previously this method logged `amount: resetAmount` with `type: 'credit'`
    // regardless of direction — so resetting from 10000 → 5000 recorded a
    // phantom 5000-credit. Now the ledger row reflects the actual delta.
    await this.prisma.$transaction(async (tx) => {
      await tx.userWallet.update({ where: { userId }, data: { balance: resetAmount } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: delta > 0 ? 'credit' : 'debit',
          amount: Math.abs(delta),
          description: 'Trial wallet reset', serviceType: 'trial_reset', status: 'completed',
          balanceBefore: wallet.balance, balanceAfter: resetAmount,
        },
      });
    });
    return { balance: resetAmount, initialCredit: wallet.initialCredit };
  }

  async debitWallet(userId: string, amount: number, description?: string, serviceType?: string, providerUserId?: string) {
    if (!amount || amount <= 0) throw new BadRequestException('Amount must be positive');
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.balance < amount) throw new BadRequestException('Insufficient balance');

    const platformCommission = Math.round(amount * 0.15 * 100) / 100;
    const providerAmount = amount - platformCommission;
    const newBalance = wallet.balance - amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.userWallet.update({ where: { userId }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id, type: 'debit', amount,
          description: description || 'Service payment', status: 'completed',
          serviceType, platformCommission, providerAmount,
          balanceBefore: wallet.balance, balanceAfter: newBalance,
        },
      });

      if (providerUserId) {
        const providerWallet = await tx.userWallet.findUnique({ where: { userId: providerUserId } });
        if (providerWallet) {
          const providerNewBalance = providerWallet.balance + providerAmount;
          await tx.userWallet.update({ where: { userId: providerUserId }, data: { balance: providerNewBalance } });
          await tx.walletTransaction.create({
            data: {
              walletId: providerWallet.id, type: 'credit', amount: providerAmount,
              description: description || 'Service payment received', status: 'completed',
              serviceType, balanceBefore: providerWallet.balance, balanceAfter: providerNewBalance,
            },
          });
        }
        // Platform 15% → PlatformTreasury ledger row.
        await this.treasury.creditPlatformFee(tx, {
          amount: platformCommission,
          source: serviceType ?? 'generic_debit',
          description: description || 'Service payment platform fee',
        });
      }
    });

    return { balance: newBalance };
  }

  // ─── Subscription ─────────────────────────────────────────────────────

  async getSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: { include: { planServices: { include: { platformService: true } } } } },
    });
    return subscription;
  }

  async updateSubscription(userId: string, action: string, planId?: string) {
    if (action === 'subscribe' || action === 'change') {
      if (!planId) throw new BadRequestException('planId is required');
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) throw new NotFoundException('Plan not found');

      // Corporate plans cannot be self-subscribed
      if (plan.type === 'corporate') {
        throw new BadRequestException('Corporate plans must be assigned by a corporate admin');
      }

      const subscription = await this.prisma.userSubscription.upsert({
        where: { userId },
        update: { planId, status: 'active', startDate: new Date() },
        create: { userId, planId, status: 'active', startDate: new Date(), autoRenew: true },
      });
      return subscription;
    }

    if (action === 'cancel') {
      const existing = await this.prisma.userSubscription.findUnique({ where: { userId } });
      if (!existing) throw new NotFoundException('No active subscription');
      const subscription = await this.prisma.userSubscription.update({
        where: { userId }, data: { status: 'cancelled', autoRenew: false },
      });
      return subscription;
    }

    throw new BadRequestException('action must be subscribe, change, or cancel');
  }

  // ─── Documents ─────────────────────────────────────────────────────────

  async getDocuments(userId: string, type?: string) {
    return this.prisma.document.findMany({
      where: { userId, ...(type ? { type } : {}) },
      select: { id: true, name: true, type: true, url: true, size: true, uploadedAt: true },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async createDocument(userId: string, data: { name: string; type: string; url: string; size?: number }) {
    return this.prisma.document.create({
      data: { userId, name: data.name, type: data.type, url: data.url, size: data.size ?? null },
      select: { id: true, name: true, type: true, url: true, size: true, uploadedAt: true },
    });
  }

  async deleteDocument(userId: string, docId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId }, select: { userId: true } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.userId !== userId) throw new ForbiddenException('Not authorized to delete this document');
    await this.prisma.document.delete({ where: { id: docId } });
  }

  // ─── Availability ─────────────────────────────────────────────────────

  async getAvailability(userId: string, dayOfWeek?: number) {
    return this.prisma.providerAvailability.findMany({
      where: { userId, ...(dayOfWeek !== undefined ? { dayOfWeek } : {}) },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async setAvailability(userId: string, slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.providerAvailability.deleteMany({ where: { userId } });
      if (slots.length > 0) {
        await tx.providerAvailability.createMany({
          data: slots.map(s => ({ userId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive ?? true })),
        });
      }
      return tx.providerAvailability.findMany({ where: { userId }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
    });
  }

  // ─── Preferences ───────────────────────────────────────────────────────

  async getPreferences(userId: string) {
    const prefs = await this.prisma.userPreference.findUnique({ where: { userId } });
    return prefs || { language: 'en', timezone: 'Indian/Mauritius', emailNotifications: true, pushNotifications: true, smsNotifications: false, appointmentReminders: true, marketingEmails: false, profileVisibility: 'public' };
  }

  async updatePreferences(userId: string, data: Record<string, any>) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  // ─── Password ──────────────────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user) throw new NotFoundException('User not found');
    if (!(await bcrypt.compare(currentPassword, user.password))) throw new BadRequestException('Current password is incorrect');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  // ─── Billing ───────────────────────────────────────────────────────────

  async getBilling(userId: string) {
    return this.prisma.billingInfo.findMany({
      where: { userId },
      select: { id: true, type: true, lastFour: true, cardHolder: true, expiryDate: true, isDefault: true, createdAt: true },
    });
  }

  async addBilling(userId: string, data: { type: string; lastFour: string; cardHolder?: string; expiryDate?: string; isDefault?: boolean }) {
    if (data.isDefault) {
      await this.prisma.billingInfo.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.billingInfo.create({
      data: { userId, type: data.type, lastFour: data.lastFour, cardHolder: data.cardHolder, expiryDate: data.expiryDate, isDefault: data.isDefault ?? false },
    });
  }

  async deleteBilling(userId: string, billingId: string) {
    const billing = await this.prisma.billingInfo.findUnique({ where: { id: billingId } });
    if (!billing || billing.userId !== userId) throw new NotFoundException('Billing info not found');
    await this.prisma.billingInfo.delete({ where: { id: billingId } });
  }

  async searchUsers(q: string, excludeUserId: string) {
    if (!q || q.length < 2) return [];
    return this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true, profileImage: true, userType: true },
      take: 20,
      orderBy: { firstName: 'asc' },
    });
  }

  async addPushSubscription(userId: string, data: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: { userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth, userAgent: data.userAgent },
      update: { p256dh: data.p256dh, auth: data.auth, userAgent: data.userAgent },
    });
  }

  async removePushSubscription(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  }
}
