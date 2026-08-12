import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
const { authenticator } = require('otplib');
import * as qrcode from 'qrcode';
import { SecurityService } from '@/modules/security/security.service';
import { SecurityEventType } from '@prisma/client';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private securityService: SecurityService,
  ) {}

  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const appName = this.configService.get<string>('APP_NAME') || 'IdentityPlatform';
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, qrCodeDataUrl };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication not initialized');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid authentication code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    await this.securityService.createSecurityEvent({
      userId,
      eventType: SecurityEventType.TWO_FACTOR_ENABLED,
      description: 'Two-factor authentication enabled',
    });

    return { message: 'Two-factor authentication enabled successfully' };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid authentication code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        isTwoFactorEnabled: false,
        twoFactorSecret: null 
      },
    });

    await this.securityService.createSecurityEvent({
      userId,
      eventType: SecurityEventType.TWO_FACTOR_DISABLED,
      description: 'Two-factor authentication disabled',
    });

    return { message: 'Two-factor authentication disabled successfully' };
  }

  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) return false;

    return authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
  }
}
