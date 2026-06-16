import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoiceService } from '../shared/services/invoice.service';
import { TreasuryService } from '../shared/services/treasury.service';

// Transaction mock — calls the callback with a tx proxy that delegates to mockPrisma
const mockPrisma: any = {
  providerInventoryItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  inventoryOrder: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: 'PROV001', verified: true }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  healthcareEntity: { findUnique: jest.fn() },
  providerWorkplace: { findUnique: jest.fn() },
  patientProfile: { findUnique: jest.fn() },
  prescription: { findFirst: jest.fn() },
  userWallet: { findUnique: jest.fn(), update: jest.fn() },
  walletTransaction: { create: jest.fn() },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotifications = {
  createNotification: jest.fn().mockResolvedValue({}),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: InvoiceService, useValue: { generateInvoice: jest.fn().mockResolvedValue({}) } },
        { provide: TreasuryService, useValue: { creditPlatformFee: jest.fn() } },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createItem ─────────────────────────────────────────────────────────

  describe('createItem', () => {
    it('should create an inventory item with defaults', async () => {
      const newItem = {
        id: 'ITEM001', name: 'Paracetamol', category: 'Medicines',
        price: 50, quantity: 100, inStock: true, isActive: true,
      };
      mockPrisma.providerInventoryItem.create.mockResolvedValue(newItem);

      const result = await service.createItem('PHARM001', 'PHARMACIST', {
        name: 'Paracetamol', category: 'Medicines', price: 50, quantity: 100,
      });

      expect(result).toEqual(newItem);
      expect(mockPrisma.providerInventoryItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          providerUserId: 'PHARM001',
          providerType: 'PHARMACIST',
          name: 'Paracetamol',
          category: 'Medicines',
          price: 50,
          quantity: 100,
          unitOfMeasure: 'unit',
          minStockAlert: 5,
          requiresPrescription: false,
          inStock: true,
          isActive: true,
        }),
      });
    });

    it('should sell under an organisation the provider founded', async () => {
      mockPrisma.healthcareEntity.findUnique.mockResolvedValue({ id: 'ENT1', founderUserId: 'PHARM001' });
      mockPrisma.providerInventoryItem.create.mockResolvedValue({ id: 'ITEM003' });

      await service.createItem('PHARM001', 'PHARMACIST', {
        name: 'Paracetamol', category: 'Medicines', price: 50, healthcareEntityId: 'ENT1',
      });

      expect(mockPrisma.providerInventoryItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ healthcareEntityId: 'ENT1' }),
      });
    });

    it('should reject selling under an organisation the provider does not belong to', async () => {
      mockPrisma.healthcareEntity.findUnique.mockResolvedValue({ id: 'ENT1', founderUserId: 'SOMEONE_ELSE' });
      mockPrisma.providerWorkplace.findUnique.mockResolvedValue(null);

      await expect(
        service.createItem('PHARM001', 'PHARMACIST', {
          name: 'Paracetamol', category: 'Medicines', price: 50, healthcareEntityId: 'ENT1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should set inStock to false when quantity is 0', async () => {
      mockPrisma.providerInventoryItem.create.mockResolvedValue({ id: 'ITEM002' });

      await service.createItem('PHARM001', 'PHARMACIST', {
        name: 'Rare Drug', category: 'Medicines', price: 200,
      });

      expect(mockPrisma.providerInventoryItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ quantity: 0, inStock: false }),
      });
    });
  });

  // ─── updateItem ─────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('should update an item owned by the user', async () => {
      mockPrisma.providerInventoryItem.findUnique.mockResolvedValue({
        id: 'ITEM001', providerUserId: 'PHARM001',
      });
      mockPrisma.providerInventoryItem.update.mockResolvedValue({ id: 'ITEM001', price: 75 });

      const result = await service.updateItem('ITEM001', 'PHARM001', { price: 75 });

      expect(result.price).toBe(75);
    });

    it('should throw NotFoundException for non-existent item', async () => {
      mockPrisma.providerInventoryItem.findUnique.mockResolvedValue(null);

      await expect(service.updateItem('MISSING', 'PHARM001', { price: 75 })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the item', async () => {
      mockPrisma.providerInventoryItem.findUnique.mockResolvedValue({
        id: 'ITEM001', providerUserId: 'OTHER_USER',
      });

      await expect(service.updateItem('ITEM001', 'PHARM001', { price: 75 })).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── createOrder ────────────────────────────────────────────────────────

  describe('createOrder', () => {
    // For createOrder, we need to mock $transaction to call the callback with a tx proxy
    const setupTransaction = (txOverrides: Record<string, any> = {}) => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn(),
            update: jest.fn(),
          },
          patientProfile: { findUnique: jest.fn() },
          prescription: { findFirst: jest.fn() },
          userWallet: { findUnique: jest.fn(), update: jest.fn() },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: { create: jest.fn() },
          user: { findUnique: jest.fn().mockResolvedValue({ userType: 'PHARMACIST' }) },
          ...txOverrides,
        };
        return cb(tx);
      });
    };

    it('should create an order, deduct stock, and process payment', async () => {
      const orderResult = {
        id: 'ORD001', totalAmount: 200, status: 'confirmed',
        items: [{ inventoryItemId: 'ITEM001', quantity: 2, unitPrice: 100, subtotal: 200, inventoryItem: {} }],
      };

      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'ITEM001', name: 'Vitamin C', isActive: true, inStock: true,
              quantity: 50, price: 100, requiresPrescription: false, minStockAlert: 5,
            }),
            update: jest.fn(),
          },
          patientProfile: { findUnique: jest.fn() },
          prescription: { findFirst: jest.fn() },
          userWallet: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'W-PAT', balance: 1000 }) // wallet check
              .mockResolvedValueOnce({ id: 'W-PAT', balance: 1000 }) // payment debit
              .mockResolvedValueOnce({ id: 'W-PROV', balance: 500 }), // provider credit
            update: jest.fn(),
          },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: {
            create: jest.fn().mockResolvedValue(orderResult),
          },
          user: { findUnique: jest.fn().mockResolvedValue({ userType: 'PHARMACIST' }) },
        };
        return cb(tx);
      });

      const result = await service.createOrder('PAT001', {
        providerUserId: 'PHARM001',
        items: [{ itemId: 'ITEM001', quantity: 2 }],
      });

      expect(result).toEqual(orderResult);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when item has insufficient stock', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'ITEM001', name: 'Rare Drug', isActive: true, inStock: true,
              quantity: 1, price: 500, requiresPrescription: false, minStockAlert: 5,
            }),
          },
          patientProfile: { findUnique: jest.fn() },
          prescription: { findFirst: jest.fn() },
          userWallet: { findUnique: jest.fn(), update: jest.fn() },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(
        service.createOrder('PAT001', {
          providerUserId: 'PHARM001',
          items: [{ itemId: 'ITEM001', quantity: 10 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when item is not found or inactive', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          patientProfile: { findUnique: jest.fn() },
          prescription: { findFirst: jest.fn() },
          userWallet: { findUnique: jest.fn() },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(
        service.createOrder('PAT001', {
          providerUserId: 'PHARM001',
          items: [{ itemId: 'NONEXIST', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when wallet balance is insufficient', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'ITEM001', name: 'Vitamin C', isActive: true, inStock: true,
              quantity: 50, price: 500, requiresPrescription: false, minStockAlert: 5,
            }),
          },
          patientProfile: { findUnique: jest.fn() },
          prescription: { findFirst: jest.fn() },
          userWallet: {
            findUnique: jest.fn().mockResolvedValue({ id: 'W-PAT', balance: 100 }),
          },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(
        service.createOrder('PAT001', {
          providerUserId: 'PHARM001',
          items: [{ itemId: 'ITEM001', quantity: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when prescription-required item has no prescription', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'ITEM001', name: 'Controlled Med', isActive: true, inStock: true,
              quantity: 50, price: 200, requiresPrescription: true, minStockAlert: 5,
            }),
          },
          patientProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'PROF-PAT001' }) },
          prescription: { findFirst: jest.fn().mockResolvedValue(null) },
          userWallet: { findUnique: jest.fn(), update: jest.fn() },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(
        service.createOrder('PAT001', {
          providerUserId: 'PHARM001',
          items: [{ itemId: 'ITEM001', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow prescription-required item when valid prescription exists', async () => {
      const orderResult = { id: 'ORD002', totalAmount: 200, status: 'confirmed', items: [] };

      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'ITEM001', name: 'Controlled Med', isActive: true, inStock: true,
              quantity: 50, price: 200, requiresPrescription: true, minStockAlert: 5,
            }),
            update: jest.fn(),
          },
          patientProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'PROF-PAT001' }) },
          prescription: { findFirst: jest.fn().mockResolvedValue({ id: 'RX001', isActive: true }) },
          userWallet: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'W-PAT', balance: 5000 })
              .mockResolvedValueOnce({ id: 'W-PAT', balance: 5000 })
              .mockResolvedValueOnce({ id: 'W-PROV', balance: 500 }),
            update: jest.fn(),
          },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: { create: jest.fn().mockResolvedValue(orderResult) },
          user: { findUnique: jest.fn().mockResolvedValue({ userType: 'PHARMACIST' }) },
        };
        return cb(tx);
      });

      const result = await service.createOrder('PAT001', {
        providerUserId: 'PHARM001',
        items: [{ itemId: 'ITEM001', quantity: 1 }],
      });

      expect(result).toEqual(orderResult);
    });

    it('should send low-stock notification when stock drops below minStockAlert', async () => {
      const orderResult = { id: 'ORD003', totalAmount: 100, status: 'confirmed', items: [] };

      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          providerInventoryItem: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'ITEM001', name: 'Almost Gone', isActive: true, inStock: true,
              quantity: 3, price: 100, requiresPrescription: false, minStockAlert: 5,
            }),
            update: jest.fn(),
          },
          patientProfile: { findUnique: jest.fn() },
          prescription: { findFirst: jest.fn() },
          userWallet: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'W-PAT', balance: 1000 })
              .mockResolvedValueOnce({ id: 'W-PAT', balance: 1000 })
              .mockResolvedValueOnce({ id: 'W-PROV', balance: 500 }),
            update: jest.fn(),
          },
          walletTransaction: { create: jest.fn() },
          inventoryOrder: { create: jest.fn().mockResolvedValue(orderResult) },
          user: { findUnique: jest.fn().mockResolvedValue({ userType: 'PHARMACIST' }) },
        };
        return cb(tx);
      });

      await service.createOrder('PAT001', {
        providerUserId: 'PHARM001',
        items: [{ itemId: 'ITEM001', quantity: 1 }],
      });

      // Should send both low-stock alert and order notification
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'inventory', title: 'Low Stock Alert' }),
      );
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order', title: 'New Health Shop Order' }),
      );
    });
  });

  // ─── searchShop ─────────────────────────────────────────────────────────

  describe('searchShop', () => {
    it('should return filtered items with total count', async () => {
      const items = [
        { id: 'I1', name: 'Vitamin C', price: 50, inStock: true, isActive: true, isRecommended: false },
      ];
      mockPrisma.providerInventoryItem.findMany.mockResolvedValue(items);
      mockPrisma.providerInventoryItem.count.mockResolvedValue(1);

      const result = await service.searchShop({ query: 'vitamin' });

      expect(result.items).toHaveLength(1);
      // searchShop now annotates each item with seller info (org name or the
      // individual provider) and isRecommended.
      expect(result.items[0]).toEqual(
        expect.objectContaining({ id: 'I1', name: 'Vitamin C', sellerType: 'provider' }),
      );
      expect(result.total).toBe(1);
      expect(mockPrisma.providerInventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            inStock: true,
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'vitamin', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      mockPrisma.providerInventoryItem.findMany.mockResolvedValue([]);
      mockPrisma.providerInventoryItem.count.mockResolvedValue(0);

      await service.searchShop({ category: 'Supplements' });

      expect(mockPrisma.providerInventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'Supplements' }),
        }),
      );
    });

    it('should filter by providerType', async () => {
      mockPrisma.providerInventoryItem.findMany.mockResolvedValue([]);
      mockPrisma.providerInventoryItem.count.mockResolvedValue(0);

      await service.searchShop({ providerType: 'PHARMACIST' });

      expect(mockPrisma.providerInventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ providerType: 'PHARMACIST' }),
        }),
      );
    });

    it('should apply pagination defaults', async () => {
      mockPrisma.providerInventoryItem.findMany.mockResolvedValue([]);
      mockPrisma.providerInventoryItem.count.mockResolvedValue(0);

      await service.searchShop({});

      expect(mockPrisma.providerInventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 0 }),
      );
    });

    it('should respect custom limit and offset', async () => {
      mockPrisma.providerInventoryItem.findMany.mockResolvedValue([]);
      mockPrisma.providerInventoryItem.count.mockResolvedValue(0);

      await service.searchShop({ limit: 10, offset: 20 });

      expect(mockPrisma.providerInventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 20 }),
      );
    });
  });

  // ─── deactivateItem ────────────────────────────────────────────────────

  describe('deactivateItem', () => {
    it('should deactivate an item owned by the user', async () => {
      mockPrisma.providerInventoryItem.findUnique.mockResolvedValue({
        id: 'ITEM001', providerUserId: 'PHARM001',
      });
      mockPrisma.providerInventoryItem.update.mockResolvedValue({ id: 'ITEM001', isActive: false });

      await service.deactivateItem('ITEM001', 'PHARM001');

      expect(mockPrisma.providerInventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'ITEM001' },
        data: { isActive: false },
      });
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrisma.providerInventoryItem.findUnique.mockResolvedValue({
        id: 'ITEM001', providerUserId: 'OTHER',
      });

      await expect(service.deactivateItem('ITEM001', 'PHARM001')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getOrders ─────────────────────────────────────────────────────────

  describe('getOrders', () => {
    it('should return orders for patient role', async () => {
      const orders = [{ id: 'ORD1', patientUserId: 'PAT001', items: [] }];
      mockPrisma.inventoryOrder.findMany.mockResolvedValue(orders);

      const result = await service.getOrders('PAT001', 'patient');

      expect(result).toEqual(orders);
      expect(mockPrisma.inventoryOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { patientUserId: 'PAT001' } }),
      );
    });

    it('should return orders for provider role', async () => {
      const orders = [{ id: 'ORD1', providerUserId: 'PHARM001', items: [] }];
      mockPrisma.inventoryOrder.findMany.mockResolvedValue(orders);

      const result = await service.getOrders('PHARM001', 'provider');

      expect(result).toEqual(orders);
      expect(mockPrisma.inventoryOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerUserId: 'PHARM001' } }),
      );
    });
  });
});
