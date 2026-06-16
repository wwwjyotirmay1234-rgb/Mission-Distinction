import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable, notesTable, pdfsTable, booksTable,
  quizzesTable, quizAttemptsTable, activityTable
} from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router = Router();

function changePercent(thisWeek: number, lastWeek: number): number {
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

router.get("/student-stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const [activity, attempts] = await Promise.all([
      db.select().from(activityTable).where(eq(activityTable.userId, user.id)).limit(500),
      db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, user.id)).limit(500),
    ]);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const notesAll = activity.filter(a => a.type === "note");
    const pdfsAll = activity.filter(a => a.type === "pdf");

    const notesThisWeek = notesAll.filter(a => new Date(a.createdAt) >= weekAgo).length;
    const notesLastWeek = notesAll.filter(a => { const d = new Date(a.createdAt); return d >= twoWeeksAgo && d < weekAgo; }).length;

    const pdfsThisWeek = pdfsAll.filter(a => new Date(a.createdAt) >= weekAgo).length;
    const pdfsLastWeek = pdfsAll.filter(a => { const d = new Date(a.createdAt); return d >= twoWeeksAgo && d < weekAgo; }).length;

    const quizzesThisWeek = attempts.filter(a => new Date(a.id) >= weekAgo).length;
    const quizzesLastWeekCount = attempts.filter(a => { const d = new Date(a.id); return d >= twoWeeksAgo && d < weekAgo; }).length;

    const attemptsThisWeek = attempts.filter(a => {
      const createdAt = (a as any).createdAt;
      return createdAt && new Date(createdAt) >= weekAgo;
    }).length;
    const attemptsLastWeek = attempts.filter(a => {
      const createdAt = (a as any).createdAt;
      if (!createdAt) return false;
      const d = new Date(createdAt);
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;

    res.json({
      notesCount: notesAll.length,
      notesChangePercent: changePercent(notesThisWeek, notesLastWeek),
      pdfsDownloaded: pdfsAll.length,
      pdfsChangePercent: changePercent(pdfsThisWeek, pdfsLastWeek),
      quizzesAttempted: attempts.length,
      quizzesChangePercent: changePercent(attemptsThisWeek, attemptsLastWeek),
      studyStreak: user.studyStreak || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin-stats", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const [users, notes, pdfs, books, quizzes] = await Promise.all([
      db.select({ id: usersTable.id, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable),
      db.select({ id: notesTable.id, createdAt: notesTable.createdAt }).from(notesTable),
      db.select({ id: pdfsTable.id, createdAt: pdfsTable.createdAt }).from(pdfsTable),
      db.select({ id: booksTable.id, createdAt: booksTable.createdAt }).from(booksTable),
      db.select({ id: quizzesTable.id, createdAt: quizzesTable.createdAt }).from(quizzesTable),
    ]);

    const students = users.filter(u => u.role === "student");
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const inWindow = <T extends { createdAt: Date | string }>(arr: T[], from: Date, to: Date) =>
      arr.filter(x => { const d = new Date(x.createdAt); return d >= from && d < to; }).length;

    const studentsThisWeek = inWindow(students, weekAgo, now);
    const studentsLastWeek = inWindow(students, twoWeeksAgo, weekAgo);
    const notesThisWeek = inWindow(notes, weekAgo, now);
    const notesLastWeek = inWindow(notes, twoWeeksAgo, weekAgo);
    const pdfsThisWeek = inWindow(pdfs, weekAgo, now);
    const pdfsLastWeek = inWindow(pdfs, twoWeeksAgo, weekAgo);
    const booksThisWeek = inWindow(books, weekAgo, now);
    const booksLastWeek = inWindow(books, twoWeeksAgo, weekAgo);
    const quizzesThisWeek = inWindow(quizzes, weekAgo, now);
    const quizzesLastWeek = inWindow(quizzes, twoWeeksAgo, weekAgo);

    res.json({
      totalStudents: students.length,
      studentsChangePercent: changePercent(studentsThisWeek, studentsLastWeek),
      totalNotes: notes.length,
      notesChangePercent: changePercent(notesThisWeek, notesLastWeek),
      totalPdfs: pdfs.length,
      pdfsChangePercent: changePercent(pdfsThisWeek, pdfsLastWeek),
      totalBooks: books.length,
      booksChangePercent: changePercent(booksThisWeek, booksLastWeek),
      totalQuizzes: quizzes.length,
      quizzesChangePercent: changePercent(quizzesThisWeek, quizzesLastWeek),
      activeUsersToday: students.filter(u => inWindow([u], new Date(now.getTime() - 24 * 60 * 60 * 1000), now) > 0).length,
      totalContentPublished: notes.length + pdfs.length + books.length + quizzes.length,
      serverStatus: "online",
      appVersion: "v2.1.0",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/top-subjects", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const subjectStats = await db
      .select({
        subject: quizAttemptsTable.subject,
        percentage: sql<number>`ROUND(AVG(${quizAttemptsTable.percentage}))::int`,
      })
      .from(quizAttemptsTable)
      .groupBy(quizAttemptsTable.subject)
      .orderBy(desc(sql`AVG(${quizAttemptsTable.percentage})`))
      .limit(5);

    if (subjectStats.length === 0) {
      res.json([
        { subject: "Anatomy", percentage: 0 },
        { subject: "Physiology", percentage: 0 },
        { subject: "Biochemistry", percentage: 0 },
        { subject: "Pathology", percentage: 0 },
        { subject: "Pharmacology", percentage: 0 },
      ]);
      return;
    }

    res.json(subjectStats.map(s => ({ subject: s.subject, percentage: Number(s.percentage) || 0 })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/student-growth", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const allStudents = await db
      .select({ id: usersTable.id, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.role, "student"));

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const growth = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const count = allStudents.filter(u => {
        const d = new Date(u.createdAt);
        return d >= date && d < nextDate;
      }).length;
      return { day: dayNames[date.getDay()], count };
    });

    res.json(growth);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/content-overview", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const [notes, pdfs, books, quizzes] = await Promise.all([
      db.select({ id: notesTable.id }).from(notesTable),
      db.select({ id: pdfsTable.id }).from(pdfsTable),
      db.select({ id: booksTable.id }).from(booksTable),
      db.select({ id: quizzesTable.id }).from(quizzesTable),
    ]);
    const total = notes.length + pdfs.length + books.length + quizzes.length;
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
    res.json([
      { name: "Notes", value: notes.length, percentage: pct(notes.length) },
      { name: "PDFs", value: pdfs.length, percentage: pct(pdfs.length) },
      { name: "Books", value: books.length, percentage: pct(books.length) },
      { name: "Quizzes", value: quizzes.length, percentage: pct(quizzes.length) },
    ]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
