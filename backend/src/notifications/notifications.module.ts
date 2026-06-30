import { Global, Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from '../shared/services/email.service';
import { WebPushService } from '../shared/services/web-push.service';

/**
 * @Global so any module can inject NotificationsService
 * (workflow strategies, booking service, etc.)
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService, EmailService, WebPushService],
  exports: [NotificationsService, NotificationsGateway, EmailService, WebPushService],
})
export class NotificationsModule {}
