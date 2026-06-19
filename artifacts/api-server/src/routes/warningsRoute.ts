import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { studentWarningsTable, usersTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { logAudit } from "../lib/auditLog";

const router = Router();

// Student: get my warnings (unread)
router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const warnings = await db.select().from(studentWarningsTable)
      .where(eq(studentWarningsTable.userId, userId))
      .orderBy(desc(studentWarningsTable.createdAt));
    res.json(warnings);
  } catch { res.status(500).json({ error: "Failed to load warnings" }); }
});

// Student: mark warning as seen
router.patch("/:id/seen", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const id = parseId(req.params.id);
    await db.update(studentWarningsTable)
      .set({ seenAt: new Date() })
      .where(eq(studentWarningsTable.id, id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to mark seen" }); }
});

// Admin: issue warning
router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { userId, reason, severity } = req.body;
    if (!userId || !reason?.trim()) { res.status(400).json({ error: "userId and reason required" }); return; }
    const validSeverities = new Set(["warning", "strike", "final"]);
    const sev = validSeverities.has(severity) ? severity : "warning";

    const [warning] = await db.insert(studentWarningsTable).values({
      userId: parseId(userId),
      issuedBy: admin.id,
      issuedByName: admin.name,
      reason: reason.trim().slice(0, 500),
      severity: sev,
    }).returning();

    await logAudit(admin.id, admin.name, "issued_warning", "user", parseId(userId), { severity: sev, reason: reason.trim().slice(0, 100) });
    res.json(warning);
  } catch { res.status(500).json({ error: "Failed to issue warning" }); }
});

// Admin: list warnings for user
router.get("/user/:userId", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId(req.params.userId);
    const warnings = await db.select().from(studentWarningsTable)
      .where(eq(studentWarningsTable.userId, userId))
      .orderBy(desc(studentWarningsTable.createdAt));
    res.json(warnings);
  } catch { res.status(500).json({ error: "Failed to load warnings" }); }
});

// Admin: all users with warning counts
router.get("/summary", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const summary = await db.select({
      userId: studentWarningsTable.userId,
      userName: usersTable.fullName,
      userEmail: usersTable.email,
      total: sql<number>`COUNT(*)`,
      unseen: sql<number>`COUNT(CASE WHEN ${studentWarningsTable.seenAt} IS NULL THEN 1 END)`,
      lastWarning: sql<Date>`MAX(${studentWarningsTable.createdAt})`,
    })
    .from(studentWarningsTable)
    .leftJoin(usersTable, eq(studentWarningsTable.userId, usersTable.id))
    .groupBy(studentWarningsTable.userId, usersTable.fullName, usersTable.email)
    .orderBy(desc(sql`MAX(${studentWarningsTable.createdAt})`))
    .limit(100);
    res.json(summary);
  } catch { res.status(500).json({ error: "Failed to load summary" }); }
});

export { router as warningsRouter };
