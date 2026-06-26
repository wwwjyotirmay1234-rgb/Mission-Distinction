import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { pinnedNoticesTable } from "@workspace/db";
import { eq, and, or, gte, isNull, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { logAudit } from "../lib/auditLog";

const router = Router();

// Student: get active notice
router.get("/active", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const [notice] = await db.select().from(pinnedNoticesTable)
      .where(and(
        eq(pinnedNoticesTable.isActive, true),
        or(isNull(pinnedNoticesTable.expiresAt), gte(pinnedNoticesTable.expiresAt, now))
      ))
      .orderBy(desc(pinnedNoticesTable.createdAt))
      .limit(1);
    res.json(notice || null);
  } catch { res.status(500).json({ error: "Failed to load notice" }); }
});

// Admin: list all notices
router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const notices = await db.select().from(pinnedNoticesTable).orderBy(desc(pinnedNoticesTable.createdAt)).limit(50);
    res.json(notices);
  } catch { res.status(500).json({ error: "Failed to load notices" }); }
});

// Admin: create notice
router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { message, type, expiresAt } = req.body;
    if (!message?.trim()) { res.status(400).json({ error: "message required" }); return; }
    const validTypes = new Set(["info", "warning", "success", "alert"]);
    const t = validTypes.has(type) ? type : "info";

    await db.update(pinnedNoticesTable).set({ isActive: false });
    const [notice] = await db.insert(pinnedNoticesTable).values({
      createdBy: admin.id,
      message: message.trim().slice(0, 500),
      type: t,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();

    await logAudit(admin.id, admin.name, "pinned_notice", "notice", notice.id, { type: t });
    res.json(notice);
  } catch { res.status(500).json({ error: "Failed to create notice" }); }
});

// Admin: deactivate notice
router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.update(pinnedNoticesTable).set({ isActive: false }).where(eq(pinnedNoticesTable.id, id));
    await logAudit(admin.id, admin.name, "cleared_notice", "notice", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to clear notice" }); }
});

export { router as noticesRouter };
