import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * EmailService — sends transactional emails via SMTP.
 *
 * Configure via env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Falls back to Ethereal (captures all mail in dev so no real emails sent).
 * Never throws — email failures are logged and swallowed so they never
 * block the calling flow.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from: string;

  constructor(private config: ConfigService) {
    this.from = config.get('SMTP_FROM') ?? `MediWyz <noreply@mediwyz.com>`;
    this.init();
  }

  private async init() {
    const host = this.config.get('SMTP_HOST');
    const port = parseInt(this.config.get('SMTP_PORT') ?? '587');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Email transport configured (${host}:${port})`);
    } else {
      // Dev fallback: Ethereal captures mail without sending
      const testAccount = await nodemailer.createTestAccount().catch(() => null);
      if (testAccount) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        this.logger.warn('SMTP not configured — using Ethereal (emails captured, not delivered)');
      }
    }
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent to ${payload.to}: no transport configured`);
      return;
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? payload.html.replace(/<[^>]+>/g, ''),
      });
      // In dev, log the Ethereal preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) this.logger.debug(`Email preview: ${previewUrl}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${payload.to}: ${err}`);
    }
  }

  // ─── Transactional templates ──────────────────────────────────────────────

  async sendBookingConfirmation(opts: {
    to: string; patientName: string; providerName: string;
    serviceName: string; scheduledAt: Date; bookingId: string;
  }) {
    const dateStr = opts.scheduledAt.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    await this.send({
      to: opts.to,
      subject: `Booking confirmed — ${opts.serviceName} with ${opts.providerName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#001E40;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="color:#9AE1FF;margin:0;font-size:22px">MediWyz</h1>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
            <p style="color:#374151;font-size:16px">Hi ${opts.patientName},</p>
            <p style="color:#374151">Your booking has been confirmed.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Service</td><td style="padding:8px 0;font-weight:600;color:#111827">${opts.serviceName}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Provider</td><td style="padding:8px 0;font-weight:600;color:#111827">${opts.providerName}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Date & Time</td><td style="padding:8px 0;font-weight:600;color:#111827">${dateStr}</td></tr>
            </table>
            <a href="https://mediwyz.com/bookings/${opts.bookingId}"
              style="display:inline-block;background:#0C6780;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              View Booking →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">MediWyz — Your trusted healthcare companion</p>
          </div>
        </div>`,
    });
  }

  async sendStatusUpdate(opts: {
    to: string; userName: string; bookingId: string;
    serviceName: string; newStatus: string; statusLabel: string;
    message?: string;
  }) {
    await this.send({
      to: opts.to,
      subject: `Update: ${opts.statusLabel} — ${opts.serviceName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#001E40;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="color:#9AE1FF;margin:0;font-size:22px">MediWyz</h1>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
            <p style="color:#374151;font-size:16px">Hi ${opts.userName},</p>
            <p style="color:#374151">Your booking status has been updated to <strong>${opts.statusLabel}</strong>.</p>
            ${opts.message ? `<p style="color:#374151;background:#eff6ff;padding:12px;border-radius:6px;border-left:4px solid #0C6780">${opts.message}</p>` : ''}
            <a href="https://mediwyz.com/bookings/${opts.bookingId}"
              style="display:inline-block;background:#0C6780;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              View Booking →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">MediWyz — Your trusted healthcare companion</p>
          </div>
        </div>`,
    });
  }

  async sendWelcome(opts: { to: string; firstName: string; userType: string }) {
    await this.send({
      to: opts.to,
      subject: 'Welcome to MediWyz 🏥',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#001E40;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="color:#9AE1FF;margin:0;font-size:22px">MediWyz</h1>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
            <p style="color:#374151;font-size:16px">Hi ${opts.firstName}!</p>
            <p style="color:#374151">Welcome to MediWyz — your trusted healthcare companion across Africa.</p>
            <p style="color:#374151">Your account is ready. ${opts.userType !== 'PATIENT' ? 'Upload your verification documents from Settings → Documents to start accepting bookings.' : 'Start exploring healthcare providers near you.'}</p>
            <a href="https://mediwyz.com"
              style="display:inline-block;background:#0C6780;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              Get Started →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">MediWyz — Your trusted healthcare companion</p>
          </div>
        </div>`,
    });
  }

  async sendPasswordReset(opts: { to: string; firstName: string; resetLink: string }) {
    await this.send({
      to: opts.to,
      subject: 'Reset your MediWyz password',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#001E40;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="color:#9AE1FF;margin:0;font-size:22px">MediWyz</h1>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
            <p style="color:#374151;font-size:16px">Hi ${opts.firstName},</p>
            <p style="color:#374151">You requested to reset your password. Click the button below. This link expires in 1 hour.</p>
            <a href="${opts.resetLink}"
              style="display:inline-block;background:#C53030;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              Reset Password →
            </a>
            <p style="color:#6b7280;font-size:13px;margin-top:16px">If you didn't request this, ignore this email. Your password won't change.</p>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">MediWyz — Your trusted healthcare companion</p>
          </div>
        </div>`,
    });
  }

  async sendDocumentReview(opts: {
    to: string; firstName: string;
    status: 'approved' | 'rejected'; reason?: string;
  }) {
    const approved = opts.status === 'approved';
    await this.send({
      to: opts.to,
      subject: approved ? 'Your account has been verified ✅' : 'Document review update',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#001E40;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="color:#9AE1FF;margin:0;font-size:22px">MediWyz</h1>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
            <p style="color:#374151;font-size:16px">Hi ${opts.firstName},</p>
            ${approved
              ? '<p style="color:#374151">Great news — your documents have been reviewed and your account is now fully verified. You can start accepting bookings.</p>'
              : `<p style="color:#374151">We reviewed your documents and need some changes.<br>${opts.reason ? `<strong>Reason:</strong> ${opts.reason}` : 'Please re-upload your documents from Settings → Documents.'}</p>`
            }
            <a href="https://mediwyz.com/settings/documents"
              style="display:inline-block;background:#0C6780;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              ${approved ? 'Go to Dashboard →' : 'Upload Documents →'}
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">MediWyz — Your trusted healthcare companion</p>
          </div>
        </div>`,
    });
  }
}
