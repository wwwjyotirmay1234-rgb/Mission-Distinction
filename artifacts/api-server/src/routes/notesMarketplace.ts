import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { studentNoteSubmissionsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { awardXp, getContributionXp } from "../lib/xp";
import multer from "multer";
import rateLimit from "express-rate-limit";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only PDF and image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

const router = Router();

const submitLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Maximum 5 submissions per day." },
});

async function uploadFileToCloudinary(buffer: Buffer, mimeType: string, resourceType: "raw" | "image"): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "mission-distinction/student-notes",
        resource_type: resourceType,
        quality: resourceType === "image" ? "auto" : undefined,
        fetch_format: resourceType === "image" ? "auto" : undefined,
      },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Upload failed"));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ─── GET /marketplace/notes — list all approved submissions ──────────────────
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject } = req.query;

    const rows = await db
      .select({
        id: studentNoteSubmissionsTable.id,
        title: studentNoteSubmissionsTable.title,
        subject: studentNoteSubmissionsTable.subject,
        description: studentNoteSubmissionsTable.description,
        fileUrl: studentNoteSubmissionsTable.fileUrl,
        fileType: studentNoteSubmissionsTable.fileType,
        createdAt: studentNoteSubmissionsTable.createdAt,
        uploaderName: usersTable.fullName,
      })
      .from(studentNoteSubmissionsTable)
      .innerJoin(usersTable, eq(studentNoteSubmissionsTable.userId, usersTable.id))
      .where(
        subject
          ? and(
              eq(studentNoteSubmissionsTable.status, "approved"),
              eq(studentNoteSubmissionsTable.subject, String(subject))
            )
          : eq(studentNoteSubmissionsTable.status, "approved")
      )
      .orderBy(desc(studentNoteSubmissionsTable.createdAt))
      .limit(200);

    res.json({ notes: rows });
  } catch (err) {
    console.error("marketplace notes list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /marketplace/notes/my-submissions — student's own submissions ───────
router.get("/my-submissions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select()
      .from(studentNoteSubmissionsTable)
      .where(eq(studentNoteSubmissionsTable.userId, user.id))
      .orderBy(desc(studentNoteSubmissionsTable.createdAt))
      .limit(50);
    res.json({ submissions: rows });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /marketplace/notes/submit — student uploads a note ─────────────────
router.post("/submit", authMiddleware, submitLimiter, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;

    if (!file) { res.status(400).json({ error: "file is required" }); return; }

    const { title, subject, description } = req.body;
    if (!title?.trim() || !subject?.trim()) {
      res.status(400).json({ error: "title and subject are required" });
      return;
    }

    // Check pending limit — no more than 3 pending at once
    const pending = await db
      .select({ id: studentNoteSubmissionsTable.id })
      .from(studentNoteSubmissionsTable)
      .where(and(
        eq(studentNoteSubmissionsTable.userId, user.id),
        eq(studentNoteSubmissionsTable.status, "pending")
      ))
      .limit(4);

    if (pending.length >= 3) {
      res.status(429).json({ error: "You have 3 pending submissions already. Wait for them to be reviewed." });
      return;
    }

    const isPdf = file.mimetype === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";
    const fileUrl = await uploadFileToCloudinary(file.buffer, file.mimetype, resourceType);

    const [saved] = await db.insert(studentNoteSubmissionsTable).values({
      userId: user.id,
      title: String(title).slice(0, 200),
      subject: String(subject).slice(0, 100),
      description: description ? String(description).slice(0, 500) : null,
      fileUrl,
      fileType: isPdf ? "pdf" : "image",
    }).returning();

    res.status(201).json({ submission: saved, message: "Your notes have been submitted for review. You'll earn XP when approved!" });
  } catch (err: any) {
    console.error("marketplace submit error:", err);
    if (err.message?.includes("Only PDF")) {
      res.status(400).json({ error: "Only PDF and image files are allowed" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: GET /marketplace/notes/pending ───────────────────────────────────
router.get("/pending", authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: studentNoteSubmissionsTable.id,
        title: studentNoteSubmissionsTable.title,
        subject: studentNoteSubmissionsTable.subject,
        description: studentNoteSubmissionsTable.description,
        fileUrl: studentNoteSubmissionsTable.fileUrl,
        fileType: studentNoteSubmissionsTable.fileType,
        status: studentNoteSubmissionsTable.status,
        createdAt: studentNoteSubmissionsTable.createdAt,
        uploaderName: usersTable.fullName,
        uploaderEmail: usersTable.email,
        uploaderId: usersTable.id,
      })
      .from(studentNoteSubmissionsTable)
      .innerJoin(usersTable, eq(studentNoteSubmissionsTable.userId, usersTable.id))
      .where(eq(studentNoteSubmissionsTable.status, "pending"))
      .orderBy(studentNoteSubmissionsTable.createdAt)
      .limit(200);
    res.json({ submissions: rows });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: POST /marketplace/notes/:id/approve ──────────────────────────────
router.post("/:id/approve", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [submission] = await db
      .select()
      .from(studentNoteSubmissionsTable)
      .where(eq(studentNoteSubmissionsTable.id, id))
      .limit(1);

    if (!submission) { res.status(404).json({ error: "Submission not found" }); return; }
    if (submission.status !== "pending") { res.status(400).json({ error: "Submission is not pending" }); return; }

    const [updated] = await db
      .update(studentNoteSubmissionsTable)
      .set({
        status: "approved",
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        adminNote: req.body.adminNote ?? null,
        xpAwarded: false,
      })
      .where(eq(studentNoteSubmissionsTable.id, id))
      .returning();

    // Award XP to the uploader
    const xp = getContributionXp();
    awardXp(
      submission.userId,
      xp,
      "marketplace_note_approved",
      `Your notes "${submission.title}" were approved in the marketplace!`
    ).catch(() => {});

    // Mark XP as awarded
    await db
      .update(studentNoteSubmissionsTable)
      .set({ xpAwarded: true })
      .where(eq(studentNoteSubmissionsTable.id, id));

    res.json({ submission: updated, xpAwarded: xp });
  } catch (err) {
    console.error("marketplace approve error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: POST /marketplace/notes/:id/reject ───────────────────────────────
router.post("/:id/reject", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { adminNote } = req.body;

    const [updated] = await db
      .update(studentNoteSubmissionsTable)
      .set({
        status: "rejected",
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        adminNote: adminNote ? String(adminNote).slice(0, 300) : null,
      })
      .where(and(
        eq(studentNoteSubmissionsTable.id, id),
        eq(studentNoteSubmissionsTable.status, "pending")
      ))
      .returning();

    if (!updated) { res.status(404).json({ error: "Submission not found or not pending" }); return; }
    res.json({ submission: updated });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as notesMarketplaceRouter };
