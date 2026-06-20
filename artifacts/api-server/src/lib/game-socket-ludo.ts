import { Server, Socket } from "socket.io";

// 52-cell main path (outer ring, excluding 4 corner cells)
// Left col going UP: indices 0-12 → [13,0]..[1,0]
// Top row going RIGHT: indices 13-25 → [0,1]..[0,13]
// Right col going DOWN: indices 26-38 → [1,14]..[13,14]
// Bottom row going LEFT: indices 39-51 → [14,13]..[14,1]

// Color entry indices on main path (where each color enters from their home)
const ENTRY = [0, 13, 26, 39]; // Red, Yellow, Blue, Green

// Safe squares (absolute path indices) - entry squares of each color + center-area squares
const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home starting positions for tokens [colorIdx][tokenIdx] = [row, col]
const HOME_POS: [number, number][][] = [
  [[10,2],[10,4],[12,2],[12,4]], // Red (bottom-left)
  [[2,2],[2,4],[4,2],[4,4]],    // Yellow (top-left)
  [[2,10],[2,12],[4,10],[4,12]], // Blue (top-right)
  [[10,10],[10,12],[12,10],[12,12]], // Green (bottom-right)
];

const COLORS = ["red", "yellow", "blue", "green"];

interface LudoPlayer { id: number; name: string; colorIdx: number; socketId: string; }

interface LudoRoom {
  code: string;
  hostId: number;
  players: LudoPlayer[];
  maxPlayers: number;
  status: "waiting" | "playing" | "ended";
  tokenPositions: number[][]; // [colorIdx][tokenIdx] = relativePos (-1=home, 0-51=path, 52-56=homestretch, 57=finished)
  currentPlayerIdx: number;
  diceValue: number | null;
  diceRolled: boolean;
  validTokens: number[];
  winner: number | null;
  extraTurn: boolean;
}

const rooms = new Map<string, LudoRoom>();

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function absIdx(colorIdx: number, relPos: number): number {
  return (ENTRY[colorIdx] + relPos) % 52;
}

function getValidTokens(positions: number[][], playerColorIdx: number, dice: number): number[] {
  const valid: number[] = [];
  for (let t = 0; t < 4; t++) {
    const pos = positions[playerColorIdx][t];
    if (pos === 57) continue;
    if (pos === -1) {
      if (dice === 6) valid.push(t);
    } else if (pos >= 0 && pos <= 51) {
      const newPos = pos + dice;
      if (newPos <= 57) valid.push(t);
    } else if (pos >= 52 && pos <= 56) {
      const newPos = pos + dice;
      if (newPos <= 57) valid.push(t);
    }
  }
  return valid;
}

function applyMove(room: LudoRoom, playerIdx: number, colorIdx: number, tokenIdx: number): string | null {
  const dice = room.diceValue!;
  const pos = room.tokenPositions[colorIdx][tokenIdx];
  let newPos = pos === -1 ? 0 : pos + dice;
  room.tokenPositions[colorIdx][tokenIdx] = newPos;

  // Check for kills on main path only (pos 1-51, not on safe squares)
  if (newPos >= 1 && newPos <= 51) {
    const myAbs = absIdx(colorIdx, newPos);
    if (!SAFE_ABS.has(myAbs)) {
      for (let oc = 0; oc < room.players.length; oc++) {
        const opColor = room.players[oc].colorIdx;
        if (opColor === colorIdx) continue;
        for (let ot = 0; ot < 4; ot++) {
          const opPos = room.tokenPositions[opColor][ot];
          if (opPos >= 0 && opPos <= 51 && absIdx(opColor, opPos) === myAbs) {
            room.tokenPositions[opColor][ot] = -1;
            return room.players[oc].name;
          }
        }
      }
    }
  }
  return null;
}

function checkWin(positions: number[], colorIdx: number): boolean {
  return positions.every(p => p === 57);
}

function serialize(room: LudoRoom) {
  return {
    code: room.code,
    players: room.players.map(p => ({ id: p.id, name: p.name, colorIdx: p.colorIdx })),
    maxPlayers: room.maxPlayers,
    status: room.status,
    tokenPositions: room.tokenPositions,
    currentPlayerIdx: room.currentPlayerIdx,
    currentColorIdx: room.players[room.currentPlayerIdx]?.colorIdx ?? 0,
    diceValue: room.diceValue,
    diceRolled: room.diceRolled,
    validTokens: room.validTokens,
    winner: room.winner,
    winnerName: room.winner !== null ? room.players[room.winner]?.name : null,
    hostId: room.hostId,
  };
}

function nextPlayer(room: LudoRoom, extraTurn: boolean) {
  if (!extraTurn) {
    let next = (room.currentPlayerIdx + 1) % room.players.length;
    room.currentPlayerIdx = next;
  }
  room.diceValue = null;
  room.diceRolled = false;
  room.validTokens = [];
}

export function registerLudoHandlers(io: Server, socket: Socket, user: { id: number; fullName: string }) {
  socket.on("ludo:create", ({ maxPlayers = 4 }: { maxPlayers?: number }) => {
    let code = makeCode();
    while (rooms.has(code)) code = makeCode();
    const colorIdx = 0; // Host = Red
    const room: LudoRoom = {
      code,
      hostId: user.id,
      players: [{ id: user.id, name: user.fullName, colorIdx, socketId: socket.id }],
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 4),
      status: "waiting",
      tokenPositions: [[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]],
      currentPlayerIdx: 0,
      diceValue: null,
      diceRolled: false,
      validTokens: [],
      winner: null,
      extraTurn: false,
    };
    rooms.set(code, room);
    socket.join(`ludo:${code}`);
    socket.emit("ludo:created", serialize(room));
  });

  socket.on("ludo:join", ({ code }: { code: string }) => {
    const room = rooms.get(code.toUpperCase().trim());
    if (!room) { socket.emit("ludo:error", { message: "Room not found." }); return; }
    if (room.status !== "waiting") { socket.emit("ludo:error", { message: "Game already started." }); return; }
    if (room.players.find(p => p.id === user.id)) { socket.emit("ludo:error", { message: "Already in room." }); return; }
    if (room.players.length >= room.maxPlayers) { socket.emit("ludo:error", { message: "Room is full." }); return; }
    const colorIdx = room.players.length; // Assign next color
    room.players.push({ id: user.id, name: user.fullName, colorIdx, socketId: socket.id });
    socket.join(`ludo:${code}`);
    io.to(`ludo:${code}`).emit("ludo:state", serialize(room));
    io.to(`ludo:${code}`).emit("ludo:player-joined", { name: user.fullName, players: room.players.map(p => ({ id: p.id, name: p.name, colorIdx: p.colorIdx })) });
  });

  socket.on("ludo:start", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== user.id || room.status !== "waiting") return;
    if (room.players.length < 2) { socket.emit("ludo:error", { message: "Need at least 2 players." }); return; }
    room.status = "playing";
    room.currentPlayerIdx = 0;
    room.tokenPositions = [[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]];
    io.to(`ludo:${code}`).emit("ludo:state", serialize(room));
  });

  socket.on("ludo:roll", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room || room.status !== "playing") return;
    const currentPlayer = room.players[room.currentPlayerIdx];
    if (currentPlayer.id !== user.id) return;
    if (room.diceRolled) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    room.diceValue = dice;
    room.diceRolled = true;
    const colorIdx = currentPlayer.colorIdx;
    room.validTokens = getValidTokens(room.tokenPositions, colorIdx, dice);

    io.to(`ludo:${code}`).emit("ludo:rolled", { dice, validTokens: room.validTokens, playerId: user.id });
    io.to(`ludo:${code}`).emit("ludo:state", serialize(room));

    // Auto-pass if no valid moves
    if (room.validTokens.length === 0) {
      setTimeout(() => {
        if (!rooms.has(code)) return;
        nextPlayer(room, false);
        io.to(`ludo:${code}`).emit("ludo:state", serialize(room));
      }, 1500);
    }
  });

  socket.on("ludo:move", ({ code, tokenIdx }: { code: string; tokenIdx: number }) => {
    const room = rooms.get(code);
    if (!room || room.status !== "playing") return;
    const currentPlayer = room.players[room.currentPlayerIdx];
    if (currentPlayer.id !== user.id) return;
    if (typeof tokenIdx !== "number" || tokenIdx < 0 || tokenIdx > 3) return;
    if (!room.diceRolled || !room.validTokens.includes(tokenIdx)) return;

    const colorIdx = currentPlayer.colorIdx;
    const killedName = applyMove(room, room.currentPlayerIdx, colorIdx, tokenIdx);
    const gotBonus = room.diceValue === 6 || killedName !== null;

    if (killedName) {
      io.to(`ludo:${code}`).emit("ludo:killed", { by: user.fullName, killed: killedName });
    }

    // Check win
    if (checkWin(room.tokenPositions[colorIdx], colorIdx)) {
      room.status = "ended";
      room.winner = room.currentPlayerIdx;
      io.to(`ludo:${code}`).emit("ludo:state", serialize(room));
      io.to(`ludo:${code}`).emit("ludo:won", { name: user.fullName });
      rooms.delete(code);
      return;
    }

    nextPlayer(room, gotBonus);
    io.to(`ludo:${code}`).emit("ludo:state", serialize(room));
  });

  socket.on("ludo:leave", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    socket.leave(`ludo:${code}`);
    room.players = room.players.filter(p => p.id !== user.id);
    if (room.players.length === 0) { rooms.delete(code); return; }
    if (room.hostId === user.id) room.hostId = room.players[0].id;
    if (room.currentPlayerIdx >= room.players.length) room.currentPlayerIdx = 0;
    io.to(`ludo:${code}`).emit("ludo:state", serialize(room));
  });
}
