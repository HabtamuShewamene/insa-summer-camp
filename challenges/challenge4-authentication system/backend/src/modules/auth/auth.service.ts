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
import { MailService } from '@/modules/mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  UpdateProfileDto,
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
import { TwoFactorService } from './two-factor.service';

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
    private mailService: MailService,
    private twoFactorService: TwoFactorService,
  ) {}

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
        emailVerified: false,
      },
    });

    const verificationToken = generateRefreshToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: await hashToken(verificationToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.mailService.sendEmailVerification(user.email, verificationToken);

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

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email address before logging in');
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

    if (user.isTwoFactorEnabled) {
      // Generate a temporary token for the 2FA verification step
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, is2faTemp: true },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '5m',
        },
      );
      
      return {
        requires2fa: true,
        userId: user.id,
        tempToken,
      };
    }

    return this.createSessionAndTokens(user, req);
  }

  // 2FA login verification
  async verify2FALogin(code: string, userId: string | undefined, req: Request) {
    let targetUserId = userId;
    
    // If a tempToken was sent via Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tempToken = authHeader.split(' ')[1];
      try {
        const payload = this.jwtService.verify(tempToken, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        });
        if (payload.is2faTemp) {
          targetUserId = payload.sub;
        }
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired 2FA token');
      }
    }

    if (!targetUserId) {
      throw new UnauthorizedException('User identification required for 2FA');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Invalid 2FA setup');
    }

    const isValid = require('otplib').authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

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
        
        const { ipAddress } = extractDeviceInfo(req);
        await this.securityService.createSecurityEvent({
          userId: user.id,
          eventType: SecurityEventType.GOOGLE_ACCOUNT_LINKED,
          description: 'Linked Google account to existing profile',
          ipAddress,
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

  // Update profile
  async updateProfile(userId: string, name: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        emailVerified: true,
      }
    });
    return { message: 'Profile updated successfully', user };
  }

  // Delete account
  async deleteAccount(userId: string) {
    // Due to Cascade deletes in the schema, this will also delete 
    // sessions, security events, documents, comments, etc.
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return { message: 'Account deleted successfully' };
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

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.session.updateMany({
        where: { 
          userId,
          ...(req ? { id: { not: (req as any).user?.sessionId } } : {}) // Revoke all OTHER sessions
        },
        data: { revoked: true },
      })
    ]);

    const { ipAddress } = req ? extractDeviceInfo(req) : { ipAddress: undefined };
    await this.securityService.createSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.PASSWORD_CHANGED,
      description: 'User changed their password',
      ipAddress,
    });

    return { message: 'Password changed successfully. Other sessions have been revoked.' };
  }



  // ─── Password reset ───────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user?.passwordHash) {
      const token = generateRefreshToken();
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: await hashToken(token),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      await this.mailService.sendPasswordResetEmail(user.email, token);
    }
    return { message: 'If an account exists, a password reset email has been sent.' };
  }

  async resetPassword(dto: { token: string; newPassword: string }) {
    const tokenHash = await hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
      this.prisma.session.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);
    return { message: 'Password reset successfully. Please log in.' };
  }

  // ─── Security Dashboard & Sessions ────────────────────────────────────────────

  async logoutAll(userId: string, sessionId?: string) {
    await this.prisma.session.updateMany({
      where: { userId, ...(sessionId ? { id: { not: sessionId } } : {}) },
      data: { revoked: true },
    });
    
    await this.securityService.createSecurityEvent({
      userId,
      eventType: SecurityEventType.LOGOUT_ALL_DEVICES,
      description: 'Revoked all other active sessions',
    });
    
    return { message: 'All other sessions revoked' };
  }

  async getSecurityDashboard(userId: string, sessionId?: string) {
    const [activeSessions, loginHistory, securityEvents] = await Promise.all([
      this.sessionsService.getActiveSessions(userId, sessionId),
      this.securityService.getLoginHistory(userId),
      this.securityService.getSecurityEvents(userId),
    ]);
    return { activeSessions, loginHistory, securityEvents };
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
