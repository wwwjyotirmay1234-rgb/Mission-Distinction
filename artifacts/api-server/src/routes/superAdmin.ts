import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable, quizAttemptsTable, activityTable, bookmarksTable,
  feedbackTable, emailTokensTable, refreshTokensTable,
  communityGroupsTable, communityMessagesTable, groupMembersTable,
} from "@workspace/db";
import { eq, desc, sql, count, inArray } from "drizzle-orm";
import { superAdminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";

const router = Router();

// ─── All Users ────────────────────────────────────────────────────────────────
router.get("/users", superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        mobileNumber: usersTable.mobileNumber,
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
      .limit(500);
    res.json(users);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── User Activity ─────────────────────────────────────────────────────────────
router.get("/users/:id/activity", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }

    const [user] = await db
      .select({
        id: usersTable.id, fullName: usersTable.fullName, email: usersTable.email,
        role: usersTable.role, isSuperAdmin: usersTable.isSuperAdmin,
        year: usersTable.year, college: usersTable.college,
        studyStreak: usersTable.studyStreak, bannedAt: usersTable.bannedAt,
        banReason: usersTable.banReason, createdAt: usersTable.createdAt,
      })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const [quizStats] = await db
      .select({ attempts: sql<number>`COUNT(*)`, avgScore: sql<number>`ROUND(AVG(${quizAttemptsTable.percentage}))` })
      .from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, userId));

    const recentActivity = await db
      .select().from(activityTable)
      .where(eq(activityTable.userId, userId))
      .orderBy(desc(activityTable.createdAt)).limit(20);

    res.json({
      user,
      quizStats: { attempts: Number(quizStats?.attempts ?? 0), avgScore: Number(quizStats?.avgScore ?? 0) },
      recentActivity,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Promote to Admin ─────────────────────────────────────────────────────────
router.post("/users/:id/promote-admin", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).user;
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    if (userId === caller.id) { res.status(400).json({ error: "Cannot change your own role" }); return; }

    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.isSuperAdmin) { res.status(403).json({ error: "Cannot change another super admin's role" }); return; }
    if (target.role === "admin") { res.status(409).json({ error: `${target.fullName} is already an admin` }); return; }

    await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, userId));
    res.json({ message: `${target.fullName} has been promoted to admin` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Demote to Student ────────────────────────────────────────────────────────
router.post("/users/:id/demote-admin", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).user;
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    if (userId === caller.id) { res.status(400).json({ error: "Cannot change your own role" }); return; }

    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.isSuperAdmin) { res.status(403).json({ error: "Cannot demote another super admin" }); return; }
    if (target.role !== "admin") { res.status(409).json({ error: `${target.fullName} is not an admin` }); return; }

    await db.update(usersTable).set({ role: "student", isSuperAdmin: false }).where(eq(usersTable.id, userId));

    // Invalidate all sessions since role changed
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, userId));

    res.json({ message: `${target.fullName} has been demoted to student and their sessions have been cleared` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Force Logout ─────────────────────────────────────────────────────────────
router.post("/users/:id/force-logout", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).user;
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    if (userId === caller.id) { res.status(400).json({ error: "Cannot force-logout yourself" }); return; }

    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.isSuperAdmin) { res.status(403).json({ error: "Cannot force-logout another super admin" }); return; }

    const result = await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, userId)).returning();
    res.json({ message: `${target.fullName} has been logged out (${result.length} session${result.length !== 1 ? "s" : ""} cleared)` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Ban / Unban ──────────────────────────────────────────────────────────────
router.post("/users/:id/ban", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).user;
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    if (userId === caller.id) { res.status(400).json({ error: "You cannot ban yourself" }); return; }

    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.isSuperAdmin) { res.status(403).json({ error: "Cannot ban another super admin" }); return; }

    const safeReason = req.body.reason?.trim() ? stripHtml(String(req.body.reason.trim())) : "Violation of platform rules";
    await db.update(usersTable).set({ bannedAt: new Date(), banReason: safeReason }).where(eq(usersTable.id, userId));
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, userId));
    res.json({ message: `${target.fullName} has been suspended` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/unban", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    await db.update(usersTable).set({ bannedAt: null, banReason: null }).where(eq(usersTable.id, userId));
    res.json({ message: `${target.fullName}'s account has been restored` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Delete User ──────────────────────────────────────────────────────────────
router.delete("/users/:id", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).user;
    const userId = parseId(req.params.id);
    if (!userId) { res.status(400).json({ error: "Invalid user ID" }); return; }
    if (userId === caller.id) { res.status(400).json({ error: "You cannot delete your own account" }); return; }

    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.isSuperAdmin) { res.status(403).json({ error: "Cannot delete another super admin" }); return; }

    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, userId));
    await db.delete(emailTokensTable).where(eq(emailTokensTable.userId, userId));
    await db.delete(feedbackTable).where(eq(feedbackTable.userId, userId));
    await db.delete(bookmarksTable).where(eq(bookmarksTable.userId, userId));
    await db.delete(activityTable).where(eq(activityTable.userId, userId));
    await db.delete(quizAttemptsTable).where(eq(quizAttemptsTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ message: `${target.fullName}'s account has been permanently deleted` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Community: All Groups ────────────────────────────────────────────────────
// Note: this intentionally exposes group names and member rosters only —
// never chat content (message text/files) — to respect student privacy.
router.get("/community", superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const groups = await db
      .select({
        id: communityGroupsTable.id,
        name: communityGroupsTable.name,
        subject: communityGroupsTable.subject,
        description: communityGroupsTable.description,
        createdBy: communityGroupsTable.createdBy,
        isAdminCreated: communityGroupsTable.isAdminCreated,
        createdAt: communityGroupsTable.createdAt,
      })
      .from(communityGroupsTable)
      .orderBy(desc(communityGroupsTable.createdAt));

    const members = await db
      .select({
        groupId: groupMembersTable.groupId,
        userId: groupMembersTable.userId,
        role: groupMembersTable.role,
        fullName: usersTable.fullName,
      })
      .from(groupMembersTable)
      .leftJoin(usersTable, eq(usersTable.id, groupMembersTable.userId));

    const membersByGroup = new Map<number, Array<{ userId: number; fullName: string; role: string }>>();
    for (const m of members) {
      const list = membersByGroup.get(m.groupId) ?? [];
      list.push({ userId: m.userId, fullName: m.fullName ?? "Unknown", role: m.role });
      membersByGroup.set(m.groupId, list);
    }

    const creatorIds = [...new Set(groups.map(g => g.createdBy).filter(Boolean))] as number[];
    let creatorMap = new Map<number, string>();
    if (creatorIds.length > 0) {
      const creators = await db.select({ id: usersTable.id, fullName: usersTable.fullName })
        .from(usersTable).where(inArray(usersTable.id, creatorIds));
      creators.forEach(c => creatorMap.set(c.id, c.fullName));
    }

    res.json(groups.map(g => {
      const groupMembers = membersByGroup.get(g.id) ?? [];
      return {
        ...g,
        memberCount: groupMembers.length,
        members: groupMembers,
        creatorName: g.createdBy ? (creatorMap.get(g.createdBy) ?? "Unknown") : "System",
      };
    }));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Community: Delete Any Group ──────────────────────────────────────────────
router.delete("/community/:groupId", superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }

    const [group] = await db.select().from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    await db.delete(communityMessagesTable).where(eq(communityMessagesTable.groupId, groupId));
    await db.delete(groupMembersTable).where(eq(groupMembersTable.groupId, groupId));
    await db.delete(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    res.json({ message: `Group "${group.name}" deleted` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Platform Settings ────────────────────────────────────────────────────────
router.get("/settings", superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const [totalUsers] = await db.select({ cnt: count() }).from(usersTable);
    const [totalGroups] = await db.select({ cnt: count() }).from(communityGroupsTable);
    const [activeSessions] = await db.select({ cnt: count() }).from(refreshTokensTable);
    const [bannedUsers] = await db.select({ cnt: count() }).from(usersTable).where(sql`${usersTable.bannedAt} IS NOT NULL`);

    res.json({
      stats: {
        totalUsers: Number(totalUsers?.cnt ?? 0),
        totalGroups: Number(totalGroups?.cnt ?? 0),
        activeSessions: Number(activeSessions?.cnt ?? 0),
        bannedUsers: Number(bannedUsers?.cnt ?? 0),
      },
      inviteCodeConfigured: !!process.env.ADMIN_INVITE_CODE,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
