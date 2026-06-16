import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable, quizAttemptsTable, activityTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { superAdminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

router.get("/users", superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        role: usersTable.role,
        isSuperAdmin: usersTable.isSuperAdmin,
        year: usersTable.year,
        college: usersTable.college,
        studyStreak: usersTable.studyStreak,
        emailVerified: usersTable.emailVerified,
        bannedAt: usersTable.bannedAt,
        banReason: usersTable.banReason,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(1000);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id/activity", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }

    const [user] = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        role: usersTable.role,
        year: usersTable.year,
        college: usersTable.college,
        studyStreak: usersTable.studyStreak,
        bannedAt: usersTable.bannedAt,
        banReason: usersTable.banReason,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const [quizStats] = await db
      .select({
        attempts: sql<number>`COUNT(*)`,
        avgScore: sql<number>`ROUND(AVG(${quizAttemptsTable.percentage}))`,
      })
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.userId, userId));

    const recentActivity = await db
      .select()
      .from(activityTable)
      .where(eq(activityTable.userId, userId))
      .orderBy(desc(activityTable.createdAt))
      .limit(20);

    res.json({
      user,
      quizStats: {
        attempts: Number(quizStats?.attempts ?? 0),
        avgScore: Number(quizStats?.avgScore ?? 0),
      },
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/ban", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).user;
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    const { reason } = req.body;

    if (userId === caller.id) {
      res.status(400).json({ error: "You cannot ban yourself" });
      return;
    }
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.isSuperAdmin) {
      res.status(403).json({ error: "Cannot ban another super admin" });
      return;
    }

    await db.update(usersTable)
      .set({ bannedAt: new Date(), banReason: reason?.trim() || "Violation of platform rules" })
      .where(eq(usersTable.id, userId));

    res.json({ message: `${target.fullName} has been suspended` });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/unban", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }

    await db.update(usersTable)
      .set({ bannedAt: null, banReason: null })
      .where(eq(usersTable.id, userId));

    res.json({ message: `${target.fullName}'s account has been restored` });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).user;
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    if (userId === caller.id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.isSuperAdmin) {
      res.status(403).json({ error: "Cannot delete another super admin" });
      return;
    }

    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ message: `${target.fullName}'s account has been permanently deleted` });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
