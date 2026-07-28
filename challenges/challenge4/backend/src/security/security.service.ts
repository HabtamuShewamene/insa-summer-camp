import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  LoginStatus,
  SecurityEventType,
} from '@prisma/client';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private prisma: PrismaService) {}

  async recordLoginHistory(data: {
    userId?: string;
    email?: string;
    ipAddress: string;
    device: string;
    browser: string;
    location?: string;
    country?: string;
    city?: string;
    status: LoginStatus;
    riskScore?: number;
  }) {
    return this.prisma.loginHistory.create({
      data: {
        userId: data.userId,
        email: data.email,
        ipAddress: data.ipAddress,
        device: data.device,
        browser: data.browser,
        location: data.location,
        country: data.country,
        city: data.city,
        status: data.status,
        riskScore: data.riskScore ?? 0,
      },
    });
  }

  async createSecurityEvent(data: {
    userId: string;
    eventType: SecurityEventType;
    description: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.logger.warn(
      `Security event [${data.eventType}] for user ${data.userId}: ${data.description}`,
    );

    return this.prisma.securityEvent.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        description: data.description,
        ipAddress: data.ipAddress,
        metadata: data.metadata ?? undefined,
      },
    });
  }

  async checkSuspiciousLogin(
    userId: string,
    deviceInfo: {
      device: string;
      browser: string;
      ipAddress: string;
      country?: string;
      city?: string;
    },
  ): Promise<{ suspicious: boolean; riskScore: number; reasons: string[] }> {
    const reasons: string[] = [];
    let riskScore = 0;

    const recentLogins = await this.prisma.loginHistory.findMany({
      where: {
        userId,
        status: LoginStatus.SUCCESS,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentLogins.length === 0) {
      return { suspicious: false, riskScore: 0, reasons: [] };
    }

    const lastLogin = recentLogins[0];
    const knownDevices = new Set(
      recentLogins.map((l) => `${l.device}|${l.browser}`),
    );
    const currentDevice = `${deviceInfo.device}|${deviceInfo.browser}`;

    if (!knownDevices.has(currentDevice)) {
      reasons.push('Login from new device or browser');
      riskScore += 40;
    }

    if (
      deviceInfo.country &&
      lastLogin.country &&
      deviceInfo.country !== lastLogin.country
    ) {
      reasons.push(
        `Location change: ${lastLogin.country} → ${deviceInfo.country}`,
      );
      riskScore += 50;
    }

    if (
      deviceInfo.city &&
      lastLogin.city &&
      deviceInfo.city !== lastLogin.city &&
      deviceInfo.country === lastLogin.country
    ) {
      reasons.push(`City change: ${lastLogin.city} → ${deviceInfo.city}`);
      riskScore += 20;
    }

    return {
      suspicious: riskScore >= 40,
      riskScore,
      reasons,
    };
  }

  async getSecurityEvents(userId: string, limit = 20) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getLoginHistory(userId: string, limit = 20) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
