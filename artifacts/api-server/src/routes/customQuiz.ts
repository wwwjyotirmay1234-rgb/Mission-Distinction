import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { questionsTable, quizzesTable, quizAttemptsTable, quizAnswersTable } from "@workspace/db";
import { eq, sql, and, inArray } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { awardXp, XP_VALUES } from "../lib/xp";
import { updateStreak } from "../lib/streak";
import rateLimit from "express-rate-limit";

const router = Router();

const buildLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many custom quizzes. Please wait." },
});

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry",
  "Pathology", "Pharmacology", "Microbiology",
  "Forensic Medicine", "Community Medicine", "ENT",
  "Ophthalmology", "General Medicine", "General Surgery",
  "Obstetrics & Gynaecology", "Paediatrics", "Psychiatry",
  "Orthopaedics", "Radiology", "Dermatology",
];

// ─── GET /custom/meta — available subjects + topic tags for the builder ────────
router.get("/custom/meta", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        subject: questionsTable.quizId,
        topicTags: questionsTable.topicTags,
        questionType: questionsTable.questionType,
      })
      .from(questionsTable)
      .limit(5000);

    // Collect subjects from quizzes
    const quizzes = await db.select({ id: quizzesTable.id, subject: quizzesTable.subject }).from(quizzesTable);
    const quizSubjectMap = new Map(quizzes.map(q => [q.id, q.subject]));

    const subjectSet = new Set<string>();
    const tagsBySubject: Record<string, Set<string>> = {};

    for (const row of rows) {
      const subject = quizSubjectMap.get(row.subject) ?? "Unknown";
      subjectSet.add(subject);
      if (!tagsBySubject[subject]) tagsBySubject[subject] = new Set();
      (row.topicTags ?? []).forEach(t => tagsBySubject[subject].add(t));
    }

    const result: Record<string, string[]> = {};
    for (const [subject, tags] of Object.entries(tagsBySubject)) {
      result[subject] = Array.from(tags).sort();
    }

    res.json({ subjects: Array.from(subjectSet).sort(), tagsBySubject: result });
  } catch (err) {
    console.error("custom-quiz meta error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /custom/build — generate a custom quiz session ─────────────────────
router.post("/custom/build", authMiddleware, buildLimiter, async (req: Request, res: Response) => {
  try {
    const { subject, topicTags, questionTypes, difficulty, count } = req.body;

    if (!subject) { res.status(400).json({ error: "subject is required" }); return; }

    const requestedCount = Math.min(Math.max(parseInt(String(count || 10)), 5), 50);

    // Find all quizzes for this subject
    let quizList = await db
      .select({ id: quizzesTable.id })
      .from(quizzesTable)
      .where(sql`LOWER(${quizzesTable.subject}) = LOWER(${subject})`);

    if (quizList.length === 0) {
      res.status(404).json({ error: `No questions found for subject: ${subject}` });
      return;
    }

    const quizIds = quizList.map(q => q.id);

    // Fetch questions from those quizzes
    let allQuestions = await db
      .select()
      .from(questionsTable)
      .where(inArray(questionsTable.quizId, quizIds));

    // Filter by question types (only MCQ/true-false for instant grading)
    const allowedTypes = ["mcq", "true-false", "fill-blank"];
    let filtered = allQuestions.filter(q => allowedTypes.includes(q.questionType));

    // Filter by topic tags if specified
    if (Array.isArray(topicTags) && topicTags.length > 0) {
      const tagSet = new Set(topicTags.map((t: string) => t.toLowerCase()));
      filtered = filtered.filter(q =>
        (q.topicTags ?? []).some(t => tagSet.has(t.toLowerCase()))
      );
    }

    if (filtered.length === 0) {
      res.status(404).json({ error: "No MCQ questions found for the selected filters. Try removing topic filters." });
      return;
    }

    // Shuffle and sample
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, requestedCount);

    // Sanitize questions — strip correct answers from response
    const sanitized = selected.map(q => ({
      id: q.id,
      text: q.text,
      questionType: q.questionType,
      options: q.options,
      explanation: null,
      correctOption: null,
      correctAnswer: null,
    }));

    res.json({
      sessionId: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      subject,
      questionIds: selected.map(q => q.id),
      questions: sanitized,
      totalQuestions: sanitized.length,
    });
  } catch (err) {
    console.error("custom-quiz build error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /custom/submit — score a custom quiz session ────────────────────────
router.post("/custom/submit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subject, questionIds, answers } = req.body;

    if (!Array.isArray(questionIds) || !Array.isArray(answers)) {
      res.status(400).json({ error: "questionIds and answers arrays are required" });
      return;
    }

    if (questionIds.length !== answers.length) {
      res.status(400).json({ error: "questionIds and answers must have the same length" });
      return;
    }

    // Fetch the actual questions to grade
    const questions = await db
      .select()
      .from(questionsTable)
      .where(inArray(questionsTable.id, questionIds));

    const qMap = new Map(questions.map(q => [q.id, q]));

    let score = 0;
    const breakdown: Array<{
      questionId: number;
      text: string;
      correct: boolean;
      studentAnswer: number | null;
      correctOption: number | null;
      correctAnswer: string | null;
      explanation: string | null;
    }> = [];

    for (let i = 0; i < questionIds.length; i++) {
      const q = qMap.get(questionIds[i]);
      if (!q) continue;

      const studentAnswer = answers[i];
      let correct = false;

      if (q.questionType === "mcq" || q.questionType === "true-false") {
        correct = studentAnswer !== null && studentAnswer !== undefined && parseInt(String(studentAnswer)) === q.correctOption;
      } else if (q.questionType === "fill-blank") {
        const normalise = (s: string) => String(s).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        correct = normalise(String(studentAnswer)) === normalise(String(q.correctAnswer ?? ""));
      }

      if (correct) score++;

      breakdown.push({
        questionId: q.id,
        text: q.text,
        correct,
        studentAnswer: studentAnswer ?? null,
        correctOption: q.correctOption ?? null,
        correctAnswer: q.correctAnswer ?? null,
        explanation: q.explanation ?? null,
      });
    }

    const total = questionIds.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // Record as a quiz attempt (quizId=0 marks it as custom)
    await db.insert(quizAttemptsTable).values({
      userId: user.id,
      quizId: 0,
      quizTitle: `Custom Quiz — ${subject}`,
      subject: subject ?? "Custom",
      score,
      total,
      percentage,
      hasPending: false,
    });

    // Award XP
    awardXp(user.id, XP_VALUES.QUIZ_COMPLETE, "custom_quiz_complete", `Completed Custom Quiz: ${subject}`).catch(() => {});
    if (percentage >= 70) {
      awardXp(user.id, Math.round(score * 2), "custom_quiz_correct", `${score}/${total} correct in custom quiz`).catch(() => {});
    }
    updateStreak(user.id).catch(() => {});

    res.json({ score, total, percentage, breakdown });
  } catch (err) {
    console.error("custom-quiz submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as customQuizRouter };
