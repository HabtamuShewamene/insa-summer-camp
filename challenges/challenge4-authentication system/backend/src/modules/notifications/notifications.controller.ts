import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any) {
    return this.notificationsService.getNotifications(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return { count: await this.notificationsService.getUnreadCount(req.user.id) };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    if (id === 'all') {
      return this.notificationsService.markAllAsRead(req.user.id);
    }
    return this.notificationsService.markAsRead(req.user.id, id);
  }
}
