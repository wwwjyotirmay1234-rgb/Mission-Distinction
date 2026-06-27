import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { parseToken } from "./auth";
import { db } from "@workspace/db";
import { usersTable, communityGroupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { awardXp } from "./xp";
import { updateStreak } from "./streak";
import { openai } from "@workspace/integrations-openai-ai-server";
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

interface GamePlayer {
  id: number;
  name: string;
  score: number;
  socketId: string;
  answered: boolean;
  answerTime: number;
}

interface GameQuestion {
  text: string;
  options: string[];
  correctOption: number;
}

interface GameRoom {
  code: string;
  hostId: number;
  hostSocketId: string;
  players: Map<number, GamePlayer>;
  status: "waiting" | "playing" | "ended";
  subject: string;
  questions: GameQuestion[];
  currentQuestion: number;
  questionTimer: ReturnType<typeof setTimeout> | null;
}

const gameRooms = new Map<string, GameRoom>();
const QUESTION_TIME_MS = 15000;
const TOTAL_QUESTIONS = 10;

// ── WebRTC call rooms ──────────────────────────────────────────────────────────
interface CallParticipant { id: number; name: string; socketId: string; }
const callRooms = new Map<string, Set<CallParticipant>>();

// ── Video call join-request approval ──────────────────────────────────────────
interface PendingJoinRequest { userId: number; name: string; hostUserId: number; }
const callJoinRequests = new Map<string, Map<string, PendingJoinRequest>>(); // roomKey → socketId → request

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function roomPlayers(room: GameRoom) {
  return Array.from(room.players.values()).map(p => ({
    id: p.id, name: p.name, score: p.score, answered: p.answered,
  }));
}

async function generateGameQuestions(subject: string): Promise<GameQuestion[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 2000,
    messages: [
      {
        role: "system",
        content: `You are a medical education expert for 1st year MBBS (India). Generate exactly ${TOTAL_QUESTIONS} multiple choice questions about ${subject} for competitive quiz play. Each question must have exactly 4 options and one correct answer.

Return ONLY valid JSON array, no markdown:
[{"text":"...","options":["A text","B text","C text","D text"],"correctOption":0},...]

correctOption is 0-indexed. Make questions challenging but fair for 1st year MBBS students. Cover different topics within ${subject}.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "[]";
  const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(clean);
  return Array.isArray(parsed) ? parsed.slice(0, TOTAL_QUESTIONS) : [];
}

function advanceQuestion(room: GameRoom, code: string) {
  if (room.questionTimer) clearTimeout(room.questionTimer);
  room.players.forEach(p => { p.answered = false; });

  room.currentQuestion++;
  if (room.currentQuestion >= room.questions.length) {
    room.status = "ended";
    const sorted = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
    const leaderboard = sorted.map(p => ({ id: p.id, name: p.name, score: p.score }));
    io.to(`game:${code}`).emit("game:ended", { leaderboard });

    // Award XP to every player who participated
    const playerXpMap: Record<number, number> = {};
    for (const p of sorted) {
      // Base participation XP + bonus for each estimated correct answer (100 pts each)
      const estimatedCorrect = Math.min(TOTAL_QUESTIONS, Math.round(p.score / 100));
      const xp = 30 + estimatedCorrect * 5;
      playerXpMap[p.id] = xp;
      awardXp(p.id, xp, "multiplayer_quiz", `Multiplayer quiz: ${room.subject} (score ${p.score})`).catch(() => {});
      updateStreak(p.id).catch(() => {});
    }

    // Notify each player's personal socket about their XP reward
    for (const p of sorted) {
      io.to(`user:${p.id}`).emit("xp-awarded", { xpEarned: playerXpMap[p.id], reason: "Multiplayer Quiz" });
    }

    gameRooms.delete(code);
    return;
  }

  const q = room.questions[room.currentQuestion];
  io.to(`game:${code}`).emit("game:question", {
    questionNum: room.currentQuestion + 1,
    total: room.questions.length,
    text: q.text,
    options: q.options,
    timeLimit: QUESTION_TIME_MS / 1000,
  });

  room.questionTimer = setTimeout(() => {
    io.to(`game:${code}`).emit("game:question-timeout", {
      correctOption: room.questions[room.currentQuestion]?.correctOption,
      scores: roomPlayers(room),
    });
    setTimeout(() => advanceQuestion(room, code), 3000);
  }, QUESTION_TIME_MS);
}

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    path: "/api/socket.io/",
    cors: { origin: getAllowedOrigins(), methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
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

    // ── Multiplayer Games ──────────────────────────────────────────────────────
    socket.on("game:create", ({ subject }: { subject: string }) => {
      let code = generateCode();
      while (gameRooms.has(code)) code = generateCode();

      const room: GameRoom = {
        code,
        hostId: user.id,
        hostSocketId: socket.id,
        players: new Map([[user.id, { id: user.id, name: user.fullName, score: 0, socketId: socket.id, answered: false, answerTime: 0 }]]),
        status: "waiting",
        subject,
        questions: [],
        currentQuestion: -1,
        questionTimer: null,
      };
      gameRooms.set(code, room);
      socket.join(`game:${code}`);
      socket.emit("game:created", { code, subject, players: roomPlayers(room) });
    });

    socket.on("game:join", ({ code }: { code: string }) => {
      const room = gameRooms.get(code.toUpperCase().trim());
      if (!room) { socket.emit("game:error", { message: "Room not found. Check the code." }); return; }
      if (room.status !== "waiting") { socket.emit("game:error", { message: "Game already started." }); return; }
      if (room.players.size >= 10) { socket.emit("game:error", { message: "Room is full (max 10 players)." }); return; }

      room.players.set(user.id, { id: user.id, name: user.fullName, score: 0, socketId: socket.id, answered: false, answerTime: 0 });
      socket.join(`game:${code}`);

      const players = roomPlayers(room);
      socket.emit("game:joined", { code, subject: room.subject, hostId: room.hostId, players });
      socket.to(`game:${code}`).emit("game:player-joined", { players, name: user.fullName });
    });

    socket.on("game:start", async ({ code }: { code: string }) => {
      const room = gameRooms.get(code);
      if (!room || room.hostId !== user.id || room.status !== "waiting") return;

      room.status = "playing";
      io.to(`game:${code}`).emit("game:loading", { message: "Generating questions…" });

      try {
        room.questions = await generateGameQuestions(room.subject);
        if (room.questions.length === 0) throw new Error("No questions generated");
        room.currentQuestion = -1;
        io.to(`game:${code}`).emit("game:started", { total: room.questions.length });
        setTimeout(() => advanceQuestion(room, code), 1500);
      } catch (err) {
        room.status = "waiting";
        io.to(`game:${code}`).emit("game:error", { message: "Failed to generate questions. Try again." });
      }
    });

    socket.on("game:answer", ({ code, answerIndex }: { code: string; answerIndex: number }) => {
      const room = gameRooms.get(code);
      if (!room || room.status !== "playing") return;
      const player = room.players.get(user.id);
      if (!player || player.answered) return;

      const q = room.questions[room.currentQuestion];
      if (!q) return;
      if (typeof answerIndex !== "number" || answerIndex < 0 || answerIndex > 3) return;

      player.answered = true;
      player.answerTime = Date.now();

      const correct = answerIndex === q.correctOption;
      if (correct) {
        const playersAnswered = Array.from(room.players.values()).filter(p => p.answered).length;
        const speedBonus = Math.max(0, 50 - (playersAnswered - 1) * 10);
        player.score += 100 + speedBonus;
      }

      socket.emit("game:answer-result", { correct, correctOption: q.correctOption, score: player.score });
      io.to(`game:${code}`).emit("game:scores", { scores: roomPlayers(room) });

      const allAnswered = Array.from(room.players.values()).every(p => p.answered);
      if (allAnswered) {
        if (room.questionTimer) clearTimeout(room.questionTimer);
        io.to(`game:${code}`).emit("game:question-timeout", {
          correctOption: q.correctOption,
          scores: roomPlayers(room),
        });
        setTimeout(() => advanceQuestion(room, code), 3000);
      }
    });

    // ── Chess, Ludo & Snake and Ladder ─────────────────────────────────────────
    registerChessHandlers(io, socket, user);
    registerLudoHandlers(io, socket, user);
    registerSNLHandlers(io, socket, user);

    socket.on("game:leave", ({ code }: { code: string }) => {
      const room = gameRooms.get(code);
      if (!room) return;
      socket.leave(`game:${code}`);
      room.players.delete(user.id);

      if (room.players.size === 0) {
        if (room.questionTimer) clearTimeout(room.questionTimer);
        gameRooms.delete(code);
        return;
      }

      if (room.hostId === user.id) {
        const newHost = room.players.values().next().value!;
        room.hostId = newHost.id;
        room.hostSocketId = newHost.socketId;
        io.to(`game:${code}`).emit("game:host-changed", { hostId: newHost.id, players: roomPlayers(room) });
      } else {
        io.to(`game:${code}`).emit("game:player-left", { players: roomPlayers(room), name: user.fullName });
      }
    });

    // ── WebRTC Call Signaling ───────────────────────────────────────────────────
    socket.on("call:join", ({ roomKey }: { roomKey: string }) => {
      socket.join(`call:${roomKey}`);
      const room = callRooms.get(roomKey) ?? new Set<CallParticipant>();
      const existing = Array.from(room).filter(p => p.id !== user.id);
      // Remove stale entry for this user (reconnect case)
      for (const p of room) { if (p.id === user.id) room.delete(p); }
      room.add({ id: user.id, name: user.fullName, socketId: socket.id });
      callRooms.set(roomKey, room);
      socket.emit("call:participants", { participants: existing });
      socket.to(`call:${roomKey}`).emit("call:user-joined", {
        userId: user.id, name: user.fullName, socketId: socket.id,
      });
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
        if (room.size === 0) callRooms.delete(roomKey);
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
      callJoinRequests.get(roomKey)?.delete(requesterSocketId);
      io.to(requesterSocketId).emit("call:approved", { roomKey });
    });

    socket.on("call:deny", ({ roomKey, requesterSocketId }: { roomKey: string; requesterSocketId: string }) => {
      if (typeof roomKey !== "string" || typeof requesterSocketId !== "string") return;
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
            if (callRoom.size === 0) callRooms.delete(roomKey);
            else io.to(room).emit("call:user-left", { socketId: socket.id, userId: user.id });
          }
        }
        if (room.startsWith("game:")) {
          const code = room.replace("game:", "");
          const gameRoom = gameRooms.get(code);
          if (gameRoom) {
            gameRoom.players.delete(user.id);
            if (gameRoom.players.size === 0) {
              if (gameRoom.questionTimer) clearTimeout(gameRoom.questionTimer);
              gameRooms.delete(code);
            } else {
              io.to(room).emit("game:player-left", { players: roomPlayers(gameRoom), name: user.fullName });
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
