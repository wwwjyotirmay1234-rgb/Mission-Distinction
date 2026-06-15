import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { communityPostsTable, communityGroupsTable, communityMessagesTable } from "@workspace/db";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/posts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { group, search } = req.query;
    let posts = await db.select().from(communityPostsTable);
    if (group) posts = posts.filter(p => p.groupName.toLowerCase().includes((group as string).toLowerCase()));
    if (search) posts = posts.filter(p => p.title.toLowerCase().includes((search as string).toLowerCase()) || p.content.toLowerCase().includes((search as string).toLowerCase()));
    res.json(posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/posts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, content, groupName } = req.body;
    if (!title || !content || !groupName) { res.status(400).json({ error: "Missing fields" }); return; }
    const safeTitle = stripHtml(title);
    const safeContent = stripHtml(content);
    if (!safeTitle || !safeContent) { res.status(400).json({ error: "Invalid content" }); return; }
    if (safeTitle.length > 200) { res.status(400).json({ error: "Title must be under 200 characters" }); return; }
    if (safeContent.length > 5000) { res.status(400).json({ error: "Content must be under 5000 characters" }); return; }
    const [post] = await db.insert(communityPostsTable).values({
      title: safeTitle,
      content: safeContent,
      groupName: stripHtml(groupName),
      author: user.fullName,
      authorAvatarUrl: user.avatarUrl || null,
    }).returning();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groups", authMiddleware, async (req: Request, res: Response) => {
  try {
    const groups = await db.select().from(communityGroupsTable);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/messages/:groupId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const messages = await db
      .select()
      .from(communityMessagesTable)
      .where(eq(communityMessagesTable.groupId, groupId))
      .orderBy(desc(communityMessagesTable.createdAt))
      .limit(100);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/messages/:groupId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "Message content required" }); return; }
    const safeContent = stripHtml(content);
    if (!safeContent) { res.status(400).json({ error: "Invalid content" }); return; }
    if (safeContent.length > 2000) { res.status(400).json({ error: "Message must be under 2000 characters" }); return; }
    const [message] = await db.insert(communityMessagesTable).values({
      groupId,
      senderName: user.fullName,
      senderAvatarUrl: user.avatarUrl || null,
      content: safeContent,
    }).returning();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
