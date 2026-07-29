import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as zxcvbn from 'zxcvbn';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from './password.service';
import { SecurityService } from '@/security/security.service';
import { BruteForceService } from '@/security/brute-force.service';
import { SessionsService } from '@/sessions/sessions.service';
import { MailService } from '@/mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { GoogleProfile } from './strategies/google.strategy';
import { AuthProvider, LoginStatus, SecurityEventType } from '@prisma/client';
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
    private mailService: MailService,
  ) {}

  // ─── Registration ────────────────────────────────────────────────────────────

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

    const { ipAddress } = extractDeviceInfo(req);

    await this.securityService.createSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.REGISTRATION,
      description: 'New account registered',
      ipAddress,
    });

    // Send verification email (non-blocking — failure doesn't break registration)
    this.sendVerificationEmail(user.id, user.email).catch(() => {
      /* log only, don't fail */
    });

    return this.createSessionAndTokens(user, req);
  }

  private async sendVerificationEmail(
    userId: string,
    email: string,
  ): Promise<void> {
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = await hashToken(verifyToken);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: verifyTokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
      },
    });

    await this.mailService.sendEmailVerification(email, verifyToken);
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, req: Request): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const { ipAddress } = extractDeviceInfo(req);

    await this.bruteForceService.assertNotBlocked(email, ipAddress);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      await this.bruteForceService.recordAttempt(email, ipAddress, false);
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!valid) {
      await this.bruteForceService.recordAttempt(
        email,
        ipAddress,
        false,
        user.id,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.bruteForceService.recordAttempt(
      email,
      ipAddress,
      true,
      user.id,
    );

    return this.createSessionAndTokens(user, req);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  async googleLogin(
    profile: GoogleProfile,
    req: Request,
  ): Promise<AuthResponse> {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: profile.googleId },
          { email: profile.email.toLowerCase() },
        ],
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

  // ─── Token refresh ────────────────────────────────────────────────────────────

  async refresh(refreshToken: string, _req: Request): Promise<AuthTokens> {
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

  // ─── Logout ───────────────────────────────────────────────────────────────────

  async logout(
    refreshToken: string | undefined,
    userId?: string,
    sessionId?: string,
  ): Promise<{ message: string }> {
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

  async logoutAll(
    userId: string,
    currentSessionId: string,
  ): Promise<{ message: string }> {
    await this.sessionsService.revokeAllSessions(userId, currentSessionId);

    await this.securityService.createSecurityEvent({
      userId,
      eventType: SecurityEventType.LOGOUT_ALL_DEVICES,
      description: 'User logged out from all other devices',
    });

    return { message: 'Logged out from all other devices' };
  }

  // ─── Profile ──────────────────────────────────────────────────────────────────

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

  // ─── Password management ──────────────────────────────────────────────────────

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

    const { ipAddress } = extractDeviceInfo(req);
    await this.securityService.createSecurityEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_CHANGED,
      description: 'Password changed successfully',
      ipAddress,
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashToken(resetToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = await hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Revoke all sessions after password reset
      this.prisma.session.updateMany({
        where: { userId: resetToken.userId },
        data: { revoked: true },
      }),
    ]);

    await this.securityService.createSecurityEvent({
      userId: resetToken.userId,
      eventType: SecurityEventType.PASSWORD_CHANGED,
      description: 'Password reset via email token',
    });

    return { message: 'Password reset successfully. Please log in.' };
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
