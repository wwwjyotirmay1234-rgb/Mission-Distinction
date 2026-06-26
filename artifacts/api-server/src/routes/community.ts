import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { communityPostsTable, communityGroupsTable, communityMessagesTable, groupMembersTable, groupInvitesTable, usersTable } from "@workspace/db";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { eq, desc, and, count, ne } from "drizzle-orm";
import { getIO } from "../lib/socket-server";
import rateLimit from "express-rate-limit";
import { awardXp, XP_VALUES } from "../lib/xp";

const router = Router();

const postCreateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { error: "Too many posts. Try again later." }, standardHeaders: true, legacyHeaders: false });
const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: "Sending too fast. Slow down." }, standardHeaders: true, legacyHeaders: false });
const groupCreateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: "Too many groups created. Wait before making another." }, standardHeaders: true, legacyHeaders: false });

async function isMember(groupId: number, userId: number): Promise<boolean> {
  const rows = await db.select({ id: groupMembersTable.id }).from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)));
  return rows.length > 0;
}

async function getMemberRole(groupId: number, userId: number): Promise<string | null> {
  const rows = await db.select({ role: groupMembersTable.role }).from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)));
  return rows.length > 0 ? rows[0].role : null;
}

async function isOwner(groupId: number, userId: number): Promise<boolean> {
  return (await getMemberRole(groupId, userId)) === "owner";
}

function parseSeenBy(raw: string | null | undefined): number[] {
  try { return JSON.parse(raw || "[]") as number[]; } catch { return []; }
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
    awardXp(user.id, XP_VALUES.COMMUNITY_POST, "community_post", `Posted in community: ${safeTitle.slice(0, 60)}`).catch(() => {});
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

    const memberCounts = await db
      .select({ groupId: groupMembersTable.groupId, cnt: count() })
      .from(groupMembersTable)
      .groupBy(groupMembersTable.groupId);
    const countMap = new Map(memberCounts.map(r => [r.groupId, r.cnt]));

    const visible = allGroups
      .filter(g => g.isAdminCreated || memberGroupIds.has(g.id))
      .map(g => ({
        ...g,
        memberCount: countMap.get(g.id) ?? 0,
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

router.delete("/groups/:groupId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const [group] = await db.select().from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }
    if (!(await isOwner(groupId, user.id)) && user.role !== "admin") {
      res.status(403).json({ error: "Only the group owner can delete this group" }); return;
    }
    await db.delete(communityMessagesTable).where(eq(communityMessagesTable.groupId, groupId));
    await db.delete(groupMembersTable).where(eq(groupMembersTable.groupId, groupId));
    await db.delete(groupInvitesTable).where(eq(groupInvitesTable.groupId, groupId));
    await db.delete(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    try { getIO().to(`chat:${groupId}`).emit("group-deleted", { groupId }); } catch { }
    res.json({ message: "Group deleted" });
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

// Changed: now creates a pending invite instead of directly adding
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

    // Check if a pending invite already exists
    const existing = await db.select({ id: groupInvitesTable.id }).from(groupInvitesTable)
      .where(and(eq(groupInvitesTable.groupId, groupId), eq(groupInvitesTable.inviteeId, targetId), eq(groupInvitesTable.status, "pending")));
    if (existing.length > 0) { res.status(409).json({ error: `${target.fullName} already has a pending invite` }); return; }

    const [invite] = await db.insert(groupInvitesTable).values({
      groupId, inviterId: inviter.id, inviterName: inviter.fullName, inviteeId: targetId, status: "pending",
    }).returning();

    // Notify the invitee via socket
    try { getIO().to(`user:${targetId}`).emit("new-invite", { invite, groupName: group.name }); } catch { }

    res.status(201).json({ message: `Invite request sent to ${target.fullName}` });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/groups/:groupId/transfer-owner", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }
    const [group] = await db.select().from(communityGroupsTable).where(eq(communityGroupsTable.id, groupId));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }
    if (!(await isOwner(groupId, user.id)) && user.role !== "admin") {
      res.status(403).json({ error: "Only the current owner can transfer ownership" }); return;
    }
    const { userId: newOwnerIdRaw } = req.body;
    const newOwnerId = typeof newOwnerIdRaw === "number" ? newOwnerIdRaw : parseInt(newOwnerIdRaw);
    if (!newOwnerId || isNaN(newOwnerId) || newOwnerId === user.id) {
      res.status(400).json({ error: "Invalid target user" }); return;
    }
    if (!(await isMember(groupId, newOwnerId))) {
      res.status(400).json({ error: "Target user must be a member of this group" }); return;
    }
    const [target] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, newOwnerId));
    await db.update(groupMembersTable).set({ role: "member" })
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)));
    await db.update(groupMembersTable).set({ role: "owner" })
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, newOwnerId)));
    res.json({ message: `Ownership transferred to ${target?.fullName ?? "new owner"}` });
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
      res.status(400).json({ error: "The group owner cannot leave. Transfer ownership first." }); return;
    }
    await db.delete(groupMembersTable).where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, targetId)));
    res.json({ message: "Removed from group" });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Invites ──────────────────────────────────────────────────────────────────

router.get("/invites/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const invites = await db
      .select({
        id: groupInvitesTable.id,
        groupId: groupInvitesTable.groupId,
        inviterId: groupInvitesTable.inviterId,
        inviterName: groupInvitesTable.inviterName,
        inviteeId: groupInvitesTable.inviteeId,
        status: groupInvitesTable.status,
        createdAt: groupInvitesTable.createdAt,
        groupName: communityGroupsTable.name,
        groupSubject: communityGroupsTable.subject,
      })
      .from(groupInvitesTable)
      .innerJoin(communityGroupsTable, eq(groupInvitesTable.groupId, communityGroupsTable.id))
      .where(and(eq(groupInvitesTable.inviteeId, user.id), eq(groupInvitesTable.status, "pending")))
      .orderBy(desc(groupInvitesTable.createdAt));
    res.json(invites);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/invites/:inviteId/accept", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const inviteId = parseId(req.params.inviteId);
    if (!inviteId) { res.status(400).json({ error: "Invalid invite ID" }); return; }
    const [invite] = await db.select().from(groupInvitesTable).where(eq(groupInvitesTable.id, inviteId));
    if (!invite) { res.status(404).json({ error: "Invite not found" }); return; }
    if (invite.inviteeId !== user.id) { res.status(403).json({ error: "This invite is not for you" }); return; }
    if (invite.status !== "pending") { res.status(400).json({ error: "Invite already responded to" }); return; }

    // Mark as accepted
    await db.update(groupInvitesTable).set({ status: "accepted" }).where(eq(groupInvitesTable.id, inviteId));

    // Add to group if not already a member
    if (!(await isMember(invite.groupId, user.id))) {
      await db.insert(groupMembersTable).values({ groupId: invite.groupId, userId: user.id, role: "member" });
    }

    const [group] = await db.select({ name: communityGroupsTable.name }).from(communityGroupsTable).where(eq(communityGroupsTable.id, invite.groupId));
    res.json({ message: `Joined ${group?.name ?? "the group"}`, groupId: invite.groupId });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/invites/:inviteId/decline", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const inviteId = parseId(req.params.inviteId);
    if (!inviteId) { res.status(400).json({ error: "Invalid invite ID" }); return; }
    const [invite] = await db.select().from(groupInvitesTable).where(eq(groupInvitesTable.id, inviteId));
    if (!invite) { res.status(404).json({ error: "Invite not found" }); return; }
    if (invite.inviteeId !== user.id) { res.status(403).json({ error: "This invite is not for you" }); return; }
    if (invite.status !== "pending") { res.status(400).json({ error: "Invite already responded to" }); return; }
    await db.update(groupInvitesTable).set({ status: "declined" }).where(eq(groupInvitesTable.id, inviteId));
    res.json({ message: "Invite declined" });
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
    const { content, fileUrl, fileType, fileName, messageType, richContent } = req.body;
    const mType: string = messageType && ["text", "image", "pdf", "flashcard", "mnemonic", "video"].includes(messageType) ? messageType : "text";
    if (!content?.trim() && !fileUrl && !richContent) { res.status(400).json({ error: "Message content or attachment required" }); return; }
    const safeContent = content ? stripHtml(content) : "";
    if (safeContent.length > 2000) { res.status(400).json({ error: "Message too long" }); return; }
    if (fileUrl) {
      try { new URL(fileUrl); } catch { res.status(400).json({ error: "Invalid file URL" }); return; }
      if (!fileUrl.startsWith("https://res.cloudinary.com/")) { res.status(400).json({ error: "Invalid file URL" }); return; }
    }
    if (richContent) {
      try { JSON.parse(richContent); } catch { res.status(400).json({ error: "Invalid rich content" }); return; }
    }
    const [message] = await db.insert(communityMessagesTable).values({
      groupId, senderId: user.id, senderName: user.fullName, senderAvatarUrl: user.avatarUrl || null,
      content: safeContent, fileUrl: fileUrl || null, fileType: fileType || null, fileName: fileName || null,
      messageType: mType, richContent: richContent || null,
      seenBy: JSON.stringify([user.id]),
    }).returning();
    try { getIO().to(`chat:${groupId}`).emit("new-message", message); } catch { }
    awardXp(user.id, XP_VALUES.COMMUNITY_MESSAGE, "community_message", "Sent a message in a study group").catch(() => {});
    res.status(201).json(message);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// Edit a message (sender only, within 15 minutes)
router.patch("/messages/:messageId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const messageId = parseId(req.params.messageId);
    if (!messageId) { res.status(400).json({ error: "Invalid message ID" }); return; }
    const [msg] = await db.select().from(communityMessagesTable).where(eq(communityMessagesTable.id, messageId));
    if (!msg) { res.status(404).json({ error: "Message not found" }); return; }
    if (msg.senderId !== user.id) { res.status(403).json({ error: "You can only edit your own messages" }); return; }
    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    if (ageMs > 15 * 60 * 1000) { res.status(403).json({ error: "Messages can only be edited within 15 minutes of sending" }); return; }
    const { content } = req.body;
    const safeContent = content ? stripHtml(String(content)) : "";
    if (!safeContent.trim()) { res.status(400).json({ error: "Content cannot be empty" }); return; }
    if (safeContent.length > 2000) { res.status(400).json({ error: "Message too long" }); return; }
    const [updated] = await db.update(communityMessagesTable)
      .set({ content: safeContent, isEdited: true, editedAt: new Date() })
      .where(eq(communityMessagesTable.id, messageId))
      .returning();
    try { getIO().to(`chat:${msg.groupId}`).emit("message-edited", updated); } catch { }
    res.json(updated);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// Delete a message (for everyone by sender, for self by anyone)
router.delete("/messages/:messageId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const messageId = parseId(req.params.messageId);
    if (!messageId) { res.status(400).json({ error: "Invalid message ID" }); return; }
    const [msg] = await db.select().from(communityMessagesTable).where(eq(communityMessagesTable.id, messageId));
    if (!msg) { res.status(404).json({ error: "Message not found" }); return; }
    const forEveryone = req.body?.forEveryone === true;

    if (forEveryone) {
      if (msg.senderId !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Only the sender can delete for everyone" }); return;
      }
      const [updated] = await db.update(communityMessagesTable)
        .set({ deletedForEveryone: true, content: "" })
        .where(eq(communityMessagesTable.id, messageId))
        .returning();
      try { getIO().to(`chat:${msg.groupId}`).emit("message-deleted", { messageId, forEveryone: true, groupId: msg.groupId }); } catch { }
      res.json(updated);
    } else {
      const deletedBy = parseSeenBy(msg.deletedBy);
      if (!deletedBy.includes(user.id)) deletedBy.push(user.id);
      const [updated] = await db.update(communityMessagesTable)
        .set({ deletedBy: JSON.stringify(deletedBy) })
        .where(eq(communityMessagesTable.id, messageId))
        .returning();
      res.json({ messageId, forEveryone: false, deletedBy: updated.deletedBy });
    }
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// Mark all messages in a group as seen by the current user
router.post("/groups/:groupId/mark-seen", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }

    // Get all messages in this group not sent by this user that don't have this user in seenBy
    const messages = await db.select({ id: communityMessagesTable.id, seenBy: communityMessagesTable.seenBy })
      .from(communityMessagesTable)
      .where(and(eq(communityMessagesTable.groupId, groupId), ne(communityMessagesTable.senderId!, user.id)));

    const toUpdate: number[] = [];
    for (const m of messages) {
      const seen = parseSeenBy(m.seenBy);
      if (!seen.includes(user.id)) toUpdate.push(m.id);
    }

    if (toUpdate.length > 0) {
      // Update each in a batch — update seen_by by adding userId
      for (const msgId of toUpdate) {
        const [m] = await db.select({ seenBy: communityMessagesTable.seenBy }).from(communityMessagesTable).where(eq(communityMessagesTable.id, msgId));
        const seen = parseSeenBy(m?.seenBy);
        if (!seen.includes(user.id)) {
          seen.push(user.id);
          await db.update(communityMessagesTable).set({ seenBy: JSON.stringify(seen) }).where(eq(communityMessagesTable.id, msgId));
        }
      }
      try { getIO().to(`chat:${groupId}`).emit("group-seen", { groupId, userId: user.id }); } catch { }
    }

    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

export default router;
