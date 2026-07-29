import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');

    if (host && user) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: {
          user,
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    } else {
      this.logger.warn(
        'SMTP not configured — emails will be logged to console only',
      );
    }
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ??
      'Identity Platform <no-reply@identity.dev>';

    if (!this.transporter) {
      // Development fallback — log the email content
      this.logger.log(
        `\n======== EMAIL (dev mode) ========\nTo: ${options.to}\nSubject: ${options.subject}\n${options.html.replace(/<[^>]+>/g, '')}\n==================================`,
      );
      return;
    }

    await this.transporter.sendMail({ from, ...options });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link = `${frontendUrl}/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verify your email address',
      html: `
        <h2>Welcome to Identity Platform</h2>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${link}" style="background:#3b82f6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset your password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
        <p><a href="${link}" style="background:#ef4444;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Reset Password</a></p>
        <p>If you did not request a password reset, please ignore this email. Your password will not change.</p>
      `,
    });
  }

  async sendSuspiciousLoginAlert(
    email: string,
    details: { device: string; location: string; time: string },
  ): Promise<void> {
    await this.send({
      to: email,
      subject: '⚠️ Suspicious login detected on your account',
      html: `
        <h2>Suspicious Login Detected</h2>
        <p>We detected a login to your account from an unusual location or device:</p>
        <ul>
          <li><strong>Device:</strong> ${details.device}</li>
          <li><strong>Location:</strong> ${details.location}</li>
          <li><strong>Time:</strong> ${details.time}</li>
        </ul>
        <p>If this was you, you can safely ignore this email.</p>
        <p>If this was <strong>not</strong> you, please change your password immediately and review your active sessions.</p>
      `,
    });
  }
}
