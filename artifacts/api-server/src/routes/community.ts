import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { communityPostsTable, communityGroupsTable, communityMessagesTable, groupMembersTable, groupInvitesTable, usersTable, postLikesTable, postCommentsTable } from "@workspace/db";
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
    const user = (req as any).user;
    const { group, search } = req.query;
    let posts = await db.select().from(communityPostsTable).orderBy(desc(communityPostsTable.createdAt)).limit(500);
    if (group) posts = posts.filter(p => p.groupName?.toLowerCase().includes((group as string).toLowerCase()));
    if (search) posts = posts.filter(p => p.title.toLowerCase().includes((search as string).toLowerCase()) || p.content.toLowerCase().includes((search as string).toLowerCase()));

    // Fetch all reactions for these posts
    const allReactions = await db.select({ postId: postLikesTable.postId, userId: postLikesTable.userId, emoji: postLikesTable.emoji }).from(postLikesTable);
    const reactionsByPost = new Map<number, { emoji: string; userId: number }[]>();
    for (const r of allReactions) {
      if (!reactionsByPost.has(r.postId)) reactionsByPost.set(r.postId, []);
      reactionsByPost.get(r.postId)!.push({ emoji: r.emoji, userId: r.userId });
    }

    const result = posts.map(p => {
      const reactions = reactionsByPost.get(p.id) || [];
      const myReaction = reactions.find(r => r.userId === user.id);
      // Group by emoji
      const emojiCounts: Record<string, number> = {};
      for (const r of reactions) emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
      return {
        ...p,
        likedByMe: !!myReaction,
        myEmoji: myReaction?.emoji || null,
        reactions: emojiCounts,
        likeCount: reactions.length,
      };
    });
    res.json(result);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/posts", authMiddleware, postCreateLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, content, mediaUrl, mediaType } = req.body;
    if (!title || !content) { res.status(400).json({ error: "Title and content are required" }); return; }
    const safeTitle = stripHtml(title);
    const safeContent = stripHtml(content);
    if (!safeTitle || !safeContent) { res.status(400).json({ error: "Invalid content" }); return; }
    if (safeTitle.length > 200) { res.status(400).json({ error: "Title too long" }); return; }
    if (safeContent.length > 5000) { res.status(400).json({ error: "Content too long" }); return; }

    // Validate media URL if provided
    let safeMediaUrl: string | null = null;
    let safeMediaType: string | null = null;
    if (mediaUrl) {
      try { new URL(mediaUrl); } catch { res.status(400).json({ error: "Invalid media URL" }); return; }
      if (!mediaUrl.startsWith("https://res.cloudinary.com/") && !mediaUrl.startsWith("https://www.youtube.com/") && !mediaUrl.startsWith("https://youtu.be/")) {
        res.status(400).json({ error: "Invalid media URL" }); return;
      }
      safeMediaUrl = mediaUrl;
      safeMediaType = mediaType === "video" ? "video" : "image";
    }

    const insertValues: any = {
      title: safeTitle,
      content: safeContent,
      author: user.fullName,
      authorId: user.id,
      authorAvatarUrl: user.avatarUrl || null,
    };
    if (safeMediaUrl) {
      insertValues.mediaUrl = safeMediaUrl;
      insertValues.mediaType = safeMediaType;
    }
    const [post] = await db.insert(communityPostsTable).values(insertValues).returning();
    awardXp(user.id, XP_VALUES.COMMUNITY_POST, "community_post", `Posted in community: ${safeTitle.slice(0, 60)}`).catch(() => {});
    res.status(201).json({ ...post, likedByMe: false });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/posts/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const postId = parseId(req.params.id);
    if (!postId) { res.status(400).json({ error: "Invalid post ID" }); return; }
    const [post] = await db.select({ id: communityPostsTable.id, authorId: communityPostsTable.authorId })
      .from(communityPostsTable).where(eq(communityPostsTable.id, postId));
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    if (post.authorId !== user.id && user.role !== "admin") {
      res.status(403).json({ error: "You can only delete your own posts" }); return;
    }
    await db.delete(postCommentsTable).where(eq(postCommentsTable.postId, postId));
    await db.delete(postLikesTable).where(eq(postLikesTable.postId, postId));
    await db.delete(communityPostsTable).where(eq(communityPostsTable.id, postId));
    res.json({ message: "Post deleted" });
  } catch (err) { console.error("[Delete post]", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── Post likes ───────────────────────────────────────────────────────────────

router.post("/posts/:id/like", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const postId = parseId(req.params.id);
    if (!postId) { res.status(400).json({ error: "Invalid post ID" }); return; }
    const [post] = await db.select({ id: communityPostsTable.id }).from(communityPostsTable).where(eq(communityPostsTable.id, postId));
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }

    const rawEmoji = req.body?.emoji;
    const emoji = typeof rawEmoji === "string" && rawEmoji.trim() ? rawEmoji.trim().slice(0, 8) : "❤️";

    const existing = await db.select({ id: postLikesTable.id, emoji: postLikesTable.emoji })
      .from(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, user.id)));

    let likedByMe: boolean;
    let myEmoji: string | null;

    if (existing.length > 0) {
      if (existing[0].emoji === emoji) {
        // Same emoji → toggle off
        await db.delete(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, user.id)));
        likedByMe = false; myEmoji = null;
      } else {
        // Different emoji → update
        await db.update(postLikesTable).set({ emoji }).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, user.id)));
        likedByMe = true; myEmoji = emoji;
      }
    } else {
      await db.insert(postLikesTable).values({ postId, userId: user.id, emoji }).onConflictDoNothing();
      likedByMe = true; myEmoji = emoji;
    }

    // Re-fetch reaction counts
    const reactions = await db.select({ emoji: postLikesTable.emoji }).from(postLikesTable).where(eq(postLikesTable.postId, postId));
    const emojiCounts: Record<string, number> = {};
    for (const r of reactions) emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
    await db.update(communityPostsTable).set({ likeCount: reactions.length }).where(eq(communityPostsTable.id, postId));

    res.json({ likedByMe, myEmoji, reactions: emojiCounts, likeCount: reactions.length });
  } catch (err) { console.error("[Like]", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── Comments ─────────────────────────────────────────────────────────────────

const commentLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: "Commenting too fast." }, standardHeaders: true, legacyHeaders: false });

router.get("/posts/:id/comments", authMiddleware, async (req: Request, res: Response) => {
  try {
    const postId = parseId(req.params.id);
    if (!postId) { res.status(400).json({ error: "Invalid post ID" }); return; }
    const comments = await db.select().from(postCommentsTable)
      .where(eq(postCommentsTable.postId, postId))
      .orderBy(postCommentsTable.createdAt);
    res.json(comments);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.post("/posts/:id/comments", authMiddleware, commentLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const postId = parseId(req.params.id);
    if (!postId) { res.status(400).json({ error: "Invalid post ID" }); return; }
    const [post] = await db.select({ id: communityPostsTable.id }).from(communityPostsTable).where(eq(communityPostsTable.id, postId));
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "Comment cannot be empty" }); return; }
    const safe = stripHtml(content.trim());
    if (!safe) { res.status(400).json({ error: "Invalid content" }); return; }
    if (safe.length > 1000) { res.status(400).json({ error: "Comment too long (max 1000 chars)" }); return; }
    const [comment] = await db.insert(postCommentsTable).values({
      postId, userId: user.id, author: user.fullName, authorAvatarUrl: user.avatarUrl || null, content: safe,
    }).returning();
    // Increment reply count
    await db.update(communityPostsTable).set({ replyCount: post.id }).where(eq(communityPostsTable.id, postId)); // placeholder, recalculate below
    const [{ cnt }] = await db.select({ cnt: count() }).from(postCommentsTable).where(eq(postCommentsTable.postId, postId));
    await db.update(communityPostsTable).set({ replyCount: Number(cnt) }).where(eq(communityPostsTable.id, postId));
    res.status(201).json(comment);
  } catch (err) { console.error("[Comment POST]", err); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/posts/:id/comments/:commentId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const postId = parseId(req.params.id);
    const commentId = parseId(req.params.commentId);
    if (!postId || !commentId) { res.status(400).json({ error: "Invalid IDs" }); return; }
    const [comment] = await db.select().from(postCommentsTable).where(eq(postCommentsTable.id, commentId));
    if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }
    if (comment.userId !== user.id && user.role !== "admin") { res.status(403).json({ error: "Not authorised" }); return; }
    await db.delete(postCommentsTable).where(eq(postCommentsTable.id, commentId));
    const [{ cnt }] = await db.select({ cnt: count() }).from(postCommentsTable).where(eq(postCommentsTable.postId, postId));
    await db.update(communityPostsTable).set({ replyCount: Number(cnt) }).where(eq(communityPostsTable.id, postId));
    res.json({ message: "Deleted" });
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
    const { name, description } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Group name is required" }); return; }
    const safeName = stripHtml(name.trim());
    const safeSubject = "General";
    const safeDesc = description ? stripHtml(description.trim()) : null;
    if (!safeName) { res.status(400).json({ error: "Invalid content" }); return; }
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
      if (!deletedBy.includes(user.id)) {
        deletedBy.push(user.id);
        await db.update(communityMessagesTable).set({ deletedBy: JSON.stringify(deletedBy) }).where(eq(communityMessagesTable.id, messageId));
      }
      res.json({ message: "Deleted for you" });
    }
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// Mark messages as seen
router.post("/groups/:groupId/mark-seen", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const groupId = parseId(req.params.groupId);
    if (!groupId) { res.status(400).json({ error: "Invalid group ID" }); return; }

    const messages = await db.select({ id: communityMessagesTable.id, seenBy: communityMessagesTable.seenBy, senderId: communityMessagesTable.senderId })
      .from(communityMessagesTable)
      .where(and(eq(communityMessagesTable.groupId, groupId), ne(communityMessagesTable.senderId, user.id)));

    for (const msg of messages) {
      const seenBy = parseSeenBy(msg.seenBy);
      if (!seenBy.includes(user.id)) {
        seenBy.push(user.id);
        await db.update(communityMessagesTable).set({ seenBy: JSON.stringify(seenBy) }).where(eq(communityMessagesTable.id, msg.id));
      }
    }

    try { getIO().to(`chat:${groupId}`).emit("group-seen", { groupId, userId: user.id }); } catch { }
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

export default router;
