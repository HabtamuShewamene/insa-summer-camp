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
      this.logger.log('SMTP transporter configured');
    } else {
      this.logger.warn(
        'SMTP not configured — emails will be printed to console (dev mode)',
      );
    }
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
    text: string; // plain-text version — used for dev console output
  }): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ??
      'Identity Platform <no-reply@identity.dev>';

    if (!this.transporter) {
      // ── DEV MODE — print a clear, copy-pasteable output ──────────────────
      this.logger.log(
        [
          '',
          '╔══════════════════════════════════════════════════════════════╗',
          '║                  📧  EMAIL (dev mode)                       ║',
          '╠══════════════════════════════════════════════════════════════╣',
          `║  To      : ${options.to.padEnd(50)}║`,
          `║  Subject : ${options.subject.substring(0, 50).padEnd(50)}║`,
          '╠══════════════════════════════════════════════════════════════╣',
          ...options.text
            .split('\n')
            .map((line) => `║  ${line.substring(0, 60).padEnd(60)}║`),
          '╚══════════════════════════════════════════════════════════════╝',
          '',
        ].join('\n'),
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
      subject: 'Verify your email — Identity Platform',
      text: [
        'Welcome to Identity Platform!',
        '',
        'Verify your email address by visiting this link:',
        link,
        '',
        'This link expires in 24 hours.',
        'If you did not create an account, ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Welcome to Identity Platform</h2>
          <p>Click the button below to verify your email address.</p>
          <p style="margin:24px 0">
            <a href="${link}"
               style="background:#3b82f6;color:#fff;padding:12px 24px;
                      text-decoration:none;border-radius:6px;display:inline-block;
                      font-weight:600">
              Verify Email
            </a>
          </p>
          <p style="color:#888;font-size:13px">
            Or copy and paste this link:<br/>
            <a href="${link}" style="color:#3b82f6">${link}</a>
          </p>
          <p style="color:#888;font-size:12px">
            This link expires in 24 hours. If you did not create an account,
            you can safely ignore this email.
          </p>
        </div>`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset your password — Identity Platform',
      text: [
        'You requested a password reset.',
        '',
        'Click or paste this link to reset your password:',
        link,
        '',
        'This link expires in 15 minutes.',
        'If you did not request a password reset, ignore this email.',
        'Your password will NOT change unless you visit the link above.',
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Reset your password</h2>
          <p>Click the button below to choose a new password.
             This link expires in <strong>15 minutes</strong>.</p>
          <p style="margin:24px 0">
            <a href="${link}"
               style="background:#ef4444;color:#fff;padding:12px 24px;
                      text-decoration:none;border-radius:6px;display:inline-block;
                      font-weight:600">
              Reset Password
            </a>
          </p>
          <p style="color:#888;font-size:13px">
            Or copy and paste this link:<br/>
            <a href="${link}" style="color:#ef4444">${link}</a>
          </p>
          <p style="color:#888;font-size:12px">
            If you did not request a password reset, you can safely ignore
            this email. Your password will not change.
          </p>
        </div>`,
    });
  }

  async sendSuspiciousLoginAlert(
    email: string,
    details: { device: string; location: string; time: string },
  ): Promise<void> {
    await this.send({
      to: email,
      subject: '⚠️ Suspicious login detected — Identity Platform',
      text: [
        'Suspicious Login Detected',
        '',
        `Device   : ${details.device}`,
        `Location : ${details.location}`,
        `Time     : ${details.time}`,
        '',
        'If this was you, no action is needed.',
        'If this was NOT you, change your password immediately and',
        'revoke all active sessions from your security dashboard.',
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>⚠️ Suspicious Login Detected</h2>
          <p>We detected a login to your account from an unusual location or device:</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:8px;background:#f3f4f6;font-weight:600">Device</td>
                <td style="padding:8px">${details.device}</td></tr>
            <tr><td style="padding:8px;background:#f3f4f6;font-weight:600">Location</td>
                <td style="padding:8px">${details.location}</td></tr>
            <tr><td style="padding:8px;background:#f3f4f6;font-weight:600">Time</td>
                <td style="padding:8px">${details.time}</td></tr>
          </table>
          <p>If this was you, no action is needed.</p>
          <p>If this was <strong>not</strong> you, please change your password
             immediately and review your active sessions.</p>
        </div>`,
    });
  }

  async sendDocumentInvitation(params: {
    toEmail: string;
    toName: string;
    fromName: string;
    documentTitle: string;
    documentId: string;
    permission: string;
  }): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const docLink = `${frontendUrl}/documents/${params.documentId}`;
    const permLabel =
      params.permission === 'VIEWER' ? 'view'
      : params.permission === 'COMMENTER' ? 'view and comment on'
      : 'edit';

    await this.send({
      to: params.toEmail,
      subject: `${params.fromName} shared "${params.documentTitle}" with you — CollabDocs`,
      text: [
        `Hi ${params.toName},`,
        '',
        `${params.fromName} has invited you to ${permLabel} a document:`,
        `"${params.documentTitle}"`,
        '',
        `Permission level: ${params.permission}`,
        '',
        `Open document: ${docLink}`,
        '',
        'If you were not expecting this invitation, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
          <h2 style="margin-bottom:4px">You have been invited to collaborate</h2>
          <p style="color:#555;margin-top:0">
            <strong>${params.fromName}</strong> has invited you to
            <strong>${permLabel}</strong> a document on CollabDocs.
          </p>
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;background:#f9fafb">
            <p style="margin:0 0 4px 0;font-size:18px;font-weight:600">
              📄 ${params.documentTitle}
            </p>
            <p style="margin:0;font-size:12px;color:#6b7280">
              Permission: <strong>${params.permission}</strong>
            </p>
          </div>
          <p style="margin:24px 0">
            <a href="${docLink}"
               style="background:#000;color:#fff;padding:12px 28px;
                      text-decoration:none;border-radius:6px;display:inline-block;
                      font-weight:600;font-size:14px">
              Open Document →
            </a>
          </p>
          <p style="font-size:12px;color:#9ca3af">
            If you were not expecting this invitation, you can safely ignore this email.
          </p>
        </div>`,
    });
  }
}
