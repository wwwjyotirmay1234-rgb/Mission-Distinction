import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";

const router = Router();

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { category, subject, message, rating } = req.body;
    if (!subject || !message) {
      res.status(400).json({ error: "Subject and message are required" });
      return;
    }
    if (subject.trim().length < 3) {
      res.status(400).json({ error: "Subject too short" });
      return;
    }
    if (message.trim().length < 10) {
      res.status(400).json({ error: "Message too short (min 10 chars)" });
      return;
    }
    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      res.status(400).json({ error: "Rating must be 1–5" });
      return;
    }
    const safeSubject = stripHtml(subject.trim());
    const safeMessage = stripHtml(message.trim());
    if (!safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    if (!safeMessage) { res.status(400).json({ error: "Invalid message" }); return; }
    const [item] = await db.insert(feedbackTable).values({
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      category: stripHtml(String(category || "general")),
      subject: safeSubject,
      message: safeMessage,
      rating: rating ?? null,
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const items = await db.select().from(feedbackTable).orderBy(desc(feedbackTable.createdAt));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/status", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { status } = req.body;
    if (!["new", "read", "resolved"].includes(status)) {
      res.status(400).json({ error: "Invalid status" }); return;
    }
    const [item] = await db.update(feedbackTable).set({ status }).where(eq(feedbackTable.id, id)).returning();
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(feedbackTable).where(eq(feedbackTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
