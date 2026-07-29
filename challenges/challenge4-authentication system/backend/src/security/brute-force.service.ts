import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { SecurityService } from '@/security/security.service';
import { SecurityEventType, LoginStatus } from '@prisma/client';

/**
 * Brute-Force Protection Rules
 * ─────────────────────────────
 * • 1st and 2nd failed login  → allowed immediately, no delay
 * • 3rd failed login          → account locked for 15 minutes
 * • While locked              → every attempt returns 403 with exact unlock time
 * • Successful login          → counter reset, lock cleared
 * • After lock expires        → counter reset automatically on next request
 */
@Injectable()
export class BruteForceService {
  private readonly maxAttempts: number;   // default: 3
  private readonly lockoutMs: number;     // default: 15 minutes in ms

  constructor(
    private prisma: PrismaService,
    private securityService: SecurityService,
    configService: ConfigService,
  ) {
    this.maxAttempts =
      configService.get<number>('MAX_LOGIN_ATTEMPTS') ?? 3;
    this.lockoutMs =
      (configService.get<number>('LOCKOUT_DURATION_MINUTES') ?? 15) * 60 * 1000;
  }

  // ── Called BEFORE attempting password verification ────────────────────────

  async assertNotBlocked(email: string, ipAddress: string): Promise<void> {
    const record = await this.prisma.loginAttempt.findUnique({
      where: { email_ipAddress: { email, ipAddress } },
    });

    if (!record?.blockedUntil) return;

    if (record.blockedUntil > new Date()) {
      // Still locked — tell the user exactly when they can retry
      const remainingMs = record.blockedUntil.getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60_000);
      const unlockTime = record.blockedUntil.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      throw new ForbiddenException(
        `Too many failed attempts. Account locked. ` +
        `Try again in ${remainingMins} minute(s) (at ${unlockTime}).`,
      );
    }

    // Lock has expired — clean it up so the user starts fresh
    await this.resetAttempts(email, ipAddress);
  }

  // ── Called AFTER password verification (pass success=true on correct pw) ──

  async recordAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    userId?: string,
  ): Promise<void> {
    if (success) {
      await this.resetAttempts(email, ipAddress);
      return;
    }

    // Upsert — increment counter or create a fresh record
    const record = await this.prisma.loginAttempt.upsert({
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

    const count = record.attemptCount;

    if (count >= this.maxAttempts) {
      // ── Lock the account for 15 minutes ───────────────────────────────────
      const blockedUntil = new Date(Date.now() + this.lockoutMs);

      await this.prisma.loginAttempt.update({
        where: { id: record.id },
        data: { blockedUntil },
      });

      if (userId) {
        await this.securityService.createSecurityEvent({
          userId,
          eventType: SecurityEventType.ACCOUNT_LOCKED,
          description:
            `Account locked after ${this.maxAttempts} failed login attempts. ` +
            `Unlocks at ${blockedUntil.toISOString()}`,
          ipAddress,
        });
      }
    }
    // No progressive delays for attempts 1 and 2 — just record and continue

    // Always log the failed attempt as a security event and in login history
    if (userId) {
      await this.securityService.createSecurityEvent({
        userId,
        eventType: SecurityEventType.FAILED_LOGIN,
        description: `Failed login attempt (${count}/${this.maxAttempts})`,
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async resetAttempts(email: string, ipAddress: string): Promise<void> {
    await this.prisma.loginAttempt.deleteMany({
      where: { email, ipAddress },
    });
  }

  /** Returns the number of failed attempts so far (0 if no record) */
  async getAttemptCount(email: string, ipAddress: string): Promise<number> {
    const record = await this.prisma.loginAttempt.findUnique({
      where: { email_ipAddress: { email, ipAddress } },
    });
    return record?.attemptCount ?? 0;
  }
}
