import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { awardXp, getContributionXp } from "../lib/xp";
import { sendEmail, getAppUrl } from "../lib/email";

const router = Router();

const ALLOWED_TYPES = ["note", "book", "pyq"] as const;
const ALLOWED_STATUSES = ["pending", "approved", "rejected"] as const;

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, "").trim();
}

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rows } = await pool.query(
      `SELECT * FROM student_submissions WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("submissions/my error:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.get("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let query = `SELECT * FROM student_submissions`;
    const params: any[] = [];
    if (status && ALLOWED_STATUSES.includes(status as any)) {
      query += ` WHERE status = $1`;
      params.push(status);
    }
    query += ` ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("submissions list error:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type, title, subject, year, url, description } = req.body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      res.status(400).json({ error: "Invalid type. Must be note, book, or pyq." });
      return;
    }
    if (!title || !subject || !url) {
      res.status(400).json({ error: "Title, subject, and URL are required." });
      return;
    }
    if (!isValidUrl(url)) {
      res.status(400).json({ error: "URL must be a valid HTTPS link." });
      return;
    }
    if (type === "pyq" && !year) {
      res.status(400).json({ error: "Year is required for PYQs." });
      return;
    }

    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeYear = year ? stripHtml(String(year)) : null;
    const safeDesc = description ? stripHtml(String(description)).slice(0, 500) : null;

    if (!safeTitle || !safeSubject) {
      res.status(400).json({ error: "Invalid title or subject." });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO student_submissions
        (user_id, user_name, user_college, type, title, subject, year, url, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
       RETURNING *`,
      [
        user.id,
        user.displayName || user.email,
        user.college || null,
        type,
        safeTitle,
        safeSubject,
        safeYear,
        url,
        safeDesc,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("submissions create error:", err);
    res.status(500).json({ error: "Failed to submit. Please try again." });
  }
});

router.patch("/:id/approve", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM student_submissions WHERE id = $1`,
      [id]
    );
    if (!rows.length) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }
    const sub = rows[0];
    if (sub.status === "approved") {
      res.status(400).json({ error: "Already approved" });
      return;
    }

    const isLink = sub.url.includes("drive.google.com") || sub.url.includes("docs.google.com");

    if (sub.type === "note") {
      await pool.query(
        `INSERT INTO notes (title, subject, content, file_url, file_type, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          sub.title,
          sub.subject,
          sub.description || "",
          sub.url,
          isLink ? "link" : "pdf",
          admin.id,
        ]
      );
    } else if (sub.type === "book") {
      await pool.query(
        `INSERT INTO books (title, subject, author, url, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [sub.title, sub.subject, null, sub.url]
      );
    } else if (sub.type === "pyq") {
      await pool.query(
        `INSERT INTO pyqs (title, subject, year, url, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [sub.title, sub.subject, sub.year || "Unknown", sub.url, admin.id]
      );
    }

    await pool.query(
      `UPDATE student_submissions
       SET status = 'approved', reviewed_by = $1, reviewed_by_name = $2, reviewed_at = NOW()
       WHERE id = $3`,
      [admin.id, admin.displayName || admin.email, id]
    );

    const contributionXp = getContributionXp();
    awardXp(
      sub.user_id,
      contributionXp,
      "contribution_approved",
      `Contribution approved: ${String(sub.title).slice(0, 60)}`
    ).catch(() => {});

    // Email the student
    pool.query(`SELECT email, full_name FROM users WHERE id = $1`, [sub.user_id])
      .then(async ({ rows: userRows }) => {
        const u = userRows[0];
        if (!u?.email) return;
        const appUrl = getAppUrl();
        const safeTitle = String(sub.title).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const html =
          `<h2 style="margin:0 0 8px;font-size:20px;color:#1e1e2e;">🎉 Contribution Approved!</h2>` +
          `<p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">Great news! Your submission <strong>${safeTitle}</strong> has been approved and is now live on Mission Distinction.</p>` +
          `<p style="margin:0 0 16px;font-size:15px;color:#4b5563;">You've earned <strong>+${contributionXp} XP</strong> for your contribution. Keep sharing knowledge!</p>` +
          `<div style="text-align:center;margin:24px 0;"><a href="${appUrl}/mission-distinction/scholar-hub" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">View Scholar Hub</a></div>`;
        const text = `Your submission "${sub.title}" has been approved on Mission Distinction! You earned +${contributionXp} XP.`;
        await sendEmail(u.email, "Your contribution was approved! 🎉", html, text);
      })
      .catch(() => {});

    res.json({ success: true, xpAwarded: contributionXp });
  } catch (err) {
    console.error("submissions approve error:", err);
    res.status(500).json({ error: "Failed to approve submission" });
  }
});

router.patch("/:id/reject", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { id } = req.params;
    const { reason } = req.body;

    const { rows } = await pool.query(
      `SELECT id FROM student_submissions WHERE id = $1`,
      [id]
    );
    if (!rows.length) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const { rows: subRows } = await pool.query(`SELECT user_id, title FROM student_submissions WHERE id = $1`, [id]);
    await pool.query(
      `UPDATE student_submissions
       SET status = 'rejected', reviewed_by = $1, reviewed_by_name = $2,
           rejection_reason = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [admin.id, admin.displayName || admin.email, reason || null, id]
    );

    // Email the student
    if (subRows[0]) {
      const sub2 = subRows[0];
      pool.query(`SELECT email, full_name FROM users WHERE id = $1`, [sub2.user_id])
        .then(async ({ rows: userRows }) => {
          const u = userRows[0];
          if (!u?.email) return;
          const safeTitle = String(sub2.title).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const safeReason = reason ? String(reason).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
          const appUrl = getAppUrl();
          const html =
            `<h2 style="margin:0 0 8px;font-size:20px;color:#1e1e2e;">Submission Needs Revision</h2>` +
            `<p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">Your submission <strong>${safeTitle}</strong> was not approved at this time.</p>` +
            (safeReason ? `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:0 0 16px;"><p style="margin:0;font-size:14px;color:#92400e;"><strong>Feedback:</strong> ${safeReason}</p></div>` : "") +
            `<p style="margin:0 0 16px;font-size:15px;color:#4b5563;">You can revise and resubmit. Every contribution helps the community!</p>` +
            `<div style="text-align:center;margin:24px 0;"><a href="${appUrl}/mission-distinction/scholar-hub" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Go to Scholar Hub</a></div>`;
          const text = `Your submission "${sub2.title}" was not approved. ${reason ? `Reason: ${reason}` : ""} You can revise and resubmit on Mission Distinction.`;
          await sendEmail(u.email, "Update on your Mission Distinction submission", html, text);
        })
        .catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    console.error("submissions reject error:", err);
    res.status(500).json({ error: "Failed to reject submission" });
  }
});

export { router as submissionsRouter };
