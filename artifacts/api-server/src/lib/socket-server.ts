import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { parseToken } from "./auth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

    socket.on("join-room", async (groupId: number) => {
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

    socket.on("disconnect", async () => {
      for (const room of socket.rooms) {
        if (room.startsWith("chat:")) {
          const sockets = await io.in(room).fetchSockets();
          io.to(room).emit("room-count", { groupId: parseInt(room.replace("chat:", "")), count: sockets.length });
        }
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
