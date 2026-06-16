import crypto from "crypto";
import sgMail from "@sendgrid/mail";

export function generateEmailToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getAppUrl(): string {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const first = domains.split(",")[0].trim();
    return `https://${first}`;
  }
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) return `https://${devDomain}`;
  return "http://localhost:5173";
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_EMAIL;

  if (!apiKey) {
    console.warn(`[Email] SENDGRID_API_KEY not set — email skipped. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in Replit Secrets.`);
    return false;
  }

  if (!fromEmail) {
    console.warn(`[Email] SENDGRID_FROM_EMAIL not set — email skipped. Set a verified SendGrid sender address in SENDGRID_FROM_EMAIL.`);
    return false;
  }

  try {
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to,
      from: { name: "Mission Distinction", email: fromEmail },
      subject,
      html,
    });
    console.info(`[Email] Sent | Subject: ${subject}`);
    return true;
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.body;
    if (status === 403) {
      console.error(
        `[Email] SendGrid 403 Forbidden — sender "${fromEmail}" is not verified. ` +
        `Go to app.sendgrid.com → Settings → Sender Authentication and verify this address or domain. ` +
        `Then ensure SENDGRID_FROM_EMAIL in Replit Secrets matches a verified sender.`,
        body
      );
    } else if (status === 401) {
      console.error(`[Email] SendGrid 401 Unauthorized — SENDGRID_API_KEY may be invalid or revoked.`, body);
    } else {
      console.error(`[Email] SendGrid error (status ${status ?? "unknown"}):`, body ?? err?.message ?? err);
    }
    return false;
  }
}

export function resetPasswordEmail(resetUrl: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:40px;border-radius:12px;">
      <h2 style="color:#7c3aed;margin-top:0;">Mission Distinction</h2>
      <h3 style="color:#e2e8f0;">Reset Your Password</h3>
      <p style="color:#94a3b8;">Click the button below to reset your password. This link expires in <strong style="color:#e2e8f0;">1 hour</strong>.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
      <p style="color:#64748b;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
    </div>`;
}

export function verifyEmailTemplate(verifyUrl: string, name: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:40px;border-radius:12px;">
      <h2 style="color:#7c3aed;margin-top:0;">Mission Distinction</h2>
      <h3 style="color:#e2e8f0;">Welcome, ${name}! Verify your email</h3>
      <p style="color:#94a3b8;">Click below to verify your email address and unlock full access.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Verify Email</a>
      <p style="color:#64748b;font-size:12px;margin-top:24px;">This link expires in 24 hours.</p>
    </div>`;
}
