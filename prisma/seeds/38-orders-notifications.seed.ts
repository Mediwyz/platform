/**
 * Seed 38 - Inventory Orders, Notification Templates, Notifications
 *
 * 1. seedInventoryOrders - 5 sample orders from patients to providers
 * 2. seedNotificationTemplates - Custom WorkflowNotificationTemplate for providers/admins
 * 3. seedNotifications - 20+ notifications for various users and types
 */
import { PrismaClient } from '@prisma/client'

// ─── 1. Inventory Orders ────────────────────────────────────────────────────

export async function seedInventoryOrders(prisma: PrismaClient) {
  console.log('  Seeding inventory orders...')

  // Find existing inventory items grouped by provider
  const pharmItems = await prisma.providerInventoryItem.findMany({
    where: { providerUserId: 'PHARM001' },
    select: { id: true, name: true, price: true, currency: true },
    take: 3,
  })

  const dentItems = await prisma.providerInventoryItem.findMany({
    where: { providerUserId: 'DENT001' },
    select: { id: true, name: true, price: true, currency: true },
    take: 2,
  })

  const optItems = await prisma.providerInventoryItem.findMany({
    where: { providerUserId: 'OPT001' },
    select: { id: true, name: true, price: true, currency: true },
    take: 2,
  })

  if (pharmItems.length === 0 && dentItems.length === 0 && optItems.length === 0) {
    console.log('  Skipping inventory orders - no inventory items found')
    return
  }

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000

  interface OrderDef {
    patientUserId: string
    providerUserId: string
    providerType: string
    status: string
    deliveryType: string
    deliveryAddress: string | null
    items: { inventoryItemId: string; quantity: number; unitPrice: number }[]
    daysAgo: number
    confirmed: boolean
    delivered: boolean
  }

  const orderDefs: OrderDef[] = []

  // Order 1: PAT001 orders from PHARM001 (completed, pickup)
  if (pharmItems.length >= 2) {
    orderDefs.push({
      patientUserId: 'PAT001',
      providerUserId: 'PHARM001',
      providerType: 'PHARMACIST',
      status: 'completed',
      deliveryType: 'pickup',
      deliveryAddress: null,
      items: [
        { inventoryItemId: pharmItems[0].id, quantity: 2, unitPrice: pharmItems[0].price },
        { inventoryItemId: pharmItems[1].id, quantity: 1, unitPrice: pharmItems[1].price },
      ],
      daysAgo: 12,
      confirmed: true,
      delivered: true,
    })
  }

  // Order 2: PAT002 orders from PHARM001 (pending, delivery)
  if (pharmItems.length >= 1) {
    orderDefs.push({
      patientUserId: 'PAT002',
      providerUserId: 'PHARM001',
      providerType: 'PHARMACIST',
      status: 'pending',
      deliveryType: 'delivery',
      deliveryAddress: '14 Rue Labourdonnais, Port Louis',
      items: [
        { inventoryItemId: pharmItems[0].id, quantity: 3, unitPrice: pharmItems[0].price },
      ],
      daysAgo: 1,
      confirmed: false,
      delivered: false,
    })
  }

  // Order 3: PAT001 orders from DENT001 (completed, pickup)
  if (dentItems.length >= 1) {
    orderDefs.push({
      patientUserId: 'PAT001',
      providerUserId: 'DENT001',
      providerType: 'DENTIST',
      status: 'completed',
      deliveryType: 'pickup',
      deliveryAddress: null,
      items: [
        { inventoryItemId: dentItems[0].id, quantity: 1, unitPrice: dentItems[0].price },
      ],
      daysAgo: 7,
      confirmed: true,
      delivered: true,
    })
  }

  // Order 4: PAT003 orders from OPT001 (pending, delivery)
  if (optItems.length >= 1) {
    orderDefs.push({
      patientUserId: 'PAT003',
      providerUserId: 'OPT001',
      providerType: 'OPTOMETRIST',
      status: 'pending',
      deliveryType: 'delivery',
      deliveryAddress: '8 Avenue des Palmiers, Curepipe',
      items: [
        { inventoryItemId: optItems[0].id, quantity: 1, unitPrice: optItems[0].price },
      ],
      daysAgo: 2,
      confirmed: false,
      delivered: false,
    })
  }

  // Order 5: PAT002 orders from DENT001 (completed, delivery)
  if (dentItems.length >= 2) {
    orderDefs.push({
      patientUserId: 'PAT002',
      providerUserId: 'DENT001',
      providerType: 'DENTIST',
      status: 'completed',
      deliveryType: 'delivery',
      deliveryAddress: '22 Royal Road, Quatre Bornes',
      items: [
        { inventoryItemId: dentItems[0].id, quantity: 1, unitPrice: dentItems[0].price },
        { inventoryItemId: dentItems[1].id, quantity: 2, unitPrice: dentItems[1].price },
      ],
      daysAgo: 20,
      confirmed: true,
      delivered: true,
    })
  }

  let created = 0

  for (const def of orderDefs) {
    const totalAmount = def.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const deliveryFee = def.deliveryType === 'delivery' ? 150 : 0
    const orderedAt = new Date(now.getTime() - def.daysAgo * DAY)

    const order = await prisma.inventoryOrder.create({
      data: {
        patientUserId: def.patientUserId,
        providerUserId: def.providerUserId,
        providerType: def.providerType,
        status: def.status,
        totalAmount: totalAmount + deliveryFee,
        currency: 'MUR',
        deliveryType: def.deliveryType,
        deliveryAddress: def.deliveryAddress,
        deliveryFee,
        prescriptionRequired: false,
        orderedAt,
        confirmedAt: def.confirmed ? new Date(orderedAt.getTime() + 2 * 60 * 60 * 1000) : null,
        deliveredAt: def.delivered ? new Date(orderedAt.getTime() + 2 * DAY) : null,
        items: {
          create: def.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
    })

    created++
    console.log(`    Order ${order.id.slice(0, 8)}... ${def.patientUserId} → ${def.providerUserId} (${def.status})`)
  }

  console.log(`  ✓ Created ${created} inventory orders`)
}

// ─── 2. Notification Templates ──────────────────────────────────────────────

export async function seedNotificationTemplates(prisma: PrismaClient) {
  console.log('  Seeding workflow notification templates...')

  let created = 0

  // Find a DOCTOR workflow template
  const doctorTemplate = await prisma.workflowTemplate.findFirst({
    where: { providerType: 'DOCTOR', isDefault: true },
    select: { id: true, slug: true },
  })

  if (doctorTemplate) {
    // Check existing to avoid unique constraint violation
    const existing = await prisma.workflowNotificationTemplate.findFirst({
      where: {
        workflowTemplateId: doctorTemplate.id,
        statusCode: 'confirmed',
        targetRole: 'patient',
        createdByProviderId: 'DOC001',
      },
    })

    if (!existing) {
      await prisma.workflowNotificationTemplate.create({
        data: {
          workflowTemplateId: doctorTemplate.id,
          statusCode: 'confirmed',
          targetRole: 'patient',
          title: 'Appointment Confirmed with Dr. {{providerName}}',
          message: 'Dear {{patientName}}, your appointment is confirmed for {{scheduledAt}}. Amount: {{amount}}',
          notificationType: 'workflow',
          createdByProviderId: 'DOC001',
        },
      })
      created++
      console.log(`    DOC001 custom template for "${doctorTemplate.slug}" → confirmed`)
    }
  }

  // Find a PHARMACIST workflow template
  const pharmTemplate = await prisma.workflowTemplate.findFirst({
    where: { providerType: 'PHARMACIST', isDefault: true },
    select: { id: true, slug: true },
  })

  if (pharmTemplate) {
    const existing = await prisma.workflowNotificationTemplate.findFirst({
      where: {
        workflowTemplateId: pharmTemplate.id,
        statusCode: 'order_confirmed',
        targetRole: 'patient',
        createdByProviderId: 'PHARM001',
      },
    })

    if (!existing) {
      await prisma.workflowNotificationTemplate.create({
        data: {
          workflowTemplateId: pharmTemplate.id,
          statusCode: 'order_confirmed',
          targetRole: 'patient',
          title: 'Order Confirmed',
          message: 'Your pharmacy order has been confirmed. Amount: {{amount}}',
          notificationType: 'workflow',
          createdByProviderId: 'PHARM001',
        },
      })
      created++
      console.log(`    PHARM001 custom template for "${pharmTemplate.slug}" → order_confirmed`)
    }
  }

  // Find a regional admin template
  const adminTemplate = await prisma.workflowTemplate.findFirst({
    where: { createdByAdminId: { not: null } },
    select: { id: true, slug: true, createdByAdminId: true },
  })

  if (adminTemplate) {
    const existing = await prisma.workflowNotificationTemplate.findFirst({
      where: {
        workflowTemplateId: adminTemplate.id,
        statusCode: 'pending',
        targetRole: 'provider',
        createdByAdminId: adminTemplate.createdByAdminId,
      },
    })

    if (!existing) {
      await prisma.workflowNotificationTemplate.create({
        data: {
          workflowTemplateId: adminTemplate.id,
          statusCode: 'pending',
          targetRole: 'provider',
          title: 'New Request',
          message: '{{patientName}} has requested a service',
          notificationType: 'workflow',
          createdByAdminId: adminTemplate.createdByAdminId,
        },
      })
      created++
      console.log(`    Admin template for "${adminTemplate.slug}" → pending`)
    }
  } else {
    // Fallback: use any default template for a regional-admin-style notification
    const fallbackTemplate = await prisma.workflowTemplate.findFirst({
      where: { isDefault: true },
      select: { id: true, slug: true },
    })

    if (fallbackTemplate) {
      const existing = await prisma.workflowNotificationTemplate.findFirst({
        where: {
          workflowTemplateId: fallbackTemplate.id,
          statusCode: 'pending',
          targetRole: 'provider',
          createdByProviderId: null,
          createdByAdminId: null,
        },
      })

      if (!existing) {
        await prisma.workflowNotificationTemplate.create({
          data: {
            workflowTemplateId: fallbackTemplate.id,
            statusCode: 'pending',
            targetRole: 'provider',
            title: 'New Request',
            message: '{{patientName}} has requested a service',
            notificationType: 'workflow',
          },
        })
        created++
        console.log(`    System default template for "${fallbackTemplate.slug}" → pending`)
      }
    }
  }

  console.log(`  ✓ Created ${created} notification templates`)
}

// ─── 3. Notifications ───────────────────────────────────────────────────────

export async function seedNotifications(prisma: PrismaClient) {
  console.log('  Seeding notifications...')

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  const HOUR = 60 * 60 * 1000

  // Helper: random date within the last N days
  const daysAgo = (days: number) => new Date(now.getTime() - days * DAY)
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * HOUR)

  const notifications: {
    userId: string
    type: string
    title: string
    message: string
    referenceId?: string
    referenceType?: string
    readAt: Date | null
    createdAt: Date
  }[] = [
    // ── booking_request notifications for providers ──
    {
      userId: 'DOC001',
      type: 'booking_request',
      title: 'New Appointment Request',
      message: 'Emma Johnson has requested a video consultation for diabetes follow-up.',
      referenceType: 'appointment',
      readAt: daysAgo(5),
      createdAt: daysAgo(6),
    },
    {
      userId: 'DOC001',
      type: 'booking_request',
      title: 'New Appointment Request',
      message: 'Raj Doorgakant has requested an office consultation.',
      referenceType: 'appointment',
      readAt: null,
      createdAt: daysAgo(1),
    },
    {
      userId: 'NUR001',
      type: 'booking_request',
      title: 'New Nursing Request',
      message: 'Emma Johnson has requested a home visit for wound dressing.',
      referenceType: 'nurse_booking',
      readAt: daysAgo(3),
      createdAt: daysAgo(4),
    },
    {
      userId: 'DENT001',
      type: 'booking_request',
      title: 'New Dental Appointment',
      message: 'Priya Ramgoolam has requested a dental check-up.',
      referenceType: 'service_booking',
      readAt: null,
      createdAt: daysAgo(2),
    },
    {
      userId: 'PHARM001',
      type: 'booking_request',
      title: 'New Order Request',
      message: 'Raj Doorgakant has placed an order for prescription medication.',
      referenceType: 'inventory_order',
      readAt: null,
      createdAt: hoursAgo(6),
    },

    // ── booking_confirmed notifications for patients ──
    {
      userId: 'PAT001',
      type: 'booking_confirmed',
      title: 'Appointment Confirmed',
      message: 'Your appointment with Dr. Johnson has been confirmed for tomorrow at 10:00 AM.',
      referenceType: 'appointment',
      readAt: daysAgo(2),
      createdAt: daysAgo(3),
    },
    {
      userId: 'PAT002',
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: 'Your dental appointment with Dr. Naidoo has been confirmed.',
      referenceType: 'service_booking',
      readAt: null,
      createdAt: daysAgo(1),
    },
    {
      userId: 'PAT001',
      type: 'booking_confirmed',
      title: 'Nurse Visit Confirmed',
      message: 'Your home nursing visit has been confirmed for this Friday at 2:00 PM.',
      referenceType: 'nurse_booking',
      readAt: null,
      createdAt: hoursAgo(12),
    },

    // ── workflow notifications for status transitions ──
    {
      userId: 'PAT001',
      type: 'workflow',
      title: 'Consultation In Progress',
      message: 'Your video consultation with Dr. Johnson is now in progress.',
      referenceType: 'workflow_instance',
      readAt: daysAgo(10),
      createdAt: daysAgo(10),
    },
    {
      userId: 'DOC001',
      type: 'workflow',
      title: 'Prescription Uploaded',
      message: 'Prescription has been uploaded for Emma Johnson.',
      referenceType: 'workflow_instance',
      readAt: daysAgo(9),
      createdAt: daysAgo(10),
    },
    {
      userId: 'PAT002',
      type: 'workflow',
      title: 'Lab Results Ready',
      message: 'Your lab test results are now available. Please review them in your dashboard.',
      referenceType: 'workflow_instance',
      readAt: null,
      createdAt: daysAgo(5),
    },
    {
      userId: 'PHARM001',
      type: 'workflow',
      title: 'Order Ready for Pickup',
      message: 'Order for Raj Doorgakant is packed and ready for pickup.',
      referenceType: 'workflow_instance',
      readAt: daysAgo(3),
      createdAt: daysAgo(4),
    },
    {
      userId: 'PAT003',
      type: 'workflow',
      title: 'Appointment Completed',
      message: 'Your eye exam with the optometrist has been completed. View your results in your dashboard.',
      referenceType: 'workflow_instance',
      readAt: null,
      createdAt: daysAgo(7),
    },
    {
      userId: 'NUR001',
      type: 'workflow',
      title: 'Visit Completed',
      message: 'Home visit for Emma Johnson has been marked as completed.',
      referenceType: 'workflow_instance',
      readAt: daysAgo(2),
      createdAt: daysAgo(3),
    },

    // ── stock_alert notifications for providers ──
    {
      userId: 'PHARM001',
      type: 'stock_alert',
      title: 'Low Stock Alert',
      message: 'Paracetamol 500mg is running low (3 units remaining). Restock soon.',
      referenceType: 'inventory_item',
      readAt: null,
      createdAt: daysAgo(1),
    },
    {
      userId: 'PHARM001',
      type: 'stock_alert',
      title: 'Out of Stock',
      message: 'Amoxicillin 250mg is now out of stock. Orders for this item will be paused.',
      referenceType: 'inventory_item',
      readAt: null,
      createdAt: hoursAgo(3),
    },
    {
      userId: 'PHARM001',
      type: 'stock_alert',
      title: 'Stock Replenished',
      message: 'Metformin 500mg stock has been updated to 50 units.',
      referenceType: 'inventory_item',
      readAt: daysAgo(8),
      createdAt: daysAgo(10),
    },

    // ── review_request notifications for patients ──
    {
      userId: 'PAT001',
      type: 'review_request',
      title: 'How was your consultation?',
      message: 'Please rate your video consultation with Dr. Johnson. Your feedback helps us improve.',
      referenceType: 'appointment',
      readAt: null,
      createdAt: daysAgo(8),
    },
    {
      userId: 'PAT002',
      type: 'review_request',
      title: 'Rate your experience',
      message: 'How was your dental check-up? Leave a review for Dr. Naidoo.',
      referenceType: 'service_booking',
      readAt: daysAgo(14),
      createdAt: daysAgo(15),
    },
    {
      userId: 'PAT001',
      type: 'review_request',
      title: 'Review your pharmacy order',
      message: 'Your order from City Pharmacy has been delivered. Please share your experience.',
      referenceType: 'inventory_order',
      readAt: null,
      createdAt: daysAgo(11),
    },
    {
      userId: 'PAT002',
      type: 'review_request',
      title: 'How was your nurse visit?',
      message: 'Please rate your home nursing visit. Your feedback is valuable.',
      referenceType: 'nurse_booking',
      readAt: null,
      createdAt: daysAgo(4),
    },

    // ── Additional variety ──
    {
      userId: 'PAT003',
      type: 'booking_confirmed',
      title: 'Optometrist Appointment Confirmed',
      message: 'Your eye exam appointment has been confirmed for next Monday.',
      referenceType: 'service_booking',
      readAt: daysAgo(6),
      createdAt: daysAgo(8),
    },
    {
      userId: 'DENT001',
      type: 'workflow',
      title: 'Treatment Plan Accepted',
      message: 'Priya Ramgoolam has accepted the proposed treatment plan.',
      referenceType: 'workflow_instance',
      readAt: null,
      createdAt: hoursAgo(18),
    },
    {
      userId: 'DOC001',
      type: 'booking_request',
      title: 'Urgent Consultation Request',
      message: 'Priya Ramgoolam has requested an urgent consultation regarding persistent headaches.',
      referenceType: 'appointment',
      readAt: null,
      createdAt: hoursAgo(2),
    },
  ]

  let created = 0

  for (const notif of notifications) {
    // Verify user exists before creating
    const userExists = await prisma.user.findUnique({
      where: { id: notif.userId },
      select: { id: true },
    })

    if (!userExists) {
      console.log(`    Skipping notification for ${notif.userId} - user not found`)
      continue
    }

    await prisma.notification.create({
      data: {
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        referenceId: notif.referenceId || null,
        referenceType: notif.referenceType || null,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
      },
    })
    created++
  }

  console.log(`  ✓ Created ${created} notifications`)
}
