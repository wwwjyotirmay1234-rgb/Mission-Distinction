import { Server, Socket } from "socket.io";

// Standard Snake and Ladder positions
// Snakes: head → tail (move down)
const SNAKES: Record<number, number> = {
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78,
};
// Ladders: base → top (move up)
const LADDERS: Record<number, number> = {
  4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
};

interface SNLPlayer {
  id: number;
  name: string;
  colorIdx: number;
  socketId: string;
  position: number; // 0 = start (not yet moved), 1-100 = on board
}

interface SNLRoom {
  code: string;
  hostId: number;
  players: SNLPlayer[];
  maxPlayers: number;
  status: "waiting" | "playing" | "ended";
  currentPlayerIdx: number;
  diceValue: number | null;
  diceRolled: boolean;
  winner: number | null;
  lastEvent: "snake" | "ladder" | null;
}

const rooms = new Map<string, SNLRoom>();

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function serialize(room: SNLRoom) {
  return {
    code: room.code,
    players: room.players.map(p => ({ id: p.id, name: p.name, colorIdx: p.colorIdx, position: p.position })),
    maxPlayers: room.maxPlayers,
    status: room.status,
    currentPlayerIdx: room.currentPlayerIdx,
    currentPlayerId: room.players[room.currentPlayerIdx]?.id ?? null,
    diceValue: room.diceValue,
    diceRolled: room.diceRolled,
    winner: room.winner,
    winnerName: room.winner !== null ? room.players[room.winner]?.name : null,
    hostId: room.hostId,
    lastEvent: room.lastEvent,
  };
}

function nextTurn(io: Server, room: SNLRoom, code: string, extraTurn: boolean) {
  if (!extraTurn) {
    room.currentPlayerIdx = (room.currentPlayerIdx + 1) % room.players.length;
  }
  room.diceValue = null;
  room.diceRolled = false;
  room.lastEvent = null;
  io.to(`snl:${code}`).emit("snl:state", serialize(room));
}

export function registerSNLHandlers(io: Server, socket: Socket, user: { id: number; fullName: string }) {
  socket.on("snl:create", ({ maxPlayers = 2 }: { maxPlayers?: number }) => {
    let code = makeCode();
    while (rooms.has(code)) code = makeCode();
    const room: SNLRoom = {
      code,
      hostId: user.id,
      players: [{ id: user.id, name: user.fullName, colorIdx: 0, socketId: socket.id, position: 0 }],
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 4),
      status: "waiting",
      currentPlayerIdx: 0,
      diceValue: null,
      diceRolled: false,
      winner: null,
      lastEvent: null,
    };
    rooms.set(code, room);
    socket.join(`snl:${code}`);
    socket.emit("snl:created", serialize(room));
  });

  socket.on("snl:join", ({ code }: { code: string }) => {
    const room = rooms.get(code.toUpperCase().trim());
    if (!room) { socket.emit("snl:error", { message: "Room not found." }); return; }
    if (room.status !== "waiting") { socket.emit("snl:error", { message: "Game already started." }); return; }
    if (room.players.find(p => p.id === user.id)) { socket.emit("snl:error", { message: "Already in room." }); return; }
    if (room.players.length >= room.maxPlayers) { socket.emit("snl:error", { message: "Room is full." }); return; }
    room.players.push({ id: user.id, name: user.fullName, colorIdx: room.players.length, socketId: socket.id, position: 0 });
    socket.join(`snl:${code}`);
    io.to(`snl:${code}`).emit("snl:state", serialize(room));
    io.to(`snl:${code}`).emit("snl:player-joined", { name: user.fullName });
  });

  socket.on("snl:start", ({ code }: { code: string }) => {
    const room = rooms.get((code || "").toUpperCase().trim());
    if (!room || room.hostId !== user.id || room.status !== "waiting") return;
    if (room.players.length < 2) { socket.emit("snl:error", { message: "Need at least 2 players." }); return; }
    room.status = "playing";
    io.to(`snl:${code}`).emit("snl:state", serialize(room));
  });

  socket.on("snl:roll", ({ code }: { code: string }) => {
    const room = rooms.get((code || "").toUpperCase().trim());
    if (!room || room.status !== "playing") return;
    const currentPlayer = room.players[room.currentPlayerIdx];
    if (currentPlayer.id !== user.id || room.diceRolled) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    room.diceValue = dice;
    room.diceRolled = true;
    room.lastEvent = null;

    const oldPos = currentPlayer.position;
    let newPos = oldPos + dice;
    const extraTurn = dice === 6;

    if (newPos > 100) {
      // Bounce back
      newPos = 100 - (newPos - 100);
    }

    // Emit the roll so client can animate
    io.to(`snl:${code}`).emit("snl:rolled", { dice, playerId: user.id, playerName: user.fullName, from: oldPos, to: newPos });

    if (newPos === 100) {
      currentPlayer.position = 100;
      room.status = "ended";
      room.winner = room.currentPlayerIdx;
      io.to(`snl:${code}`).emit("snl:state", serialize(room));
      io.to(`snl:${code}`).emit("snl:won", { name: user.fullName });
      setTimeout(() => rooms.delete(code), 60000);
      return;
    }

    currentPlayer.position = newPos;

    if (SNAKES[newPos] !== undefined) {
      room.lastEvent = "snake";
      io.to(`snl:${code}`).emit("snl:state", serialize(room));
      setTimeout(() => {
        const r = rooms.get(code);
        if (!r) return;
        const p = r.players.find(pl => pl.id === user.id);
        if (!p) return;
        p.position = SNAKES[newPos];
        io.to(`snl:${code}`).emit("snl:event", { type: "snake", player: user.fullName, from: newPos, to: SNAKES[newPos] });
        nextTurn(io, r, code, false);
      }, 1500);
    } else if (LADDERS[newPos] !== undefined) {
      room.lastEvent = "ladder";
      io.to(`snl:${code}`).emit("snl:state", serialize(room));
      setTimeout(() => {
        const r = rooms.get(code);
        if (!r) return;
        const p = r.players.find(pl => pl.id === user.id);
        if (!p) return;
        p.position = LADDERS[newPos];
        io.to(`snl:${code}`).emit("snl:event", { type: "ladder", player: user.fullName, from: newPos, to: LADDERS[newPos] });
        nextTurn(io, r, code, false);
      }, 1500);
    } else {
      nextTurn(io, room, code, extraTurn);
    }
  });

  socket.on("snl:leave", ({ code }: { code: string }) => {
    const room = rooms.get((code || "").toUpperCase().trim());
    if (!room) return;
    socket.leave(`snl:${code}`);
    room.players = room.players.filter(p => p.id !== user.id);
    if (room.players.length === 0) { rooms.delete(code); return; }
    if (room.hostId === user.id) room.hostId = room.players[0].id;
    if (room.currentPlayerIdx >= room.players.length) room.currentPlayerIdx = 0;
    io.to(`snl:${code}`).emit("snl:state", serialize(room));
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms) {
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx >= 0) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) { rooms.delete(code); continue; }
        if (room.currentPlayerIdx >= room.players.length) room.currentPlayerIdx = 0;
        io.to(`snl:${code}`).emit("snl:state", serialize(room));
      }
    }
  });
}
