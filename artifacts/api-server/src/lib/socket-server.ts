import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { parseToken } from "./auth";
import { db } from "@workspace/db";
import { usersTable, communityGroupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { registerChessHandlers } from "./game-socket-chess";
import { registerLudoHandlers } from "./game-socket-ludo";
import { registerSNLHandlers } from "./game-socket-snl";

let io: Server;

function getAllowedOrigins(): string | string[] | boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const domains = (process.env.REPLIT_DOMAINS || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `https://${d}`);
  return domains.length > 0 ? domains : false;
}

// ── WebRTC call rooms ──────────────────────────────────────────────────────────
interface CallParticipant { id: number; name: string; socketId: string; }
const callRooms = new Map<string, Set<CallParticipant>>();

// ── Video call join-request approval ──────────────────────────────────────────
interface PendingJoinRequest { userId: number; name: string; hostUserId: number; }
const callJoinRequests = new Map<string, Map<string, PendingJoinRequest>>(); // roomKey → socketId → request

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    path: "/api/socket.io/",
    cors: { origin: getAllowedOrigins(), methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
    // Without these, a half-open connection (phone locked, tab backgrounded,
    // flaky mobile network) can sit "connected" from the server's point of
    // view indefinitely — leaking memory in gameRooms/callRooms/callJoinRequests
    // and never firing the "disconnect" cleanup handlers. Under sustained heavy
    // use this accumulates and looks like the whole app "hanging".
    pingTimeout: 20000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) { next(new Error("No token")); return; }
    const parsed = parseToken(token);
    if (!parsed) { next(new Error("Invalid token")); return; }
    const [user] = await db.select({ id: usersTable.id, fullName: usersTable.fullName, bannedAt: usersTable.bannedAt })
      .from(usersTable).where(eq(usersTable.id, parsed.userId));
    if (!user || user.bannedAt) { next(new Error("Unauthorized")); return; }
    (socket as any).user = user;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as { id: number; fullName: string };

    // Join personal room for direct notifications (e.g. group invites)
    socket.join(`user:${user.id}`);

    // ── Community Chat ─────────────────────────────────────────────────────────
    socket.on("join-room", async (groupId: number) => {
      if (!groupId || typeof groupId !== "number") return;
      const [group] = await db
        .select({ id: communityGroupsTable.id })
        .from(communityGroupsTable)
        .where(eq(communityGroupsTable.id, groupId));
      if (!group) return;
      socket.join(`chat:${groupId}`);
      socket.to(`chat:${groupId}`).emit("user-joined", { name: user.fullName });
      const sockets = await io.in(`chat:${groupId}`).fetchSockets();
      io.to(`chat:${groupId}`).emit("room-count", { groupId, count: sockets.length });
    });

    socket.on("leave-room", async (groupId: number) => {
      socket.leave(`chat:${groupId}`);
      const sockets = await io.in(`chat:${groupId}`).fetchSockets();
      io.to(`chat:${groupId}`).emit("room-count", { groupId, count: sockets.length });
    });

    socket.on("typing", (groupId: number) => {
      socket.to(`chat:${groupId}`).emit("user-typing", { name: user.fullName });
    });

    // ── Chess, Ludo & Snake and Ladder ─────────────────────────────────────────
    registerChessHandlers(io, socket, user);
    registerLudoHandlers(io, socket, user);
    registerSNLHandlers(io, socket, user);

    // ── WebRTC Call Signaling ───────────────────────────────────────────────────
    socket.on("call:join", ({ roomKey }: { roomKey: string }) => {
      socket.join(`call:${roomKey}`);
      const room = callRooms.get(roomKey) ?? new Set<CallParticipant>();
      const existing = Array.from(room).filter(p => p.id !== user.id);
      const isFirstJoiner = existing.length === 0;
      // Remove stale entry for this user (reconnect case)
      for (const p of room) { if (p.id === user.id) room.delete(p); }
      room.add({ id: user.id, name: user.fullName, socketId: socket.id });
      callRooms.set(roomKey, room);
      socket.emit("call:participants", { participants: existing });
      socket.to(`call:${roomKey}`).emit("call:user-joined", {
        userId: user.id, name: user.fullName, socketId: socket.id,
      });
      // Notify group chat members that a call has started
      if (isFirstJoiner && roomKey.startsWith("group-")) {
        const groupId = parseInt(roomKey.replace("group-", ""), 10);
        if (!isNaN(groupId)) {
          socket.to(`chat:${groupId}`).emit("call:ringing", {
            groupId, callerName: user.fullName, roomKey,
          });
        }
      }
    });

    socket.on("call:offer", ({ to, offer }: { to: string; offer: object }) => {
      io.to(to).emit("call:offer", { from: socket.id, fromId: user.id, fromName: user.fullName, offer });
    });

    socket.on("call:answer", ({ to, answer }: { to: string; answer: object }) => {
      io.to(to).emit("call:answer", { from: socket.id, fromId: user.id, answer });
    });

    socket.on("call:ice", ({ to, candidate }: { to: string; candidate: object }) => {
      io.to(to).emit("call:ice", { from: socket.id, candidate });
    });

    socket.on("call:leave", ({ roomKey }: { roomKey: string }) => {
      const room = callRooms.get(roomKey);
      if (room) {
        for (const p of room) { if (p.id === user.id) room.delete(p); }
        if (room.size === 0) {
          callRooms.delete(roomKey);
          if (roomKey.startsWith("group-")) {
            const groupId = parseInt(roomKey.replace("group-", ""), 10);
            if (!isNaN(groupId)) io.to(`chat:${groupId}`).emit("call:ended", { groupId, roomKey });
          }
        }
      }
      socket.leave(`call:${roomKey}`);
      socket.to(`call:${roomKey}`).emit("call:user-left", { socketId: socket.id, userId: user.id });
    });

    // ── Video call join-request approval ───────────────────────────────────────
    socket.on("call:request-join", ({ roomKey, hostUserId }: { roomKey: string; hostUserId: number }) => {
      if (typeof roomKey !== "string" || typeof hostUserId !== "number") return;
      const requests = callJoinRequests.get(roomKey) ?? new Map<string, PendingJoinRequest>();
      requests.set(socket.id, { userId: user.id, name: user.fullName, hostUserId });
      callJoinRequests.set(roomKey, requests);
      io.to(`user:${hostUserId}`).emit("call:join-request", {
        roomKey,
        requesterName: user.fullName,
        requesterSocketId: socket.id,
        requesterId: user.id,
      });
    });

    socket.on("call:approve", ({ roomKey, requesterSocketId }: { roomKey: string; requesterSocketId: string }) => {
      if (typeof roomKey !== "string" || typeof requesterSocketId !== "string") return;
      const pending = callJoinRequests.get(roomKey)?.get(requesterSocketId);
      // Only the intended host may approve
      if (!pending || pending.hostUserId !== user.id) return;
      callJoinRequests.get(roomKey)?.delete(requesterSocketId);
      io.to(requesterSocketId).emit("call:approved", { roomKey });
    });

    socket.on("call:deny", ({ roomKey, requesterSocketId }: { roomKey: string; requesterSocketId: string }) => {
      if (typeof roomKey !== "string" || typeof requesterSocketId !== "string") return;
      const pending = callJoinRequests.get(roomKey)?.get(requesterSocketId);
      // Only the intended host may deny
      if (!pending || pending.hostUserId !== user.id) return;
      callJoinRequests.get(roomKey)?.delete(requesterSocketId);
      io.to(requesterSocketId).emit("call:denied", { roomKey });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      for (const room of socket.rooms) {
        if (room.startsWith("chat:")) {
          const sockets = await io.in(room).fetchSockets();
          io.to(room).emit("room-count", { groupId: parseInt(room.replace("chat:", "")), count: sockets.length });
        }
        if (room.startsWith("call:")) {
          const roomKey = room.replace("call:", "");
          const callRoom = callRooms.get(roomKey);
          if (callRoom) {
            for (const p of callRoom) { if (p.socketId === socket.id) callRoom.delete(p); }
            if (callRoom.size === 0) {
              callRooms.delete(roomKey);
              if (roomKey.startsWith("group-")) {
                const groupId = parseInt(roomKey.replace("group-", ""), 10);
                if (!isNaN(groupId)) io.to(`chat:${groupId}`).emit("call:ended", { groupId, roomKey });
              }
            } else {
              io.to(room).emit("call:user-left", { socketId: socket.id, userId: user.id });
            }
          }
        }
      }
      // Clean up any pending join requests from this socket
      for (const [roomKey, requests] of callJoinRequests.entries()) {
        requests.delete(socket.id);
        if (requests.size === 0) callJoinRequests.delete(roomKey);
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
