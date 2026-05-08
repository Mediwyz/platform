import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * WebPushService — sends Web Push notifications to subscribed browsers.
 *
 * Requires env vars:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT (mailto:admin@mediwyz.com)
 *
 * Generate VAPID keys:
 *   npx web-push generate-vapid-keys
 */
@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private enabled = false;

  constructor(private config: ConfigService) {
    const pub = config.get<string>('VAPID_PUBLIC_KEY');
    const priv = config.get<string>('VAPID_PRIVATE_KEY');
    const contact = config.get<string>('VAPID_CONTACT') ?? 'mailto:admin@mediwyz.com';

    if (pub && priv) {
      webpush.setVapidDetails(contact, pub, priv);
      this.enabled = true;
      this.logger.log('Web Push enabled');
    } else {
      this.logger.warn('VAPID keys not configured — web push disabled');
    }
  }

  get publicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? '';
  }

  /**
   * Send a push notification to a stored subscription object.
   * Never throws — failures are logged and swallowed.
   */
  async send(subscription: webpush.PushSubscription, payload: PushPayload): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/icons/icon-192x192.png',
        url: payload.url ?? '/',
        tag: payload.tag,
      }));
      return true;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired — caller should delete it from DB
        return false;
      }
      this.logger.error(`Push send failed: ${err.message}`);
      return false;
    }
  }
}
