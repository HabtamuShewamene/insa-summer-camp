import {
  Controller,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequestUser } from '@/common/interfaces';
import { SecurityService } from '@/security/security.service';
import { SecurityEventType } from '@prisma/client';

// JwtAuthGuard is applied globally via APP_GUARD in app.module.ts
// No @UseGuards needed here
@Controller('sessions')
export class SessionsController {
  constructor(
    private sessionsService: SessionsService,
    private securityService: SecurityService,
  ) {}

  @Get()
  async getSessions(@CurrentUser() user: RequestUser) {
    return this.sessionsService.getActiveSessions(user.id, user.sessionId);
  }

  @Delete(':id')
  async revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    const result = await this.sessionsService.revokeSession(
      user.id,
      sessionId,
      user.sessionId,
    );

    await this.securityService.createSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.SESSION_REVOKED,
      description: `Session ${sessionId} revoked by user`,
    });

    return result;
  }
}
