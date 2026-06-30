import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  /** GET /notifications — the signed-in user's recent notifications + unread count. */
  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string) {
    if (!user?.sub) return { success: true, data: { items: [], unread: 0 } };
    return { success: true, data: await this.notifications.list(user.sub, parseInt(limit || '30')) };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.notifications.markRead(user.sub, id) };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.notifications.markAllRead(user.sub) };
  }
}
