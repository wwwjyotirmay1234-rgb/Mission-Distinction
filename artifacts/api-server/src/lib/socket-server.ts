import { Server, Socket } from "socket.io";
import { IncomingMessage, Server as HttpServer } from "http";
import { parseToken } from "./auth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let io: Server;

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    path: "/api/socket.io/",
    cors: { origin: "*", methods: ["GET", "POST"] },
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

    socket.on("join-room", (groupId: number) => {
      socket.join(`chat:${groupId}`);
      socket.to(`chat:${groupId}`).emit("user-joined", { name: user.fullName });
    });

    socket.on("leave-room", (groupId: number) => {
      socket.leave(`chat:${groupId}`);
    });

    socket.on("typing", (groupId: number) => {
      socket.to(`chat:${groupId}`).emit("user-typing", { name: user.fullName });
    });

    socket.on("disconnect", () => {
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
