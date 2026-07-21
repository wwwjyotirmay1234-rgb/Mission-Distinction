import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, LogOut, RotateCcw, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Board constants
const CELL = 52;
const BOARD = CELL * 10;

// Snakes and Ladders positions
const SNAKES: Record<number, number> = {
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78,
};
const LADDERS: Record<number, number> = {
  4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
};

const COLOR_HEX = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7"];
const COLOR_NAMES = ["Red", "Blue", "Green", "Purple"];

// Row-based pastel palette (row 0 = bottom = squares 1–10)
const ROW_PALETTE: [string, string][] = [
  ["#FFB3C6", "#FFC8D5"],
  ["#FFD4A8", "#FFE5C4"],
  ["#A8DCA8", "#C4EEC4"],
  ["#A8C8F8", "#C0D8FF"],
  ["#D0B8F0", "#E4D0FF"],
  ["#FFF0A0", "#FFF8C0"],
  ["#F0A8A8", "#F8C4C4"],
  ["#A0E0EA", "#C0EEF4"],
  ["#C8B0EC", "#DDD0F8"],
  ["#FFE090", "#FFF0B8"],
];

// Per-snake colors
const SNAKE_COLORS: Record<number, { body: string; accent: string; head: string }> = {
  17: { body: "#42A5F5", accent: "#90CAF9", head: "#1565C0" },
  54: { body: "#EF5350", accent: "#EF9A9A", head: "#B71C1C" },
  62: { body: "#FDD835", accent: "#FFF176", head: "#E65100" },
  64: { body: "#AB47BC", accent: "#CE93D8", head: "#6A1B9A" },
  87: { body: "#66BB6A", accent: "#A5D6A7", head: "#1B5E20" },
  93: { body: "#FF7043", accent: "#FFAB91", head: "#BF360C" },
  95: { body: "#26C6DA", accent: "#80DEEA", head: "#006064" },
  99: { body: "#EC407A", accent: "#F48FB1", head: "#880E4F" },
};

function squareToXY(sq: number): [number, number] {
  if (sq <= 0) return [CELL / 2 - 6, BOARD - CELL / 2];
  const row = Math.floor((sq - 1) / 10);
  const isOdd = row % 2 === 1;
  const col = isOdd ? 9 - ((sq - 1) % 10) : (sq - 1) % 10;
  const svgRow = 9 - row;
  return [col * CELL + CELL / 2, svgRow * CELL + CELL / 2];
}

function squareToRowCol(sq: number): [number, number] {
  const row = Math.floor((sq - 1) / 10);
  const isOdd = row % 2 === 1;
  const col = isOdd ? 9 - ((sq - 1) % 10) : (sq - 1) % 10;
  return [9 - row, col];
}

function getCellColor(sq: number): string {
  const row = Math.floor((sq - 1) / 10);
  const [r, c] = squareToRowCol(sq);
  const tone = (r + c) % 2;
  return ROW_PALETTE[row % 10][tone];
}

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
    <div className="w-16 h-16 rounded-2xl border-2 border-white/30 bg-white/20 flex items-center justify-center text-white/60 text-sm font-bold select-none shadow-inner">
      ?
    </div>
  );
  return (
    <div className="relative w-16 h-16 rounded-2xl bg-white shadow-xl select-none border-2 border-white/60">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-1">
        {(dots[value] || []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={9} fill="#1e40af" />
        ))}
      </svg>
    </div>
  );
}

// ─── SVG Snake ────────────────────────────────────────────────────────────────
function SnakeSVG({ head, tail }: { head: number; tail: number }) {
  const [hx, hy] = squareToXY(head);
  const [tx, ty] = squareToXY(tail);
  const colors = SNAKE_COLORS[head] ?? { body: "#66BB6A", accent: "#A5D6A7", head: "#1B5E20" };

  const dx = tx - hx, dy = ty - hy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const pux = -dy / dist, puy = dx / dist;
  const offset = dist * 0.28;
  const cx1 = hx + dx * 0.3 + pux * offset;
  const cy1 = hy + dy * 0.3 + puy * offset;
  const cx2 = tx - dx * 0.3 - pux * offset;
  const cy2 = ty - dy * 0.3 - puy * offset;

  // Angle for tongue at head
  const angle = Math.atan2(ty - hy, tx - hx) * (180 / Math.PI);
  const tongueAngle = (angle + 90) % 360;
  const tongueRad = tongueAngle * (Math.PI / 180);
  const t1x = hx + Math.cos(tongueRad) * 13;
  const t1y = hy + Math.sin(tongueRad) * 13;
  const t2ax = t1x + Math.cos(tongueRad - 0.4) * 7;
  const t2ay = t1y + Math.sin(tongueRad - 0.4) * 7;
  const t2bx = t1x + Math.cos(tongueRad + 0.4) * 7;
  const t2by = t1y + Math.sin(tongueRad + 0.4) * 7;

  return (
    <g>
      {/* Body shadow */}
      <path d={`M ${hx+1} ${hy+2} C ${cx1+1} ${cy1+2} ${cx2+1} ${cy2+2} ${tx+1} ${ty+2}`}
        stroke="rgba(0,0,0,0.18)" strokeWidth={11} fill="none" strokeLinecap="round" />
      {/* Body */}
      <path d={`M ${hx} ${hy} C ${cx1} ${cy1} ${cx2} ${cy2} ${tx} ${ty}`}
        stroke={colors.body} strokeWidth={10} fill="none" strokeLinecap="round" />
      {/* Belly accent */}
      <path d={`M ${hx} ${hy} C ${cx1} ${cy1} ${cx2} ${cy2} ${tx} ${ty}`}
        stroke={colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* Tail dot */}
      <circle cx={tx} cy={ty} r={5} fill={colors.body} />
      {/* Head */}
      <ellipse cx={hx} cy={hy} rx={12} ry={11} fill={colors.head} />
      {/* Eyes */}
      <circle cx={hx - 4} cy={hy - 3} r={3} fill="white" />
      <circle cx={hx + 4} cy={hy - 3} r={3} fill="white" />
      <circle cx={hx - 4} cy={hy - 3} r={1.5} fill="#111" />
      <circle cx={hx + 4} cy={hy - 3} r={1.5} fill="#111" />
      <circle cx={hx - 3.2} cy={hy - 3.8} r={0.8} fill="white" />
      <circle cx={hx + 4.8} cy={hy - 3.8} r={0.8} fill="white" />
      {/* Tongue */}
      <line x1={hx} y1={hy + 10} x2={t1x} y2={t1y} stroke="#ff1744" strokeWidth={1.8} strokeLinecap="round" />
      <line x1={t1x} y1={t1y} x2={t2ax} y2={t2ay} stroke="#ff1744" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={t1x} y1={t1y} x2={t2bx} y2={t2by} stroke="#ff1744" strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

// ─── SVG Ladder ───────────────────────────────────────────────────────────────
function LadderSVG({ base, top }: { base: number; top: number }) {
  const [bx, by] = squareToXY(base);
  const [tx, ty] = squareToXY(top);

  const dx = tx - bx, dy = ty - by;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const hw = 7;
  const px = -dy / len * hw, py = dx / len * hw;
  const numRungs = Math.max(3, Math.round(len / 26));

  return (
    <g>
      {/* Rails shadow */}
      <line x1={bx - px + 1} y1={by - py + 2} x2={tx - px + 1} y2={ty - py + 2}
        stroke="rgba(0,0,0,0.15)" strokeWidth={5} strokeLinecap="round" />
      <line x1={bx + px + 1} y1={by + py + 2} x2={tx + px + 1} y2={ty + py + 2}
        stroke="rgba(0,0,0,0.15)" strokeWidth={5} strokeLinecap="round" />
      {/* Left rail */}
      <line x1={bx - px} y1={by - py} x2={tx - px} y2={ty - py}
        stroke="#7B4F1E" strokeWidth={4.5} strokeLinecap="round" />
      {/* Right rail */}
      <line x1={bx + px} y1={by + py} x2={tx + px} y2={ty + py}
        stroke="#7B4F1E" strokeWidth={4.5} strokeLinecap="round" />
      {/* Rungs */}
      {Array.from({ length: numRungs }, (_, i) => {
        const t = (i + 1) / (numRungs + 1);
        return (
          <line key={i}
            x1={bx - px + (tx - px - bx + px) * t}
            y1={by - py + (ty - py - by + py) * t}
            x2={bx + px + (tx + px - bx - px) * t}
            y2={by + py + (ty + py - by - py) * t}
            stroke="#A0681E" strokeWidth={3} strokeLinecap="round"
          />
        );
      })}
      {/* Rail highlight */}
      <line x1={bx - px} y1={by - py} x2={tx - px} y2={ty - py}
        stroke="rgba(255,220,150,0.35)" strokeWidth={2} strokeLinecap="round" />
      <line x1={bx + px} y1={by + py} x2={tx + px} y2={ty + py}
        stroke="rgba(255,220,150,0.35)" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

// ─── Pawn token ───────────────────────────────────────────────────────────────
function PawnToken({ cx, cy, color, label, active }: {
  cx: number; cy: number; color: string; label: string; active: boolean;
}) {
  return (
    <g>
      {active && (
        <circle cx={cx} cy={cy - 4} r={14} fill="none" stroke="white"
          strokeWidth={2.5} opacity={0.9}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }} />
      )}
      {/* Shadow */}
      <ellipse cx={cx} cy={cy + 11} rx={9} ry={3.5} fill="rgba(0,0,0,0.25)" />
      {/* Base */}
      <ellipse cx={cx} cy={cy + 8} rx={10} ry={5} fill={color} opacity={0.85} />
      {/* Neck */}
      <rect x={cx - 4.5} y={cy + 1} width={9} height={7} rx={2} fill={color} />
      {/* Head */}
      <circle cx={cx} cy={cy - 4} r={9} fill={color} />
      <circle cx={cx} cy={cy - 4} r={9} fill="rgba(255,255,255,0.15)" />
      {/* Label */}
      <text x={cx} y={cy - 4 + 1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={8} fontWeight="bold" style={{ pointerEvents: "none" }}>
        {label}
      </text>
    </g>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
function SNLBoard({ positions, currentPlayerId, players }: {
  positions: { id: number; name: string; colorIdx: number; position: number }[];
  currentPlayerId: number | null;
  players: { id: number; name: string; colorIdx: number; position: number }[];
}) {
  const cells = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="relative overflow-auto rounded-2xl"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)", background: "#FFF8E8", padding: 6, borderRadius: 18 }}>
      <svg width={BOARD} height={BOARD} style={{ display: "block", borderRadius: 12, overflow: "hidden" }}>
        {/* Board background */}
        <rect width={BOARD} height={BOARD} fill="#FFF8E8" />

        {/* Cells */}
        {cells.map(sq => {
          const [r, c] = squareToRowCol(sq);
          const x = c * CELL, y = r * CELL;
          const fill = getCellColor(sq);
          const isWin = sq === 100;
          return (
            <g key={sq}>
              <rect x={x} y={y} width={CELL} height={CELL} fill={fill}
                stroke="rgba(255,255,255,0.6)" strokeWidth={1} rx={2} />
              {isWin ? (
                <>
                  <rect x={x} y={y} width={CELL} height={CELL} fill="#FFD700" opacity={0.4} rx={2} />
                  <text x={x + CELL / 2} y={y + CELL / 2 - 6} textAnchor="middle"
                    dominantBaseline="middle" fontSize={20}>🏆</text>
                  <text x={x + CELL / 2} y={y + CELL - 8} textAnchor="middle"
                    fill="#7B5800" fontSize={8} fontWeight="bold">100</text>
                </>
              ) : (
                <text x={x + 4} y={y + 12} fill="rgba(0,0,0,0.55)" fontSize={9} fontWeight="700">{sq}</text>
              )}
            </g>
          );
        })}

        {/* Ladders (drawn under snakes) */}
        {Object.entries(LADDERS).map(([base, top]) => (
          <LadderSVG key={`l-${base}`} base={Number(base)} top={Number(top)} />
        ))}

        {/* Snakes */}
        {Object.entries(SNAKES).map(([head, tail]) => (
          <SnakeSVG key={`s-${head}`} head={Number(head)} tail={tail} />
        ))}

        {/* Player tokens */}
        {players.map((p, idx) => {
          const isActive = p.id === currentPlayerId;
          if (p.position <= 0) {
            const offX = CELL / 2 - 8 + (p.colorIdx % 2) * 18;
            const offY = BOARD - CELL / 2 + 4 - Math.floor(p.colorIdx / 2) * 18;
            return (
              <PawnToken key={p.id} cx={offX} cy={offY}
                color={COLOR_HEX[p.colorIdx]} label={String(idx + 1)} active={isActive} />
            );
          }
          const [px, py] = squareToXY(p.position);
          const sameSquare = players.filter(q => q.position === p.position && q.id !== p.id);
          const myRank = players.filter(q => q.position === p.position && q.colorIdx < p.colorIdx).length;
          const offX = sameSquare.length > 0 ? (myRank % 2 === 0 ? -8 : 8) : 0;
          const offY = sameSquare.length > 0 ? (myRank < 2 ? -6 : 6) : 0;
          return (
            <PawnToken key={p.id} cx={px + offX} cy={py + offY}
              color={COLOR_HEX[p.colorIdx]} label={String(idx + 1)} active={isActive} />
          );
        })}
      </svg>
    </div>
  );
}

// ─── Player Card ──────────────────────────────────────────────────────────────
const PLAYER_CARD_BG = [
  "bg-blue-100 border-blue-300",
  "bg-red-100 border-red-300",
  "bg-green-100 border-green-300",
  "bg-purple-100 border-purple-300",
];
const PLAYER_CARD_TEXT = ["text-blue-800", "text-red-800", "text-green-800", "text-purple-800"];

function PlayerCard({ p, idx, isCurrent }: {
  p: { id: number; name: string; colorIdx: number; position: number };
  idx: number;
  isCurrent: boolean;
}) {
  return (
    <div className={`rounded-xl border-2 px-3 py-2.5 flex items-center gap-3 transition-all ${
      PLAYER_CARD_BG[p.colorIdx % 4]
    } ${isCurrent ? "shadow-md scale-[1.03]" : "opacity-80"}`}>
      {/* Pawn icon */}
      <svg width={28} height={36} viewBox="0 0 28 36">
        <ellipse cx={14} cy={33} rx={10} ry={4} fill="rgba(0,0,0,0.12)" />
        <ellipse cx={14} cy={29} rx={10} ry={5} fill={COLOR_HEX[p.colorIdx]} opacity={0.85} />
        <rect x={9} y={20} width={10} height={9} rx={2} fill={COLOR_HEX[p.colorIdx]} />
        <circle cx={14} cy={15} r={10} fill={COLOR_HEX[p.colorIdx]} />
        {isCurrent && <circle cx={14} cy={15} r={12} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={2} />}
        <text x={14} y={16} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={9} fontWeight="bold">{idx + 1}</text>
      </svg>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${PLAYER_CARD_TEXT[p.colorIdx % 4]}`}>
          {p.name.split(" ")[0]}
          {isCurrent && <span className="ml-1 text-xs opacity-70">▶</span>}
        </p>
        <p className={`text-xs ${PLAYER_CARD_TEXT[p.colorIdx % 4]} opacity-70`}>
          {p.position === 0 ? "Start" : p.position === 100 ? "🏆 Winner!" : `Square ${p.position}`}
        </p>
      </div>
    </div>
  );
}

// ─── AI Game ──────────────────────────────────────────────────────────────────
interface LocalSNLPlayer { id: number; name: string; colorIdx: number; position: number; isAI: boolean; }
interface LocalSNLState {
  players: LocalSNLPlayer[];
  currentPlayerIdx: number;
  diceValue: number | null;
  diceRolled: boolean;
  status: string;
  winner: LocalSNLPlayer | null;
  lastMsg: string | null;
}

function snlApplyRoll(state: LocalSNLState, playerIdx: number): LocalSNLState {
  const dice = Math.floor(Math.random() * 6) + 1;
  const p = state.players[playerIdx];
  let newPos = p.position + dice;
  let msg = `${p.name.split(" ")[0]} rolled ${dice}`;

  if (newPos > 100) {
    newPos = p.position; msg += " — can't move past 100!";
  } else if (SNAKES[newPos]) {
    const tail = SNAKES[newPos];
    msg += ` 🐍 Snake! ${newPos} → ${tail}`; newPos = tail;
  } else if (LADDERS[newPos]) {
    const top = LADDERS[newPos];
    msg += ` 🪜 Ladder! ${newPos} → ${top}`; newPos = top;
  } else {
    msg += ` → square ${newPos}`;
  }

  const newPlayers = state.players.map((pl, i) => i === playerIdx ? { ...pl, position: newPos } : pl);
  const won = newPos === 100;
  const nextIdx = won ? playerIdx : (playerIdx + 1) % state.players.length;

  return {
    ...state, players: newPlayers, currentPlayerIdx: nextIdx,
    diceValue: dice, diceRolled: true,
    status: won ? "ended" : "playing",
    winner: won ? newPlayers[playerIdx] : null, lastMsg: msg,
  };
}

function SNLAIGame({ onBack, numAI }: { onBack: () => void; numAI: number }) {
  const initState = (): LocalSNLState => ({
    players: [
      { id: 0, name: "You", colorIdx: 0, position: 0, isAI: false },
      ...Array.from({ length: numAI }, (_, i) => ({
        id: i + 1, name: `Meddy ${i + 1} 🤖`, colorIdx: i + 1, position: 0, isAI: true,
      })),
    ],
    currentPlayerIdx: 0, diceValue: null, diceRolled: false,
    status: "playing", winner: null, lastMsg: null,
  });

  const [state, setState] = useState<LocalSNLState>(initState);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn = !currentPlayer?.isAI && state.status === "playing";

  useEffect(() => {
    if (state.status !== "playing" || !currentPlayer?.isAI) return;
    aiTimer.current = setTimeout(() => {
      setState(prev => snlApplyRoll(prev, prev.currentPlayerIdx));
    }, 1100);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [state.currentPlayerIdx, state.status, currentPlayer?.isAI]);

  const handleRoll = () => {
    if (!isMyTurn) return;
    setState(prev => snlApplyRoll(prev, prev.currentPlayerIdx));
  };

  const boardPlayers = state.players.map(p => ({ id: p.id, name: p.name, colorIdx: p.colorIdx, position: p.position }));

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
        <h2 className="text-lg font-black tracking-wide"
          style={{ color: "#2E7D32", textShadow: "0 1px 0 rgba(0,0,0,0.1)", fontFamily: "sans-serif" }}>
          🐍 SNAKES &amp; LADDERS 🪜
        </h2>
        <div className="w-12" />
      </div>

      {/* Main area: board + player sidebar */}
      <div className="flex gap-3 items-start flex-wrap">
        {/* Board */}
        <div className="flex-shrink-0" style={{ maxWidth: BOARD }}>
          <SNLBoard positions={boardPlayers} currentPlayerId={currentPlayer?.id ?? null} players={boardPlayers} />
        </div>

        {/* Player cards sidebar */}
        <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
          {state.players.map((p, idx) => (
            <PlayerCard key={p.id} p={p} idx={idx} isCurrent={state.currentPlayerIdx === idx} />
          ))}
          {/* Goal card */}
          <div className="rounded-xl border-2 border-purple-400 bg-purple-600 px-3 py-2.5 text-white text-center mt-1">
            <Trophy size={18} className="mx-auto mb-1 text-yellow-300" />
            <p className="font-bold text-sm">Goal</p>
            <p className="text-xs opacity-80">Reach 100 to Win!</p>
          </div>
        </div>
      </div>

      {/* Last move message */}
      {state.lastMsg && (
        <div className="text-xs text-center text-muted-foreground bg-card/40 rounded-xl py-2 px-4 border border-border/30">
          {state.lastMsg}
        </div>
      )}

      {/* Winner screen */}
      {state.status === "ended" && state.winner && (
        <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-50 border-2 border-yellow-400 space-y-3">
          <p className="text-4xl">🏆</p>
          <p className="font-black text-xl text-amber-800">{state.winner.name} Wins!</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setState(initState())}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl">
              <RotateCcw size={14} /> Play Again
            </Button>
            <Button variant="outline" onClick={onBack} className="gap-2 rounded-xl">
              <LogOut size={14} /> Back
            </Button>
          </div>
        </div>
      )}

      {/* Roll Dice button */}
      {state.status === "playing" && (
        <AnimatePresence mode="wait">
          <motion.button
            key={state.diceValue ?? "empty"}
            onClick={handleRoll}
            disabled={!isMyTurn}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full py-4 rounded-2xl font-black text-xl text-white flex items-center justify-center gap-4 shadow-lg transition-all disabled:opacity-50"
            style={{
              background: isMyTurn
                ? "linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)"
                : "linear-gradient(135deg, #90A4AE 0%, #B0BEC5 100%)",
              boxShadow: isMyTurn ? "0 6px 20px rgba(25,118,210,0.45)" : "none",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={state.diceValue ?? "roll"}
                initial={{ rotate: -20, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", duration: 0.4 }}>
                <DiceFace value={state.diceValue} />
              </motion.div>
            </AnimatePresence>
            <div className="text-left">
              {isMyTurn ? (
                <>
                  <div>ROLL DICE</div>
                  <div className="text-xs font-normal opacity-80">Tap to Roll</div>
                </>
              ) : currentPlayer?.isAI ? (
                <>
                  <div className="text-base">{currentPlayer.name.split(" ").slice(0, 2).join(" ")} rolling…</div>
                  <div className="text-xs font-normal opacity-70 animate-pulse">Please wait</div>
                </>
              ) : null}
            </div>
          </motion.button>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Session persistence (survive navigation away) ───────────────────────────
const SNL_SESSION_KEY = "snl_active_room";
function saveSnlSession(code: string) {
  try { localStorage.setItem(SNL_SESSION_KEY, JSON.stringify({ code, ts: Date.now() })); } catch {}
}
function clearSnlSession() { try { localStorage.removeItem(SNL_SESSION_KEY); } catch {} }
function loadSnlSession(): { code: string } | null {
  try {
    const raw = localStorage.getItem(SNL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > 3 * 3600 * 1000) { clearSnlSession(); return null; }
    return parsed;
  } catch { return null; }
}

// ─── Multiplayer ──────────────────────────────────────────────────────────────
type Phase = "setup" | "lobby" | "game" | "ended";
interface Player { id: number; name: string; colorIdx: number; position: number; }
interface GameState {
  code: string; players: Player[]; maxPlayers: number; status: string;
  currentPlayerIdx: number; currentPlayerId: number | null;
  diceValue: number | null; diceRolled: boolean;
  winner: number | null; winnerName: string | null;
  hostId: number; lastEvent: "snake" | "ladder" | null;
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
  const [gameMode, setGameMode] = useState<"menu" | "ai">("menu");
  const [numAI, setNumAI] = useState(1);
  const [savedSession, setSavedSession] = useState<{ code: string } | null>(null);

  useEffect(() => { setSavedSession(loadSnlSession()); }, []);

  const myPlayerIdx = gameState?.players.findIndex(p => p.id === myId) ?? -1;
  const isMyTurn = gameState?.currentPlayerId === myId;
  const isHost = gameState?.hostId === myId;

  const connect = useCallback(() => {
    const token = localStorage.getItem("mission_token");
    if (!token) { toast.error("Please log in."); return null; }
    const s = io({ path: "/api/socket.io/", auth: { token }, transports: ["websocket", "polling"] });
    s.on("connect_error", err => { toast.error("Connection failed: " + err.message); setConnecting(false); });
    s.on("snl:error", ({ message }: { message: string }) => { toast.error(message); setConnecting(false); });
    s.on("snl:created", (state: GameState) => {
      setGameState(state); setPhase("lobby"); setConnecting(false);
      saveSnlSession(state.code);
    });
    s.on("snl:state", (state: GameState) => {
      setGameState(state);
      if (state.status === "playing") setPhase("game");
      if (state.status === "ended") { setPhase("ended"); clearSnlSession(); }
    });
    s.on("snl:player-joined", ({ name }: { name: string }) => toast.success(`${name} joined!`));
    s.on("snl:rolled", ({ dice, playerName, to }: any) => setLastMsg(`${playerName} rolled ${dice} → square ${to}`));
    s.on("snl:event", ({ type, player, from, to }: any) => {
      if (type === "snake") toast(`🐍 ${player} hit a snake! ${from} → ${to}`);
      else toast(`🪜 ${player} climbed a ladder! ${from} → ${to}`, { icon: "🎉" });
      setLastMsg(type === "snake" ? `🐍 ${player} slid from ${from} to ${to}` : `🪜 ${player} climbed from ${from} to ${to}`);
    });
    s.on("snl:won", ({ name }: { name: string }) => toast.success(`🏆 ${name} wins!`));
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
  const handleJoin = (codeOverride?: string) => {
    const code = (codeOverride ?? joinCode).trim().toUpperCase();
    if (code.length !== 6) { toast.error("Enter a 6-character code."); return; }
    setConnecting(true);
    const s = connect();
    if (!s) return;
    s.on("connect", () => { s.emit("snl:join", { code }); setJoinCode(""); saveSnlSession(code); });
  };
  const handleRejoin = () => { if (!savedSession) return; setSavedSession(null); handleJoin(savedSession.code); };
  const handleStart = () => socketRef.current?.emit("snl:start", { code: gameState?.code });
  const handleRoll = () => {
    if (!isMyTurn || gameState?.diceRolled) return;
    socketRef.current?.emit("snl:roll", { code: gameState?.code });
  };
  const handleLeave = () => {
    socketRef.current?.emit("snl:leave", { code: gameState?.code });
    socketRef.current?.disconnect();
    socketRef.current = null;
    clearSnlSession(); setSavedSession(null);
    setPhase("setup"); setGameState(null); setLastMsg(null);
  };

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  // ── Setup ──
  if (phase === "setup") {
    if (gameMode === "ai") return <SNLAIGame onBack={() => setGameMode("menu")} numAI={numAI} />;
    return (
      <div className="space-y-5">
        <h2 className="text-center text-lg font-black" style={{ color: "#2E7D32" }}>
          🐍 SNAKES &amp; LADDERS 🪜
        </h2>

        {savedSession && (
          <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-sm text-yellow-800">🎲 Active room: <span className="font-mono tracking-widest">{savedSession.code}</span></p>
              <p className="text-xs text-yellow-600">Tap Rejoin to return to your game</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={connecting} onClick={handleRejoin} className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs h-8">
                {connecting ? "Rejoining…" : "Rejoin"}
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { clearSnlSession(); setSavedSession(null); }}>Dismiss</Button>
            </div>
          </div>
        )}

        {/* vs AI */}
        <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-4 space-y-3">
          <p className="font-bold text-sm text-green-800 flex items-center gap-2">🤖 Play vs Meddy AI (Offline)</p>
          <p className="text-xs text-green-700">Number of AI opponents</p>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <Button key={n} variant={numAI === n ? "default" : "outline"} size="sm" className="flex-1"
                onClick={() => setNumAI(n)}>{n} AI</Button>
            ))}
          </div>
          <Button onClick={() => setGameMode("ai")} className="w-full gap-2 bg-green-600 hover:bg-green-700 rounded-xl">
            🎮 Start vs AI
          </Button>
        </div>

        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold text-center">Or play online</p>
        <div className="flex gap-2">
          <Button variant={joinMode === "create" ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setJoinMode("create")}>Create</Button>
          <Button variant={joinMode === "join" ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setJoinMode("join")}>Join</Button>
        </div>
        {joinMode === "create" ? (
          <div className="space-y-4">
            <Select value={maxPlayers} onValueChange={setMaxPlayers}>
              <SelectTrigger className="bg-card/40 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Players</SelectItem>
                <SelectItem value="3">3 Players</SelectItem>
                <SelectItem value="4">4 Players</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={connecting} className="w-full rounded-xl">
              {connecting ? "Creating…" : "Create Room"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code" maxLength={6}
              className="text-center text-lg tracking-widest font-mono uppercase bg-card/40 rounded-xl" />
            <Button onClick={() => handleJoin()} disabled={connecting || joinCode.trim().length !== 6} className="w-full rounded-xl">
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
            <Button variant="outline" size="sm" className="h-7 text-xs px-2"
              onClick={() => { navigator.clipboard.writeText(`Join my Snakes & Ladders game on Mission Distinction! 🐍🪜\nRoom Code: ${gameState.code}\n(Games → Snakes & Ladders → Multiplayer → Join Room)`); toast.success("Invite copied!"); }}>
              Invite
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{gameState.players.length}/{gameState.maxPlayers} players</p>
        </div>
        <div className="space-y-2">
          {gameState.players.map((p, idx) => (
            <PlayerCard key={p.id} p={p} idx={idx} isCurrent={false} />
          ))}
        </div>
        <div className="flex gap-2">
          {isHost ? (
            <Button onClick={handleStart} disabled={gameState.players.length < 2} className="flex-1 rounded-xl bg-green-600 hover:bg-green-700">
              Start Game
            </Button>
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
          <h2 className="text-base font-black" style={{ color: "#2E7D32" }}>🐍 SNAKES &amp; LADDERS 🪜</h2>
          <Button variant="ghost" size="sm" onClick={handleLeave} className="gap-1 text-xs opacity-60 hover:opacity-100">
            <LogOut size={12} /> Leave
          </Button>
        </div>

        <div className="flex gap-3 items-start flex-wrap">
          <div className="flex-shrink-0" style={{ maxWidth: BOARD }}>
            <SNLBoard positions={gameState.players} currentPlayerId={gameState.currentPlayerId} players={gameState.players} />
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
            {gameState.players.map((p, idx) => (
              <PlayerCard key={p.id} p={p} idx={idx} isCurrent={gameState.currentPlayerIdx === idx} />
            ))}
            <div className="rounded-xl border-2 border-purple-400 bg-purple-600 px-3 py-2.5 text-white text-center mt-1">
              <Trophy size={18} className="mx-auto mb-1 text-yellow-300" />
              <p className="font-bold text-sm">Goal</p>
              <p className="text-xs opacity-80">Reach 100 to Win!</p>
            </div>
          </div>
        </div>

        {lastMsg && (
          <div className="text-xs text-center text-muted-foreground bg-card/40 rounded-xl py-2 px-4 border border-border/30">
            {lastMsg}
          </div>
        )}

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
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-black text-xl text-white flex items-center justify-center gap-4 shadow-lg transition-all disabled:opacity-50"
            style={{
              background: isMyTurn && !gameState.diceRolled
                ? "linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)"
                : "linear-gradient(135deg, #90A4AE 0%, #B0BEC5 100%)",
              boxShadow: isMyTurn && !gameState.diceRolled ? "0 6px 20px rgba(25,118,210,0.45)" : "none",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={gameState.diceValue ?? "roll"}
                initial={{ rotate: -20, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", duration: 0.4 }}>
                <DiceFace value={gameState.diceValue} />
              </motion.div>
            </AnimatePresence>
            <div className="text-left">
              {isMyTurn && !gameState.diceRolled ? (
                <>
                  <div>ROLL DICE</div>
                  <div className="text-xs font-normal opacity-80">Tap to Roll</div>
                </>
              ) : isMyTurn && gameState.diceRolled ? (
                <div className="text-base">Moving…</div>
              ) : (
                <>
                  <div className="text-base">
                    {currentPlayer?.name?.split(" ")[0]}'s turn
                  </div>
                  <div className="text-xs font-normal opacity-70 animate-pulse">Waiting…</div>
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
