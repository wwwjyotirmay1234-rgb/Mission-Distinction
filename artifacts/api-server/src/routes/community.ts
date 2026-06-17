import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { communityPostsTable, communityGroupsTable, communityMessagesTable, groupMembersTable, usersTable } from "@workspace/db";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { getIO } from "../lib/socket-server";
import rateLimit from "express-rate-limit";

const router = Router();

const postCreateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { error: "Too many posts. Try again later." }, standardHeaders: true, legacyHeaders: false });
const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: "Sending too fast. Slow down." }, standardHeaders: true, legacyHeaders: false });
const groupCreateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: "Too many groups created. Wait before making another." }, standardHeaders: true, legacyHeaders: false });

async function isMember(groupId: number, userId: number): Promise<boolean> {
  const rows = await db.select({ id: groupMembersTable.id })
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)));
  return rows.length > 0;
}

async function isOwner(groupId: number, userId: number): Promise<boolean> {
  const rows = await db.select({ role: groupMembersTable.role })
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)));
  return rows.length > 0 && rows[0].role === "owner";
}

// ─── Posts ────────────────────────────────────────────────────────────────────

router.get("/posts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { group, search } = req.query;
    let posts = await db.select().from(communityPostsTable).orderBy(desc(communityPostsTable.createdAt)).limit(500);
    if (group) posts = posts.filter(p => p.groupName.toLowerCase().includes((group as string).toLowerCase()));
    if (search) posts = posts.filter(p => p.title.toLowerCase().includes((search as string).toLowerCase()) || p.content.toLowerCase().includes((search as string).toLowerCase()));
    res.json(posts);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/posts", authMiddleware, postCreateLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, content, groupName } = req.body;
    if (!title || !content || !groupName) { res.status(400).json({ error: "Missing fields" }); return; }
    const safeTitle = stripHtml(title);
    const safeContent = stripHtml(content);
    if (!safeTitle || !safeContent) { res.status(400).json({ error: "Invalid content" }); return; }
    if (safeTitle.length > 200) { res.status(400).json({ error: "Title too long" }); return; }
    if (safeContent.length > 5000) { res.status(400).json({ error: "Content too long" }); return; }
    const groups = await db.select({ id: communityGroupsTable.id, name: communityGroupsTable.name, isAdminCreated: communityGroupsTable.isAdminCreated }).from(communityGroupsTable);
    const validGroup = groups.find(g => g.name === groupName);
    if (!validGroup) { res.status(400).json({ error: "Invalid group" }); return; }
    if (!validGroup.isAdminCreated && !(await isMember(validGroup.id, user.id))) {
      res.status(403).json({ error: "You must be a member of this group to post" }); return;
    }
    const [post] = await db.insert(communityPostsTable).values({ title: safeTitle, content: safeContent, groupName: validGroup.name, author: user.fullName, authorId: user.id, authorAvatarUrl: user.avatarUrl || null }).returning();
    res.status(201).json(post);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Groups ───────────────────────────────────────────────────────────────────

router.get("/groups", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const allGroups = await db.select().from(communityGroupsTable).orderBy(desc(communityGroupsTable.createdAt));
    const memberships = await db.select({ groupId: groupMembersTable.groupId, role: groupMembersTable.role })
      .from(groupMembersTable).where(eq(groupMembersTable.userId, user.id));
    const memberGroupIds = new Set(memberships.map(m => m.groupId));

    const visible = allGroups
      .filter(g => g.isAdminCreated || memberGroupIds.has(g.id))
      .map(g => ({
        ...g,
        isMember: g.isAdminCreated ? true : memberGroupIds.has(g.id),
        memberRole: memberships.find(m => m.groupId === g.id)?.role ?? null,
      }));

    res.json(visible);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/groups", authMiddleware, groupCreateLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, subject, description } = req.body;
    if (!name?.trim() || !subject?.trim()) { res.status(400).json({ error: "Group name and subject are required" }); return; }
    const safeName = stripHtml(name.trim());
    const safeSubject = stripHtml(subject.trim());
    const safeDesc = description ? stripHtml(description.trim()) : null;
    if (!safeName || !safeSubject) { res.status(400).json({ error: "Invalid content" }); return; }
    if (safeName.length > 80) { res.status(400).json({ error: "Group name too long" }); return; }
    const existing = await db.select({ id: communityGroupsTable.id }).from(communityGroupsTable).where(eq(communityGroupsTable.name, safeName));
    if (existing.length > 0) { res.status(409).json({ error: "A group with that name already exists" }); return; }
    const [group] = await db.insert(communityGroupsTable).values({ name: safeName, subject: safeSubject, description: safeDesc, createdBy: user.id, isAdminCreated: user.role === "admin", memberCount: 1 }).returning();
    await db.insert(groupMembersTable).values({ groupId: group.id, userId: user.id, role: "owner" });
    res.status(201).json(group);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Members ──────────────────────────────────────────────────────────────────

router.get("/groups/:groupId/members", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const [group] = await db.select().from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }
    if (!group.isAdminCreated && !(await isMember(groupId, user.id))) {
      res.status(403).json({ error: "Not a member of this group" }); return;
    }
    const members = await db
      .select({ id: usersTable.id, fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl, role: groupMembersTable.role, joinedAt: groupMembersTable.joinedAt })
      .from(groupMembersTable)
      .innerJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
      .where(eq(groupMembersTable.groupId, groupId))
      .orderBy(groupMembersTable.joinedAt);
    res.json(members);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/groups/:groupId/invite", authMiddleware, async (req: Request, res: Response) => {
  try {
    const inviter = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const [group] = await db.select().from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }
    if (!(await isOwner(groupId, inviter.id)) && inviter.role !== "admin") {
      res.status(403).json({ error: "Only the group owner can invite members" }); return;
    }
    const { userId } = req.body;
    const targetId = typeof userId === "number" ? userId : parseInt(userId);
    if (!targetId || isNaN(targetId)) { res.status(400).json({ error: "Invalid userId" }); return; }
    const [target] = await db.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, targetId));
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (await isMember(groupId, targetId)) { res.status(409).json({ error: `${target.fullName} is already in this group` }); return; }
    await db.insert(groupMembersTable).values({ groupId, userId: targetId, role: "member" });
    await db.update(communityGroupsTable).set({ memberCount: group.memberCount + 1 }).where(eq(communityGroupsTable.id, groupId));
    res.status(201).json({ message: `${target.fullName} added to the group` });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/groups/:groupId/members/:userId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const groupId = parseId(req.params.groupId);
    const targetId = parseId(req.params.userId);
    if (!groupId || !targetId) { res.status(400).json({ error: "Invalid IDs" }); return; }
    if (requester.id !== targetId && !(await isOwner(groupId, requester.id)) && requester.role !== "admin") {
      res.status(403).json({ error: "Not authorised" }); return;
    }
    if (await isOwner(groupId, targetId) && requester.role !== "admin") {
      res.status(400).json({ error: "The group owner cannot leave. Transfer ownership or delete the group." }); return;
    }
    await db.delete(groupMembersTable).where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, targetId)));
    const [group] = await db.select({ memberCount: communityGroupsTable.memberCount }).from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (group) await db.update(communityGroupsTable).set({ memberCount: Math.max(0, group.memberCount - 1) }).where(eq(communityGroupsTable.id, groupId));
    res.json({ message: "Removed from group" });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get("/messages/:groupId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const [group] = await db.select({ isAdminCreated: communityGroupsTable.isAdminCreated }).from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }
    if (!group.isAdminCreated && !(await isMember(groupId, user.id))) {
      res.status(403).json({ error: "Join this group to view messages" }); return;
    }
    const messages = await db.select().from(communityMessagesTable).where(eq(communityMessagesTable.groupId, groupId)).orderBy(desc(communityMessagesTable.createdAt)).limit(100);
    res.json(messages.reverse());
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/messages/:groupId", authMiddleware, messageLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const [group] = await db.select().from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }
    if (!group.isAdminCreated && !(await isMember(groupId, user.id))) {
      res.status(403).json({ error: "Join this group to send messages" }); return;
    }
    const { content, fileUrl, fileType, fileName } = req.body;
    if (!content?.trim() && !fileUrl) { res.status(400).json({ error: "Message content or file required" }); return; }
    const safeContent = content ? stripHtml(content) : "";
    if (safeContent.length > 2000) { res.status(400).json({ error: "Message too long" }); return; }
    if (fileUrl) {
      try { new URL(fileUrl); } catch { res.status(400).json({ error: "Invalid file URL" }); return; }
      if (!fileUrl.startsWith("https://res.cloudinary.com/")) { res.status(400).json({ error: "Invalid file URL" }); return; }
    }
    const [message] = await db.insert(communityMessagesTable).values({ groupId, senderId: user.id, senderName: user.fullName, senderAvatarUrl: user.avatarUrl || null, content: safeContent, fileUrl: fileUrl || null, fileType: fileType || null, fileName: fileName || null }).returning();
    await db.update(communityGroupsTable).set({ lastMessage: safeContent || (fileType === "image" ? "📷 Photo" : fileType === "pdf" ? "📄 PDF" : "📎 File"), lastMessageTime: new Date() }).where(eq(communityGroupsTable.id, groupId));
    try { getIO().to(`chat:${groupId}`).emit("new-message", message); } catch { }
    res.status(201).json(message);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

export default router;
