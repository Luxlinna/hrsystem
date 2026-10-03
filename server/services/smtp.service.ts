import nodemailer from 'nodemailer';
import { supabaseAdminClient } from '../config/supabase.js';

const SMTP_KEYS = [
  'smtp_host', 'smtp_port', 'smtp_secure',
  'smtp_user', 'smtp_pass',
  'smtp_from_name', 'smtp_from_email',
] as const;

type SmtpKey = typeof SMTP_KEYS[number];

/** Load SMTP config from system_settings table using the existing admin client */
async function loadSmtpConfig(): Promise<Record<SmtpKey, string>> {
  const client = supabaseAdminClient;
  if (!client) throw new Error('Supabase admin client is not configured on the server.');

  const { data, error } = await client
    .from('system_settings')
    .select('key, value')
    .in('key', [...SMTP_KEYS]);

  if (error) throw new Error(`Failed to load SMTP config: ${error.message}`);

  const map: Partial<Record<SmtpKey, string>> = {};
  (data || []).forEach(({ key, value }: { key: string; value: string }) => {
    if (SMTP_KEYS.includes(key as SmtpKey)) {
      map[key as SmtpKey] = value ?? '';
    }
  });

  return {
    smtp_host:       map.smtp_host       || '',
    smtp_port:       map.smtp_port       || '587',
    smtp_secure:     map.smtp_secure     || 'false',
    smtp_user:       map.smtp_user       || '',
    smtp_pass:       map.smtp_pass       || '',
    smtp_from_name:  map.smtp_from_name  || 'HRM System',
    smtp_from_email: map.smtp_from_email || '',
  };
}

/** Build a Nodemailer transporter from DB config */
export async function createSmtpTransporter() {
  const cfg = await loadSmtpConfig();

  if (!cfg.smtp_host || !cfg.smtp_from_email || !cfg.smtp_pass) {
    throw new Error(
      'SMTP is not fully configured. Please set host, sender email, and password in Settings → Email (SMTP).'
    );
  }

  const port = Number(cfg.smtp_port) || 587;
  // Port 465 is direct SSL/TLS. Port 587 and 25 must use STARTTLS (secure = false).
  const isSecure = port === 465 ? true : (port === 587 || port === 25 ? false : cfg.smtp_secure === 'true');

  const transporter = nodemailer.createTransport({
    host: cfg.smtp_host.trim(),
    port: port,
    secure: isSecure,
    auth: {
      user: (cfg.smtp_user || cfg.smtp_from_email).trim(),
      pass: cfg.smtp_pass.trim(),
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return {
    transporter,
    from: `${cfg.smtp_from_name || 'HRM System'} <${cfg.smtp_from_email.trim()}>`,
  };
}

/** Send a user invitation email with set up link */
export async function sendUserInviteEmail(
  toEmail: string,
  inviteeName: string,
  inviteLink: string
): Promise<void> {
  const { transporter, from } = await createSmtpTransporter();

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: `You're invited to HRM System — Set up your account`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto; padding:20px;">
        <div style="background:linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding:28px 24px; border-radius:12px 12px 0 0; text-align:center;">
          <h1 style="color:white; margin:0; font-size:22px;">Welcome to HRM System</h1>
        </div>
        <div style="background:#f8fafc; padding:28px 24px; border-radius:0 0 12px 12px; border:1px solid #e2e8f0; border-top:none;">
          <p style="font-size:15px; margin-top:0;">Hello <strong>${inviteeName || toEmail.split('@')[0]}</strong>,</p>
          <p style="font-size:15px; color:#475569;">You have been invited to access the <strong>HRM System</strong>. Click the button below to set up your account and create your password.</p>
          <div style="text-align:center; margin:28px 0;">
            <a href="${inviteLink}" style="display:inline-block; background:#1e40af; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">Set Up Account</a>
          </div>
          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-bottom:20px;">
            <p style="font-size:13px; color:#92400e; margin:0;">
              ⏰ <strong>This invitation link expires in 24 hours.</strong>
            </p>
          </div>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;">
          <p style="font-size:12px; color:#94a3b8; margin:0;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
    `.trim(),
  });
}

/** Send signup OTP code email */
export async function sendSignupOtpEmail(
  toEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<void> {
  const { transporter, from } = await createSmtpTransporter();

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: `Your HRM System verification code: ${otpCode}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#253C7D;margin-top:0;">Verification Code</h2>
        <p style="color:#555;font-size:14px;">Hello ${recipientName || 'there'},</p>
        <p style="color:#555;font-size:14px;">Your 6-digit verification code is:</p>
        <div style="background:#f1f5f9;padding:16px;border-radius:8px;text-align:center;margin:20px 0;">
          <span style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#1e293b;">${otpCode}</span>
        </div>
        <p style="color:#888;font-size:12px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `.trim(),
  });
}

/** Send a test email to verify the current SMTP config */
export async function sendTestEmail(toEmail: string): Promise<void> {
  const { transporter, from } = await createSmtpTransporter();

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: '✅ HRM System — SMTP Test Email',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#253C7D;margin-bottom:8px;">SMTP configuration works!</h2>
        <p style="color:#555;font-size:14px;">
          This is a test email sent from your <strong>HRM OPS</strong> system to verify
          that your SMTP settings are correctly configured.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="color:#888;font-size:12px;">
          Sent from: ${from}<br/>
          Sent to: ${toEmail}
        </p>
      </div>
    `,
  });
}
