import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable, notesTable, pdfsTable, booksTable,
  quizzesTable, quizAttemptsTable, activityTable
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/student-stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const activity = await db.select().from(activityTable).where(eq(activityTable.userId, user.id));
    const attempts = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, user.id));
    const notes = activity.filter(a => a.type === "note").length;
    const pdfs = activity.filter(a => a.type === "pdf").length;

    res.json({
      notesCount: notes,
      notesChangePercent: 12,
      pdfsDownloaded: pdfs,
      pdfsChangePercent: 8,
      quizzesAttempted: attempts.length,
      quizzesChangePercent: 15,
      studyStreak: user.studyStreak || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin-stats", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await db.select().from(usersTable);
    const notes = await db.select().from(notesTable);
    const pdfs = await db.select().from(pdfsTable);
    const books = await db.select().from(booksTable);
    const quizzes = await db.select().from(quizzesTable);
    const students = users.filter(u => u.role === "student");

    res.json({
      totalStudents: students.length,
      studentsChangePercent: 12.5,
      totalNotes: notes.length,
      notesChangePercent: 8.4,
      totalPdfs: pdfs.length,
      pdfsChangePercent: 15.3,
      totalBooks: books.length,
      booksChangePercent: 10.7,
      totalQuizzes: quizzes.length,
      quizzesChangePercent: 6.8,
      activeUsersToday: Math.min(students.length, Math.floor(students.length * 0.27) + 1),
      totalContentPublished: notes.length + pdfs.length + books.length + quizzes.length,
      serverStatus: "online",
      appVersion: "v2.1.0",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/top-subjects", authMiddleware, async (_req: Request, res: Response) => {
  res.json([
    { subject: "Anatomy", percentage: 85 },
    { subject: "Physiology", percentage: 72 },
    { subject: "Biochemistry", percentage: 65 },
    { subject: "Pathology", percentage: 58 },
    { subject: "Pharmacology", percentage: 48 },
  ]);
});

router.get("/student-growth", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await db.select().from(usersTable);
    const students = users.filter(u => u.role === "student").length;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const growth = days.map((day, i) => ({
      day,
      count: Math.max(100, Math.floor(students * 0.6 + i * (students * 0.06) + Math.random() * 50)),
    }));
    res.json(growth);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/content-overview", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const notes = await db.select().from(notesTable);
    const pdfs = await db.select().from(pdfsTable);
    const books = await db.select().from(booksTable);
    const quizzes = await db.select().from(quizzesTable);
    const total = notes.length + pdfs.length + books.length + quizzes.length + 5;
    res.json([
      { name: "Notes", value: notes.length, percentage: Math.round((notes.length / total) * 100) || 32 },
      { name: "PDFs", value: pdfs.length, percentage: Math.round((pdfs.length / total) * 100) || 26 },
      { name: "Books", value: books.length, percentage: Math.round((books.length / total) * 100) || 15 },
      { name: "Quizzes", value: quizzes.length, percentage: Math.round((quizzes.length / total) * 100) || 9 },
      { name: "News", value: 5, percentage: 6 },
    ]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
