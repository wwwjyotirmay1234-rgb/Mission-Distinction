/**
 * POST /api/system/sync-alert
 * Called by the GitHub Auto-Sync script when a push fails.
 * Protected by the SESSION_SECRET so it can't be triggered by random callers.
 * Sends a plain-text alert email to the admin address.
 */
import { Router, type Request, type Response } from "express";
import { sendEmail } from "../lib/email";

const router = Router();

router.post("/system/sync-alert", async (req: Request, res: Response) => {
  const expected = process.env.SESSION_SECRET;
  const authHeader = req.headers.authorization ?? "";
  const provided   = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!expected || provided !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { reason = "Unknown failure", sha = "—", detail = "" } = req.body as {
    reason?: string;
    sha?: string;
    detail?: string;
  };

  const adminEmail = process.env.SMTP_EMAIL;
  if (!adminEmail) {
    res.status(500).json({ error: "Admin email not configured" });
    return;
  }

  const subject = `⚠️ GitHub Sync Failed — Mission Distinction`;
  const safeReason = reason.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeSha    = sha.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeDetail = detail.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `
    <h2 style="margin:0 0 12px;font-size:18px;color:#dc2626;">⚠️ GitHub Sync Failed</h2>
    <p style="font-size:14px;color:#4b5563;margin:0 0 16px;">
      The automatic GitHub sync script encountered a failure and has stopped (or will retry).
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f9f9fb;">
        <td style="padding:8px 12px;font-weight:600;color:#374151;width:120px;">Reason</td>
        <td style="padding:8px 12px;color:#1e1e2e;">${safeReason}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#374151;">Commit SHA</td>
        <td style="padding:8px 12px;color:#1e1e2e;font-family:monospace;">${safeSha}</td>
      </tr>
      ${safeDetail ? `
      <tr style="background:#f9f9fb;">
        <td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top;">Detail</td>
        <td style="padding:8px 12px;color:#1e1e2e;font-family:monospace;white-space:pre-wrap;">${safeDetail}</td>
      </tr>` : ""}
    </table>
    <p style="font-size:13px;color:#6b7280;margin:16px 0 0;">
      Action required: check the GitHub Auto-Sync workflow logs and verify the
      <code>GITHUB_PERSONAL_ACCESS_TOKEN</code> secret has <strong>repo + workflow</strong> scopes.
    </p>
  `;

  const text = `GitHub Sync Failed — Mission Distinction

Reason: ${reason}
Commit SHA: ${sha}
${detail ? `Detail:\n${detail}\n` : ""}
Action required: check the GitHub Auto-Sync workflow logs and verify GITHUB_PERSONAL_ACCESS_TOKEN has repo + workflow scopes.
`;

  const sent = await sendEmail(adminEmail, subject, html, text);
  if (sent) {
    res.json({ ok: true, message: "Alert email sent" });
  } else {
    // Email sending failed (e.g. SENDGRID_API_KEY not set in prod),
    // but the alert was received — log it server-side and return 200.
    console.error("[sync-alert] Email send failed — alert logged server-side only.", { reason, sha });
    res.json({ ok: false, message: "Alert logged (email not sent — check SENDGRID_API_KEY)" });
  }
});

export { router as syncAlertRouter };
