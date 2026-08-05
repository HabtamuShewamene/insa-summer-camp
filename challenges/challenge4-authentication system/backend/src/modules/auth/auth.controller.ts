import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequestUser } from '@/common/interfaces';
import { GoogleProfile } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // ─── Registration ─────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  // ─── Login ────────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  // ─── Token refresh ────────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, req);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto, @CurrentUser() user: RequestUser) {
    return this.authService.logout(dto.refreshToken, user.id, user.sessionId);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: RequestUser) {
    return this.authService.logoutAll(user.id, user.sessionId);
  }

  // ─── Profile ──────────────────────────────────────────────────────────────────

  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.id);
  }

  @Get('security-dashboard')
  async getSecurityDashboard(@CurrentUser() user: RequestUser) {
    return this.authService.getSecurityDashboard(user.id, user.sessionId);
  }

  // ─── Password management ──────────────────────────────────────────────────────

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(user.id, dto, req);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  // ─── Password strength check ──────────────────────────────────────────────────

  @Public()
  @Post('check-password-strength')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  checkPasswordStrength(@Body('password') password: string) {
    return this.authService.checkPasswordStrength(password ?? '');
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  @Public()
  @SkipThrottle()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport intercepts this and redirects to Google — handler never runs
  }

  @Public()
  @SkipThrottle()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    try {
      // Check if user was authenticated
      if (!req.user) {
        throw new Error('No user from Google OAuth');
      }

      const result = await this.authService.googleLogin(req.user, req);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

      // Redirect to the server-side set-auth route which sets cookies
      // before redirecting to dashboard — avoids cookie timing issues
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        redirect: '/dashboard',
      });

      res.redirect(`${frontendUrl}/api/set-auth?${params.toString()}`);
    } catch (err) {
      console.error('Google OAuth Error:', err);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
      const errorMsg = err instanceof Error ? err.message : 'oauth_failed';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
    }
  }
}
