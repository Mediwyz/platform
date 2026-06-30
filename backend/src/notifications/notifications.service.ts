import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../shared/services/email.service';
import { WebPushService } from '../shared/services/web-push.service';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  /** Structured payload — drives contextual CTAs on the notification card. */
  payload?: Record<string, unknown>;
  /** Same-day notifications with the same groupKey collapse into one card
   *  when the caller requests ?grouped=true. Defaults: workflow → "booking:<id>";
   *  insurance → "insurance:<companyId>". */
  groupKey?: string;
}

// Notification types that warrant an email
const EMAIL_TYPES = new Set([
  'booking_confirmed', 'booking_status', 'document_reviewed',
  'payment_received', 'appointment_reminder',
]);

/**
 * Replaces lib/notifications.ts createNotification().
 * Creates DB record + emits Socket.IO event + sends email + web push.
 * All side-channels (email, push) are fire-and-forget — they never block the main flow.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private email: EmailService,
    private webPush: WebPushService,
  ) {}

  async createNotification(params: CreateNotificationParams) {
    const groupKey = params.groupKey
      ?? (params.referenceId && params.referenceType
            ? `${params.referenceType}:${params.referenceId}`
            : undefined);

    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        referenceId: params.referenceId || null,
        referenceType: params.referenceType || null,
        payload: params.payload ? (params.payload as any) : undefined,
        groupKey,
      },
    });

    // 1. Real-time via Socket.IO
    this.gateway.emitToUser(params.userId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      referenceId: notification.referenceId,
      referenceType: notification.referenceType,
      payload: notification.payload,
      groupKey: notification.groupKey,
    });

    // 2. Email + web push — fire and forget
    this.dispatchSideChannels(params).catch(() => {});

    return notification;
  }

  private async dispatchSideChannels(params: CreateNotificationParams) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        email: true, firstName: true,
        pushSubscriptions: { select: { endpoint: true, p256dh: true, auth: true } },
      },
    });
    if (!user) return;

    // Email — only for high-signal types
    if (EMAIL_TYPES.has(params.type) && user.email) {
      await this.email.sendStatusUpdate({
        to: user.email,
        userName: user.firstName,
        bookingId: params.referenceId ?? '',
        serviceName: (params.payload?.serviceName as string) ?? 'your booking',
        newStatus: params.type,
        statusLabel: params.title,
        message: params.message,
      }).catch(() => {});
    }

    // Web push — to all registered browsers
    for (const sub of user.pushSubscriptions) {
      const ok = await this.webPush.send(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { title: params.title, body: params.message, url: params.referenceId ? `/bookings/${params.referenceId}` : '/', tag: params.groupKey },
      );
      // Remove expired subscription
      if (!ok) {
        this.prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
      }
    }
  }

  async markRead(userId: string, notificationId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (updated.count > 0) {
      this.gateway.emitToUser(userId, 'notification:read', { id: notificationId });
    }
    return { ok: updated.count > 0 };
  }

  async markAllRead(userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (updated.count > 0) {
      this.gateway.emitToUser(userId, 'notification:read-all', { count: updated.count });
    }
    return { count: updated.count };
  }

  /** Recent notifications for a user + unread count (drives the mobile list). */
  async list(userId: string, limit = 30) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      select: { id: true, type: true, title: true, message: true, createdAt: true, readAt: true, referenceType: true, referenceId: true },
    });
    const unread = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { items, unread };
  }
}
