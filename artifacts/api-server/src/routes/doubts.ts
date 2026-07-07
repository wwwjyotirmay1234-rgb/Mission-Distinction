import { Router, Request, Response } from "express";
import { db, pool } from "@workspace/db";
import { doubtsTable, doubtAnswersTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import rateLimit from "express-rate-limit";
import { awardXp, XP_VALUES } from "../lib/xp";
import { openai } from "@workspace/integrations-openai-ai-server";

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
    awardXp(user.id, XP_VALUES.DOUBT_ASKED, "doubt_asked", `Asked a doubt: ${safeTitle.slice(0, 60)}`).catch(() => {});

    // Fire-and-forget AI auto-answer — clearly labelled, never blocks the response
    generateAiAnswer(doubt.id, safeTitle, safeQuestion, stripHtml(String(subject))).catch(() => {});

    res.status(201).json(doubt);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── AI auto-answer helper (fire-and-forget) ──────────────────────────────────
async function generateAiAnswer(doubtId: number, title: string, question: string, subject: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable MBBS medical tutor helping 1st-year to final-year students in India. Provide a clear, accurate, and concise answer to the student's medical question. Use standard Indian medical textbook knowledge (Gray's, Guyton, Harper's, Robbins, etc.). Format with markdown where helpful (bold key terms, bullet lists for steps/mechanisms). End with a note: "Always cross-verify with your textbook and batch seniors."`,
        },
        {
          role: "user",
          content: `Subject: ${subject}\nQuestion: ${title}\n\n${question}`,
        },
      ],
    });
    const aiText = completion.choices[0]?.message?.content;
    if (!aiText) return;

    await db.insert(doubtAnswersTable).values({
      doubtId,
      userId: 0,
      authorName: "Mission AI",
      answer: aiText.slice(0, 10000),
      isAiGenerated: true,
    });

    await db.update(doubtsTable)
      .set({ answerCount: sql`${doubtsTable.answerCount} + 1` })
      .where(eq(doubtsTable.id, doubtId));
  } catch (err) {
    console.error("[AI auto-answer] error:", err);
  }
}

// ─── Get doubt with answers ───────────────────────────────────────────────────
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid doubt ID" }); return; }
    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id));
    if (!doubt) { res.status(404).json({ error: "Not found" }); return; }
    const answers = await db
      .select()
      .from(doubtAnswersTable)
      .where(eq(doubtAnswersTable.doubtId, id))
      .orderBy(
        desc(doubtAnswersTable.isAiGenerated),
        desc(doubtAnswersTable.isAccepted),
        desc(doubtAnswersTable.helpfulCount),
        desc(doubtAnswersTable.createdAt)
      )
      .limit(100);

    // Check which answers current user has voted helpful on
    const answerIds = answers.map(a => a.id);
    let myVotedIds = new Set<number>();
    if (answerIds.length > 0) {
      const { rows: voteRows } = await pool.query(
        `SELECT answer_id FROM doubt_answer_votes WHERE user_id = $1 AND answer_id = ANY($2)`,
        [user.id, answerIds]
      );
      myVotedIds = new Set(voteRows.map((r: any) => r.answer_id));
    }

    const answersWithVotes = answers.map(a => ({ ...a, myVote: myVotedIds.has(a.id) }));
    res.json({ ...doubt, answers: answersWithVotes });
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
    awardXp(user.id, XP_VALUES.DOUBT_ANSWERED, "doubt_answered", "Answered a doubt").catch(() => {});
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

// ─── Toggle helpful vote on an answer ────────────────────────────────────────
router.post("/:id/answers/:aid/helpful", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const answerId = parseId(req.params.aid);
    if (!answerId) { res.status(400).json({ error: "Invalid answer ID" }); return; }

    const { rowCount } = await pool.query(
      `INSERT INTO doubt_answer_votes (user_id, answer_id) VALUES ($1, $2) ON CONFLICT (user_id, answer_id) DO NOTHING`,
      [user.id, answerId]
    );

    if ((rowCount ?? 0) > 0) {
      await pool.query(`UPDATE doubt_answers SET helpful_count = helpful_count + 1 WHERE id = $1`, [answerId]);
      const { rows } = await pool.query(`SELECT helpful_count FROM doubt_answers WHERE id = $1`, [answerId]);
      res.json({ voted: true, helpfulCount: rows[0]?.helpful_count ?? 1 });
    } else {
      await pool.query(`DELETE FROM doubt_answer_votes WHERE user_id = $1 AND answer_id = $2`, [user.id, answerId]);
      await pool.query(`UPDATE doubt_answers SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = $1`, [answerId]);
      const { rows } = await pool.query(`SELECT helpful_count FROM doubt_answers WHERE id = $1`, [answerId]);
      res.json({ voted: false, helpfulCount: rows[0]?.helpful_count ?? 0 });
    }
  } catch (err) {
    console.error("helpful vote error:", err);
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
