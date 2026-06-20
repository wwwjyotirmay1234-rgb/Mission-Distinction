import { Server, Socket } from "socket.io";
import { Chess } from "chess.js";

interface ChessPlayer { id: number; name: string; socketId: string; }

interface ChessRoom {
  code: string;
  white: ChessPlayer | null;
  black: ChessPlayer | null;
  chess: Chess;
  status: "waiting" | "playing" | "ended";
  result: string | null;
}

const rooms = new Map<string, ChessRoom>();

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function serialize(room: ChessRoom) {
  return {
    code: room.code,
    white: room.white ? { id: room.white.id, name: room.white.name } : null,
    black: room.black ? { id: room.black.id, name: room.black.name } : null,
    fen: room.chess.fen(),
    turn: room.chess.turn(),
    status: room.status,
    result: room.result,
    isCheck: room.chess.isCheck(),
    isCheckmate: room.chess.isCheckmate(),
    isStalemate: room.chess.isStalemate(),
    isDraw: room.chess.isDraw(),
    moveHistory: room.chess.history().slice(-10),
  };
}

export function registerChessHandlers(io: Server, socket: Socket, user: { id: number; fullName: string }) {
  socket.on("chess:create", () => {
    let code = makeCode();
    while (rooms.has(code)) code = makeCode();
    const room: ChessRoom = {
      code,
      white: { id: user.id, name: user.fullName, socketId: socket.id },
      black: null,
      chess: new Chess(),
      status: "waiting",
      result: null,
    };
    rooms.set(code, room);
    socket.join(`chess:${code}`);
    socket.emit("chess:created", serialize(room));
  });

  socket.on("chess:join", ({ code }: { code: string }) => {
    const room = rooms.get(code.toUpperCase().trim());
    if (!room) { socket.emit("chess:error", { message: "Room not found. Check the code." }); return; }
    if (room.status !== "waiting") { socket.emit("chess:error", { message: "Game already started." }); return; }
    if (room.black) { socket.emit("chess:error", { message: "Room is full." }); return; }
    if (room.white?.id === user.id) { socket.emit("chess:error", { message: "You created this room." }); return; }
    room.black = { id: user.id, name: user.fullName, socketId: socket.id };
    room.status = "playing";
    socket.join(`chess:${code}`);
    io.to(`chess:${code}`).emit("chess:state", serialize(room));
  });

  socket.on("chess:move", ({ code, from, to, promotion }: { code: string; from: string; to: string; promotion?: string }) => {
    const room = rooms.get(code);
    if (!room || room.status !== "playing") return;
    const isWhite = room.white?.id === user.id;
    const isBlack = room.black?.id === user.id;
    if (!isWhite && !isBlack) return;
    const turn = room.chess.turn();
    if ((turn === "w" && !isWhite) || (turn === "b" && !isBlack)) {
      socket.emit("chess:error", { message: "Not your turn." }); return;
    }
    try {
      const move = room.chess.move({ from, to, promotion: promotion || "q" });
      if (!move) { socket.emit("chess:error", { message: "Invalid move." }); return; }
      if (room.chess.isCheckmate()) {
        room.status = "ended";
        room.result = isWhite ? "White wins by checkmate" : "Black wins by checkmate";
      } else if (room.chess.isStalemate()) {
        room.status = "ended";
        room.result = "Draw — stalemate";
      } else if (room.chess.isDraw()) {
        room.status = "ended";
        room.result = "Draw";
      }
      io.to(`chess:${code}`).emit("chess:state", serialize(room));
    } catch {
      socket.emit("chess:error", { message: "Invalid move." });
    }
  });

  socket.on("chess:resign", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    const isWhite = room.white?.id === user.id;
    room.status = "ended";
    room.result = isWhite ? `Black wins — ${room.white?.name} resigned` : `White wins — ${room.black?.name} resigned`;
    io.to(`chess:${code}`).emit("chess:state", serialize(room));
    setTimeout(() => rooms.delete(code), 60000);
  });

  socket.on("chess:leave", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    socket.leave(`chess:${code}`);
    if (room.white?.id === user.id) room.white = null;
    else if (room.black?.id === user.id) room.black = null;
    if (!room.white && !room.black) { rooms.delete(code); return; }
    if (room.status === "playing") {
      room.status = "ended";
      room.result = room.white ? "White wins — opponent disconnected" : "Black wins — opponent disconnected";
      io.to(`chess:${code}`).emit("chess:state", serialize(room));
    }
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms) {
      if (room.white?.socketId === socket.id || room.black?.socketId === socket.id) {
        if (room.white?.socketId === socket.id) room.white = null;
        else room.black = null;
        if (!room.white && !room.black) { rooms.delete(code); continue; }
        if (room.status === "playing") {
          room.status = "ended";
          room.result = room.white ? "White wins — opponent disconnected" : "Black wins — opponent disconnected";
          io.to(`chess:${code}`).emit("chess:state", serialize(room));
        }
      }
    }
  });
}
