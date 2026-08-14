import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { videosTable, videoConceptsTable, videoQuestionsTable, videoProgressTable } from "@workspace/db";
import { eq, and, desc, or, isNull } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { awardXp } from "../lib/xp";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

// ─── Student routes ──────────────────────────────────────────────────────────

// GET /api/videos — list published videos with my progress
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const subject = Array.isArray(req.query.subject)
      ? String(req.query.subject[0] ?? "")
      : String(req.query.subject ?? "");

    // Students see published videos for their batch + shared; fail closed when sessionYear unknown
    const isAdmin = user?.role === "admin";
    const batchFilter = isAdmin
      ? eq(videosTable.isPublished, true)
      : user?.sessionYear
        ? and(eq(videosTable.isPublished, true), or(isNull(videosTable.sessionYear), eq(videosTable.sessionYear, user.sessionYear)))
        : and(eq(videosTable.isPublished, true), isNull(videosTable.sessionYear));

    const videos = await db
      .select()
      .from(videosTable)
      .where(batchFilter)
      .orderBy(desc(videosTable.createdAt));

    const filtered = subject && subject !== "all"
      ? videos.filter(v => v.subject === subject)
      : videos;

    // Fetch my progress for all videos
    const progressRows = await db
      .select()
      .from(videoProgressTable)
      .where(eq(videoProgressTable.userId, user.id));
    const progressMap = Object.fromEntries(progressRows.map(p => [p.videoId, p]));

    const result = filtered.map(v => ({
      ...v,
      myProgress: progressMap[v.id] ?? null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/videos/:id — video detail with concepts + questions (correct answers hidden)
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const isAdmin = user?.role === "admin";
    const batchCond = isAdmin
      ? and(eq(videosTable.id, id), eq(videosTable.isPublished, true))
      : user?.sessionYear
        ? and(eq(videosTable.id, id), eq(videosTable.isPublished, true), or(isNull(videosTable.sessionYear), eq(videosTable.sessionYear, user.sessionYear)))
        : and(eq(videosTable.id, id), eq(videosTable.isPublished, true), isNull(videosTable.sessionYear));
    const [video] = await db.select().from(videosTable).where(batchCond);
    if (!video) { res.status(404).json({ error: "Video not found" }); return; }

    const concepts = await db
      .select()
      .from(videoConceptsTable)
      .where(eq(videoConceptsTable.videoId, id))
      .orderBy(videoConceptsTable.sortOrder);

    const questions = await db
      .select()
      .from(videoQuestionsTable)
      .where(eq(videoQuestionsTable.videoId, id))
      .orderBy(videoQuestionsTable.sortOrder);

    const [progress] = await db
      .select()
      .from(videoProgressTable)
      .where(and(eq(videoProgressTable.userId, user.id), eq(videoProgressTable.videoId, id)));

    // Hide correct answers unless student has completed the video
    const safeQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      sortOrder: q.sortOrder,
      // Only reveal correct answer if already quiz-submitted
      correctOption: progress?.quizTotal != null ? q.correctOption : undefined,
      explanation: progress?.quizTotal != null ? q.explanation : undefined,
    }));

    res.json({ ...video, concepts, questions: safeQuestions, myProgress: progress ?? null });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/videos/:id/progress — update watch progress, auto-mark completed at 80%
router.post("/:id/progress", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    // Verify student can access this video (batch isolation)
    if (user?.role !== "admin") {
      const accessCond = user?.sessionYear
        ? and(eq(videosTable.id, id), eq(videosTable.isPublished, true), or(isNull(videosTable.sessionYear), eq(videosTable.sessionYear, user.sessionYear)))
        : and(eq(videosTable.id, id), eq(videosTable.isPublished, true), isNull(videosTable.sessionYear));
      const [accessible] = await db.select({ id: videosTable.id }).from(videosTable).where(accessCond);
      if (!accessible) { res.status(404).json({ error: "Video not found" }); return; }
    }

    const { watchedPercent } = req.body;
    const pct = Math.min(100, Math.max(0, parseInt(String(watchedPercent ?? 0))));
    const completed = pct >= 80;

    const [existing] = await db
      .select()
      .from(videoProgressTable)
      .where(and(eq(videoProgressTable.userId, user.id), eq(videoProgressTable.videoId, id)));

    if (existing) {
      // Only update if progress improved
      if (pct > existing.watchedPercent || (completed && !existing.completed)) {
        await db.update(videoProgressTable)
          .set({ watchedPercent: pct, completed, updatedAt: new Date() })
          .where(eq(videoProgressTable.id, existing.id));
      }
      res.json({ completed, watchedPercent: Math.max(pct, existing.watchedPercent) });
    } else {
      await db.insert(videoProgressTable).values({
        userId: user.id,
        videoId: id,
        watchedPercent: pct,
        completed,
      });
      res.json({ completed, watchedPercent: pct });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/videos/:id/quiz — submit quiz answers
router.post("/:id/quiz", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { answers } = req.body; // { [questionId]: selectedOption }
    if (!answers || typeof answers !== "object") {
      res.status(400).json({ error: "answers object required" }); return;
    }

    // Verify student can access this video (batch isolation)
    if (user?.role !== "admin") {
      const accessCond = user?.sessionYear
        ? and(eq(videosTable.id, id), eq(videosTable.isPublished, true), or(isNull(videosTable.sessionYear), eq(videosTable.sessionYear, user.sessionYear)))
        : and(eq(videosTable.id, id), eq(videosTable.isPublished, true), isNull(videosTable.sessionYear));
      const [accessible] = await db.select({ id: videosTable.id }).from(videosTable).where(accessCond);
      if (!accessible) { res.status(404).json({ error: "Video not found" }); return; }
    }

    // Verify video is completed
    const [progress] = await db
      .select()
      .from(videoProgressTable)
      .where(and(eq(videoProgressTable.userId, user.id), eq(videoProgressTable.videoId, id)));

    if (!progress?.completed) {
      res.status(403).json({ error: "Watch at least 80% of the video before taking the quiz." });
      return;
    }

    if (progress.quizTotal != null) {
      res.json({ alreadySubmitted: true, score: progress.quizScore, total: progress.quizTotal });
      return;
    }

    const questions = await db
      .select()
      .from(videoQuestionsTable)
      .where(eq(videoQuestionsTable.videoId, id));

    let score = 0;
    const results = questions.map(q => {
      const selected = answers[q.id];
      const correct = selected === q.correctOption;
      if (correct) score++;
      return { questionId: q.id, correct, correctOption: q.correctOption, explanation: q.explanation };
    });

    await db.update(videoProgressTable)
      .set({ quizScore: score, quizTotal: questions.length, xpAwarded: true, updatedAt: new Date() })
      .where(eq(videoProgressTable.id, progress.id));

    // XP: 20 base + 5 per correct answer
    if (!progress.xpAwarded) {
      const xp = 20 + score * 5;
      awardXp(user.id, xp, "video_quiz", `Completed video quiz (${score}/${questions.length})`).catch(() => {});
    }

    res.json({ score, total: questions.length, results });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /api/videos/admin/list
router.get("/admin/list", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const videos = await db.select().from(videosTable).orderBy(desc(videosTable.createdAt));
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/videos/admin — create video
router.post("/admin", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, subject, description, sessionYear } = req.body;
    if (!title?.trim() || !subject?.trim()) {
      res.status(400).json({ error: "title and subject are required" }); return;
    }
    const [video] = await db.insert(videosTable).values({
      title: String(title).trim(),
      subject: String(subject).trim(),
      description: description ? String(description).trim() : null,
      sessionYear: sessionYear || null,
    }).returning();
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/videos/admin/:id — update video metadata
router.put("/admin/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { title, subject, description, videoUrl, cloudinaryPublicId, thumbnailUrl, durationSeconds, isPublished, sessionYear } = req.body;
    const [updated] = await db.update(videosTable).set({
      ...(title != null && { title: String(title).trim() }),
      ...(subject != null && { subject: String(subject).trim() }),
      ...(description !== undefined && { description: description ? String(description) : null }),
      ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
      ...(cloudinaryPublicId !== undefined && { cloudinaryPublicId: cloudinaryPublicId || null }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || null }),
      ...(durationSeconds !== undefined && { durationSeconds: durationSeconds ? Number(durationSeconds) : null }),
      ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      ...(sessionYear !== undefined && { sessionYear: sessionYear || null }),
    }).where(eq(videosTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Video not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/videos/admin/:id
router.delete("/admin/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(videoConceptsTable).where(eq(videoConceptsTable.videoId, id));
    await db.delete(videoQuestionsTable).where(eq(videoQuestionsTable.videoId, id));
    await db.delete(videoProgressTable).where(eq(videoProgressTable.videoId, id));
    await db.delete(videosTable).where(eq(videosTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/videos/admin/upload-sign — Cloudinary signed upload for videos
router.post("/admin/upload-sign", adminMiddleware, (_req: Request, res: Response) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "mission-distinction/videos";
    const paramsToSign = { folder, timestamp: String(timestamp) };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET ?? ""
    );
    res.json({
      signature,
      timestamp,
      folder,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not generate upload signature" });
  }
});

// PUT /api/videos/admin/:id/concepts — replace all concepts for a video
router.put("/admin/:id/concepts", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { concepts } = req.body; // [{ heading, content, sortOrder }]
    if (!Array.isArray(concepts)) { res.status(400).json({ error: "concepts array required" }); return; }

    await db.delete(videoConceptsTable).where(eq(videoConceptsTable.videoId, id));
    if (concepts.length > 0) {
      await db.insert(videoConceptsTable).values(
        concepts.map((c, i) => ({
          videoId: id,
          heading: String(c.heading ?? "").trim(),
          content: String(c.content ?? "").trim(),
          sortOrder: i,
        }))
      );
    }
    const saved = await db.select().from(videoConceptsTable).where(eq(videoConceptsTable.videoId, id)).orderBy(videoConceptsTable.sortOrder);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/videos/admin/:id/questions — replace all questions for a video
router.put("/admin/:id/questions", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { questions } = req.body; // [{ text, options, correctOption, explanation }]
    if (!Array.isArray(questions)) { res.status(400).json({ error: "questions array required" }); return; }

    await db.delete(videoQuestionsTable).where(eq(videoQuestionsTable.videoId, id));
    if (questions.length > 0) {
      await db.insert(videoQuestionsTable).values(
        questions.map((q, i) => ({
          videoId: id,
          text: String(q.text ?? "").trim(),
          options: Array.isArray(q.options) ? q.options.map(String) : [],
          correctOption: parseInt(String(q.correctOption ?? 0)),
          explanation: q.explanation ? String(q.explanation) : null,
          sortOrder: i,
        }))
      );
    }
    const saved = await db.select().from(videoQuestionsTable).where(eq(videoQuestionsTable.videoId, id)).orderBy(videoQuestionsTable.sortOrder);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/videos/admin/:id/detail — full detail including concepts + questions (with correct answers)
router.get("/admin/:id/detail", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id));
    if (!video) { res.status(404).json({ error: "Not found" }); return; }
    const concepts = await db.select().from(videoConceptsTable).where(eq(videoConceptsTable.videoId, id)).orderBy(videoConceptsTable.sortOrder);
    const questions = await db.select().from(videoQuestionsTable).where(eq(videoQuestionsTable.videoId, id)).orderBy(videoQuestionsTable.sortOrder);
    res.json({ ...video, concepts, questions });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/videos/admin/bulk-duplicate — clone all videos from one batch to another
router.post("/admin/bulk-duplicate", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { fromBatch, toBatch } = req.body;
    if (!fromBatch || !toBatch) { res.status(400).json({ error: "fromBatch and toBatch are required" }); return; }
    const fromYear = fromBatch === "shared" ? null : String(fromBatch);
    const toYear   = toBatch   === "shared" ? null : String(toBatch);
    if (fromYear === toYear) { res.status(400).json({ error: "Source and target batch must be different" }); return; }

    const sources = await db.select().from(videosTable)
      .where(fromYear ? eq(videosTable.sessionYear, fromYear) : isNull(videosTable.sessionYear));

    const existingInTarget = await db
      .select({ title: videosTable.title, subject: videosTable.subject })
      .from(videosTable)
      .where(toYear ? eq(videosTable.sessionYear, toYear) : isNull(videosTable.sessionYear));
    const existingKeys = new Set(existingInTarget.map(e => `${e.subject}|||${e.title}`));

    let copied = 0, skipped = 0;
    for (const source of sources) {
      if (existingKeys.has(`${source.subject}|||${source.title}`)) { skipped++; continue; }
      // Transaction ensures no orphaned video if child inserts fail
      await db.transaction(async (tx) => {
        const [newVideo] = await tx.insert(videosTable).values({
          title: source.title, subject: source.subject, description: source.description,
          videoUrl: source.videoUrl, cloudinaryPublicId: source.cloudinaryPublicId,
          thumbnailUrl: source.thumbnailUrl, durationSeconds: source.durationSeconds,
          isPublished: false, sessionYear: toYear,
        }).returning();
        const concepts = await tx.select().from(videoConceptsTable)
          .where(eq(videoConceptsTable.videoId, source.id)).orderBy(videoConceptsTable.sortOrder);
        if (concepts.length > 0) {
          await tx.insert(videoConceptsTable).values(
            concepts.map(c => ({ videoId: newVideo.id, heading: c.heading, content: c.content, sortOrder: c.sortOrder }))
          );
        }
        const questions = await tx.select().from(videoQuestionsTable)
          .where(eq(videoQuestionsTable.videoId, source.id)).orderBy(videoQuestionsTable.sortOrder);
        if (questions.length > 0) {
          await tx.insert(videoQuestionsTable).values(
            questions.map(q => ({
              videoId: newVideo.id, text: q.text, options: q.options,
              correctOption: q.correctOption, explanation: q.explanation, sortOrder: q.sortOrder,
            }))
          );
        }
      });
      copied++;
    }
    res.json({ copied, skipped, total: sources.length });
  } catch (err) {
    console.error("bulk duplicate videos error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/videos/admin/:id/duplicate — clone video with concepts + questions
router.post("/admin/:id/duplicate", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { sessionYear } = req.body;
    const safeSessionYear = sessionYear === "shared" ? null : (sessionYear || null);

    const [source] = await db.select().from(videosTable).where(eq(videosTable.id, id));
    if (!source) { res.status(404).json({ error: "Not found" }); return; }

    const [newVideo] = await db.insert(videosTable).values({
      title: `${source.title} (Copy)`,
      subject: source.subject,
      description: source.description,
      videoUrl: source.videoUrl,
      cloudinaryPublicId: source.cloudinaryPublicId,
      thumbnailUrl: source.thumbnailUrl,
      durationSeconds: source.durationSeconds,
      isPublished: false,
      sessionYear: safeSessionYear,
    }).returning();

    const concepts = await db.select().from(videoConceptsTable)
      .where(eq(videoConceptsTable.videoId, id)).orderBy(videoConceptsTable.sortOrder);
    if (concepts.length > 0) {
      await db.insert(videoConceptsTable).values(
        concepts.map(c => ({ videoId: newVideo.id, heading: c.heading, content: c.content, sortOrder: c.sortOrder }))
      );
    }

    const questions = await db.select().from(videoQuestionsTable)
      .where(eq(videoQuestionsTable.videoId, id)).orderBy(videoQuestionsTable.sortOrder);
    if (questions.length > 0) {
      await db.insert(videoQuestionsTable).values(
        questions.map(q => ({
          videoId: newVideo.id, text: q.text, options: q.options,
          correctOption: q.correctOption, explanation: q.explanation, sortOrder: q.sortOrder,
        }))
      );
    }

    res.status(201).json({ ...newVideo, conceptCount: concepts.length, questionCount: questions.length });
  } catch (err) {
    console.error("duplicate video error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as videosRouter };
