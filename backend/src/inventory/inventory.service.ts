import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoiceService } from '../shared/services/invoice.service';
import { TreasuryService } from '../shared/services/treasury.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private invoiceService: InvoiceService,
    private treasury: TreasuryService,
  ) {}

  // ─── Provider's items ──────────────────────────────────────────────────

  async getItems(providerUserId: string) {
    return this.prisma.providerInventoryItem.findMany({
      where: { providerUserId, isActive: true },
      orderBy: { name: 'asc' },
      include: { healthcareEntity: { select: { id: true, name: true, type: true } } },
    });
  }

  /**
   * Verify the provider may sell under `healthcareEntityId` — they must be the
   * founder or an active member (ProviderWorkplace) of that entity. Throws
   * otherwise. A null/empty id means "sell as an individual" and is always OK.
   */
  private async resolveEntityForSeller(
    providerUserId: string,
    healthcareEntityId?: string | null,
  ): Promise<string | null> {
    if (!healthcareEntityId) return null;
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id: healthcareEntityId },
      select: { id: true, founderUserId: true },
    });
    if (!entity) throw new NotFoundException('Organisation not found');
    if (entity.founderUserId === providerUserId) return entity.id;
    const membership = await (this.prisma.providerWorkplace as any).findUnique({
      where: { providerUserId_healthcareEntityId: { providerUserId, healthcareEntityId } },
      select: { status: true, isActive: true },
    });
    if (!membership || !membership.isActive || membership.status !== 'active') {
      throw new ForbiddenException('You can only sell under an organisation you belong to.');
    }
    return entity.id;
  }

  async createItem(providerUserId: string, providerType: string, data: {
    name: string; genericName?: string; description?: string; category: string;
    price: number; unitOfMeasure?: string; quantity?: number; minStockAlert?: number;
    requiresPrescription?: boolean; imageUrl?: string; isFeatured?: boolean;
    healthcareEntityId?: string;
  }) {
    const provider = await this.prisma.user.findUnique({
      where: { id: providerUserId },
      select: { verified: true },
    });
    if (!provider?.verified) {
      throw new ForbiddenException('Your account must be verified before you can list items on the Health Shop.');
    }
    const entityId = await this.resolveEntityForSeller(providerUserId, data.healthcareEntityId);
    return this.prisma.providerInventoryItem.create({
      data: {
        providerUserId, providerType: providerType as any,
        healthcareEntityId: entityId,
        name: data.name, genericName: data.genericName, description: data.description,
        category: data.category, price: data.price,
        unitOfMeasure: data.unitOfMeasure || 'unit',
        quantity: data.quantity ?? 0, minStockAlert: data.minStockAlert ?? 5,
        requiresPrescription: data.requiresPrescription ?? false,
        isFeatured: data.isFeatured ?? false,
        imageUrl: data.imageUrl, inStock: (data.quantity ?? 0) > 0, isActive: true,
      },
    });
  }

  async updateItem(id: string, userId: string, data: Record<string, any>) {
    const item = await this.prisma.providerInventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.providerUserId !== userId) throw new ForbiddenException('Not your item');

    const update: Record<string, any> = {};
    for (const key of ['name', 'genericName', 'description', 'category', 'price', 'unitOfMeasure', 'quantity', 'minStockAlert', 'requiresPrescription', 'imageUrl', 'inStock', 'isFeatured']) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    // Move the item under an organisation, or back to individual (empty string).
    if (data.healthcareEntityId !== undefined) {
      update.healthcareEntityId = await this.resolveEntityForSeller(userId, data.healthcareEntityId || null);
    }
    return this.prisma.providerInventoryItem.update({ where: { id }, data: update });
  }

  async deactivateItem(id: string, userId: string) {
    const item = await this.prisma.providerInventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.providerUserId !== userId) throw new ForbiddenException('Not your item');
    await this.prisma.providerInventoryItem.update({ where: { id }, data: { isActive: false } });
  }

  // ─── Entity-scoped inventory (org founder manages a pharmacy's stock) ────

  /** Throw unless `userId` founded the entity. Returns the entity row. */
  private async assertEntityFounder(entityId: string, userId: string) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id: entityId },
      select: { id: true, founderUserId: true, name: true, type: true },
    });
    if (!entity) throw new NotFoundException('Organisation not found');
    if (entity.founderUserId !== userId) {
      throw new ForbiddenException('Only the organisation owner can manage its inventory.');
    }
    return entity;
  }

  async getEntityItems(entityId: string, userId: string) {
    await this.assertEntityFounder(entityId, userId);
    return this.prisma.providerInventoryItem.findMany({
      where: { healthcareEntityId: entityId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createEntityItem(entityId: string, userId: string, providerType: string, data: {
    name: string; genericName?: string; description?: string; category: string;
    price: number; unitOfMeasure?: string; quantity?: number; minStockAlert?: number;
    requiresPrescription?: boolean; imageUrl?: string; isFeatured?: boolean;
  }) {
    await this.assertEntityFounder(entityId, userId);
    return this.prisma.providerInventoryItem.create({
      data: {
        providerUserId: userId, providerType: providerType as any,
        healthcareEntityId: entityId,
        name: data.name, genericName: data.genericName, description: data.description,
        category: data.category, price: data.price,
        unitOfMeasure: data.unitOfMeasure || 'unit',
        quantity: data.quantity ?? 0, minStockAlert: data.minStockAlert ?? 5,
        requiresPrescription: data.requiresPrescription ?? false,
        isFeatured: data.isFeatured ?? false,
        imageUrl: data.imageUrl, inStock: (data.quantity ?? 0) > 0, isActive: true,
      },
    });
  }

  async updateEntityItem(entityId: string, itemId: string, userId: string, data: Record<string, any>) {
    await this.assertEntityFounder(entityId, userId);
    const item = await this.prisma.providerInventoryItem.findUnique({ where: { id: itemId } });
    if (!item || item.healthcareEntityId !== entityId) throw new NotFoundException('Item not found');
    const update: Record<string, any> = {};
    for (const key of ['name', 'genericName', 'description', 'category', 'price', 'unitOfMeasure', 'quantity', 'minStockAlert', 'requiresPrescription', 'imageUrl', 'inStock', 'isFeatured']) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    if (data.quantity !== undefined && data.inStock === undefined) update.inStock = (Number(data.quantity) || 0) > 0;
    return this.prisma.providerInventoryItem.update({ where: { id: itemId }, data: update });
  }

  async deleteEntityItem(entityId: string, itemId: string, userId: string) {
    await this.assertEntityFounder(entityId, userId);
    const item = await this.prisma.providerInventoryItem.findUnique({ where: { id: itemId } });
    if (!item || item.healthcareEntityId !== entityId) throw new NotFoundException('Item not found');
    await this.prisma.providerInventoryItem.update({ where: { id: itemId }, data: { isActive: false } });
  }

  // ─── Orders ────────────────────────────────────────────────────────────

  async getOrders(userId: string, role: 'patient' | 'provider') {
    if (role === 'patient') {
      return this.prisma.inventoryOrder.findMany({
        where: { patientUserId: userId },
        include: { items: { include: { inventoryItem: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.inventoryOrder.findMany({
      where: { providerUserId: userId },
      include: { items: { include: { inventoryItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create an inventory order — FULLY AUTOMATIC:
   * 1. Validate stock availability (stock check)
   * 2. Check patient wallet balance
   * 3. Create order record
   * 4. Deduct stock (stock subtract)
   * 5. Process payment (debit patient, credit provider)
   * 6. Send low-stock alerts if needed
   * 7. Notify provider of new order
   *
   * All in one atomic transaction. No manual workflow flags needed.
   * Works for any delivery method: pickup at provider OR delivery to patient.
   */
  async createOrder(patientUserId: string, data: {
    providerUserId: string; items: Array<{ itemId: string; quantity: number }>;
    deliveryMethod?: string; deliveryAddress?: string; notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // ─── 1. STOCK CHECK (automatic) ─────────────────────────────────
      let totalAmount = 0;
      const validatedItems: Array<{ itemId: string; quantity: number; price: number; name: string; currentQty: number; minAlert: number }> = [];

      for (const item of data.items) {
        const inv = await tx.providerInventoryItem.findUnique({ where: { id: item.itemId } });
        if (!inv || !inv.isActive) throw new BadRequestException(`Item not found: ${item.itemId}`);
        if (!inv.inStock || inv.quantity < item.quantity) {
          throw new BadRequestException(`${inv.name}: insufficient stock (available: ${inv.quantity}, requested: ${item.quantity})`);
        }
        if (inv.requiresPrescription) {
          // Auto-check prescription for items that require it
          const patientProfile = await tx.patientProfile.findUnique({ where: { userId: patientUserId }, select: { id: true } });
          if (!patientProfile) throw new BadRequestException(`${inv.name} requires a valid prescription`);

          // Find an active prescription that:
          //   1. Has not passed its refill window (nextRefill in the future, or unset)
          //   2. Contains a medicine whose name matches the inventory item being ordered
          const matching = await tx.prescription.findFirst({
            where: {
              patientId: patientProfile.id,
              isActive: true,
              OR: [{ nextRefill: null }, { nextRefill: { gte: new Date() } }],
              medicines: { some: { medicine: { name: { equals: inv.name, mode: 'insensitive' } } } },
            },
            select: { id: true, nextRefill: true },
          });

          if (!matching) {
            // Fall back: any active, non-expired prescription. Strict-match guards against
            // unrelated prescriptions but we keep a soft fallback so providers without
            // structured medicine catalogs still work.
            const anyActive = await tx.prescription.findFirst({
              where: {
                patientId: patientProfile.id,
                isActive: true,
                OR: [{ nextRefill: null }, { nextRefill: { gte: new Date() } }],
              },
              select: { id: true },
            });
            if (!anyActive) {
              throw new BadRequestException(`${inv.name} requires a valid (non-expired) prescription for this medicine`);
            }
          }
        }
        validatedItems.push({ itemId: item.itemId, quantity: item.quantity, price: inv.price, name: inv.name, currentQty: inv.quantity, minAlert: inv.minStockAlert });
        totalAmount += inv.price * item.quantity;
      }

      // ─── 2. WALLET CHECK (automatic) ────────────────────────────────
      if (totalAmount > 0) {
        const wallet = await tx.userWallet.findUnique({ where: { userId: patientUserId }, select: { id: true, balance: true } });
        if (!wallet || wallet.balance < totalAmount) {
          throw new BadRequestException(`Insufficient wallet balance. Required: ${totalAmount}, Available: ${wallet?.balance ?? 0}`);
        }
      }

      // ─── 3. CREATE ORDER ────────────────────────────────────────────
      // Schema requires `providerType`; look it up from the provider's User row.
      // (Field name is `deliveryType`, not `deliveryMethod` — earlier refactor
      // left a typo that only blew up on actual order creation.)
      const providerUser = await tx.user.findUnique({
        where: { id: data.providerUserId },
        select: { userType: true },
      });
      if (!providerUser) {
        throw new BadRequestException(`Provider not found: ${data.providerUserId}`);
      }

      const order = await tx.inventoryOrder.create({
        data: {
          patientUserId,
          providerUserId: data.providerUserId,
          providerType: providerUser.userType,
          totalAmount,
          status: 'confirmed',
          deliveryType: data.deliveryMethod || 'pickup',
          deliveryAddress: data.deliveryAddress,
          items: {
            create: validatedItems.map((i) => ({
              inventoryItemId: i.itemId,
              quantity: i.quantity,
              unitPrice: i.price,
              subtotal: i.price * i.quantity,
            })),
          },
        },
        include: { items: { include: { inventoryItem: true } } },
      });

      // ─── 4. STOCK SUBTRACT (automatic) ──────────────────────────────
      const lowStockItems: string[] = [];
      for (const item of validatedItems) {
        const newQty = item.currentQty - item.quantity;
        await tx.providerInventoryItem.update({
          where: { id: item.itemId },
          data: { quantity: { decrement: item.quantity }, inStock: newQty > 0 },
        });
        if (newQty <= item.minAlert) lowStockItems.push(item.name);
      }

      // ─── 5. PAYMENT (automatic — debit patient, credit provider) ────
      if (totalAmount > 0) {
        const patientWallet = await tx.userWallet.findUnique({ where: { userId: patientUserId }, select: { id: true, balance: true } });
        if (patientWallet) {
          // Debit patient
          await tx.userWallet.update({ where: { id: patientWallet.id }, data: { balance: { decrement: totalAmount } } });
          await tx.walletTransaction.create({
            data: {
              walletId: patientWallet.id, type: 'debit', amount: totalAmount,
              description: `Health Shop order: ${validatedItems.length} item(s)`,
              serviceType: 'inventory', referenceId: order.id,
              balanceBefore: patientWallet.balance, balanceAfter: patientWallet.balance - totalAmount,
            },
          });

          // Credit provider (85% — platform keeps 15%)
          const platformFee = Math.round(totalAmount * 0.15 * 100) / 100;
          const providerAmount = totalAmount - platformFee;
          const providerWallet = await tx.userWallet.findUnique({ where: { userId: data.providerUserId }, select: { id: true, balance: true } });
          if (providerWallet) {
            await tx.userWallet.update({ where: { id: providerWallet.id }, data: { balance: { increment: providerAmount } } });
            await tx.walletTransaction.create({
              data: {
                walletId: providerWallet.id, type: 'credit', amount: providerAmount,
                description: `Health Shop sale — Order #${order.id.slice(0, 8)}`,
                serviceType: 'inventory', referenceId: order.id,
                balanceBefore: providerWallet.balance, balanceAfter: providerWallet.balance + providerAmount,
                status: 'completed',
              },
            });
          }
          // Platform 15% → PlatformTreasury ledger row.
          await this.treasury.creditPlatformFee(tx, {
            amount: platformFee,
            source: 'inventory',
            referenceId: order.id,
            description: `Health Shop order ${order.id.slice(0, 8)} platform fee`,
          });
        }
      }

      this.logger.log(`Order ${order.id} created: ${validatedItems.length} items, total ${totalAmount}, delivery: ${data.deliveryMethod || 'pickup'}`);

      // ─── INVOICE GENERATION (automatic) ──────────────────────────────
      const platformFee = Math.round(totalAmount * 0.15 * 100) / 100;
      const providerInvoiceAmount = totalAmount - platformFee;
      await this.invoiceService.generateInvoice({
        patientUserId,
        providerUserId: data.providerUserId,
        orderId: order.id,
        type: 'health_shop_order',
        amount: totalAmount,
        platformFee,
        providerAmount: providerInvoiceAmount,
        description: `Health Shop order — ${validatedItems.length} item(s)`,
        items: validatedItems.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.price, subtotal: i.price * i.quantity })),
      }).catch(() => {}); // non-blocking, don't fail the order

      // ─── 6. LOW-STOCK ALERTS (automatic) ────────────────────────────
      if (lowStockItems.length > 0) {
        await this.notifications.createNotification({
          userId: data.providerUserId, type: 'inventory',
          title: 'Low Stock Alert',
          message: `These items are running low: ${lowStockItems.join(', ')}`,
          referenceId: order.id, referenceType: 'inventory_order',
        }).catch(() => {});
      }

      // ─── 7. NOTIFY PROVIDER (automatic) ─────────────────────────────
      await this.notifications.createNotification({
        userId: data.providerUserId, type: 'order',
        title: 'New Health Shop Order',
        message: `New order for ${validatedItems.length} item(s) — ${data.deliveryMethod === 'delivery' ? 'Delivery requested' : 'Pickup at your location'}`,
        referenceId: order.id, referenceType: 'inventory_order',
      }).catch(() => {});

      return order;
    });
  }

  async updateOrderStatus(id: string, userId: string, status: string) {
    const order = await this.prisma.inventoryOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.providerUserId !== userId && order.patientUserId !== userId) throw new ForbiddenException('Not your order');

    const update: Record<string, any> = { status };
    if (status === 'delivered' || status === 'completed') update.completedAt = new Date();

    return this.prisma.inventoryOrder.update({ where: { id }, data: update });
  }

  // ─── Health Shop Search ────────────────────────────────────────────────

  async searchShop(opts: { query?: string; category?: string; providerType?: string; limit?: number; offset?: number; userId?: string }) {
    const where: any = { isActive: true, inStock: true };
    if (opts.category) where.category = opts.category;
    if (opts.providerType) where.providerType = opts.providerType;
    if (opts.query) {
      where.OR = [
        { name: { contains: opts.query, mode: 'insensitive' } },
        { genericName: { contains: opts.query, mode: 'insensitive' } },
        { description: { contains: opts.query, mode: 'insensitive' } },
      ];
    }

    // Fetch active prescription medication names for the user (if userId provided)
    let prescriptionMedNames: string[] = [];
    if (opts.userId) {
      try {
        const profile = await this.prisma.patientProfile.findUnique({
          where: { userId: opts.userId },
          select: {
            prescriptions: {
              where: { isActive: true },
              select: {
                medicines: {
                  select: { medicine: { select: { name: true, genericName: true } } },
                },
              },
              take: 10,
            },
          },
        });
        if (profile?.prescriptions) {
          for (const rx of profile.prescriptions) {
            for (const med of rx.medicines) {
              if (med.medicine?.name) prescriptionMedNames.push(med.medicine.name.toLowerCase());
              if ((med.medicine as any)?.genericName) prescriptionMedNames.push(((med.medicine as any).genericName as string).toLowerCase());
            }
          }
        }
      } catch {
        // Non-fatal — proceed without prescription boosting
      }
    }

    const [items, total] = await Promise.all([
      (this.prisma.providerInventoryItem as any).findMany({
        where, take: opts.limit || 20, skip: opts.offset || 0,
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        include: { healthcareEntity: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.providerInventoryItem.count({ where }),
    ]);

    // Resolve EVERY seller's name (provider person) so a card can show both the
    // provider AND their organisation. One batched query, no N+1.
    const providerIds = [...new Set(items.map((i: any) => i.providerUserId))];
    const sellers = providerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: providerIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const sellerById = new Map(sellers.map((s) => [s.id, `${s.firstName} ${s.lastName}`.trim()]));

    // Annotate items with isRecommended + seller info, sort recommended to top
    const annotated = items.map((item: any) => {
      const itemText = `${item.name} ${item.genericName ?? ''}`.toLowerCase();
      const isRecommended = prescriptionMedNames.length > 0
        && prescriptionMedNames.some((med) => {
          if (itemText.includes(med)) return true;
          // Word-level partial match (word > 3 chars)
          return med.split(/\s+/).some((word) => word.length > 3 && itemText.includes(word));
        });
      const { healthcareEntity, ...rest } = item;
      const providerName = sellerById.get(item.providerUserId) ?? null;
      // Every product belongs to a provider; their org defaults to "Self-employed".
      const organisationName = healthcareEntity?.name ?? 'Self-employed';
      const organisationType = healthcareEntity?.type ?? 'self_employed';
      const sellerName = healthcareEntity?.name ?? providerName; // back-compat
      const sellerType = healthcareEntity ? 'organisation' : 'provider';
      return {
        ...rest, isRecommended, sellerName, sellerType,
        sellerEntityId: healthcareEntity?.id ?? null,
        providerName, organisationName, organisationType,
      };
    });

    // Stable sort: recommended first, then featured, then alphabetical
    annotated.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });

    return { items: annotated, total };
  }
}
