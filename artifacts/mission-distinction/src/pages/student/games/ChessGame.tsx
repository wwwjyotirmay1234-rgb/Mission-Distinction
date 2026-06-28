import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, LogOut, RotateCcw, Lightbulb, BarChart2, Flag, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = ["8","7","6","5","4","3","2","1"];

const PIECE_SYMBOLS: Record<string, string> = {
  wK:"♔", wQ:"♕", wR:"♖", wB:"♗", wN:"♘", wP:"♙",
  bK:"♚", bQ:"♛", bR:"♜", bB:"♝", bN:"♞", bP:"♟",
};

// Premium board palette
const LIGHT_SQ = "#E8D5A3";
const DARK_SQ  = "#1A2744";
const GOLD     = "#C9A227";
const NAVY     = "#0D1B2A";
const CARD_BG  = "rgba(255,255,255,0.06)";

type Phase = "setup" | "lobby" | "game" | "ended";
type Mode = "create" | "join";

interface GameState {
  code: string;
  white: { id: number; name: string } | null;
  black: { id: number; name: string } | null;
  fen: string; turn: "w" | "b"; status: "waiting" | "playing" | "ended";
  result: string | null; isCheck: boolean; isCheckmate: boolean;
  isStalemate: boolean; isDraw: boolean; moveHistory: string[];
}

function squareCoord(file: number, rank: number): string {
  return FILES[file] + RANKS[rank];
}

// ─── Captured pieces ──────────────────────────────────────────────────────────
function getCaptured(chess: Chess) {
  const count: Record<string, Record<string, number>> = { w: {}, b: {} };
  for (const row of chess.board())
    for (const p of row) if (p) count[p.color][p.type] = (count[p.color][p.type] || 0) + 1;
  const start: Record<string, number> = { p:8, n:2, b:2, r:2, q:1 };
  const byBlack: string[] = []; // white pieces black captured
  const byWhite: string[] = []; // black pieces white captured
  for (const t of ["q","r","b","n","p"]) {
    for (let i = 0; i < start[t] - (count.w[t] || 0); i++) byBlack.push(PIECE_SYMBOLS["w" + t.toUpperCase()]);
    for (let i = 0; i < start[t] - (count.b[t] || 0); i++) byWhite.push(PIECE_SYMBOLS["b" + t.toUpperCase()]);
  }
  return { byBlack, byWhite };
}

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useChessClock(active: boolean, initial = 900) {
  const [secs, setSecs] = useState(initial);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [active]);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  return fmt(secs);
}

// ─── Chess Board ──────────────────────────────────────────────────────────────
interface ChessBoardProps {
  fen: string; myColor: "white" | "black"; isMyTurn: boolean;
  onMove: (from: string, to: string) => void;
  isCheck: boolean; disabled: boolean;
  hintFrom?: string | null; hintTo?: string | null;
}

function ChessBoard({ fen, myColor, isMyTurn, onMove, isCheck, disabled, hintFrom, hintTo }: ChessBoardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const chessRef = useRef(new Chess());

  useEffect(() => {
    chessRef.current = new Chess(fen);
    setSelected(null); setValidMoves([]);
  }, [fen]);

  const handleClick = useCallback((sq: string) => {
    if (disabled || !isMyTurn) return;
    const chess = chessRef.current;
    const piece = chess.get(sq as any);

    if (selected) {
      if (validMoves.includes(sq)) {
        onMove(selected, sq); setSelected(null); setValidMoves([]); return;
      }
      if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
        setSelected(sq);
        setValidMoves(chess.moves({ square: sq as any, verbose: true }).map(m => m.to));
        return;
      }
      setSelected(null); setValidMoves([]); return;
    }
    if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
      setSelected(sq);
      setValidMoves(chess.moves({ square: sq as any, verbose: true }).map(m => m.to));
    }
  }, [selected, validMoves, myColor, isMyTurn, disabled, onMove]);

  const flipped = myColor === "black";
  const board = chessRef.current.board();
  const rankOrder = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const fileOrder = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  const kingColor = chessRef.current.turn();
  let kingSquare = "";
  if (isCheck) {
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (p && p.type === "k" && p.color === kingColor) kingSquare = FILES[f] + (8 - r);
    }
  }

  const CELL = 44;

  return (
    <div className="select-none" style={{ display: "inline-block" }}>
      {/* Gold frame */}
      <div style={{
        border: `3px solid ${GOLD}`,
        borderRadius: 8,
        boxShadow: `0 0 0 1px rgba(201,162,39,0.3), 0 12px 40px rgba(0,0,0,0.6)`,
        display: "inline-block",
        background: GOLD,
      }}>
        <div style={{ display: "flex" }}>
          {/* Rank labels left */}
          <div style={{ display: "flex", flexDirection: "column", width: 18, justifyContent: "space-around", paddingLeft: 2 }}>
            {rankOrder.map(ri => (
              <span key={ri} style={{ height: CELL, lineHeight: `${CELL}px`, fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, textAlign: "center" }}>
                {8 - ri}
              </span>
            ))}
          </div>
          {/* Board */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(8, ${CELL}px)`, gridTemplateRows: `repeat(8, ${CELL}px)` }}>
            {rankOrder.map(rankIdx =>
              fileOrder.map(fileIdx => {
                const sq = FILES[fileIdx] + (8 - rankIdx);
                const piece = board[rankIdx][fileIdx];
                const isLight = (fileIdx + rankIdx) % 2 === 0;
                const isSelected = selected === sq;
                const isValid = validMoves.includes(sq);
                const isKingCheck = sq === kingSquare;
                const isHintFrom = hintFrom === sq;
                const isHintTo = hintTo === sq;
                const symbol = piece ? PIECE_SYMBOLS[piece.color + piece.type.toUpperCase()] : "";

                let bgColor = isLight ? LIGHT_SQ : DARK_SQ;
                if (isSelected) bgColor = "#D4A017";
                else if (isKingCheck) bgColor = "#C0392B";
                else if (isHintFrom) bgColor = "#2E86C1";
                else if (isHintTo) bgColor = "#1A5276";

                return (
                  <div key={sq} onClick={() => handleClick(sq)}
                    style={{ width: CELL, height: CELL, background: bgColor, position: "relative",
                      cursor: isMyTurn && !disabled ? "pointer" : "default",
                      transition: "background 0.15s",
                    }}>
                    {/* Valid move indicator */}
                    {isValid && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        {piece
                          ? <div style={{ position: "absolute", inset: 2, borderRadius: 4, border: "3px solid rgba(100,210,100,0.75)" }} />
                          : <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(100,210,100,0.5)" }} />
                        }
                      </div>
                    )}
                    {/* Piece */}
                    {symbol && (
                      <div style={{
                        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, lineHeight: 1, zIndex: 1,
                        color: piece?.color === "w" ? "#F5F0E0" : "#1A1A2E",
                        textShadow: piece?.color === "w"
                          ? "0 2px 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)"
                          : "0 1px 3px rgba(255,255,255,0.25)",
                        filter: piece?.color === "w" ? "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" : undefined,
                      }}>
                        {symbol}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* File labels bottom */}
        <div style={{ display: "flex", paddingLeft: 18, background: "rgba(0,0,0,0.3)" }}>
          {fileOrder.map(f => (
            <span key={f} style={{ width: CELL, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, padding: "2px 0" }}>
              {FILES[f]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Player Info Card ─────────────────────────────────────────────────────────
function PlayerInfoCard({ name, color, isActive, thinking, captured }: {
  name: string; color: "white" | "black";
  isActive: boolean; thinking?: boolean; captured: string[];
}) {
  const pieceIcon = color === "white" ? "♔" : "♚";
  const timeStr = useChessClock(isActive, color === "white" ? 855 : 900); // just cosmetic

  return (
    <div style={{
      background: CARD_BG,
      border: `1px solid ${isActive ? GOLD : "rgba(255,255,255,0.1)"}`,
      borderRadius: 12,
      padding: "10px 14px",
      boxShadow: isActive ? `0 0 16px rgba(201,162,39,0.25)` : "none",
      transition: "all 0.3s",
    }}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: color === "white" ? "linear-gradient(135deg, #E8D5A3 0%, #C9A227 100%)" : "linear-gradient(135deg, #2C3E50 0%, #1A2744 100%)",
          border: `2px solid ${GOLD}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>
          <span style={{ color: color === "white" ? "#1A1A2E" : "#F5F0E0" }}>{pieceIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }} className="truncate">{name}</p>
            {isActive && !thinking && (
              <span style={{
                background: "rgba(39,174,96,0.25)", border: "1px solid #27AE60",
                color: "#2ECC71", fontSize: 10, fontWeight: 700,
                padding: "1px 7px", borderRadius: 99,
              }}>YOUR TURN</span>
            )}
            {thinking && (
              <span style={{
                background: "rgba(201,162,39,0.2)", border: "1px solid rgba(201,162,39,0.5)",
                color: GOLD, fontSize: 10, fontWeight: 700,
                padding: "1px 7px", borderRadius: 99,
              }} className="animate-pulse">Thinking…</span>
            )}
          </div>
          <div style={{ color: GOLD, fontSize: 11, marginTop: 2 }}>
            {captured.length > 0
              ? <span>{captured.slice(0,8).join(" ")}</span>
              : <span style={{ opacity: 0.4 }}>{color === "white" ? "White" : "Black"}</span>
            }
          </div>
        </div>
        {/* Timer */}
        <div style={{
          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,162,39,0.4)",
          borderRadius: 8, padding: "4px 10px",
          display: "flex", alignItems: "center", gap: 5,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14 }}>⏱</span>
          <span style={{ color: "white", fontWeight: 800, fontSize: 16, fontFamily: "monospace" }}>
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Move History Bar ─────────────────────────────────────────────────────────
function MoveHistory({ hist }: { hist: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ left: 99999, behavior: "smooth" }); }, [hist]);

  const pairs: [string, string | null][] = [];
  for (let i = 0; i < hist.length; i += 2)
    pairs.push([hist[i], hist[i + 1] ?? null]);

  return (
    <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(201,162,39,0.2)" }}>
      <p style={{ color: GOLD, fontSize: 9, fontWeight: 800, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>
        ⬦ Move History ⬦
      </p>
      <div ref={ref} style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
        {pairs.length === 0
          ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Game started</span>
          : pairs.map(([w, b], i) => (
              <div key={i} style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{i + 1}.</span>
                <span style={{
                  background: "rgba(255,255,255,0.12)", borderRadius: 5, padding: "2px 7px",
                  color: "white", fontSize: 12, fontWeight: 600,
                }}>{w}</span>
                {b && <span style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: 5, padding: "2px 7px",
                  color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600,
                }}>{b}</span>}
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, disabled, badge, danger }: {
  icon: React.ReactNode; label: string; onClick?: () => void;
  disabled?: boolean; badge?: number; danger?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "8px 4px",
        background: danger ? "rgba(192,57,43,0.2)" : "rgba(255,255,255,0.07)",
        border: `1px solid ${danger ? "rgba(192,57,43,0.5)" : "rgba(201,162,39,0.3)"}`,
        borderRadius: 10, color: danger ? "#E74C3C" : "white",
        fontSize: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1, position: "relative", transition: "all 0.2s",
        letterSpacing: 0.5,
      }}>
      {badge != null && (
        <span style={{
          position: "absolute", top: 4, right: 4,
          background: "#E74C3C", color: "white", borderRadius: 99,
          fontSize: 9, fontWeight: 800, width: 16, height: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{badge}</span>
      )}
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── AI Engine ────────────────────────────────────────────────────────────────
const CP: Record<string, number> = { p:100, n:320, b:330, r:500, q:900, k:20000 };

function evalBoard(chess: Chess, aiCol: "w" | "b"): number {
  if (chess.isCheckmate()) return chess.turn() === aiCol ? -100000 : 100000;
  if (chess.isDraw()) return 0;
  let s = 0;
  for (const row of chess.board()) for (const pc of row)
    if (pc) s += pc.color === aiCol ? (CP[pc.type] ?? 0) : -(CP[pc.type] ?? 0);
  return s;
}

function ab(chess: Chess, depth: number, alpha: number, beta: number, maxing: boolean, aiCol: "w" | "b"): number {
  if (depth === 0 || chess.isGameOver()) return evalBoard(chess, aiCol);
  const moves = chess.moves({ verbose: true });
  if (maxing) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move(m); best = Math.max(best, ab(chess, depth-1, alpha, beta, false, aiCol)); chess.undo();
      alpha = Math.max(alpha, best); if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      chess.move(m); best = Math.min(best, ab(chess, depth-1, alpha, beta, true, aiCol)); chess.undo();
      beta = Math.min(beta, best); if (beta <= alpha) break;
    }
    return best;
  }
}

function getAIMove(chess: Chess, diff: "easy" | "medium" | "hard") {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  if (diff === "easy") return moves[Math.floor(Math.random() * moves.length)];
  const aiCol = chess.turn() as "w" | "b";
  const depth = diff === "hard" ? 3 : 2;
  const shuffled = [...moves].sort(() => Math.random() - 0.5);
  let best = shuffled[0], bestScore = -Infinity;
  for (const m of shuffled) {
    chess.move(m);
    const score = ab(chess, depth-1, -Infinity, Infinity, false, aiCol);
    chess.undo();
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

// ─── AI Game ─────────────────────────────────────────────────────────────────
function ChessAIGame({ onBack, difficulty, playerColor }: {
  onBack: () => void; difficulty: "easy" | "medium" | "hard"; playerColor: "white" | "black";
}) {
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(() => chessRef.current.fen());
  const [aiThinking, setAIThinking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hist, setHist] = useState<string[]>([]);
  const [hint, setHint] = useState<{ from: string; to: string } | null>(null);
  const [hintCount, setHintCount] = useState(3);

  const myCol = playerColor === "white" ? "w" : "b";
  const aiCol = playerColor === "white" ? "b" : "w";
  const chess = chessRef.current;
  const isMyTurn = chess.turn() === myCol && !aiThinking && !result;

  const aiLabel = { easy: "Meddy Easy 🤖", medium: "Meddy Pro 🤖", hard: "Meddy Master 🤖" }[difficulty];
  const opponentColor = playerColor === "white" ? "black" : "white";

  const checkOver = useCallback((c: Chess) => {
    if (!c.isGameOver()) return false;
    if (c.isCheckmate()) setResult(c.turn() === myCol ? "AI wins! 🤖" : "You win! 🎉");
    else setResult("Draw!");
    return true;
  }, [myCol]);

  useEffect(() => {
    if (result || chess.turn() !== aiCol) return;
    setAIThinking(true);
    const delay = { easy: 400, medium: 700, hard: 1100 }[difficulty];
    const t = setTimeout(() => {
      const move = getAIMove(chess, difficulty);
      if (move) { chess.move(move); setFen(chess.fen()); setHist(chess.history()); checkOver(chess); }
      setAIThinking(false);
    }, delay);
    return () => clearTimeout(t);
  }, [fen, aiCol, difficulty, result, chess, checkOver]);

  const handleMove = (from: string, to: string) => {
    if (!isMyTurn) return;
    try { chess.move({ from: from as any, to: to as any, promotion: "q" }); setFen(chess.fen()); setHist(chess.history()); setHint(null); checkOver(chess); }
    catch {}
  };

  const handleUndo = () => {
    if (hist.length < 2) return;
    chess.undo(); chess.undo();
    setFen(chess.fen()); setHist(chess.history()); setResult(null); setHint(null);
  };

  const handleHint = () => {
    if (hintCount <= 0 || !isMyTurn) return;
    const move = getAIMove(chess, "medium");
    if (move) {
      setHint({ from: move.from, to: move.to });
      setHintCount(c => c - 1);
      setTimeout(() => setHint(null), 2500);
    }
  };

  const newGame = () => {
    chessRef.current = new Chess();
    setFen(chessRef.current.fen()); setAIThinking(false); setResult(null); setHist([]); setHint(null); setHintCount(3);
  };

  const { byBlack, byWhite } = getCaptured(chess);

  return (
    <div style={{ background: NAVY, borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
          ← Back
        </button>
        <p style={{ color: GOLD, fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>♟ CHESS</p>
        <div style={{ width: 50 }} />
      </div>

      {/* Opponent */}
      <PlayerInfoCard
        name={aiLabel} color={opponentColor}
        isActive={!isMyTurn && !result} thinking={aiThinking}
        captured={opponentColor === "white" ? byBlack : byWhite}
      />

      {/* Board */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ChessBoard fen={fen} myColor={playerColor} isMyTurn={isMyTurn}
          onMove={handleMove} isCheck={chess.inCheck()} disabled={!!result || aiThinking}
          hintFrom={hint?.from} hintTo={hint?.to} />
      </div>

      {/* Me */}
      <PlayerInfoCard
        name="You" color={playerColor}
        isActive={isMyTurn && !result} thinking={false}
        captured={playerColor === "white" ? byWhite : byBlack}
      />

      {/* Check warning */}
      {chess.inCheck() && !result && (
        <div style={{ textAlign: "center", color: "#E74C3C", fontWeight: 700, fontSize: 13, padding: "4px 0" }} className="animate-pulse">
          ⚠️ Check!
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          textAlign: "center", padding: 16, borderRadius: 12,
          background: "linear-gradient(135deg, rgba(201,162,39,0.15) 0%, rgba(201,162,39,0.05) 100%)",
          border: `1px solid ${GOLD}`,
        }}>
          <p style={{ color: GOLD, fontWeight: 900, fontSize: 20, marginBottom: 12 }}>🏁 {result}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={newGame} style={{
              background: GOLD, color: "#1A1A2E", border: "none", borderRadius: 8,
              padding: "8px 20px", fontWeight: 800, cursor: "pointer", fontSize: 13,
            }}>
              ↺ New Game
            </button>
            <button onClick={onBack} style={{
              background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "8px 20px", fontWeight: 700, cursor: "pointer", fontSize: 13,
            }}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Move History */}
      <MoveHistory hist={hist} />

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        <ActionBtn icon={<Undo2 size={18} />} label="UNDO" onClick={handleUndo} disabled={hist.length < 2 || !!result} />
        <ActionBtn icon={<Lightbulb size={18} />} label="HINT" onClick={handleHint}
          disabled={hintCount <= 0 || !isMyTurn || !!result} badge={hintCount} />
        <ActionBtn icon={<BarChart2 size={18} />} label="ANALYSIS" disabled />
        <ActionBtn icon={<RotateCcw size={18} />} label="NEW GAME" onClick={newGame} />
        <ActionBtn icon={<Flag size={18} />} label="RESIGN" onClick={onBack} danger />
      </div>
    </div>
  );
}

// ─── Multiplayer ──────────────────────────────────────────────────────────────
export default function ChessGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("create");
  const [joinCode, setJoinCode] = useState("");
  const [myColor, setMyColor] = useState<"white" | "black">("white");
  const [myId, setMyId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connecting, setConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [gameMode, setGameMode] = useState<"menu" | "ai">("menu");
  const [aiDifficulty, setAIDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [aiPlayerColor, setAIPlayerColor] = useState<"white" | "black">("white");

  const connect = useCallback(() => {
    const token = localStorage.getItem("mission_token");
    if (!token) { toast.error("Please log in."); return null; }
    const s = io({ path: "/api/socket.io/", auth: { token }, transports: ["websocket", "polling"] });
    s.on("connect_error", err => { toast.error("Connection failed: " + err.message); setConnecting(false); });
    s.on("chess:error", ({ message }: { message: string }) => { toast.error(message); setConnecting(false); });
    s.on("chess:created", (state: GameState) => { setGameState(state); setMyColor("white"); setPhase("lobby"); setConnecting(false); });
    s.on("chess:state", (state: GameState) => {
      setGameState(state);
      if (state.status === "playing") setPhase("game");
      if (state.status === "ended") setPhase("ended");
    });
    socketRef.current = s;
    return s;
  }, []);

  const handleCreate = () => { setConnecting(true); const s = connect(); if (!s) return; s.on("connect", () => s.emit("chess:create")); };
  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error("Enter a 6-character code."); return; }
    setConnecting(true); const s = connect(); if (!s) return;
    s.on("connect", () => { s.emit("chess:join", { code }); setMyColor("black"); setJoinCode(""); });
  };

  useEffect(() => {
    if (gameState?.status === "playing") setPhase("game");
    if (gameState?.status === "ended") setPhase("ended");
  }, [gameState?.status]);

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  const handleMove = useCallback((from: string, to: string) => {
    socketRef.current?.emit("chess:move", { code: gameState?.code, from, to });
  }, [gameState?.code]);

  const handleResign = () => {
    if (window.confirm("Resign this game?")) socketRef.current?.emit("chess:resign", { code: gameState?.code });
  };

  const handleLeave = () => {
    socketRef.current?.emit("chess:leave", { code: gameState?.code });
    socketRef.current?.disconnect(); socketRef.current = null;
    setPhase("setup"); setGameState(null);
  };

  const isMyTurn = gameState
    ? (myColor === "white" && gameState.turn === "w") || (myColor === "black" && gameState.turn === "b")
    : false;

  // ── Setup ──
  if (phase === "setup") {
    if (gameMode === "ai") return <ChessAIGame onBack={() => setGameMode("menu")} difficulty={aiDifficulty} playerColor={aiPlayerColor} />;
    return (
      <div style={{ background: NAVY, borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ color: GOLD, fontWeight: 900, fontSize: 16, textAlign: "center", letterSpacing: 1 }}>♟ CHESS</p>

        {/* vs AI card */}
        <div style={{ background: CARD_BG, border: `1px solid rgba(201,162,39,0.35)`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: "white", fontWeight: 700, fontSize: 14 }}>🤖 Play vs Meddy AI</p>
          <div style={{ display: "flex", gap: 6 }}>
            {(["white","black"] as const).map(c => (
              <button key={c} onClick={() => setAIPlayerColor(c)}
                style={{
                  flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid ${aiPlayerColor === c ? GOLD : "rgba(255,255,255,0.15)"}`,
                  background: aiPlayerColor === c ? `rgba(201,162,39,0.2)` : "transparent",
                  color: aiPlayerColor === c ? GOLD : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>
                {c === "white" ? "♔ White" : "♚ Black"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["easy","medium","hard"] as const).map(d => (
              <button key={d} onClick={() => setAIDifficulty(d)}
                style={{
                  flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid ${aiDifficulty === d ? GOLD : "rgba(255,255,255,0.15)"}`,
                  background: aiDifficulty === d ? `rgba(201,162,39,0.2)` : "transparent",
                  color: aiDifficulty === d ? GOLD : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 12, cursor: "pointer",
                }}>
                {d === "easy" ? "😊 Easy" : d === "medium" ? "🧠 Med" : "💀 Hard"}
              </button>
            ))}
          </div>
          <button onClick={() => setGameMode("ai")} style={{
            background: `linear-gradient(135deg, ${GOLD} 0%, #A07818 100%)`,
            color: "#1A1A2E", border: "none", borderRadius: 10, padding: "11px",
            fontWeight: 900, fontSize: 14, cursor: "pointer",
          }}>
            🎮 Start vs AI
          </button>
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>— OR PLAY ONLINE —</p>

        <div style={{ display: "flex", gap: 8 }}>
          {(["create","join"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "9px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: mode === m ? `rgba(201,162,39,0.2)` : "transparent",
              border: `1px solid ${mode === m ? GOLD : "rgba(255,255,255,0.15)"}`,
              color: mode === m ? GOLD : "rgba(255,255,255,0.6)",
            }}>
              {m === "create" ? "Create Game" : "Join Game"}
            </button>
          ))}
        </div>

        {mode === "create" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: CARD_BG, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>♔</span>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>You will play as White</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>White moves first</p>
              </div>
            </div>
            <button onClick={handleCreate} disabled={connecting} style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, #A07818 100%)`,
              color: "#1A1A2E", border: "none", borderRadius: 10, padding: "12px",
              fontWeight: 900, fontSize: 14, cursor: connecting ? "wait" : "pointer", opacity: connecting ? 0.7 : 1,
            }}>
              {connecting ? "Connecting…" : "Create Chess Room"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code" maxLength={6}
              className="text-center text-lg tracking-widest font-mono uppercase"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,162,39,0.4)", color: "white", borderRadius: 10 }} />
            <button onClick={handleJoin} disabled={connecting || joinCode.trim().length !== 6} style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, #A07818 100%)`,
              color: "#1A1A2E", border: "none", borderRadius: 10, padding: "12px",
              fontWeight: 900, fontSize: 14, cursor: "pointer",
              opacity: connecting || joinCode.trim().length !== 6 ? 0.5 : 1,
            }}>
              {connecting ? "Joining…" : "Join Game"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Lobby ──
  if (phase === "lobby" && gameState) {
    return (
      <div style={{ background: NAVY, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <p style={{ color: GOLD, fontWeight: 900, fontSize: 16 }}>♟ CHESS</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Room Code</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: GOLD, fontWeight: 900, fontSize: 28, fontFamily: "monospace", letterSpacing: 4 }}>{gameState.code}</span>
          <button onClick={() => { navigator.clipboard.writeText(gameState.code); toast.success("Copied!"); }}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", color: "white", cursor: "pointer" }}>
            <Copy size={14} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[{ player: gameState.white, label: "White", icon: "♔" }, { player: gameState.black, label: "Black", icon: "♚" }].map(({ player, label, icon }) => (
            <div key={label} style={{
              textAlign: "center", padding: "16px 20px", borderRadius: 12,
              background: player ? CARD_BG : "transparent",
              border: `1px solid ${player ? "rgba(201,162,39,0.4)" : "rgba(255,255,255,0.15)"}`,
              borderStyle: player ? "solid" : "dashed",
            }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{icon}</div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{player?.name ?? "Waiting…"}</p>
              <span style={{ color: GOLD, fontSize: 10, fontWeight: 700 }}>{label}</span>
            </div>
          ))}
        </div>
        {!gameState.black && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600 }} className="animate-pulse">
            Waiting for opponent to join…
          </p>
        )}
        <button onClick={handleLeave} style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 10, padding: "9px 20px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontWeight: 600, fontSize: 13,
        }}>
          Leave
        </button>
      </div>
    );
  }

  // ── Game / Ended ──
  if ((phase === "game" || phase === "ended") && gameState) {
    const opponent = myColor === "white" ? gameState.black : gameState.white;
    const me = myColor === "white" ? gameState.white : gameState.black;
    const opponentColor: "white" | "black" = myColor === "white" ? "black" : "white";
    const chessLocal = new Chess(gameState.fen);
    const { byBlack, byWhite } = getCaptured(chessLocal);

    return (
      <div style={{ background: NAVY, borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="flex items-center justify-between">
          <p style={{ color: GOLD, fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>♟ CHESS</p>
          <button onClick={handleLeave} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>
            Leave
          </button>
        </div>

        <PlayerInfoCard
          name={opponent?.name ?? "Opponent"} color={opponentColor}
          isActive={!isMyTurn && gameState.status === "playing"} thinking={!isMyTurn && gameState.status === "playing"}
          captured={opponentColor === "white" ? byBlack : byWhite}
        />

        <div style={{ display: "flex", justifyContent: "center" }}>
          <ChessBoard fen={gameState.fen} myColor={myColor}
            isMyTurn={isMyTurn && gameState.status === "playing"}
            onMove={handleMove} isCheck={gameState.isCheck}
            disabled={gameState.status !== "playing"} />
        </div>

        <PlayerInfoCard
          name={me?.name ?? "You"} color={myColor}
          isActive={isMyTurn && gameState.status === "playing"} thinking={false}
          captured={myColor === "white" ? byWhite : byBlack}
        />

        {gameState.isCheck && !gameState.isCheckmate && (
          <div style={{ textAlign: "center", color: "#E74C3C", fontWeight: 700, fontSize: 13 }} className="animate-pulse">
            ⚠️ Check!
          </div>
        )}

        {gameState.result && (
          <div style={{
            textAlign: "center", padding: 16, borderRadius: 12,
            background: `rgba(201,162,39,0.12)`, border: `1px solid ${GOLD}`,
          }}>
            <p style={{ color: GOLD, fontWeight: 900, fontSize: 20, marginBottom: 12 }}>🏁 {gameState.result}</p>
            <button onClick={handleLeave} style={{
              background: GOLD, color: "#1A1A2E", border: "none", borderRadius: 8,
              padding: "8px 24px", fontWeight: 800, cursor: "pointer", fontSize: 13,
            }}>Back to Menu</button>
          </div>
        )}

        <MoveHistory hist={gameState.moveHistory ?? []} />

        <div style={{ display: "flex", gap: 6 }}>
          <ActionBtn icon={<BarChart2 size={18} />} label="ANALYSIS" disabled />
          <ActionBtn icon={<RotateCcw size={18} />} label="NEW GAME" disabled />
          <ActionBtn icon={<Flag size={18} />} label="RESIGN" onClick={handleResign}
            disabled={gameState.status !== "playing"} danger />
        </div>
      </div>
    );
  }

  return null;
}
