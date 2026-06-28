import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, LogOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Board geometry
const CELL = 36;          // pixels per cell
const BOARD = CELL * 15;  // 540px

// 52-cell main path [row, col]
// Left col up: indices 0-12 → [13,0]..[1,0]
// Top row right: indices 13-25 → [0,1]..[0,13]
// Right col down: indices 26-38 → [1,14]..[13,14]
// Bottom row left: indices 39-51 → [14,13]..[14,1]
function buildMainPath(): [number,number][] {
  const p: [number,number][] = [];
  for (let r = 13; r >= 1; r--) p.push([r, 0]);
  for (let c = 1; c <= 13; c++) p.push([0, c]);
  for (let r = 1; r <= 13; r++) p.push([r, 14]);
  for (let c = 13; c >= 1; c--) p.push([14, c]);
  return p;
}
const MAIN_PATH = buildMainPath();

const ENTRY = [0, 13, 26, 39]; // Red, Yellow, Blue, Green

// Home stretch positions per color (5 squares → center [7,7])
const HOME_STRETCH: [number,number][][] = [
  [[12,7],[11,7],[10,7],[9,7],[8,7]],  // Red (from bottom)
  [[2,7],[3,7],[4,7],[5,7],[6,7]],     // Yellow (from top)
  [[7,12],[7,11],[7,10],[7,9],[7,8]],  // Blue (from right)
  [[7,2],[7,3],[7,4],[7,5],[7,6]],     // Green (from left)
];

// Token starting positions in home area
const HOME_POS: [number,number][][] = [
  [[10,2],[10,4],[12,2],[12,4]],
  [[2,2],[2,4],[4,2],[4,4]],
  [[2,10],[2,12],[4,10],[4,12]],
  [[10,10],[10,12],[12,10],[12,12]],
];

const COLOR_HEX = ["#ef4444","#eab308","#3b82f6","#22c55e"];
const COLOR_NAMES = ["Red","Yellow","Blue","Green"];
const COLOR_HOME_BOUNDS: [number,number,number,number][] = [
  [9,0,14,5],   // Red: rows 9-14, cols 0-5
  [0,0,5,5],    // Yellow
  [0,9,5,14],   // Blue
  [9,9,14,14],  // Green
];

function cellCenter(row: number, col: number): [number, number] {
  return [col * CELL + CELL / 2, row * CELL + CELL / 2];
}

function getTokenPos(colorIdx: number, relPos: number): [number, number] {
  if (relPos === -1) return [-100, -100]; // Hidden, rendered from HOME_POS
  if (relPos === 57) return cellCenter(7, 7);
  if (relPos >= 52) {
    const hs = HOME_STRETCH[colorIdx][relPos - 52];
    if (!hs) return cellCenter(7, 7);
    return cellCenter(hs[0], hs[1]);
  }
  const absIdx = (ENTRY[colorIdx] + relPos) % 52;
  const [r, c] = MAIN_PATH[absIdx];
  return cellCenter(r, c);
}

type Phase = "setup" | "lobby" | "game" | "ended";

interface Player { id: number; name: string; colorIdx: number; }
interface GameState {
  code: string;
  players: Player[];
  maxPlayers: number;
  status: string;
  tokenPositions: number[][];
  currentPlayerIdx: number;
  currentColorIdx: number;
  diceValue: number | null;
  diceRolled: boolean;
  validTokens: number[];
  winner: number | null;
  winnerName: string | null;
  hostId: number;
}

function DiceFace({ value }: { value: number | null }) {
  if (value === null) return (
    <div className="w-14 h-14 rounded-xl border-2 border-border/50 bg-card/60 flex items-center justify-center text-muted-foreground text-xs">
      Roll!
    </div>
  );
  const dots: Record<number, number[][]> = {
    1: [[50,50]],
    2: [[25,25],[75,75]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
  };
  return (
    <div className="relative w-14 h-14 rounded-xl border-2 border-amber-500/60 bg-white shadow-lg">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        {(dots[value] || []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={9} fill="#1a1a2e" />
        ))}
      </svg>
    </div>
  );
}

function LudoBoard({ state, myColorIdx, onTokenClick, validTokens }: {
  state: GameState;
  myColorIdx: number;
  onTokenClick: (colorIdx: number, tokenIdx: number) => void;
  validTokens: number[];
}) {
  const isMyTurn = state.currentColorIdx === myColorIdx;

  return (
    <div className="relative overflow-auto">
      <svg width={BOARD} height={BOARD} className="border border-border/40 rounded-xl bg-[#1a1a2e]">
        {/* Home area backgrounds */}
        {COLOR_HOME_BOUNDS.map(([r1,c1,r2,c2], ci) => (
          <rect key={ci}
            x={c1 * CELL} y={r1 * CELL}
            width={(c2-c1+1)*CELL} height={(r2-r1+1)*CELL}
            fill={COLOR_HEX[ci]} opacity={0.18}
            rx={4}
          />
        ))}

        {/* Center area background */}
        <rect x={3*CELL} y={3*CELL} width={9*CELL} height={9*CELL} fill="white" opacity={0.03} rx={4} />

        {/* Main path squares */}
        {MAIN_PATH.map(([r,c], i) => {
          const isSafeSquare = [0,13,26,39].includes(i);
          const colorForSquare = isSafeSquare ? COLOR_HEX[ENTRY.indexOf(i)] : null;
          return (
            <rect key={i}
              x={c * CELL + 1} y={r * CELL + 1}
              width={CELL - 2} height={CELL - 2}
              fill={isSafeSquare && colorForSquare ? colorForSquare : "white"}
              opacity={isSafeSquare ? 0.3 : 0.1}
              rx={2}
            />
          );
        })}

        {/* Home stretch lanes */}
        {HOME_STRETCH.map((lane, ci) =>
          lane.map(([r, c], si) => (
            <rect key={`hs-${ci}-${si}`}
              x={c * CELL + 1} y={r * CELL + 1}
              width={CELL - 2} height={CELL - 2}
              fill={COLOR_HEX[ci]} opacity={0.35}
              rx={2}
            />
          ))
        )}

        {/* Center star */}
        <polygon
          points={`${7.5*CELL},${5.5*CELL} ${8*CELL},${7*CELL} ${9.5*CELL},${7.5*CELL} ${8*CELL},${8*CELL} ${7.5*CELL},${9.5*CELL} ${7*CELL},${8*CELL} ${5.5*CELL},${7.5*CELL} ${7*CELL},${7*CELL}`}
          fill="gold" opacity={0.5}
        />

        {/* Home circles */}
        {HOME_POS.map((positions, ci) =>
          positions.map(([r, c], ti) => {
            const [cx, cy] = cellCenter(r, c);
            return (
              <circle key={`hc-${ci}-${ti}`}
                cx={cx} cy={cy} r={CELL * 0.38}
                fill={COLOR_HEX[ci]} opacity={0.25}
                stroke={COLOR_HEX[ci]} strokeWidth={1.5}
              />
            );
          })
        )}

        {/* Tokens */}
        {state.players.map(player => {
          const ci = player.colorIdx;
          return Array.from({ length: 4 }).map((_, ti) => {
            const relPos = state.tokenPositions[ci]?.[ti] ?? -1;
            const isAtHome = relPos === -1;
            const [cx, cy] = isAtHome ? cellCenter(HOME_POS[ci][ti][0], HOME_POS[ci][ti][1]) : getTokenPos(ci, relPos);
            const isValid = isMyTurn && ci === myColorIdx && validTokens.includes(ti) && state.diceRolled;

            return (
              <motion.circle
                key={`t-${ci}-${ti}`}
                cx={cx} cy={cy} r={CELL * 0.36}
                fill={COLOR_HEX[ci]}
                stroke={isValid ? "white" : "rgba(0,0,0,0.5)"}
                strokeWidth={isValid ? 3 : 1.5}
                style={{ cursor: isValid ? "pointer" : "default", filter: isValid ? "drop-shadow(0 0 6px white)" : undefined }}
                onClick={() => isValid && onTokenClick(ci, ti)}
                animate={{ scale: isValid ? [1, 1.15, 1] : 1 }}
                transition={{ repeat: isValid ? Infinity : 0, duration: 0.8 }}
              >
                <title>{COLOR_NAMES[ci]} token {ti + 1}</title>
              </motion.circle>
            );
          });
        })}

        {/* Token labels */}
        {state.players.map(player => {
          const ci = player.colorIdx;
          return Array.from({ length: 4 }).map((_, ti) => {
            const relPos = state.tokenPositions[ci]?.[ti] ?? -1;
            const isAtHome = relPos === -1;
            const [cx, cy] = isAtHome ? cellCenter(HOME_POS[ci][ti][0], HOME_POS[ci][ti][1]) : getTokenPos(ci, relPos);
            return (
              <text key={`tl-${ci}-${ti}`} x={cx} y={cy + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={10} fontWeight="bold" style={{ pointerEvents: "none" }}>
                {ti + 1}
              </text>
            );
          });
        })}
      </svg>
    </div>
  );
}

// ─── Ludo AI (Local) ─────────────────────────────────────────────────────────

const LUDO_SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

interface LocalLudoPlayer { id: number; name: string; colorIdx: number; isAI: boolean; }
interface LocalLudoState {
  players: LocalLudoPlayer[];
  tokenPositions: number[][];  // [colorIdx][tokenIdx] = relPos (-1=home, 0-51=path, 52-56=stretch, 57=done)
  currentPlayerIdx: number;
  currentColorIdx: number;
  diceValue: number | null;
  diceRolled: boolean;
  validTokens: number[];
  status: string;
  winner: LocalLudoPlayer | null;
  extraTurn: boolean;
}

function ludoAbsPos(colorIdx: number, relPos: number): number {
  return (ENTRY[colorIdx] + relPos) % 52;
}

function ludoValidTokens(positions: number[][], colorIdx: number, dice: number): number[] {
  const valid: number[] = [];
  for (let ti = 0; ti < 4; ti++) {
    const rp = positions[colorIdx][ti];
    if (rp === 57) continue;
    if (rp === -1) { if (dice === 6) valid.push(ti); continue; }
    if (rp + dice <= 57) valid.push(ti);
  }
  return valid;
}

function ludoApplyMove(state: LocalLudoState, colorIdx: number, ti: number, dice: number): LocalLudoState {
  const pos = state.tokenPositions.map(r => [...r]);
  const rp = pos[colorIdx][ti];
  const newRp = rp === -1 ? 0 : rp + dice;
  pos[colorIdx][ti] = newRp;

  let killed = false;
  if (newRp < 52) {
    const abs = ludoAbsPos(colorIdx, newRp);
    if (!LUDO_SAFE_ABS.has(abs)) {
      for (const p of state.players) {
        if (p.colorIdx === colorIdx) continue;
        for (let oti = 0; oti < 4; oti++) {
          const orp = pos[p.colorIdx][oti];
          if (orp === -1 || orp >= 52) continue;
          if (ludoAbsPos(p.colorIdx, orp) === abs) { pos[p.colorIdx][oti] = -1; killed = true; }
        }
      }
    }
  }

  const allHome = pos[colorIdx].every(p => p === 57);
  const extra = dice === 6 || killed;
  const nextIdx = allHome || !extra ? (state.currentPlayerIdx + 1) % state.players.length : state.currentPlayerIdx;
  const nextColorIdx = state.players[nextIdx].colorIdx;

  return {
    ...state, tokenPositions: pos, currentPlayerIdx: nextIdx, currentColorIdx: nextColorIdx,
    diceValue: null, diceRolled: false, validTokens: [],
    status: allHome ? "ended" : "playing",
    winner: allHome ? state.players.find(p => p.colorIdx === colorIdx) ?? null : null,
    extraTurn: extra && !allHome,
  };
}

function ludoAIToken(state: LocalLudoState, colorIdx: number, validTokens: number[]): number {
  if (validTokens.length === 1) return validTokens[0];
  const pos = state.tokenPositions;
  const dice = state.diceValue!;
  // Priority 1: kill
  for (const ti of validTokens) {
    const rp = pos[colorIdx][ti];
    const newRp = rp === -1 ? 0 : rp + dice;
    if (newRp < 52 && !LUDO_SAFE_ABS.has(ludoAbsPos(colorIdx, newRp))) {
      for (const p of state.players) {
        if (p.colorIdx === colorIdx) continue;
        for (let oti = 0; oti < 4; oti++) {
          const orp = pos[p.colorIdx][oti];
          if (orp !== -1 && orp < 52 && ludoAbsPos(p.colorIdx, orp) === ludoAbsPos(colorIdx, newRp)) return ti;
        }
      }
    }
  }
  // Priority 2: furthest token
  return validTokens.reduce((best, ti) => pos[colorIdx][ti] > pos[colorIdx][best] ? ti : best, validTokens[0]);
}

function LudoAIGame({ onBack, numAI }: { onBack: () => void; numAI: number }) {
  const initState = (): LocalLudoState => {
    const players: LocalLudoPlayer[] = [
      { id: 0, name: "You", colorIdx: 0, isAI: false },
      ...Array.from({ length: numAI }, (_, i) => ({ id: i + 1, name: `Meddy AI ${i + 1} 🤖`, colorIdx: i + 1, isAI: true })),
    ];
    const tokenPositions = [0, 1, 2, 3].map(() => [-1, -1, -1, -1]);
    return {
      players, tokenPositions, currentPlayerIdx: 0, currentColorIdx: 0,
      diceValue: null, diceRolled: false, validTokens: [], status: "playing",
      winner: null, extraTurn: false,
    };
  };

  const [state, setState] = useState<LocalLudoState>(initState);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn = !currentPlayer?.isAI && state.status === "playing";

  // AI auto-play
  useEffect(() => {
    if (state.status !== "playing" || !currentPlayer?.isAI) return;
    aiTimer.current = setTimeout(() => {
      setState(prev => {
        if (!prev.diceRolled) {
          // Roll dice
          const dice = Math.floor(Math.random() * 6) + 1;
          const valid = ludoValidTokens(prev.tokenPositions, prev.currentColorIdx, dice);
          if (valid.length === 0) {
            // No valid moves: pass turn
            const nextIdx = (prev.currentPlayerIdx + 1) % prev.players.length;
            return { ...prev, diceValue: dice, diceRolled: true, validTokens: [],
              currentPlayerIdx: nextIdx, currentColorIdx: prev.players[nextIdx].colorIdx,
              diceRolled: false, diceValue: null };
          }
          return { ...prev, diceValue: dice, diceRolled: true, validTokens: valid };
        } else {
          // Move token
          const ti = ludoAIToken(prev, prev.currentColorIdx, prev.validTokens);
          return ludoApplyMove(prev, prev.currentColorIdx, ti, prev.diceValue!);
        }
      });
    }, state.diceRolled ? 600 : 900);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [state.currentPlayerIdx, state.diceRolled, state.status, currentPlayer?.isAI]);

  const handleRoll = () => {
    if (!isMyTurn || state.diceRolled) return;
    const dice = Math.floor(Math.random() * 6) + 1;
    const valid = ludoValidTokens(state.tokenPositions, state.currentColorIdx, dice);
    if (valid.length === 0) {
      // No valid tokens: auto pass
      const nextIdx = (state.currentPlayerIdx + 1) % state.players.length;
      setState(prev => ({
        ...prev, diceValue: dice, diceRolled: false, validTokens: [],
        currentPlayerIdx: nextIdx, currentColorIdx: prev.players[nextIdx].colorIdx,
      }));
    } else {
      setState(prev => ({ ...prev, diceValue: dice, diceRolled: true, validTokens: valid }));
    }
  };

  const handleTokenClick = (_ci: number, ti: number) => {
    if (!isMyTurn || !state.diceRolled || !state.validTokens.includes(ti)) return;
    setState(prev => ludoApplyMove(prev, prev.currentColorIdx, ti, prev.diceValue!));
  };

  const myColorIdx = state.players[0].colorIdx;

  // Adapt state for LudoBoard (needs GameState shape)
  const boardState = {
    ...state,
    code: "LOCAL", hostId: -1, maxPlayers: state.players.length,
    winner: state.winner ? state.winner.id : null,
    winnerName: state.winner?.name ?? null,
    players: state.players,
  } as unknown as GameState;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {state.players.map((p, idx) => {
          const finished = state.tokenPositions[p.colorIdx]?.filter(pos => pos === 57).length ?? 0;
          const isCurrent = state.currentPlayerIdx === idx;
          return (
            <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
              isCurrent ? "border-white/40 bg-white/10 font-semibold" : "border-border/30 opacity-70"
            }`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_HEX[p.colorIdx] }} />
              <span>{p.name.split(" ")[0]}</span>
              <span className="text-muted-foreground">({finished}/4)</span>
            </div>
          );
        })}
      </div>

      <LudoBoard state={boardState} myColorIdx={myColorIdx}
        onTokenClick={handleTokenClick} validTokens={isMyTurn ? state.validTokens : []} />

      {state.status === "playing" && (
        <div className="flex items-center gap-4">
          <div className="cursor-pointer" onClick={handleRoll}>
            <AnimatePresence mode="wait">
              <motion.div key={state.diceValue ?? "empty"} initial={{ scale: 0.7, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", duration: 0.3 }}>
                <DiceFace value={state.diceValue} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex-1">
            {isMyTurn && !state.diceRolled ? (
              <Button onClick={handleRoll} className="w-full gap-2" style={{ backgroundColor: COLOR_HEX[myColorIdx] + "cc" }}>
                🎲 Roll Dice
              </Button>
            ) : isMyTurn && state.diceRolled && state.validTokens.length > 0 ? (
              <p className="text-sm text-center font-medium">Click a glowing token to move</p>
            ) : currentPlayer?.isAI ? (
              <p className="text-sm text-center text-muted-foreground animate-pulse">
                <span style={{ color: COLOR_HEX[currentPlayer.colorIdx] }} className="font-semibold">
                  {currentPlayer.name.split(" ").slice(0, 3).join(" ")}
                </span> is thinking…
              </p>
            ) : null}
          </div>
        </div>
      )}

      {state.status === "ended" && state.winner && (
        <div className="text-center p-4 rounded-xl bg-card/40 border border-border/40 space-y-3">
          <p className="text-2xl">🏆</p>
          <p className="font-bold text-lg">{state.winner.name} wins!</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setState(initState())} className="gap-2"><RotateCcw size={14} /> Play Again</Button>
            <Button variant="outline" onClick={onBack} className="gap-2"><LogOut size={14} /> Back</Button>
          </div>
        </div>
      )}

      {state.status === "playing" && (
        <Button variant="outline" size="sm" onClick={onBack} className="w-full gap-2 opacity-60 hover:opacity-100">
          <LogOut size={13} /> Leave
        </Button>
      )}
    </div>
  );
}

// ─── Ludo Multiplayer ─────────────────────────────────────────────────────────
export default function LudoGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [joinMode, setJoinMode] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lastDice, setLastDice] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [gameMode, setGameMode] = useState<"menu" | "ai">("menu");
  const [numAI, setNumAI] = useState(1);

  const myPlayerIdx = gameState?.players.findIndex(p => p.id === myId) ?? -1;
  const myColorIdx = myPlayerIdx >= 0 ? (gameState?.players[myPlayerIdx]?.colorIdx ?? 0) : 0;

  const connect = useCallback(() => {
    const token = localStorage.getItem("mission_token");
    if (!token) { toast.error("Please log in."); return null; }
    const s = io({ path: "/api/socket.io/", auth: { token }, transports: ["websocket", "polling"] });
    s.on("connect_error", err => { toast.error("Connection failed: " + err.message); setConnecting(false); });
    s.on("ludo:error", ({ message }: { message: string }) => { toast.error(message); setConnecting(false); });
    s.on("ludo:created", (state: GameState) => {
      setGameState(state);
      setPhase("lobby");
      setConnecting(false);
    });
    s.on("ludo:state", (state: GameState) => {
      setGameState(state);
      if (state.status === "playing") setPhase("game");
      if (state.status === "ended") setPhase("ended");
    });
    s.on("ludo:player-joined", ({ name }: { name: string }) => {
      toast.success(`${name} joined!`);
    });
    s.on("ludo:rolled", ({ dice }: { dice: number }) => {
      setLastDice(dice);
    });
    s.on("ludo:killed", ({ by, killed }: { by: string; killed: string }) => {
      toast(`💥 ${by} sent ${killed}'s token home!`);
    });
    s.on("ludo:won", ({ name }: { name: string }) => {
      toast.success(`🏆 ${name} wins!`);
    });
    socketRef.current = s;
    // Get my own user ID from token
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
    s.on("connect", () => s.emit("ludo:create", { maxPlayers: parseInt(maxPlayers) }));
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error("Enter a 6-character code."); return; }
    setConnecting(true);
    const s = connect();
    if (!s) return;
    s.on("connect", () => s.emit("ludo:join", { code }));
  };

  const handleStart = () => socketRef.current?.emit("ludo:start", { code: gameState?.code });
  const handleRoll = () => socketRef.current?.emit("ludo:roll", { code: gameState?.code });
  const handleTokenClick = (colorIdx: number, tokenIdx: number) => {
    socketRef.current?.emit("ludo:move", { code: gameState?.code, tokenIdx });
  };
  const handleLeave = () => {
    socketRef.current?.emit("ludo:leave", { code: gameState?.code });
    socketRef.current?.disconnect();
    socketRef.current = null;
    setPhase("setup");
    setGameState(null);
    setLastDice(null);
  };

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  const isMyTurn = gameState && myPlayerIdx >= 0 && gameState.currentPlayerIdx === myPlayerIdx;
  const isHost = gameState?.hostId === myId;
  const currentPlayerName = gameState?.players[gameState.currentPlayerIdx]?.name;
  const currentColorIdx = gameState?.currentColorIdx ?? 0;

  // ── Setup ──
  if (phase === "setup") {
    if (gameMode === "ai") {
      return <LudoAIGame onBack={() => setGameMode("menu")} numAI={numAI} />;
    }
    return (
      <div className="space-y-5">
        {/* vs AI */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <p className="font-semibold text-sm">Play vs AI (Offline)</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Number of AI opponents</p>
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <Button key={n} variant={numAI === n ? "default" : "outline"} size="sm" className="flex-1"
                  onClick={() => setNumAI(n)}>{n} AI</Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 text-sm p-3 rounded-lg bg-card/30 border border-border/30">
            <span style={{ color: COLOR_HEX[0] }} className="font-semibold">You (Red)</span>
            {Array.from({ length: numAI }, (_, i) => (
              <span key={i} style={{ color: COLOR_HEX[i + 1] }} className="font-semibold">{COLOR_NAMES[i + 1]}</span>
            ))}
          </div>
          <Button onClick={() => setGameMode("ai")} className="w-full gap-2">🎮 Start vs AI</Button>
        </div>

        {/* Multiplayer */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold text-center">Or play online</p>
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
            <div className="flex gap-2 text-sm p-3 rounded-lg bg-card/30 border border-border/30">
              {["Red","Yellow","Blue","Green"].slice(0, parseInt(maxPlayers)).map((c, i) => (
                <span key={c} style={{ color: COLOR_HEX[i] }} className="font-semibold">{c}</span>
              ))}
            </div>
            <Button onClick={handleCreate} disabled={connecting} className="w-full gap-2">
              {connecting ? "Creating…" : "Create Ludo Room"}
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
          {gameState.players.map(p => (
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
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">Waiting for host…</div>
          )}
          <Button variant="outline" size="icon" onClick={handleLeave}><LogOut size={14} /></Button>
        </div>
      </div>
    );
  }

  // ── Game ──
  if ((phase === "game" || phase === "ended") && gameState) {
    return (
      <div className="space-y-4">
        {/* Players scores */}
        <div className="flex gap-2 flex-wrap">
          {gameState.players.map((p, idx) => {
            const finished = gameState.tokenPositions[p.colorIdx]?.filter(pos => pos === 57).length ?? 0;
            const isCurrent = gameState.currentPlayerIdx === idx;
            return (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                isCurrent ? "border-white/40 bg-white/10 font-semibold" : "border-border/30 opacity-70"
              }`}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_HEX[p.colorIdx] }} />
                <span>{p.name.split(" ")[0]}</span>
                <span className="text-muted-foreground">({finished}/4)</span>
              </div>
            );
          })}
        </div>

        {/* Board */}
        <LudoBoard
          state={gameState}
          myColorIdx={myColorIdx}
          onTokenClick={handleTokenClick}
          validTokens={isMyTurn ? gameState.validTokens : []}
        />

        {/* Controls */}
        {gameState.status === "playing" && (
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => isMyTurn && !gameState.diceRolled ? handleRoll() : null}>
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
              {isMyTurn ? (
                !gameState.diceRolled ? (
                  <Button onClick={handleRoll} className="w-full gap-2" style={{ backgroundColor: COLOR_HEX[myColorIdx] + "cc" }}>
                    🎲 Roll Dice
                  </Button>
                ) : gameState.validTokens.length > 0 ? (
                  <p className="text-sm text-center font-medium">Click a glowing token to move</p>
                ) : (
                  <p className="text-sm text-center text-muted-foreground">No valid moves — passing…</p>
                )
              ) : (
                <p className="text-sm text-center text-muted-foreground">
                  <span style={{ color: COLOR_HEX[currentColorIdx] }} className="font-semibold">{currentPlayerName}</span>'s turn
                </p>
              )}
            </div>
          </div>
        )}

        {/* Winner */}
        {gameState.status === "ended" && gameState.winnerName && (
          <div className="text-center p-4 rounded-xl bg-card/40 border border-border/40 space-y-2">
            <p className="text-2xl">🏆</p>
            <p className="font-bold text-lg">{gameState.winnerName} wins!</p>
            <Button onClick={handleLeave}>Play Again</Button>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={handleLeave} className="w-full gap-2 opacity-60 hover:opacity-100">
          <LogOut size={13} /> Leave Game
        </Button>
      </div>
    );
  }

  return null;
}
