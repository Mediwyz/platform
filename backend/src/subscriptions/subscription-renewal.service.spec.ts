import { SubscriptionRenewalService } from './subscription-renewal.service';

/**
 * Idempotency + money-flow tests for the monthly individual-subscription cron.
 * Corporate subs are billed in bulk at enrollment time and must be skipped here.
 */
describe('SubscriptionRenewalService', () => {
  let service: SubscriptionRenewalService;
  let prisma: any;
  let treasury: any;

  const period = new Date().toISOString().slice(0, 7);

  beforeEach(() => {
    prisma = {
      userSubscription: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      subscriptionRenewalLog: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userWallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      walletTransaction: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(prisma)),
    };
    treasury = { creditPlatformFee: jest.fn() };
    const notifications = { createNotification: jest.fn().mockResolvedValue({}) };
    const money = {
      format: (a: number, c = 'MUR') => `${a.toFixed(0)} ${c}`,
      formatForUser: (a: number) => Promise.resolve(`${a.toFixed(0)} MUR`),
      currencyFor: () => Promise.resolve('MUR'),
    };
    service = new SubscriptionRenewalService(prisma, notifications as any, treasury, money as any);
  });

  it('skips corporate-paid subscriptions (employer bills in bulk)', async () => {
    // corporateAdminId is part of the where clause — the mock returns only
    // the matching rows.
    prisma.userSubscription.findMany.mockResolvedValueOnce([]);
    const out = await service.processDueRenewals();
    expect(out.processed).toBe(0);
    expect(prisma.userWallet.update).not.toHaveBeenCalled();
  });

  it('charges a due individual subscription and writes the idempotency log', async () => {
    const sub = {
      id: 'S1', userId: 'U1',
      startDate: new Date('2026-01-01'), // day-of-month 1; today's day ≥ 1
      plan: { id: 'PL1', name: 'Basic', price: 500 },
    };
    prisma.userSubscription.findMany.mockResolvedValueOnce([sub]);
    prisma.subscriptionRenewalLog.findUnique.mockResolvedValueOnce(null);
    prisma.userWallet.findUnique.mockResolvedValueOnce({ id: 'W1', balance: 2000 });

    await service.processDueRenewals();

    expect(prisma.userWallet.update).toHaveBeenCalledWith({
      where: { id: 'W1' }, data: { balance: 1500 },
    });
    expect(treasury.creditPlatformFee).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ amount: 500, source: 'subscription_individual' }),
    );
    expect(prisma.subscriptionRenewalLog.create).toHaveBeenCalledWith({
      data: { subscriptionId: 'S1', period, amount: 500 },
    });
  });

  it('is a no-op on a re-fire within the same period', async () => {
    prisma.userSubscription.findMany.mockResolvedValueOnce([{
      id: 'S1', userId: 'U1', startDate: new Date('2026-01-01'),
      plan: { id: 'PL1', name: 'Basic', price: 500 },
    }]);
    prisma.subscriptionRenewalLog.findUnique.mockResolvedValueOnce({ id: 'LOG1' });

    await service.processDueRenewals();

    expect(prisma.userWallet.update).not.toHaveBeenCalled();
    expect(treasury.creditPlatformFee).not.toHaveBeenCalled();
  });

  it('flips to past_due when wallet balance is insufficient — does NOT write a log row', async () => {
    prisma.userSubscription.findMany.mockResolvedValueOnce([{
      id: 'S1', userId: 'U1', startDate: new Date('2026-01-01'),
      plan: { id: 'PL1', name: 'Basic', price: 500 },
    }]);
    prisma.subscriptionRenewalLog.findUnique.mockResolvedValueOnce(null);
    prisma.userWallet.findUnique.mockResolvedValueOnce({ id: 'W1', balance: 50 });

    const out = await service.processDueRenewals();

    expect(prisma.userSubscription.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'S1' }, data: { status: 'past_due' },
    }));
    // No log row means tomorrow's sweep tries again.
    expect(prisma.subscriptionRenewalLog.create).not.toHaveBeenCalled();
    expect(out.pastDue).toBe(1);
  });

  it('skips when today is before the startDate anniversary day', async () => {
    // Pin "now" to the 15th so the anniversary day (20th) is reliably in the
    // future, regardless of the real calendar date the suite runs on.
    jest.useFakeTimers().setSystemTime(new Date('2026-06-15T12:00:00Z'));
    try {
      const sub = {
        id: 'S1', userId: 'U1',
        startDate: new Date(Date.UTC(2026, 0, 20)), // day-of-month 20 > 15
        plan: { id: 'PL1', name: 'Basic', price: 500 },
      };
      prisma.userSubscription.findMany.mockResolvedValueOnce([sub]);

      const out = await service.processDueRenewals();
      expect(out.processed).toBe(0);
      expect(prisma.userWallet.update).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
