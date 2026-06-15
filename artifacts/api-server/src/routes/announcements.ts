import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { sendPushToAll } from "./push";

const VALID_TYPES = new Set(["event", "news", "alert", "general"]);

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const announcements = type
      ? await db.select().from(announcementsTable)
          .where(eq(announcementsTable.type, type as string))
          .orderBy(desc(announcementsTable.createdAt))
      : await db.select().from(announcementsTable)
          .orderBy(desc(announcementsTable.createdAt));
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, type } = req.body;
    if (!title || !content || !type) { res.status(400).json({ error: "Missing fields" }); return; }
    if (!VALID_TYPES.has(type)) {
      res.status(400).json({ error: `type must be one of: ${[...VALID_TYPES].join(", ")}` }); return;
    }
    const safeTitle = stripHtml(String(title));
    const safeContent = stripHtml(String(content));
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (!safeContent) { res.status(400).json({ error: "Invalid content" }); return; }
    if (safeTitle.length > 300) { res.status(400).json({ error: "Title must be under 300 characters" }); return; }
    if (safeContent.length > 10000) { res.status(400).json({ error: "Content must be under 10000 characters" }); return; }
    const [announcement] = await db.insert(announcementsTable).values({ title: safeTitle, content: safeContent, type }).returning();
    sendPushToAll(`📢 ${safeTitle}`, safeContent.substring(0, 120), "/student/announcements").catch(() => {});
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
