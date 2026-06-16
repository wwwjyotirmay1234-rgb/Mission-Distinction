import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { doubtsTable, doubtAnswersTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import rateLimit from "express-rate-limit";

const router = Router();

const doubtPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many questions posted. Please wait before posting again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const answerPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many answers posted. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── List doubts ─────────────────────────────────────────────────────────────
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject } = req.query;
    const doubts =
      subject && subject !== "All"
        ? await db
            .select()
            .from(doubtsTable)
            .where(eq(doubtsTable.subject, subject as string))
            .orderBy(desc(doubtsTable.createdAt))
            .limit(500)
        : await db.select().from(doubtsTable).orderBy(desc(doubtsTable.createdAt)).limit(500);
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Create doubt ─────────────────────────────────────────────────────────────
router.post("/", authMiddleware, doubtPostLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subject, title, question } = req.body;
    if (!subject || !title || !question) {
      res.status(400).json({ error: "subject, title, and question are required" });
      return;
    }
    const safeTitle = stripHtml(String(title));
    const safeQuestion = stripHtml(String(question));
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (!safeQuestion) { res.status(400).json({ error: "Invalid question" }); return; }
    if (safeTitle.length > 200) {
      res.status(400).json({ error: "Title must be under 200 characters" });
      return;
    }
    if (safeQuestion.length > 5000) {
      res.status(400).json({ error: "Question must be under 5000 characters" });
      return;
    }
    const [doubt] = await db.insert(doubtsTable).values({
      userId: user.id,
      authorName: user.fullName,
      subject: stripHtml(String(subject)),
      title: safeTitle,
      question: safeQuestion,
    }).returning();
    res.status(201).json(doubt);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Get doubt with answers ───────────────────────────────────────────────────
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid doubt ID" }); return; }
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id));
    if (!doubt) { res.status(404).json({ error: "Not found" }); return; }
    const answers = await db
      .select()
      .from(doubtAnswersTable)
      .where(eq(doubtAnswersTable.doubtId, id))
      .orderBy(desc(doubtAnswersTable.isAccepted), desc(doubtAnswersTable.createdAt));
    res.json({ ...doubt, answers });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Post answer ──────────────────────────────────────────────────────────────
router.post("/:id/answers", authMiddleware, answerPostLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const doubtId = parseId(req.params.id);
    if (!doubtId) { res.status(400).json({ error: "Invalid doubt ID" }); return; }
    const { answer } = req.body;
    if (!answer?.trim()) { res.status(400).json({ error: "answer is required" }); return; }
    const safeAnswer = stripHtml(String(answer));
    if (!safeAnswer) { res.status(400).json({ error: "Invalid answer content" }); return; }
    if (safeAnswer.length > 10000) { res.status(400).json({ error: "Answer must be under 10000 characters" }); return; }

    const result = await db.transaction(async (tx) => {
      const [doubt] = await tx.select().from(doubtsTable).where(eq(doubtsTable.id, doubtId));
      if (!doubt) return null;
      const [newAnswer] = await tx.insert(doubtAnswersTable).values({
        doubtId,
        userId: user.id,
        authorName: user.fullName,
        answer: safeAnswer,
      }).returning();
      await tx.update(doubtsTable)
        .set({ answerCount: sql`${doubtsTable.answerCount} + 1` })
        .where(eq(doubtsTable.id, doubtId));
      return newAnswer;
    });

    if (!result) { res.status(404).json({ error: "Doubt not found" }); return; }
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Accept answer ────────────────────────────────────────────────────────────
router.patch("/:id/answers/:aid/accept", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const doubtId = parseId(req.params.id);
    const answerId = parseId(req.params.aid);
    if (!doubtId || !answerId) { res.status(400).json({ error: "Invalid ID" }); return; }

    await db.transaction(async (tx) => {
      const [doubt] = await tx.select().from(doubtsTable).where(eq(doubtsTable.id, doubtId));
      if (!doubt) throw Object.assign(new Error("Not found"), { status: 404 });
      if (doubt.userId !== user.id) throw Object.assign(new Error("Only the question author can accept answers"), { status: 403 });

      const [answerRow] = await tx.select().from(doubtAnswersTable)
        .where(and(eq(doubtAnswersTable.id, answerId), eq(doubtAnswersTable.doubtId, doubtId)));
      if (!answerRow) throw Object.assign(new Error("Answer not found for this doubt"), { status: 404 });

      await tx.update(doubtAnswersTable).set({ isAccepted: false }).where(eq(doubtAnswersTable.doubtId, doubtId));
      await tx.update(doubtAnswersTable).set({ isAccepted: true }).where(eq(doubtAnswersTable.id, answerId));
      await tx.update(doubtsTable).set({ resolved: true }).where(eq(doubtsTable.id, doubtId));
    });

    res.json({ message: "Answer accepted" });
  } catch (err: any) {
    if (err.status === 403) { res.status(403).json({ error: err.message }); return; }
    if (err.status === 404) { res.status(404).json({ error: err.message }); return; }
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Delete doubt (own only or admin) ────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid doubt ID" }); return; }
    await db.transaction(async (tx) => {
      const [doubt] = await tx.select().from(doubtsTable).where(eq(doubtsTable.id, id));
      if (!doubt) throw Object.assign(new Error("Not found"), { status: 404 });
      if (doubt.userId !== user.id && user.role !== "admin") throw Object.assign(new Error("Forbidden"), { status: 403 });
      await tx.delete(doubtAnswersTable).where(eq(doubtAnswersTable.doubtId, id));
      await tx.delete(doubtsTable).where(eq(doubtsTable.id, id));
    });
    res.status(204).send();
  } catch (err: any) {
    if (err.status === 403) { res.status(403).json({ error: err.message }); return; }
    if (err.status === 404) { res.status(404).json({ error: err.message }); return; }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
