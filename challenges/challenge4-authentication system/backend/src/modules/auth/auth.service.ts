import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as zxcvbn from 'zxcvbn';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from './password.service';
import { SecurityService } from '@/modules/security/security.service';
import { BruteForceService } from '@/modules/security/brute-force.service';
import { SessionsService } from '@/modules/sessions/sessions.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { GoogleProfile } from './strategies/google.strategy';
import { AuthProvider, LoginStatus, SecurityEventType } from '@prisma/client';
import {
  extractDeviceInfo,
  hashToken,
  generateRefreshToken,
  resolveLocation,
} from '@/common/utils/device.util';
import { AuthResponse, JwtPayload } from '@/common/interfaces';
import { Request } from 'express';

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

  // TODO: Add email verification flow
  // Register new user
  async register(dto: RegisterDto, req: Request) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Validate and hash password
    this.passwordService.validatePassword(dto.password);
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        provider: AuthProvider.LOCAL,
        emailVerified: false, // TODO: implement email verification
      },
    });

    // Log registration event
    const { ipAddress } = extractDeviceInfo(req);
    await this.securityService.createSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.REGISTRATION,
      description: 'New account registered',
      ipAddress,
    });

    return this.createSessionAndTokens(user, req);
  }

  // User login with brute force protection
  async login(dto: LoginDto, req: Request) {
    const email = dto.email.toLowerCase();
    const { ipAddress } = extractDeviceInfo(req);

    // Check if IP/email is blocked due to too many failed attempts
    await this.bruteForceService.assertNotBlocked(email, ipAddress);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      // Record failed attempt
      await this.bruteForceService.recordAttempt(email, ipAddress, false);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const valid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!valid) {
      // Record failed attempt with user ID
      await this.bruteForceService.recordAttempt(
        email,
        ipAddress,
        false,
        user.id,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    // Record successful login
    await this.bruteForceService.recordAttempt(
      email,
      ipAddress,
      true,
      user.id,
    );

    return this.createSessionAndTokens(user, req);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  // Google OAuth login/registration
  async googleLogin(profile: GoogleProfile, req: Request) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: profile.googleId },
          { email: profile.email.toLowerCase() },
        ],
      },
    });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.googleId,
            emailVerified: profile.emailVerified || user.emailVerified,
          },
        });
      }
    } else {
      // Create new user via Google
      user = await this.prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email.toLowerCase(),
          googleId: profile.googleId,
          provider: AuthProvider.GOOGLE,
          emailVerified: profile.emailVerified,
        },
      });
    }

    return this.createSessionAndTokens(user, req);
  }

  // Refresh access token
  async refresh(refreshToken: string, req?: Request) {
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

    // Update last active time
    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    return { accessToken, refreshToken };
  }

  // Logout user
  async logout(refreshToken?: string, userId?: string, sessionId?: string) {
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

  // Get current user info
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

  // Change password
  async changePassword(userId: string, dto: ChangePasswordDto, req?: Request) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Cannot change password for OAuth-only accounts');
    }

    const valid = await this.passwordService.verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different');
    }

    this.passwordService.validatePassword(dto.newPassword);
    const newHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }



  // ─── Password reset ───────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    return { message: 'If an account exists, a password reset email has been sent.' };
  }

  async resetPassword(dto: any) {
    return { message: 'Password reset successfully. Please log in.' };
  }

  // ─── Security Dashboard & Sessions ────────────────────────────────────────────

  async logoutAll(userId: string, sessionId?: string) {
    await this.prisma.session.updateMany({
      where: { userId, ...(sessionId ? { id: { not: sessionId } } : {}) },
      data: { revoked: true },
    });
    return { message: 'All other sessions revoked' };
  }

  async getSecurityDashboard(userId: string, sessionId?: string) {
    return { activeSessions: [], loginHistory: [], securityEvents: [] };
  }

  // ─── Password strength check (public endpoint) ───────────────────────────────

  checkPasswordStrength(password: string): {
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
  } {
    const empty = {
      score: 0,
      label: 'empty',
      feedback: [] as string[],
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
    };

    if (!password) return empty;

    const result = (zxcvbn as unknown as (p: string) => zxcvbn.ZXCVBNResult)(
      password,
    );

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

  // ─── Email verification ───────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = await hashToken(token);

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException(
        'Invalid or expired email verification token',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

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
      { ...deviceInfo, country: geo.country, city: geo.city },
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashToken(refreshToken);
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
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

    // Only fire security events if this isn't the very first login
    if (suspiciousCheck.isFirstLogin === false) {
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
      expiresIn:
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });
  }

  private parseExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60 * 1_000,
      h: 60 * 60 * 1_000,
      d: 24 * 60 * 60 * 1_000,
    };

    return new Date(Date.now() + value * (multipliers[unit] ?? multipliers.d));
  }
}
