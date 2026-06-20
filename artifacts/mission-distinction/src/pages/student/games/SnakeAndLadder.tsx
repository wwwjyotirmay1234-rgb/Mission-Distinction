import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Board constants
const CELL = 48;
const BOARD = CELL * 10;

// Snakes and Ladders positions (same as server)
const SNAKES: Record<number, number> = {
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78,
};
const LADDERS: Record<number, number> = {
  4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
};

const COLOR_HEX = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7"];
const COLOR_NAMES = ["Red", "Blue", "Green", "Purple"];

// Convert square number (1-100) to SVG center [x, y]
function squareToXY(sq: number): [number, number] {
  if (sq <= 0) return [CELL / 2 - 6, BOARD - CELL / 2]; // Off-board (start)
  const row = Math.floor((sq - 1) / 10); // 0=bottom, 9=top
  const isOdd = row % 2 === 1;
  const col = isOdd ? 9 - ((sq - 1) % 10) : (sq - 1) % 10;
  const svgRow = 9 - row;
  return [col * CELL + CELL / 2, svgRow * CELL + CELL / 2];
}

function squareToRowCol(sq: number): [number, number] {
  const row = Math.floor((sq - 1) / 10);
  const isOdd = row % 2 === 1;
  const col = isOdd ? 9 - ((sq - 1) % 10) : (sq - 1) % 10;
  return [9 - row, col]; // svgRow, col
}

function DiceFace({ value }: { value: number | null }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  if (!value) return (
    <div className="w-14 h-14 rounded-xl border-2 border-border/50 bg-card/60 flex items-center justify-center text-muted-foreground text-xs select-none">
      Roll!
    </div>
  );
  return (
    <div className="relative w-14 h-14 rounded-xl border-2 border-amber-500/60 bg-white shadow-lg select-none">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        {(dots[value] || []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={10} fill="#1a1a2e" />
        ))}
      </svg>
    </div>
  );
}

function SNLBoard({ positions, currentPlayerId, players, lastEvent }: {
  positions: { id: number; name: string; colorIdx: number; position: number }[];
  currentPlayerId: number | null;
  players: { id: number; name: string; colorIdx: number; position: number }[];
  lastEvent: string | null;
}) {
  // Build the board grid
  const cells = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="relative overflow-auto">
      <svg width={BOARD} height={BOARD} className="border border-border/40 rounded-xl">
        {/* Cell backgrounds */}
        {cells.map(sq => {
          const [r, c] = squareToRowCol(sq);
          const x = c * CELL;
          const y = r * CELL;
          const isSnakeHead = SNAKES[sq] !== undefined;
          const isSnakeTail = Object.values(SNAKES).includes(sq);
          const isLadderBase = LADDERS[sq] !== undefined;
          const isLadderTop = Object.values(LADDERS).includes(sq);
          const isEven = (Math.floor((sq - 1) / 10) + c) % 2 === 0;

          let fill = isEven ? "#1e1b4b" : "#1e293b";
          if (isSnakeHead) fill = "#450a0a";
          else if (isSnakeTail) fill = "#4c0519";
          else if (isLadderBase) fill = "#052e16";
          else if (isLadderTop) fill = "#14532d";

          return (
            <g key={sq}>
              <rect x={x} y={y} width={CELL} height={CELL} fill={fill} stroke="#334155" strokeWidth={0.5} />
              <text x={x + 3} y={y + 10} fill="#94a3b8" fontSize={9} fontWeight="bold">{sq}</text>
              {isSnakeHead && (
                <text x={x + CELL / 2} y={y + CELL / 2 + 3} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🐍</text>
              )}
              {isLadderBase && (
                <text x={x + CELL / 2} y={y + CELL / 2 + 3} textAnchor="middle" dominantBaseline="middle" fontSize={14}>🪜</text>
              )}
              {sq === 100 && (
                <text x={x + CELL / 2} y={y + CELL / 2 + 3} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🏆</text>
              )}
            </g>
          );
        })}

        {/* Snake lines */}
        {Object.entries(SNAKES).map(([head, tail]) => {
          const [hx, hy] = squareToXY(Number(head));
          const [tx, ty] = squareToXY(tail);
          const mx = (hx + tx) / 2 + (hx > tx ? 20 : -20);
          const my = (hy + ty) / 2;
          return (
            <path key={`snake-${head}`}
              d={`M ${hx} ${hy} Q ${mx} ${my} ${tx} ${ty}`}
              stroke="#ef4444" strokeWidth={3} fill="none" strokeLinecap="round"
              strokeDasharray="8 3" opacity={0.7}
            />
          );
        })}

        {/* Ladder lines */}
        {Object.entries(LADDERS).map(([base, top]) => {
          const [bx, by] = squareToXY(Number(base));
          const [tx, ty] = squareToXY(Number(top));
          // Two rails offset
          const dx = ty - by, dy = bx - tx;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ox = (dx / len) * 5, oy = (dy / len) * 5;
          return (
            <g key={`ladder-${base}`} opacity={0.75}>
              <line x1={bx - ox} y1={by - oy} x2={tx - ox} y2={ty - oy} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" />
              <line x1={bx + ox} y1={by + oy} x2={tx + ox} y2={ty + oy} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" />
              {[0.25, 0.5, 0.75].map(t => (
                <line key={t}
                  x1={(bx - ox) + ((tx - ox) - (bx - ox)) * t}
                  y1={(by - oy) + ((ty - oy) - (by - oy)) * t}
                  x2={(bx + ox) + ((tx + ox) - (bx + ox)) * t}
                  y2={(by + oy) + ((ty + oy) - (by + oy)) * t}
                  stroke="#22c55e" strokeWidth={2} strokeLinecap="round"
                />
              ))}
            </g>
          );
        })}

        {/* Player tokens */}
        {players.map((p, idx) => {
          if (p.position <= 0) {
            // Off-board: show in a corner start zone
            const offX = 4 + (p.colorIdx % 2) * 16;
            const offY = BOARD - CELL / 2 - 4 - Math.floor(p.colorIdx / 2) * 14;
            return (
              <g key={p.id}>
                <circle cx={offX} cy={offY} r={7} fill={COLOR_HEX[p.colorIdx]} stroke="white" strokeWidth={1.5} />
                <text x={offX} y={offY + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={7} fontWeight="bold">{idx + 1}</text>
              </g>
            );
          }
          const [px, py] = squareToXY(p.position);
          // Offset tokens sharing a square
          const sameSquare = players.filter(q => q.position === p.position && q.id !== p.id);
          const offsetIdx = sameSquare.findIndex(q => q.colorIdx < p.colorIdx);
          const offsetX = offsetIdx >= 0 ? (p.colorIdx % 2 === 0 ? -7 : 7) : 0;
          const offsetY = offsetIdx >= 0 ? (p.colorIdx < 2 ? -5 : 5) : 0;

          return (
            <g key={p.id}>
              <circle
                cx={px + offsetX} cy={py + offsetY} r={11}
                fill={COLOR_HEX[p.colorIdx]}
                stroke={p.id === currentPlayerId ? "white" : "rgba(0,0,0,0.5)"}
                strokeWidth={p.id === currentPlayerId ? 2.5 : 1.5}
              />
              <text x={px + offsetX} y={py + offsetY + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight="bold" style={{ pointerEvents: "none" }}>
                {idx + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type Phase = "setup" | "lobby" | "game" | "ended";

interface Player { id: number; name: string; colorIdx: number; position: number; }
interface GameState {
  code: string;
  players: Player[];
  maxPlayers: number;
  status: string;
  currentPlayerIdx: number;
  currentPlayerId: number | null;
  diceValue: number | null;
  diceRolled: boolean;
  winner: number | null;
  winnerName: string | null;
  hostId: number;
  lastEvent: "snake" | "ladder" | null;
}

export default function SnakeAndLadder({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [joinMode, setJoinMode] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("2");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const myPlayerIdx = gameState?.players.findIndex(p => p.id === myId) ?? -1;
  const isMyTurn = gameState?.currentPlayerId === myId;
  const isHost = gameState?.hostId === myId;

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Please log in."); return null; }
    const s = io({ path: "/api/socket.io/", auth: { token }, transports: ["websocket", "polling"] });
    s.on("connect_error", err => { toast.error("Connection failed: " + err.message); setConnecting(false); });
    s.on("snl:error", ({ message }: { message: string }) => { toast.error(message); setConnecting(false); });
    s.on("snl:created", (state: GameState) => {
      setGameState(state); setPhase("lobby"); setConnecting(false);
    });
    s.on("snl:state", (state: GameState) => {
      setGameState(state);
      if (state.status === "playing") setPhase("game");
      if (state.status === "ended") setPhase("ended");
    });
    s.on("snl:player-joined", ({ name }: { name: string }) => {
      toast.success(`${name} joined!`);
    });
    s.on("snl:rolled", ({ dice, playerName, from, to }: any) => {
      setLastMsg(`${playerName} rolled ${dice} — moved to square ${to}`);
    });
    s.on("snl:event", ({ type, player, from, to }: any) => {
      if (type === "snake") toast(`🐍 ${player} hit a snake! ${from} → ${to}`);
      else if (type === "ladder") toast(`🪜 ${player} climbed a ladder! ${from} → ${to}`, { icon: "🎉" });
      setLastMsg(type === "snake" ? `🐍 ${player} slid from ${from} to ${to}` : `🪜 ${player} climbed from ${from} to ${to}`);
    });
    s.on("snl:won", ({ name }: { name: string }) => {
      toast.success(`🏆 ${name} wins!`);
    });
    socketRef.current = s;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyId(payload.userId || payload.sub || null);
    } catch {}
    return s;
  }, []);

  const handleCreate = () => {
    setConnecting(true);
    const s = connect();
    if (!s) return;
    s.on("connect", () => s.emit("snl:create", { maxPlayers: parseInt(maxPlayers) }));
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error("Enter a 6-character code."); return; }
    setConnecting(true);
    const s = connect();
    if (!s) return;
    s.on("connect", () => { s.emit("snl:join", { code }); setJoinCode(""); });
  };

  const handleStart = () => socketRef.current?.emit("snl:start", { code: gameState?.code });
  const handleRoll = () => {
    if (!isMyTurn || gameState?.diceRolled) return;
    socketRef.current?.emit("snl:roll", { code: gameState?.code });
  };
  const handleLeave = () => {
    socketRef.current?.emit("snl:leave", { code: gameState?.code });
    socketRef.current?.disconnect();
    socketRef.current = null;
    setPhase("setup");
    setGameState(null);
    setLastMsg(null);
  };

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  // ── Setup ──
  if (phase === "setup") {
    return (
      <div className="space-y-5">
        <div className="flex gap-2">
          <Button variant={joinMode === "create" ? "default" : "outline"} className="flex-1" onClick={() => setJoinMode("create")}>Create</Button>
          <Button variant={joinMode === "join" ? "default" : "outline"} className="flex-1" onClick={() => setJoinMode("join")}>Join</Button>
        </div>
        {joinMode === "create" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Number of Players</p>
              <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                <SelectTrigger className="bg-card/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={connecting} className="w-full">
              {connecting ? "Creating…" : "Create Room"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono uppercase bg-card/40"
            />
            <Button onClick={handleJoin} disabled={connecting || joinCode.trim().length !== 6} className="w-full">
              {connecting ? "Joining…" : "Join Game"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Lobby ──
  if (phase === "lobby" && gameState) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Room Code</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black tracking-widest text-primary font-mono">{gameState.code}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(gameState.code); toast.success("Copied!"); }}>
              <Copy size={13} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{gameState.players.length}/{gameState.maxPlayers} players</p>
        </div>
        <div className="space-y-2">
          {gameState.players.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card/40 border border-border/40">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_HEX[p.colorIdx] }} />
              <span className="flex-1 text-sm font-medium">{p.name}</span>
              <Badge variant="outline" className="text-[10px]" style={{ borderColor: COLOR_HEX[p.colorIdx], color: COLOR_HEX[p.colorIdx] }}>
                {COLOR_NAMES[p.colorIdx]}
              </Badge>
              {p.id === gameState.hostId && <span className="text-xs text-amber-400">Host</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {isHost ? (
            <Button onClick={handleStart} disabled={gameState.players.length < 2} className="flex-1">
              Start Game
            </Button>
          ) : (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2 animate-pulse">Waiting for host…</div>
          )}
          <Button variant="outline" size="icon" onClick={handleLeave}><LogOut size={14} /></Button>
        </div>
      </div>
    );
  }

  // ── Game / Ended ──
  if ((phase === "game" || phase === "ended") && gameState) {
    const currentPlayer = gameState.players[gameState.currentPlayerIdx];
    const currentColorIdx = currentPlayer?.colorIdx ?? 0;

    return (
      <div className="space-y-3">
        {/* Player status pills */}
        <div className="flex gap-2 flex-wrap">
          {gameState.players.map((p, idx) => {
            const isCurrent = gameState.currentPlayerIdx === idx;
            return (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                isCurrent ? "border-white/40 bg-white/10 font-semibold" : "border-border/30 opacity-70"
              }`}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_HEX[p.colorIdx] }} />
                <span>{p.name.split(" ")[0]}</span>
                <span className="text-muted-foreground">{p.position === 0 ? "Start" : `Sq ${p.position}`}</span>
              </div>
            );
          })}
        </div>

        {/* Board */}
        <SNLBoard
          positions={gameState.players}
          currentPlayerId={gameState.currentPlayerId}
          players={gameState.players}
          lastEvent={gameState.lastEvent}
        />

        {/* Last move log */}
        {lastMsg && (
          <div className="text-xs text-center text-muted-foreground bg-card/30 rounded-lg py-2 px-3 font-mono">
            {lastMsg}
          </div>
        )}

        {/* Controls */}
        {gameState.status === "playing" && (
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={handleRoll}>
              <AnimatePresence mode="wait">
                <motion.div key={gameState.diceValue ?? "empty"}
                  initial={{ scale: 0.7, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.3 }}>
                  <DiceFace value={gameState.diceValue} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex-1">
              {isMyTurn && !gameState.diceRolled ? (
                <Button onClick={handleRoll} className="w-full gap-2" style={{ backgroundColor: COLOR_HEX[myPlayerIdx >= 0 ? (gameState.players[myPlayerIdx]?.colorIdx ?? 0) : 0] + "cc" }}>
                  🎲 Roll Dice
                </Button>
              ) : isMyTurn && gameState.diceRolled ? (
                <p className="text-sm text-center text-muted-foreground">Moving…</p>
              ) : (
                <p className="text-sm text-center text-muted-foreground">
                  <span style={{ color: COLOR_HEX[currentColorIdx] }} className="font-semibold">{currentPlayer?.name?.split(" ")[0]}</span>'s turn
                </p>
              )}
            </div>
          </div>
        )}

        {/* Winner */}
        {gameState.status === "ended" && gameState.winnerName && (
          <div className="text-center p-4 rounded-xl bg-card/40 border border-border/40 space-y-2">
            <p className="text-3xl">🏆</p>
            <p className="font-bold text-lg">{gameState.winnerName} wins!</p>
            <Button onClick={handleLeave}>Play Again</Button>
          </div>
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
            <span>🐍</span><span>Snake = slide down</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <span>🪜</span><span>Ladder = climb up</span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleLeave} className="w-full gap-2 opacity-60 hover:opacity-100">
          <LogOut size={13} /> Leave Game
        </Button>
      </div>
    );
  }

  return null;
}
