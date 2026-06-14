import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { doubtsTable, doubtAnswersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// ─── List doubts ─────────────────────────────────────────────────────────────
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject } = req.query;
    let doubts = await db.select().from(doubtsTable);
    if (subject && subject !== "All") {
      doubts = doubts.filter((d) => d.subject === subject);
    }
    res.json(doubts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Create doubt ─────────────────────────────────────────────────────────────
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subject, title, question } = req.body;
    if (!subject || !title || !question) {
      res.status(400).json({ error: "subject, title, and question are required" });
      return;
    }
    const [doubt] = await db.insert(doubtsTable).values({
      userId: user.id,
      authorName: user.fullName,
      subject,
      title,
      question,
    }).returning();
    res.status(201).json(doubt);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Get doubt with answers ───────────────────────────────────────────────────
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id));
    if (!doubt) { res.status(404).json({ error: "Not found" }); return; }
    const answers = await db.select().from(doubtAnswersTable).where(eq(doubtAnswersTable.doubtId, id));
    res.json({ ...doubt, answers: answers.sort((a, b) => (b.isAccepted ? 1 : 0) - (a.isAccepted ? 1 : 0)) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Post answer ──────────────────────────────────────────────────────────────
router.post("/:id/answers", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const doubtId = parseInt(req.params.id);
    const { answer } = req.body;
    if (!answer) { res.status(400).json({ error: "answer is required" }); return; }

    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, doubtId));
    if (!doubt) { res.status(404).json({ error: "Doubt not found" }); return; }

    const [newAnswer] = await db.insert(doubtAnswersTable).values({
      doubtId,
      userId: user.id,
      authorName: user.fullName,
      answer,
    }).returning();

    await db.update(doubtsTable)
      .set({ answerCount: sql`${doubtsTable.answerCount} + 1` })
      .where(eq(doubtsTable.id, doubtId));

    res.status(201).json(newAnswer);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Accept answer ────────────────────────────────────────────────────────────
router.patch("/:id/answers/:aid/accept", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const doubtId = parseInt(req.params.id);
    const answerId = parseInt(req.params.aid);

    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, doubtId));
    if (!doubt || doubt.userId !== user.id) {
      res.status(403).json({ error: "Only the question author can accept answers" });
      return;
    }

    // Unaccept all other answers first
    await db.update(doubtAnswersTable).set({ isAccepted: false }).where(eq(doubtAnswersTable.doubtId, doubtId));
    await db.update(doubtAnswersTable).set({ isAccepted: true }).where(eq(doubtAnswersTable.id, answerId));
    await db.update(doubtsTable).set({ resolved: true }).where(eq(doubtsTable.id, doubtId));

    res.json({ message: "Answer accepted" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Delete doubt (own only) ──────────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id));
    if (!doubt) { res.status(404).json({ error: "Not found" }); return; }
    if (doubt.userId !== user.id && user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    await db.delete(doubtAnswersTable).where(eq(doubtAnswersTable.doubtId, id));
    await db.delete(doubtsTable).where(eq(doubtsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
