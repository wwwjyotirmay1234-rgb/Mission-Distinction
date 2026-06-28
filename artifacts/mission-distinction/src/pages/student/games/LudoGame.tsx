import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, LogOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Board geometry
const CELL = 36;
const BOARD = CELL * 15; // 540px

// 52-cell main path [row, col]
function buildMainPath(): [number, number][] {
  const p: [number, number][] = [];
  for (let r = 13; r >= 1; r--) p.push([r, 0]);
  for (let c = 1; c <= 13; c++) p.push([0, c]);
  for (let r = 1; r <= 13; r++) p.push([r, 14]);
  for (let c = 13; c >= 1; c--) p.push([14, c]);
  return p;
}
const MAIN_PATH = buildMainPath();
const ENTRY = [0, 13, 26, 39]; // Red, Yellow, Blue, Green

const HOME_STRETCH: [number, number][][] = [
  [[12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],  // Red
  [[2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],      // Yellow
  [[7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],   // Blue
  [[7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],      // Green
];

const HOME_POS: [number, number][][] = [
  [[10, 2], [10, 4], [12, 2], [12, 4]], // Red
  [[2, 2], [2, 4], [4, 2], [4, 4]],    // Yellow
  [[2, 10], [2, 12], [4, 10], [4, 12]], // Blue
  [[10, 10], [10, 12], [12, 10], [12, 12]], // Green
];

const COLOR_HEX = ["#ef4444", "#eab308", "#3b82f6", "#22c55e"];
const COLOR_DARK = ["#b91c1c", "#a16207", "#1d4ed8", "#15803d"];
const COLOR_LIGHT = ["#fee2e2", "#fef9c3", "#dbeafe", "#dcfce7"];
const COLOR_NAMES = ["Red", "Yellow", "Blue", "Green"];

const COLOR_HOME_BOUNDS: [number, number, number, number][] = [
  [9, 0, 14, 5],   // Red
  [0, 0, 5, 5],    // Yellow
  [0, 9, 5, 14],   // Blue
  [9, 9, 14, 14],  // Green
];

// Center triangle assignment: which color's stretch points toward which quadrant
// Yellow(1)→top, Blue(2)→right, Red(0)→bottom, Green(3)→left
const CENTER_TRIANGLES = [
  { color: 1, points: `${6 * CELL},${6 * CELL} ${9 * CELL},${6 * CELL} ${7.5 * CELL},${7.5 * CELL}` },  // top
  { color: 2, points: `${9 * CELL},${6 * CELL} ${9 * CELL},${9 * CELL} ${7.5 * CELL},${7.5 * CELL}` },  // right
  { color: 0, points: `${9 * CELL},${9 * CELL} ${6 * CELL},${9 * CELL} ${7.5 * CELL},${7.5 * CELL}` },  // bottom
  { color: 3, points: `${6 * CELL},${9 * CELL} ${6 * CELL},${6 * CELL} ${7.5 * CELL},${7.5 * CELL}` },  // left
];

// Safe absolute positions
const LUDO_SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

function cellCenter(row: number, col: number): [number, number] {
  return [col * CELL + CELL / 2, row * CELL + CELL / 2];
}

function getTokenPos(colorIdx: number, relPos: number): [number, number] {
  if (relPos === -1) return [-100, -100];
  if (relPos === 57) return cellCenter(7, 7);
  if (relPos >= 52) {
    const hs = HOME_STRETCH[colorIdx][relPos - 52];
    return hs ? cellCenter(hs[0], hs[1]) : cellCenter(7, 7);
  }
  const absIdx = (ENTRY[colorIdx] + relPos) % 52;
  const [r, c] = MAIN_PATH[absIdx];
  return cellCenter(r, c);
}

// Build a lookup of home-stretch cells for quick check
const STRETCH_CELL_MAP = new Map<string, number>();
HOME_STRETCH.forEach((lane, ci) => lane.forEach(([r, c]) => STRETCH_CELL_MAP.set(`${r},${c}`, ci)));
const MAIN_PATH_SET = new Set(MAIN_PATH.map(([r, c]) => `${r},${c}`));
const SAFE_CELLS = new Set(
  [...LUDO_SAFE_ABS].map(i => { const [r, c] = MAIN_PATH[i]; return `${r},${c}`; })
);
const ENTRY_CELLS = new Map(
  ENTRY.map((absIdx, ci) => { const [r, c] = MAIN_PATH[absIdx]; return [`${r},${c}`, ci]; })
);

// ─── Dice ─────────────────────────────────────────────────────────────────────
function DiceFace({ value }: { value: number | null }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
  };
  if (!value) return (
    <div className="w-16 h-16 rounded-2xl border-2 border-white/40 bg-white/20 flex items-center justify-center text-white/70 text-xl font-black select-none">
      ?
    </div>
  );
  return (
    <div className="relative w-16 h-16 rounded-2xl bg-white shadow-xl border-2 border-white/80 select-none">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-1">
        {(dots[value] || []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={9} fill="#1e3a8a" />
        ))}
      </svg>
    </div>
  );
}

// ─── Pawn Token ───────────────────────────────────────────────────────────────
function PawnSVG({ cx, cy, color, darkColor, label, pulse }: {
  cx: number; cy: number; color: string; darkColor: string; label: string; pulse: boolean;
}) {
  const r = CELL * 0.38;
  return (
    <g style={{ cursor: pulse ? "pointer" : "default" }}>
      {pulse && (
        <circle cx={cx} cy={cy - r * 0.35} r={r * 1.4} fill="none" stroke="white"
          strokeWidth={2} opacity={0.9} style={{ filter: "drop-shadow(0 0 5px white)" }} />
      )}
      {/* Shadow */}
      <ellipse cx={cx} cy={cy + r * 1.1} rx={r * 0.85} ry={r * 0.32} fill="rgba(0,0,0,0.3)" />
      {/* Base */}
      <ellipse cx={cx} cy={cy + r * 0.6} rx={r * 0.85} ry={r * 0.42} fill={darkColor} />
      {/* Stem */}
      <rect x={cx - r * 0.28} y={cy - r * 0.1} width={r * 0.56} height={r * 0.72} rx={r * 0.18} fill={color} />
      {/* Head */}
      <circle cx={cx} cy={cy - r * 0.35} r={r * 0.65} fill={color} />
      {/* Gloss */}
      <ellipse cx={cx - r * 0.2} cy={cy - r * 0.6} rx={r * 0.25} ry={r * 0.18} fill="rgba(255,255,255,0.45)" />
      {/* Label */}
      <text x={cx} y={cy - r * 0.35 + 1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={r * 0.7} fontWeight="bold" style={{ pointerEvents: "none" }}>
        {label}
      </text>
    </g>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
type GameState = {
  code: string; players: { id: number; name: string; colorIdx: number }[];
  maxPlayers: number; status: string; tokenPositions: number[][];
  currentPlayerIdx: number; currentColorIdx: number;
  diceValue: number | null; diceRolled: boolean; validTokens: number[];
  winner: number | null; winnerName: string | null; hostId: number;
};

function LudoBoard({ state, myColorIdx, onTokenClick, validTokens }: {
  state: GameState;
  myColorIdx: number;
  onTokenClick: (colorIdx: number, tokenIdx: number) => void;
  validTokens: number[];
}) {
  const isMyTurn = state.currentColorIdx === myColorIdx;

  return (
    <div style={{
      padding: 6,
      background: "linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)",
      borderRadius: 20,
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    }}>
      <svg width={BOARD} height={BOARD}
        style={{ display: "block", borderRadius: 14, overflow: "hidden" }}>
        {/* Board white background */}
        <rect width={BOARD} height={BOARD} fill="white" />

        {/* Grid lines for path cells */}
        {Array.from({ length: 15 }, (_, r) =>
          Array.from({ length: 15 }, (_, c) => {
            const key = `${r},${c}`;
            const isHome = COLOR_HOME_BOUNDS.some(([r1, c1, r2, c2]) => r >= r1 && r <= r2 && c >= c1 && c <= c2);
            const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
            if (isHome || isCenter) return null;
            return (
              <rect key={`cell-${r}-${c}`}
                x={c * CELL} y={r * CELL} width={CELL} height={CELL}
                fill="white" stroke="#d1d5db" strokeWidth={0.8}
              />
            );
          })
        )}

        {/* Home area colored fills */}
        {COLOR_HOME_BOUNDS.map(([r1, c1, r2, c2], ci) => (
          <g key={`home-${ci}`}>
            {/* Outer colored quadrant */}
            <rect x={c1 * CELL} y={r1 * CELL}
              width={(c2 - c1 + 1) * CELL} height={(r2 - r1 + 1) * CELL}
              fill={COLOR_HEX[ci]} rx={ci === 0 ? 0 : ci === 1 ? 0 : ci === 2 ? 0 : 0}
            />
            {/* Inner lighter yard */}
            <rect
              x={(c1 + 1) * CELL} y={(r1 + 1) * CELL}
              width={4 * CELL} height={4 * CELL}
              fill={COLOR_LIGHT[ci]} rx={10}
            />
            {/* Color label */}
            <text
              x={(c1 + c2 + 1) / 2 * CELL}
              y={(r1 === 0 ? r1 + 0.7 : r2 - 0.1) * CELL}
              textAnchor="middle" fill="white" fontSize={13} fontWeight="900"
              style={{ letterSpacing: 1 }}
            >
              {COLOR_NAMES[ci].toUpperCase()}
            </text>
            {/* Pawn slot circles in yard */}
            {HOME_POS[ci].map(([hr, hc], ti) => {
              const [scx, scy] = cellCenter(hr, hc);
              return (
                <circle key={ti} cx={scx} cy={scy} r={CELL * 0.38}
                  fill={COLOR_HEX[ci]} opacity={0.25}
                  stroke={COLOR_HEX[ci]} strokeWidth={2}
                />
              );
            })}
          </g>
        ))}

        {/* Home stretch colored lanes */}
        {HOME_STRETCH.map((lane, ci) =>
          lane.map(([r, c], si) => (
            <rect key={`hs-${ci}-${si}`}
              x={c * CELL + 1} y={r * CELL + 1}
              width={CELL - 2} height={CELL - 2}
              fill={COLOR_HEX[ci]} opacity={0.75} rx={3}
            />
          ))
        )}

        {/* Safe square stars */}
        {[...SAFE_CELLS].map(key => {
          const [r, c] = key.split(",").map(Number);
          const [sx, sy] = cellCenter(r, c);
          return (
            <text key={`safe-${key}`} x={sx} y={sy} textAnchor="middle"
              dominantBaseline="middle" fontSize={16} opacity={0.6}>⭐</text>
          );
        })}

        {/* Entry colored indicators */}
        {[...ENTRY_CELLS.entries()].map(([key, ci]) => {
          const [r, c] = key.split(",").map(Number);
          return (
            <rect key={`entry-${key}`}
              x={c * CELL + 2} y={r * CELL + 2}
              width={CELL - 4} height={CELL - 4}
              fill={COLOR_HEX[ci]} opacity={0.35} rx={4}
            />
          );
        })}

        {/* Center 4 colored triangles */}
        {CENTER_TRIANGLES.map(({ color, points }, i) => (
          <polygon key={`ct-${i}`} points={points} fill={COLOR_HEX[color]} />
        ))}
        {/* Center circle */}
        <circle cx={7.5 * CELL} cy={7.5 * CELL} r={CELL * 0.8} fill="white" />
        <circle cx={7.5 * CELL} cy={7.5 * CELL} r={CELL * 0.65} fill="none"
          stroke="rgba(0,0,0,0.1)" strokeWidth={2} />

        {/* Tokens */}
        {state.players.map(player => {
          const ci = player.colorIdx;
          return Array.from({ length: 4 }).map((_, ti) => {
            const relPos = state.tokenPositions[ci]?.[ti] ?? -1;
            const isAtHome = relPos === -1;
            const [cx, cy] = isAtHome
              ? cellCenter(HOME_POS[ci][ti][0], HOME_POS[ci][ti][1])
              : getTokenPos(ci, relPos);
            const isValid = isMyTurn && ci === myColorIdx && validTokens.includes(ti) && state.diceRolled;

            return (
              <motion.g key={`t-${ci}-${ti}`}
                animate={{ scale: isValid ? [1, 1.12, 1] : 1 }}
                transition={{ repeat: isValid ? Infinity : 0, duration: 0.7 }}
                onClick={() => isValid && onTokenClick(ci, ti)}
              >
                <PawnSVG cx={cx} cy={cy}
                  color={COLOR_HEX[ci]} darkColor={COLOR_DARK[ci]}
                  label={String(ti + 1)} pulse={isValid} />
              </motion.g>
            );
          });
        })}
      </svg>
    </div>
  );
}

// ─── Player Card ──────────────────────────────────────────────────────────────
function LudoPlayerCard({ name, colorIdx, idx, isCurrent, tokensDone }: {
  name: string; colorIdx: number; idx: number;
  isCurrent: boolean; tokensDone: number;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 transition-all ${
      isCurrent ? "scale-[1.04] shadow-md" : "opacity-75"
    }`}
      style={{
        backgroundColor: COLOR_LIGHT[colorIdx],
        borderColor: COLOR_HEX[colorIdx],
      }}>
      {/* Mini pawn icon */}
      <svg width={26} height={34} viewBox="0 0 26 34">
        <ellipse cx={13} cy={32} rx={9} ry={3.5} fill="rgba(0,0,0,0.2)" />
        <ellipse cx={13} cy={28} rx={9} ry={4.5} fill={COLOR_DARK[colorIdx]} />
        <rect x={9} y={18} width={8} height={10} rx={2.5} fill={COLOR_HEX[colorIdx]} />
        <circle cx={13} cy={13} r={9} fill={COLOR_HEX[colorIdx]} />
        <ellipse cx={10} cy={9} rx={3} ry={2} fill="rgba(255,255,255,0.4)" />
        {isCurrent && <circle cx={13} cy={13} r={11} fill="none" stroke="white" strokeWidth={2} />}
        <text x={13} y={14} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={8} fontWeight="bold">{idx + 1}</text>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="font-black text-xs truncate" style={{ color: COLOR_DARK[colorIdx] }}>
          {name.split(" ")[0]}
          {isCurrent && <span className="ml-1">▶</span>}
        </p>
        <p className="text-[10px]" style={{ color: COLOR_HEX[colorIdx] }}>
          {COLOR_NAMES[colorIdx]} · {tokensDone}/4
        </p>
      </div>
    </div>
  );
}

// ─── AI Game ──────────────────────────────────────────────────────────────────
interface LocalLudoPlayer { id: number; name: string; colorIdx: number; isAI: boolean; }
interface LocalLudoState {
  players: LocalLudoPlayer[];
  tokenPositions: number[][];
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
  return validTokens.reduce((best, ti) => pos[colorIdx][ti] > pos[colorIdx][best] ? ti : best, validTokens[0]);
}

function LudoAIGame({ onBack, numAI }: { onBack: () => void; numAI: number }) {
  const initState = (): LocalLudoState => ({
    players: [
      { id: 0, name: "You", colorIdx: 0, isAI: false },
      ...Array.from({ length: numAI }, (_, i) => ({ id: i + 1, name: `Meddy ${i + 1} 🤖`, colorIdx: i + 1, isAI: true })),
    ],
    tokenPositions: [0, 1, 2, 3].map(() => [-1, -1, -1, -1]),
    currentPlayerIdx: 0, currentColorIdx: 0,
    diceValue: null, diceRolled: false, validTokens: [],
    status: "playing", winner: null, extraTurn: false,
  });

  const [state, setState] = useState<LocalLudoState>(initState);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn = !currentPlayer?.isAI && state.status === "playing";

  useEffect(() => {
    if (state.status !== "playing" || !currentPlayer?.isAI) return;
    aiTimer.current = setTimeout(() => {
      setState(prev => {
        if (!prev.diceRolled) {
          const dice = Math.floor(Math.random() * 6) + 1;
          const valid = ludoValidTokens(prev.tokenPositions, prev.currentColorIdx, dice);
          if (valid.length === 0) {
            const nextIdx = (prev.currentPlayerIdx + 1) % prev.players.length;
            return { ...prev, diceValue: dice, diceRolled: false, validTokens: [], currentPlayerIdx: nextIdx, currentColorIdx: prev.players[nextIdx].colorIdx };
          }
          return { ...prev, diceValue: dice, diceRolled: true, validTokens: valid };
        } else {
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
      const nextIdx = (state.currentPlayerIdx + 1) % state.players.length;
      setState(prev => ({ ...prev, diceValue: dice, diceRolled: false, validTokens: [], currentPlayerIdx: nextIdx, currentColorIdx: prev.players[nextIdx].colorIdx }));
    } else {
      setState(prev => ({ ...prev, diceValue: dice, diceRolled: true, validTokens: valid }));
    }
  };

  const handleTokenClick = (_ci: number, ti: number) => {
    if (!isMyTurn || !state.diceRolled || !state.validTokens.includes(ti)) return;
    setState(prev => ludoApplyMove(prev, prev.currentColorIdx, ti, prev.diceValue!));
  };

  const boardState = {
    ...state, code: "LOCAL", hostId: -1, maxPlayers: state.players.length,
    winner: state.winner ? state.winner.id : null, winnerName: state.winner?.name ?? null,
  } as unknown as GameState;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
        <h2 className="text-lg font-black tracking-wide text-center"
          style={{ color: "#1565C0", textShadow: "0 1px 0 rgba(0,0,0,0.1)" }}>
          🎲 LUDO
        </h2>
        <div className="w-12" />
      </div>

      {/* Player cards grid */}
      <div className="grid grid-cols-2 gap-2">
        {state.players.map((p, idx) => (
          <LudoPlayerCard key={p.id} name={p.name} colorIdx={p.colorIdx} idx={idx}
            isCurrent={state.currentPlayerIdx === idx}
            tokensDone={state.tokenPositions[p.colorIdx]?.filter(pos => pos === 57).length ?? 0} />
        ))}
      </div>

      {/* Board */}
      <div className="overflow-auto">
        <LudoBoard state={boardState} myColorIdx={0}
          onTokenClick={handleTokenClick}
          validTokens={isMyTurn ? state.validTokens : []} />
      </div>

      {/* Winner */}
      {state.status === "ended" && state.winner && (
        <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-50 border-2 border-yellow-400 space-y-3">
          <p className="text-4xl">🏆</p>
          <p className="font-black text-xl text-amber-800">{state.winner.name} Wins!</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setState(initState())} className="gap-2 rounded-xl bg-green-600 hover:bg-green-700">
              <RotateCcw size={14} /> Play Again
            </Button>
            <Button variant="outline" onClick={onBack} className="gap-2 rounded-xl"><LogOut size={14} /> Back</Button>
          </div>
        </div>
      )}

      {/* Roll Dice button */}
      {state.status === "playing" && (
        <AnimatePresence mode="wait">
          <motion.button
            key={isMyTurn ? "my" : "ai"}
            onClick={handleRoll}
            disabled={!isMyTurn || state.diceRolled}
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-4 shadow-xl transition-all disabled:opacity-55"
            style={{
              background: isMyTurn && !state.diceRolled
                ? "linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)"
                : "linear-gradient(135deg, #78909C 0%, #90A4AE 100%)",
              boxShadow: isMyTurn && !state.diceRolled ? "0 8px 24px rgba(21,101,192,0.5)" : "none",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={state.diceValue ?? "empty"}
                initial={{ rotate: -25, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", duration: 0.4 }}>
                <DiceFace value={state.diceValue} />
              </motion.div>
            </AnimatePresence>
            <div className="text-left">
              {isMyTurn && !state.diceRolled ? (
                <>
                  <div className="text-xl">ROLL DICE</div>
                  <div className="text-xs font-normal opacity-80">Tap to roll</div>
                </>
              ) : isMyTurn && state.diceRolled ? (
                <>
                  <div className="text-base">Select a pawn</div>
                  <div className="text-xs font-normal opacity-70 animate-pulse">Tap a glowing piece</div>
                </>
              ) : (
                <>
                  <div className="text-base">{currentPlayer?.name?.split(" ")[0]}'s turn</div>
                  <div className="text-xs font-normal opacity-60 animate-pulse">Waiting…</div>
                </>
              )}
            </div>
          </motion.button>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Multiplayer ──────────────────────────────────────────────────────────────
type Phase = "setup" | "lobby" | "game" | "ended";

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
  const isMyTurn = !!(gameState && myPlayerIdx >= 0 && gameState.currentPlayerIdx === myPlayerIdx);
  const isHost = gameState?.hostId === myId;

  const connect = useCallback(() => {
    const token = localStorage.getItem("mission_token");
    if (!token) { toast.error("Please log in."); return null; }
    const s = io({ path: "/api/socket.io/", auth: { token }, transports: ["websocket", "polling"] });
    s.on("connect_error", err => { toast.error("Connection failed: " + err.message); setConnecting(false); });
    s.on("ludo:error", ({ message }: { message: string }) => { toast.error(message); setConnecting(false); });
    s.on("ludo:created", (state: GameState) => { setGameState(state); setPhase("lobby"); setConnecting(false); });
    s.on("ludo:state", (state: GameState) => {
      setGameState(state);
      if (state.status === "playing") setPhase("game");
      if (state.status === "ended") setPhase("ended");
    });
    s.on("ludo:player-joined", ({ name }: { name: string }) => toast.success(`${name} joined!`));
    s.on("ludo:rolled", ({ dice }: { dice: number }) => setLastDice(dice));
    s.on("ludo:killed", ({ by, killed }: { by: string; killed: string }) => toast(`💥 ${by} sent ${killed}'s token home!`));
    s.on("ludo:won", ({ name }: { name: string }) => toast.success(`🏆 ${name} wins!`));
    socketRef.current = s;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyId(payload.userId || payload.sub || null);
    } catch {}
    return s;
  }, []);

  const handleCreate = () => { setConnecting(true); const s = connect(); if (!s) return; s.on("connect", () => s.emit("ludo:create", { maxPlayers: parseInt(maxPlayers) })); };
  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error("Enter a 6-character code."); return; }
    setConnecting(true); const s = connect(); if (!s) return;
    s.on("connect", () => s.emit("ludo:join", { code }));
  };
  const handleStart = () => socketRef.current?.emit("ludo:start", { code: gameState?.code });
  const handleRoll = () => socketRef.current?.emit("ludo:roll", { code: gameState?.code });
  const handleTokenClick = (_ci: number, tokenIdx: number) => socketRef.current?.emit("ludo:move", { code: gameState?.code, tokenIdx });
  const handleLeave = () => {
    socketRef.current?.emit("ludo:leave", { code: gameState?.code });
    socketRef.current?.disconnect(); socketRef.current = null;
    setPhase("setup"); setGameState(null); setLastDice(null);
  };

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  // ── Setup ──
  if (phase === "setup") {
    if (gameMode === "ai") return <LudoAIGame onBack={() => setGameMode("menu")} numAI={numAI} />;
    return (
      <div className="space-y-5">
        <h2 className="text-center text-lg font-black" style={{ color: "#1565C0" }}>🎲 LUDO</h2>
        <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: "#22c55e", backgroundColor: "#f0fdf4" }}>
          <p className="font-bold text-sm text-green-800 flex items-center gap-2">🤖 Play vs Meddy AI (Offline)</p>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <Button key={n} variant={numAI === n ? "default" : "outline"} size="sm" className="flex-1"
                onClick={() => setNumAI(n)}>{n} AI</Button>
            ))}
          </div>
          <div className="flex gap-2 text-xs p-2 rounded-xl bg-white border">
            {["You (Red)", ...Array.from({ length: numAI }, (_, i) => `${COLOR_NAMES[i + 1]} AI`)].map((label, i) => (
              <span key={i} className="font-bold" style={{ color: COLOR_HEX[i] }}>{label}</span>
            ))}
          </div>
          <Button onClick={() => setGameMode("ai")} className="w-full rounded-xl bg-green-600 hover:bg-green-700 gap-2">
            🎮 Start vs AI
          </Button>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold text-center">Or play online</p>
        <div className="flex gap-2">
          <Button variant={joinMode === "create" ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setJoinMode("create")}>Create</Button>
          <Button variant={joinMode === "join" ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setJoinMode("join")}>Join</Button>
        </div>
        {joinMode === "create" ? (
          <div className="space-y-3">
            <Select value={maxPlayers} onValueChange={setMaxPlayers}>
              <SelectTrigger className="rounded-xl bg-card/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["2", "3", "4"].map(n => <SelectItem key={n} value={n}>{n} Players</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={connecting} className="w-full rounded-xl">
              {connecting ? "Creating…" : "Create Ludo Room"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="6-character code" maxLength={6}
              className="text-center text-lg tracking-widest font-mono uppercase rounded-xl bg-card/40" />
            <Button onClick={handleJoin} disabled={connecting || joinCode.trim().length !== 6} className="w-full rounded-xl">
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
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => { navigator.clipboard.writeText(gameState.code); toast.success("Copied!"); }}>
              <Copy size={13} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{gameState.players.length}/{gameState.maxPlayers} players</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {gameState.players.map((p, idx) => (
            <LudoPlayerCard key={p.id} name={p.name} colorIdx={p.colorIdx} idx={idx}
              isCurrent={false} tokensDone={0} />
          ))}
        </div>
        <div className="flex gap-2">
          {isHost ? (
            <Button onClick={handleStart} disabled={gameState.players.length < 2}
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700">Start Game</Button>
          ) : (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2 animate-pulse">Waiting for host…</div>
          )}
          <Button variant="outline" size="icon" onClick={handleLeave} className="rounded-xl"><LogOut size={14} /></Button>
        </div>
      </div>
    );
  }

  // ── Game / Ended ──
  if ((phase === "game" || phase === "ended") && gameState) {
    const currentPlayer = gameState.players[gameState.currentPlayerIdx];
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black" style={{ color: "#1565C0" }}>🎲 LUDO</h2>
          <Button variant="ghost" size="sm" onClick={handleLeave} className="gap-1 text-xs opacity-60 hover:opacity-100">
            <LogOut size={12} /> Leave
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {gameState.players.map((p, idx) => (
            <LudoPlayerCard key={p.id} name={p.name} colorIdx={p.colorIdx} idx={idx}
              isCurrent={gameState.currentPlayerIdx === idx}
              tokensDone={gameState.tokenPositions[p.colorIdx]?.filter(pos => pos === 57).length ?? 0} />
          ))}
        </div>

        <div className="overflow-auto">
          <LudoBoard state={gameState} myColorIdx={myColorIdx}
            onTokenClick={handleTokenClick}
            validTokens={isMyTurn ? gameState.validTokens : []} />
        </div>

        {phase === "ended" && gameState.winnerName && (
          <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-50 border-2 border-yellow-400 space-y-3">
            <p className="text-4xl">🏆</p>
            <p className="font-black text-xl text-amber-800">{gameState.winnerName} Wins!</p>
            <Button onClick={handleLeave} className="gap-2 rounded-xl"><LogOut size={14} /> Back to Menu</Button>
          </div>
        )}

        {gameState.status === "playing" && (
          <motion.button
            onClick={handleRoll}
            disabled={!isMyTurn || gameState.diceRolled}
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-4 shadow-xl transition-all disabled:opacity-55"
            style={{
              background: isMyTurn && !gameState.diceRolled
                ? "linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)"
                : "linear-gradient(135deg, #78909C 0%, #90A4AE 100%)",
              boxShadow: isMyTurn && !gameState.diceRolled ? "0 8px 24px rgba(21,101,192,0.5)" : "none",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={gameState.diceValue ?? "empty"}
                initial={{ rotate: -25, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", duration: 0.4 }}>
                <DiceFace value={gameState.diceValue ?? lastDice} />
              </motion.div>
            </AnimatePresence>
            <div className="text-left">
              {isMyTurn && !gameState.diceRolled ? (
                <>
                  <div className="text-xl">ROLL DICE</div>
                  <div className="text-xs font-normal opacity-80">Tap to roll</div>
                </>
              ) : isMyTurn && gameState.diceRolled ? (
                <div className="text-base">Select a pawn to move</div>
              ) : (
                <>
                  <div className="text-base">{currentPlayer?.name?.split(" ")[0]}'s turn</div>
                  <div className="text-xs font-normal opacity-60 animate-pulse">Waiting…</div>
                </>
              )}
            </div>
          </motion.button>
        )}
      </div>
    );
  }

  return null;
}
