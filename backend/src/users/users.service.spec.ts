import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { TreasuryService } from '../shared/services/treasury.service';
import { ProviderIndexService } from '../embeddings/provider-index.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  userWallet: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  walletTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
  userSubscription: { findUnique: jest.fn() },
  userDocument: { findMany: jest.fn(), create: jest.fn() },
  providerAvailability: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
  userPreference: { findUnique: jest.fn(), upsert: jest.fn() },
  billingInfo: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn((fns) => Promise.all(fns)),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TreasuryService, useValue: {
            creditPlatformFee: jest.fn(), creditContribution: jest.fn(),
            payoutClaim: jest.fn(), payoutProviderDirect: jest.fn(),
          } },
        { provide: ProviderIndexService, useValue: { reembedProvider: jest.fn().mockResolvedValue(false) } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('returns user data when found, enriched with profile flattenings', async () => {
      const mockUser = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      // Base fields preserved + enrichment fields added (null when no doctorProfile).
      expect(result).toMatchObject(mockUser);
      expect(result).toMatchObject({ isProvider: false, rating: null, specialty: null, bio: null });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' } }));
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates allowed fields', async () => {
      const updatedUser = { id: 'user-1', firstName: 'Jane', lastName: 'Doe' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);
      const result = await service.update('user-1', { firstName: 'Jane' });
      expect(result).toEqual(updatedUser);
    });

    it('ignores disallowed fields', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });
      await service.update('user-1', { email: 'hacked@test.com', firstName: 'Jane' });
      const callData = mockPrisma.user.update.mock.calls[0][0].data;
      expect(callData.email).toBeUndefined();
      expect(callData.firstName).toBe('Jane');
    });
  });

  describe('getNotifications', () => {
    it('returns notifications with meta', async () => {
      const mockNotifs = [{ id: 'n1', message: 'test' }];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifs);
      mockPrisma.notification.count.mockResolvedValue(1);
      const result = await service.getNotifications('user-1', {});
      expect(result.notifications).toEqual(mockNotifs);
    });
  });

  describe('getWallet', () => {
    it('returns wallet data when exists', async () => {
      const mockWallet = { id: 'w1', balance: 5000, currency: 'MUR' };
      mockPrisma.userWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.walletTransaction.findMany.mockResolvedValue([]);
      const result = await service.getWallet('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('topUpWallet', () => {
    it('rejects non-positive amounts', async () => {
      await expect(service.topUpWallet('user-1', 0)).rejects.toThrow(BadRequestException);
      await expect(service.topUpWallet('user-1', -100)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetWallet', () => {
    // resetWallet uses the callback form of $transaction — make the mock run it.
    const runCallbackTx = () =>
      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({ userWallet: { update: jest.fn() }, walletTransaction: { create: jest.fn() } }),
      );

    it('restores a usable default when initialCredit is 0', async () => {
      mockPrisma.userWallet.findUnique.mockResolvedValue({
        id: 'w1', balance: 0, currency: 'MUR', initialCredit: 0,
      });
      runCallbackTx();

      const result = await service.resetWallet('user-1');

      expect(result.balance).toBe(5000);
    });

    it('restores the initial trial credit when it is set', async () => {
      mockPrisma.userWallet.findUnique.mockResolvedValue({
        id: 'w1', balance: 100, currency: 'MUR', initialCredit: 4500,
      });
      runCallbackTx();

      const result = await service.resetWallet('user-1');

      expect(result.balance).toBe(4500);
    });

    it('rejects a reset amount above the cap', async () => {
      mockPrisma.userWallet.findUnique.mockResolvedValue({
        id: 'w1', balance: 0, currency: 'MUR', initialCredit: 0,
      });
      await expect(service.resetWallet('user-1', 99999)).rejects.toThrow(BadRequestException);
    });
  });
});
