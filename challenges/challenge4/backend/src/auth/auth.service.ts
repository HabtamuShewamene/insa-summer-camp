import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from './password.service';
import { SecurityService } from '@/security/security.service';
import { BruteForceService } from '@/security/brute-force.service';
import { SessionsService } from '@/sessions/sessions.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { GoogleProfile } from './strategies/google.strategy';
import {
  AuthProvider,
  LoginStatus,
  SecurityEventType,
} from '@prisma/client';
import {
  extractDeviceInfo,
  resolveLocation,
  hashToken,
  generateRefreshToken,
} from '@/common/utils/device.util';
import { Request } from 'express';
import { AuthResponse, AuthTokens, JwtPayload } from '@/common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private securityService: SecurityService,
    private bruteForceService: BruteForceService,
    private sessionsService: SessionsService,
  ) {}

  async register(dto: RegisterDto, req: Request): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    this.passwordService.validatePassword(dto.password);
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        provider: AuthProvider.LOCAL,
        emailVerified: false,
      },
    });

    await this.securityService.createSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.REGISTRATION,
      description: 'New account registered',
      ipAddress: extractDeviceInfo(req).ipAddress,
    });

    return this.createSessionAndTokens(user, req);
  }

  async login(dto: LoginDto, req: Request): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const { ipAddress } = extractDeviceInfo(req);

    await this.bruteForceService.assertNotBlocked(email, ipAddress);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      await this.bruteForceService.checkAndRecordAttempt(email, ipAddress, false);
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!valid) {
      await this.bruteForceService.checkAndRecordAttempt(
        email,
        ipAddress,
        false,
        user.id,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.bruteForceService.checkAndRecordAttempt(
      email,
      ipAddress,
      true,
      user.id,
    );

    return this.createSessionAndTokens(user, req);
  }

  async googleLogin(profile: GoogleProfile, req: Request): Promise<AuthResponse> {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email: profile.email.toLowerCase() }],
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.googleId,
            emailVerified: profile.emailVerified || user.emailVerified,
          },
        });

        await this.securityService.createSecurityEvent({
          userId: user.id,
          eventType: SecurityEventType.GOOGLE_ACCOUNT_LINKED,
          description: 'Google account linked to existing user',
          ipAddress: extractDeviceInfo(req).ipAddress,
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email.toLowerCase(),
          googleId: profile.googleId,
          provider: AuthProvider.GOOGLE,
          emailVerified: profile.emailVerified,
        },
      });

      await this.securityService.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.REGISTRATION,
        description: 'Account created via Google OAuth',
        ipAddress: extractDeviceInfo(req).ipAddress,
      });
    }

    return this.createSessionAndTokens(user, req);
  }

  async refresh(refreshToken: string, req: Request): Promise<AuthTokens> {
    const tokenHash = await hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.generateAccessToken({
      sub: session.user.id,
      email: session.user.email,
      sessionId: session.id,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string | undefined, userId?: string, sessionId?: string) {
    if (refreshToken) {
      const tokenHash = await hashToken(refreshToken);
      await this.prisma.session.updateMany({
        where: { refreshTokenHash: tokenHash },
        data: { revoked: true },
      });
    } else if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId, userId },
        data: { revoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, currentSessionId: string) {
    await this.sessionsService.revokeAllSessions(userId, currentSessionId);

    await this.securityService.createSecurityEvent({
      userId,
      eventType: SecurityEventType.LOGOUT_ALL_DEVICES,
      description: 'User logged out from all other devices',
    });

    return { message: 'Logged out from all other devices' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getSecurityDashboard(userId: string, sessionId: string) {
    const [sessions, loginHistory, securityEvents] = await Promise.all([
      this.sessionsService.getActiveSessions(userId, sessionId),
      this.securityService.getLoginHistory(userId),
      this.securityService.getSecurityEvents(userId),
    ]);

    return { sessions, loginHistory, securityEvents };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    req: Request,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordHash) {
      throw new ForbiddenException(
        'Cannot change password for OAuth-only accounts',
      );
    }

    const valid = await this.passwordService.verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    this.passwordService.validatePassword(dto.newPassword);
    const newHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all other sessions after password change (security best practice)
    const { ipAddress } = extractDeviceInfo(req);
    await this.securityService.createSecurityEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_CHANGED,
      description: 'Password changed successfully',
      ipAddress,
    });

    return { message: 'Password changed successfully' };
  }

  async checkPasswordStrength(password: string): Promise<{
    score: number;
    label: string;
    feedback: string[];
    checks: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
  }> {
    if (!password) {
      return {
        score: 0,
        label: 'empty',
        feedback: [],
        checks: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        },
      };
    }

    const zxcvbn = require('zxcvbn');
    const result = zxcvbn(password);

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    };

    const labels = ['very-weak', 'weak', 'fair', 'strong', 'very-strong'];
    const feedback: string[] = [];

    if (!checks.length) feedback.push('Use at least 8 characters');
    if (!checks.uppercase) feedback.push('Add an uppercase letter');
    if (!checks.lowercase) feedback.push('Add a lowercase letter');
    if (!checks.number) feedback.push('Add a number');
    if (!checks.special) feedback.push('Add a special character');
    if (result.feedback?.warning) feedback.push(result.feedback.warning);
    if (result.feedback?.suggestions?.length) {
      feedback.push(...result.feedback.suggestions);
    }

    return {
      score: result.score,
      label: labels[result.score],
      feedback,
      checks,
    };
  }

  private async createSessionAndTokens(
    user: {
      id: string;
      name: string;
      email: string;
      provider: AuthProvider;
      emailVerified: boolean;
    },
    req: Request,
  ): Promise<AuthResponse> {
    const deviceInfo = extractDeviceInfo(req);
    const geo = resolveLocation(deviceInfo.ipAddress);
    const location = geo.location;

    const suspiciousCheck = await this.securityService.checkSuspiciousLogin(
      user.id,
      {
        ...deviceInfo,
        country: geo.country,
        city: geo.city,
      },
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashToken(refreshToken);
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.parseExpiry(refreshExpiresIn);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ipAddress,
        location,
        expiresAt,
      },
    });

    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      sessionId: session.id,
    });

    await this.securityService.recordLoginHistory({
      userId: user.id,
      email: user.email,
      ipAddress: deviceInfo.ipAddress,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      location,
      country: geo.country,
      city: geo.city,
      status: LoginStatus.SUCCESS,
      riskScore: suspiciousCheck.riskScore,
    });

    if (suspiciousCheck.suspicious) {
      await this.securityService.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.SUSPICIOUS_LOGIN,
        description: suspiciousCheck.reasons.join('; '),
        ipAddress: deviceInfo.ipAddress,
        metadata: { riskScore: suspiciousCheck.riskScore },
      });
    } else if (suspiciousCheck.riskScore >= 40) {
      await this.securityService.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.NEW_DEVICE_LOGIN,
        description: 'Login from a new device detected',
        ipAddress: deviceInfo.ipAddress,
      });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        emailVerified: user.emailVerified,
      },
    };
  }

  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });
  }

  private parseExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * (multipliers[unit] || multipliers.d));
  }
}
