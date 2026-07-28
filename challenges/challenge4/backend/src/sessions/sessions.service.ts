import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async getActiveSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        device: true,
        browser: true,
        os: true,
        ipAddress: true,
        location: true,
        createdAt: true,
        lastActive: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string, currentSessionId?: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revoked) {
      throw new ForbiddenException('Session already revoked');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revoked: true },
    });

    return { message: 'Session revoked successfully', sessionId };
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revoked: false,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revoked: true },
    });

    return { message: 'All sessions revoked', count: result.count };
  }
}
