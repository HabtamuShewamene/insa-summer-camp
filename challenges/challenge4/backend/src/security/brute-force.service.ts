import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { SecurityService } from '@/security/security.service';
import { SecurityEventType, LoginStatus } from '@prisma/client';

// Progressive delay schedule (attempt count → delay in seconds)
const PROGRESSIVE_DELAYS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 5,
  4: 10,
  5: 30,
};

@Injectable()
export class BruteForceService {
  private readonly maxAttempts: number;
  private readonly lockoutMinutes: number;

  constructor(
    private prisma: PrismaService,
    private securityService: SecurityService,
    configService: ConfigService,
  ) {
    this.maxAttempts = configService.get<number>('MAX_LOGIN_ATTEMPTS') ?? 5;
    this.lockoutMinutes =
      configService.get<number>('LOCKOUT_DURATION_MINUTES') ?? 15;
  }

  async checkAndRecordAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    userId?: string,
  ): Promise<void> {
    if (success) {
      await this.resetAttempts(email, ipAddress);
      return;
    }

    const attempt = await this.prisma.loginAttempt.upsert({
      where: { email_ipAddress: { email, ipAddress } },
      create: {
        email,
        ipAddress,
        userId,
        attemptCount: 1,
        lastAttempt: new Date(),
      },
      update: {
        attemptCount: { increment: 1 },
        lastAttempt: new Date(),
        userId: userId ?? undefined,
      },
    });

    const count = attempt.attemptCount;

    if (count >= this.maxAttempts) {
      const blockedUntil = new Date(
        Date.now() + this.lockoutMinutes * 60 * 1000,
      );

      await this.prisma.loginAttempt.update({
        where: { id: attempt.id },
        data: { blockedUntil },
      });

      if (userId) {
        await this.securityService.createSecurityEvent({
          userId,
          eventType: SecurityEventType.ACCOUNT_LOCKED,
          description: `Account locked after ${this.maxAttempts} failed login attempts`,
          ipAddress,
        });
      }
    } else {
      // Apply progressive delay: wait before allowing the next attempt
      const delaySecs =
        PROGRESSIVE_DELAYS[count] ??
        PROGRESSIVE_DELAYS[Object.keys(PROGRESSIVE_DELAYS).length];
      if (delaySecs > 0) {
        const nextAllowed = new Date(Date.now() + delaySecs * 1000);
        await this.prisma.loginAttempt.update({
          where: { id: attempt.id },
          data: { blockedUntil: nextAllowed },
        });
      }
    }

    if (userId) {
      await this.securityService.createSecurityEvent({
        userId,
        eventType: SecurityEventType.FAILED_LOGIN,
        description: 'Failed login attempt',
        ipAddress,
      });
    }

    await this.securityService.recordLoginHistory({
      userId,
      email,
      ipAddress,
      device: 'Unknown',
      browser: 'Unknown',
      status: LoginStatus.FAILED,
    });
  }

  async isBlocked(email: string, ipAddress: string): Promise<boolean> {
    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { email_ipAddress: { email, ipAddress } },
    });

    if (!attempt?.blockedUntil) return false;

    if (attempt.blockedUntil > new Date()) {
      return true;
    }

    await this.resetAttempts(email, ipAddress);
    return false;
  }

  async getBlockedUntil(email: string, ipAddress: string): Promise<Date | null> {
    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { email_ipAddress: { email, ipAddress } },
    });
    return attempt?.blockedUntil ?? null;
  }

  private async resetAttempts(email: string, ipAddress: string) {
    await this.prisma.loginAttempt.deleteMany({
      where: { email, ipAddress },
    });
  }

  async assertNotBlocked(email: string, ipAddress: string): Promise<void> {
    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { email_ipAddress: { email, ipAddress } },
    });

    if (!attempt) return;

    if (attempt.blockedUntil && attempt.blockedUntil > new Date()) {
      const remainingSecs = Math.ceil(
        (attempt.blockedUntil.getTime() - Date.now()) / 1000,
      );

      if (attempt.attemptCount >= this.maxAttempts) {
        throw new ForbiddenException(
          `Too many failed attempts. Account locked for ${Math.ceil(remainingSecs / 60)} minute(s). Try again after ${attempt.blockedUntil.toISOString()}`,
        );
      }

      // Progressive delay — short block
      throw new ForbiddenException(
        `Too many attempts. Please wait ${remainingSecs} second(s) before trying again`,
      );
    }

    // Clean up expired block
    if (attempt.blockedUntil && attempt.blockedUntil <= new Date()) {
      await this.resetAttempts(email, ipAddress);
    }
  }
}
