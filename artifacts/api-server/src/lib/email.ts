import crypto from "crypto";
import sgMail from "@sendgrid/mail";

export function generateEmailToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_EMAIL;

  if (!apiKey) {
    console.warn(`[Email] SENDGRID_API_KEY not set — email skipped.`);
    return false;
  }

  if (!fromEmail) {
    console.warn(`[Email] SENDGRID_FROM_EMAIL not set — email skipped.`);
    return false;
  }

  try {
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to,
      from: { name: "Mission Distinction", email: fromEmail },
      replyTo: fromEmail,
      subject,
      html,
      text,
    });
    console.info(`[Email] Sent | Subject: ${subject}`);
    return true;
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.body;
    if (status === 403) {
      console.error(
        `[Email] SendGrid 403 — sender "${fromEmail}" not verified. ` +
        `Go to app.sendgrid.com → Settings → Sender Authentication.`,
        body
      );
    } else if (status === 401) {
      console.error(`[Email] SendGrid 401 — SENDGRID_API_KEY may be invalid.`, body);
    } else {
      console.error(`[Email] SendGrid error (status ${status ?? "unknown"}):`, body ?? err?.message ?? err);
    }
    return false;
  }
}

const HTML_SHELL_BEFORE =
  "<!DOCTYPE html><html lang=\"en\"><head>" +
  "<meta charset=\"UTF-8\" />" +
  "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />" +
  "<title>Mission Distinction</title></head>" +
  "<body style=\"margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;\">" +
  "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f4f4f7;padding:32px 0;\"><tr><td align=\"center\">" +
  "<table width=\"100%\" style=\"max-width:580px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e0e0e5;\">" +
  "<tr><td style=\"background:#7c3aed;padding:28px 40px;text-align:center;\">" +
  "<h1 style=\"margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;\">Mission Distinction</h1>" +
  "<p style=\"margin:4px 0 0;color:#ddd6fe;font-size:13px;\">Medical Education Platform</p>" +
  "</td></tr>" +
  "<tr><td style=\"padding:36px 40px;color:#1e1e2e;\">";

const HTML_SHELL_AFTER =
  "</td></tr>" +
  "<tr><td style=\"background:#f9f9fb;padding:20px 40px;border-top:1px solid #e9e9ef;text-align:center;\">" +
  "<p style=\"margin:0;font-size:12px;color:#9ca3af;\">" +
  "Mission Distinction &mdash; Free MBBS Education for Odisha Students<br />" +
  "If you did not request this email, you can safely ignore it." +
  "</p></td></tr>" +
  "</table></td></tr></table></body></html>";

function baseHtml(content: string): string {
  return HTML_SHELL_BEFORE + content + HTML_SHELL_AFTER;
}

export function verifyEmailTemplate(verifyUrl: string, name: string): { html: string; text: string } {
  const safeUrl = encodeURI(verifyUrl);
  const safeName = escapeHtml(name);

  const bodyContent =
    "<h2 style=\"margin:0 0 8px;font-size:20px;color:#1e1e2e;\">Welcome, " + safeName + "!</h2>" +
    "<p style=\"margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;\">Thank you for registering on Mission Distinction. Please verify your email address to activate your account and access all study resources.</p>" +
    "<div style=\"text-align:center;margin:28px 0;\">" +
    "<a href=\"" + safeUrl + "\" style=\"display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.2px;\">✅ Verify My Email</a>" +
    "</div>" +
    "<p style=\"margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;\">This link expires in <strong>24 hours</strong>. If the button above doesn't work, copy and paste this URL into your browser:</p>" +
    "<p style=\"margin:8px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;\">" + safeUrl + "</p>";
  const html = baseHtml(bodyContent);

  const text = `Welcome to Mission Distinction, ${name}!

Please verify your email address by visiting the link below:

${verifyUrl}

This link expires in 24 hours.

If you did not register on Mission Distinction, you can safely ignore this email.

— Mission Distinction Team`;

  return { html, text };
}

export function resetPasswordEmail(resetUrl: string): { html: string; text: string } {
  const safeUrl = encodeURI(resetUrl);

  const resetContent =
    "<h2 style=\"margin:0 0 8px;font-size:20px;color:#1e1e2e;\">Reset Your Password</h2>" +
    "<p style=\"margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;\">We received a request to reset your Mission Distinction password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>" +
    "<div style=\"text-align:center;margin:28px 0;\">" +
    "<a href=\"" + safeUrl + "\" style=\"display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.2px;\">🔐 Reset Password</a>" +
    "</div>" +
    "<p style=\"margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;\">If the button doesn't work, copy and paste this URL into your browser:</p>" +
    "<p style=\"margin:8px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;\">" + safeUrl + "</p>" +
    "<hr style=\"border:none;border-top:1px solid #e9e9ef;margin:24px 0;\" />" +
    "<p style=\"margin:0;font-size:13px;color:#9ca3af;\">If you didn't request a password reset, no action is needed. Your password won't change.</p>";
  const html = baseHtml(resetContent);

  const text = `Reset Your Mission Distinction Password

Click the link below to reset your password (expires in 1 hour):

${resetUrl}

If you didn't request this, you can safely ignore this email.

— Mission Distinction Team`;

  return { html, text };
}
