import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { sendPushToAll } from "./push";
import { getCache, setCache, invalidateCache } from "../lib/cache";

const VALID_TYPES = new Set(["event", "news", "alert", "general", "announcement"]);
const CACHE_PREFIX = "announcements:";
const CACHE_TTL_MS = 2 * 60 * 1000;

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const cacheKey = `${CACHE_PREFIX}${type || "all"}`;

    const cached = getCache<unknown[]>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(cached);
      return;
    }

    const announcements = type
      ? await db.select().from(announcementsTable)
          .where(eq(announcementsTable.type, type as string))
          .orderBy(desc(announcementsTable.createdAt))
          .limit(200)
      : await db.select().from(announcementsTable)
          .orderBy(desc(announcementsTable.createdAt))
          .limit(200);

    setCache(cacheKey, announcements, CACHE_TTL_MS);
    res.setHeader("X-Cache", "MISS");
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const VALID_ATTACHMENT_TYPES = new Set(["image", "video", "pdf"]);

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, type, attachmentUrl, attachmentName, attachmentType } = req.body;
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

    let safeAttachmentUrl: string | null = null;
    let safeAttachmentName: string | null = null;
    let safeAttachmentType: string | null = null;
    if (attachmentUrl) {
      if (typeof attachmentUrl !== "string" || !/^https?:\/\//.test(attachmentUrl)) {
        res.status(400).json({ error: "Invalid attachment URL" }); return;
      }
      if (!attachmentType || !VALID_ATTACHMENT_TYPES.has(String(attachmentType))) {
        res.status(400).json({ error: "Invalid attachment type" }); return;
      }
      safeAttachmentUrl = attachmentUrl;
      safeAttachmentType = String(attachmentType);
      safeAttachmentName = attachmentName ? stripHtml(String(attachmentName)).slice(0, 200) : null;
    }

    const [announcement] = await db.insert(announcementsTable).values({
      title: safeTitle,
      content: safeContent,
      type,
      attachmentUrl: safeAttachmentUrl,
      attachmentName: safeAttachmentName,
      attachmentType: safeAttachmentType,
    }).returning();
    invalidateCache(CACHE_PREFIX);
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
    invalidateCache(CACHE_PREFIX);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
