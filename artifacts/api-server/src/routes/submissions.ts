import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { awardXp, getContributionXp } from "../lib/xp";

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

    await pool.query(
      `UPDATE student_submissions
       SET status = 'rejected', reviewed_by = $1, reviewed_by_name = $2,
           rejection_reason = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [admin.id, admin.displayName || admin.email, reason || null, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("submissions reject error:", err);
    res.status(500).json({ error: "Failed to reject submission" });
  }
});

export { router as submissionsRouter };
