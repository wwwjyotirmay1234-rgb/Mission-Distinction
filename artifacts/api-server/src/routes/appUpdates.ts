import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { appUpdatesTable, usersTable } from "@workspace/db";
import { eq, gt, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { logAudit } from "../lib/auditLog";

const router = Router();

// Student/any logged-in user: get updates published since they last checked
router.get("/unseen", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const since = user.lastSeenAppUpdateAt ?? user.createdAt;
    const updates = await db.select().from(appUpdatesTable)
      .where(gt(appUpdatesTable.createdAt, since))
      .orderBy(appUpdatesTable.createdAt)
      .limit(20);
    res.json(updates);
  } catch { res.status(500).json({ error: "Failed to load updates" }); }
});

// Student/any logged-in user: mark all current updates as seen
router.post("/seen", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.update(usersTable).set({ lastSeenAppUpdateAt: new Date() }).where(eq(usersTable.id, user.id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to mark updates seen" }); }
});

// Admin: list all updates
router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const updates = await db.select().from(appUpdatesTable).orderBy(desc(appUpdatesTable.createdAt)).limit(100);
    res.json(updates);
  } catch { res.status(500).json({ error: "Failed to load updates" }); }
});

// Admin: create update
router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) { res.status(400).json({ error: "title and description required" }); return; }

    const [update] = await db.insert(appUpdatesTable).values({
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 2000),
      createdBy: admin.id,
    }).returning();

    await logAudit(admin.id, admin.name, "created_app_update", "app_update", update.id, { title: update.title });
    res.json(update);
  } catch { res.status(500).json({ error: "Failed to create update" }); }
});

// Admin: delete update
router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(appUpdatesTable).where(eq(appUpdatesTable.id, id));
    await logAudit(admin.id, admin.name, "deleted_app_update", "app_update", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete update" }); }
});

export { router as appUpdatesRouter };
