import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { activityTable, usersTable, quizAttemptsTable, confessionsTable, doubtsTable, studyRoomsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { adminMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const [activities, recentQuizzes, recentConfessions, recentDoubts, recentRooms, newUsers] = await Promise.all([
      db.select({
        id: activityTable.id,
        userId: activityTable.userId,
        type: activityTable.type,
        description: activityTable.description,
        score: activityTable.score,
        createdAt: activityTable.createdAt,
      }).from(activityTable).orderBy(desc(activityTable.createdAt)).limit(30),

      db.select({
        id: quizAttemptsTable.id,
        userId: quizAttemptsTable.userId,
        score: quizAttemptsTable.score,
        total: quizAttemptsTable.total,
        percentage: quizAttemptsTable.percentage,
        createdAt: quizAttemptsTable.createdAt,
      }).from(quizAttemptsTable).orderBy(desc(quizAttemptsTable.createdAt)).limit(10),

      db.select({
        id: confessionsTable.id,
        createdAt: confessionsTable.createdAt,
      }).from(confessionsTable).orderBy(desc(confessionsTable.createdAt)).limit(5),

      db.select({
        id: doubtsTable.id,
        subject: doubtsTable.subject,
        title: doubtsTable.title,
        createdAt: doubtsTable.createdAt,
      }).from(doubtsTable).orderBy(desc(doubtsTable.createdAt)).limit(5),

      db.select({
        id: studyRoomsTable.id,
        name: studyRoomsTable.name,
        subject: studyRoomsTable.subject,
        createdAt: studyRoomsTable.createdAt,
      }).from(studyRoomsTable).orderBy(desc(studyRoomsTable.createdAt)).limit(5),

      db.select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        createdAt: usersTable.createdAt,
      }).from(usersTable).orderBy(desc(usersTable.createdAt)).limit(10),
    ]);

    const events: { id: string; type: string; label: string; meta: string; time: Date }[] = [];

    for (const a of activities) {
      events.push({ id: `act-${a.id}`, type: a.type === "quiz" ? "quiz" : "activity", label: a.description, meta: a.score ? `Score: ${a.score}` : "", time: a.createdAt });
    }
    for (const u of newUsers) {
      events.push({ id: `usr-${u.id}`, type: "register", label: `${u.fullName} joined the platform`, meta: "New student", time: u.createdAt });
    }
    for (const d of recentDoubts) {
      events.push({ id: `dbt-${d.id}`, type: "doubt", label: `New doubt: "${d.title}"`, meta: d.subject, time: d.createdAt });
    }
    for (const r of recentRooms) {
      events.push({ id: `rm-${r.id}`, type: "study_room", label: `Study room created: "${r.name}"`, meta: r.subject, time: r.createdAt });
    }
    for (const c of recentConfessions) {
      events.push({ id: `conf-${c.id}`, type: "confession", label: "Anonymous confession posted", meta: "", time: c.createdAt });
    }

    events.sort((a, b) => b.time.getTime() - a.time.getTime());

    const [totalStats] = await db.select({
      totalUsers: sql<number>`COUNT(DISTINCT ${usersTable.id})`,
      todayUsers: sql<number>`COUNT(DISTINCT CASE WHEN ${usersTable.createdAt} >= NOW() - INTERVAL '1 day' THEN ${usersTable.id} END)`,
    }).from(usersTable);

    const [quizStats] = await db.select({
      todayAttempts: sql<number>`COUNT(CASE WHEN ${quizAttemptsTable.createdAt} >= NOW() - INTERVAL '1 day' THEN 1 END)`,
    }).from(quizAttemptsTable);

    res.json({
      events: events.slice(0, 50),
      stats: {
        totalUsers: Number(totalStats?.totalUsers ?? 0),
        todayRegistrations: Number(totalStats?.todayUsers ?? 0),
        todayQuizAttempts: Number(quizStats?.todayAttempts ?? 0),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch activity feed" });
  }
});

export { router as activityFeedRouter };
