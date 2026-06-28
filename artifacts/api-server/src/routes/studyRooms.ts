import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { studyRoomsTable, studyRoomMembersTable } from "@workspace/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import rateLimit from "express-rate-limit";
import { awardXp, XP_VALUES } from "../lib/xp";

const router = Router();

const createRoomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many rooms created. Please wait before creating another." },
  standardHeaders: true,
  legacyHeaders: false,
});

const heartbeatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  message: { error: "Too many heartbeat requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

const HEARTBEAT_TIMEOUT = 45 * 1000; // 45s — offline if no heartbeat

function activeThreshold() {
  return new Date(Date.now() - HEARTBEAT_TIMEOUT);
}

// List active rooms
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const rooms = await db.select().from(studyRoomsTable)
      .where(gte(studyRoomsTable.createdAt, new Date(Date.now() - 12 * 60 * 60 * 1000)))
      .orderBy(desc(studyRoomsTable.createdAt));
    res.json(rooms);
  } catch { res.status(500).json({ error: "Failed to load rooms" }); }
});

// Get room detail
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid room ID" }); return; }
    const [room] = await db.select().from(studyRoomsTable).where(eq(studyRoomsTable.id, id)).limit(1);
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }
    const members = await db.select().from(studyRoomMembersTable)
      .where(and(eq(studyRoomMembersTable.roomId, id), gte(studyRoomMembersTable.lastHeartbeat, activeThreshold())));
    res.json({ ...room, members });
  } catch { res.status(500).json({ error: "Failed to load room" }); }
});

// Create room
router.post("/", authMiddleware, createRoomLimiter, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const userName = (req as any).user?.name || "Anonymous";
    const { name, subject, timerMinutes } = req.body;
    if (!name?.trim() || !subject) { res.status(400).json({ error: "name and subject required" }); return; }
    const mins = Math.min(Math.max(parseInt(timerMinutes) || 25, 5), 180);
    const [room] = await db.insert(studyRoomsTable).values({ hostId: userId, hostName: userName, name: name.trim(), subject, timerMinutes: mins }).returning();
    await db.insert(studyRoomMembersTable).values({ roomId: room.id, userId, userName });
    res.json(room);
  } catch { res.status(500).json({ error: "Failed to create room" }); }
});

// Join room
router.post("/:id/join", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const userName = (req as any).user?.name || "Anonymous";
    const roomId = parseId(req.params.id);
    if (!roomId) { res.status(400).json({ error: "Invalid room ID" }); return; }
    const [room] = await db.select().from(studyRoomsTable).where(eq(studyRoomsTable.id, roomId)).limit(1);
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }

    const [existing] = await db.select().from(studyRoomMembersTable)
      .where(and(eq(studyRoomMembersTable.roomId, roomId), eq(studyRoomMembersTable.userId, userId))).limit(1);
    if (existing) {
      await db.update(studyRoomMembersTable).set({ lastHeartbeat: new Date() })
        .where(and(eq(studyRoomMembersTable.roomId, roomId), eq(studyRoomMembersTable.userId, userId)));
    } else {
      await db.insert(studyRoomMembersTable).values({ roomId, userId, userName });
      const activeCount = await db.select({ c: sql<number>`COUNT(*)` }).from(studyRoomMembersTable)
        .where(and(eq(studyRoomMembersTable.roomId, roomId), gte(studyRoomMembersTable.lastHeartbeat, activeThreshold())));
      await db.update(studyRoomsTable).set({ memberCount: Number(activeCount[0]?.c ?? 1) }).where(eq(studyRoomsTable.id, roomId));
      awardXp(userId, XP_VALUES.STUDY_ROOM_JOINED, "study_room_joined", `Joined study room: ${room.name}`).catch(() => {});
    }
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to join room" }); }
});

// Heartbeat
router.post("/:id/heartbeat", authMiddleware, heartbeatLimiter, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const roomId = parseId(req.params.id);
    if (!roomId) { res.status(400).json({ error: "Invalid room ID" }); return; }
    await db.update(studyRoomMembersTable).set({ lastHeartbeat: new Date() })
      .where(and(eq(studyRoomMembersTable.roomId, roomId), eq(studyRoomMembersTable.userId, userId)));
    const activeCount = await db.select({ c: sql<number>`COUNT(*)` }).from(studyRoomMembersTable)
      .where(and(eq(studyRoomMembersTable.roomId, roomId), gte(studyRoomMembersTable.lastHeartbeat, activeThreshold())));
    await db.update(studyRoomsTable).set({ memberCount: Number(activeCount[0]?.c ?? 1) }).where(eq(studyRoomsTable.id, roomId));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to send heartbeat" }); }
});

// Start timer (host only)
router.patch("/:id/start", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid room ID" }); return; }
    const [room] = await db.select().from(studyRoomsTable).where(eq(studyRoomsTable.id, id)).limit(1);
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }
    if (room.hostId !== userId) { res.status(403).json({ error: "Only host can start" }); return; }
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + room.timerMinutes * 60 * 1000);
    const [updated] = await db.update(studyRoomsTable).set({ status: "active", startedAt, endsAt }).where(eq(studyRoomsTable.id, id)).returning();
    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to start timer" }); }
});

// Delete room (host only)
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid room ID" }); return; }
    const [room] = await db.select().from(studyRoomsTable).where(eq(studyRoomsTable.id, id)).limit(1);
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }
    if (room.hostId !== userId) { res.status(403).json({ error: "Only the host can delete this room" }); return; }
    await db.delete(studyRoomMembersTable).where(eq(studyRoomMembersTable.roomId, id));
    await db.delete(studyRoomsTable).where(eq(studyRoomsTable.id, id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete room" }); }
});

// Leave room
router.post("/:id/leave", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const roomId = parseId(req.params.id);
    if (!roomId) { res.status(400).json({ error: "Invalid room ID" }); return; }
    await db.delete(studyRoomMembersTable)
      .where(and(eq(studyRoomMembersTable.roomId, roomId), eq(studyRoomMembersTable.userId, userId)));
    const activeCount = await db.select({ c: sql<number>`COUNT(*)` }).from(studyRoomMembersTable)
      .where(and(eq(studyRoomMembersTable.roomId, roomId), gte(studyRoomMembersTable.lastHeartbeat, activeThreshold())));
    await db.update(studyRoomsTable).set({ memberCount: Number(activeCount[0]?.c ?? 0) }).where(eq(studyRoomsTable.id, roomId));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to leave room" }); }
});

export { router as studyRoomsRouter };
