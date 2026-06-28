import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, LogOut, Crown, Flag, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = ["8","7","6","5","4","3","2","1"];

const PIECE_SYMBOLS: Record<string, string> = {
  wK:"♔", wQ:"♕", wR:"♖", wB:"♗", wN:"♘", wP:"♙",
  bK:"♚", bQ:"♛", bR:"♜", bB:"♝", bN:"♞", bP:"♟",
};

type Phase = "setup" | "lobby" | "game" | "ended";
type Mode = "create" | "join";

interface GameState {
  code: string;
  white: { id: number; name: string } | null;
  black: { id: number; name: string } | null;
  fen: string;
  turn: "w" | "b";
  status: "waiting" | "playing" | "ended";
  result: string | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  moveHistory: string[];
}

function SquareCoord(file: number, rank: number): string {
  return FILES[file] + RANKS[rank];
}

interface ChessBoardProps {
  fen: string;
  myColor: "white" | "black";
  isMyTurn: boolean;
  onMove: (from: string, to: string) => void;
  isCheck: boolean;
  disabled: boolean;
}

function ChessBoard({ fen, myColor, isMyTurn, onMove, isCheck, disabled }: ChessBoardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const chess = useRef(new Chess());

  useEffect(() => {
    chess.current = new Chess(fen);
    setSelected(null);
    setValidMoves([]);
  }, [fen]);

  const handleSquareClick = useCallback((sq: string) => {
    if (disabled || !isMyTurn) return;
    const piece = chess.current.get(sq as any);

    if (selected) {
      if (validMoves.includes(sq)) {
        onMove(selected, sq);
        setSelected(null);
        setValidMoves([]);
        return;
      }
      if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
        setSelected(sq);
        const moves = chess.current.moves({ square: sq as any, verbose: true });
        setValidMoves(moves.map(m => m.to));
        return;
      }
      setSelected(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
      setSelected(sq);
      const moves = chess.current.moves({ square: sq as any, verbose: true });
      setValidMoves(moves.map(m => m.to));
    }
  }, [selected, validMoves, myColor, isMyTurn, disabled, onMove]);

  const flipped = myColor === "black";

  const board = chess.current.board();
  const rankOrder = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const fileOrder = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  // Find king position for check highlight
  const kingColor = chess.current.turn();
  let kingSquare = "";
  if (isCheck) {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (p && p.type === "k" && p.color === kingColor) {
          kingSquare = FILES[f] + (8 - r);
        }
      }
    }
  }

  return (
    <div className="select-none">
      <div className="inline-grid border-2 border-border/60 rounded-lg overflow-hidden shadow-xl"
        style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
        {rankOrder.map(rankIdx =>
          fileOrder.map(fileIdx => {
            const sq = FILES[fileIdx] + (8 - rankIdx);
            const piece = board[rankIdx][fileIdx];
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const isSelected = selected === sq;
            const isValid = validMoves.includes(sq);
            const isKingCheck = sq === kingSquare;
            const symbol = piece ? PIECE_SYMBOLS[piece.color + piece.type.toUpperCase()] : "";

            return (
              <div
                key={sq}
                onClick={() => handleSquareClick(sq)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors
                  ${isLight ? "bg-amber-100 dark:bg-amber-200" : "bg-amber-800 dark:bg-amber-900"}
                  ${isSelected ? "!bg-yellow-400/80" : ""}
                  ${isKingCheck ? "!bg-red-500/70" : ""}
                  ${isMyTurn && !disabled ? "hover:brightness-110" : ""}
                `}
                style={{ width: 52, height: 52 }}>
                {isValid && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
                    {piece
                      ? <div className="absolute inset-0 rounded-sm ring-4 ring-yellow-400/70" />
                      : <div className="w-3 h-3 rounded-full bg-black/25 dark:bg-white/30" />
                    }
                  </div>
                )}
                {symbol && (
                  <span className={`text-3xl leading-none z-10 drop-shadow-sm
                    ${piece?.color === "w" ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]" : "text-gray-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.3)]"}
                  `}>
                    {symbol}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-between mt-1 px-0.5">
        {fileOrder.map(f => <span key={f} className="text-[10px] text-muted-foreground w-[52px] text-center">{FILES[f]}</span>)}
      </div>
    </div>
  );
}

// ─── Chess AI ────────────────────────────────────────────────────────────────

const CP: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

function evalBoard(chess: Chess, aiCol: "w" | "b"): number {
  if (chess.isCheckmate()) return chess.turn() === aiCol ? -100000 : 100000;
  if (chess.isDraw()) return 0;
  let s = 0;
  for (const row of chess.board())
    for (const pc of row)
      if (pc) s += pc.color === aiCol ? (CP[pc.type] ?? 0) : -(CP[pc.type] ?? 0);
  return s;
}

function ab(chess: Chess, depth: number, alpha: number, beta: number, maxing: boolean, aiCol: "w" | "b"): number {
  if (depth === 0 || chess.isGameOver()) return evalBoard(chess, aiCol);
  const moves = chess.moves({ verbose: true });
  if (maxing) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move(m); best = Math.max(best, ab(chess, depth - 1, alpha, beta, false, aiCol)); chess.undo();
      alpha = Math.max(alpha, best); if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      chess.move(m); best = Math.min(best, ab(chess, depth - 1, alpha, beta, true, aiCol)); chess.undo();
      beta = Math.min(beta, best); if (beta <= alpha) break;
    }
    return best;
  }
}

function getAIChessMove(chess: Chess, diff: "easy" | "medium" | "hard") {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  if (diff === "easy") return moves[Math.floor(Math.random() * moves.length)];
  const aiCol = chess.turn() as "w" | "b";
  const depth = diff === "hard" ? 3 : 2;
  const shuffled = [...moves].sort(() => Math.random() - 0.5);
  let best = shuffled[0]; let bestScore = -Infinity;
  for (const m of shuffled) {
    chess.move(m);
    const score = ab(chess, depth - 1, -Infinity, Infinity, false, aiCol);
    chess.undo();
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

function ChessAIGame({ onBack, difficulty, playerColor }: {
  onBack: () => void;
  difficulty: "easy" | "medium" | "hard";
  playerColor: "white" | "black";
}) {
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(() => chessRef.current.fen());
  const [aiThinking, setAIThinking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hist, setHist] = useState<string[]>([]);

  const myCol = playerColor === "white" ? "w" : "b";
  const aiCol = playerColor === "white" ? "b" : "w";
  const chess = chessRef.current;
  const isMyTurn = chess.turn() === myCol && !aiThinking && !result;

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
      const move = getAIChessMove(chess, difficulty);
      if (move) {
        chess.move(move);
        setFen(chess.fen());
        setHist(chess.history());
        checkOver(chess);
      }
      setAIThinking(false);
    }, delay);
    return () => clearTimeout(t);
  }, [fen, aiCol, difficulty, result, chess, checkOver]);

  const handleMove = (from: string, to: string) => {
    if (!isMyTurn) return;
    try {
      chess.move({ from: from as any, to: to as any, promotion: "q" });
      setFen(chess.fen()); setHist(chess.history()); checkOver(chess);
    } catch {}
  };

  const newGame = () => {
    chessRef.current = new Chess();
    setFen(chessRef.current.fen()); setAIThinking(false); setResult(null); setHist([]);
  };

  const aiLabel = { easy: "Meddy Easy 🤖", medium: "Meddy Pro 🤖", hard: "Meddy Master 🤖" }[difficulty];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{playerColor === "white" ? "♚" : "♔"}</span>
          <span className="text-sm font-medium">{aiLabel}</span>
          {aiThinking && <Badge className="text-[10px] animate-pulse bg-amber-500/20 text-amber-300 border-none">Thinking…</Badge>}
        </div>
        <span className="text-xs text-muted-foreground">{playerColor === "white" ? "Black" : "White"}</span>
      </div>

      <div className="flex justify-center">
        <ChessBoard fen={fen} myColor={playerColor} isMyTurn={isMyTurn} onMove={handleMove}
          isCheck={chess.inCheck()} disabled={!!result || aiThinking} />
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{playerColor === "white" ? "♔" : "♚"}</span>
          <span className="text-sm font-medium">You</span>
          {isMyTurn && !result && <Badge className="text-[10px] bg-green-500/20 text-green-300 border-none">Your turn</Badge>}
        </div>
        <span className="text-xs text-muted-foreground capitalize">{playerColor}</span>
      </div>

      {chess.inCheck() && !result && (
        <div className="text-center text-sm text-red-400 font-semibold animate-pulse">⚠️ Check!</div>
      )}

      {result ? (
        <div className="text-center p-4 rounded-xl bg-card/40 border border-border/40 space-y-3">
          <p className="text-xl font-bold">🏁 {result}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={newGame} className="gap-2"><RotateCcw size={14} /> New Game</Button>
            <Button variant="outline" onClick={onBack} className="gap-2"><LogOut size={14} /> Back</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 text-xs text-muted-foreground font-mono bg-card/30 rounded-lg p-2 overflow-hidden">
            {hist.slice(-8).join(" ") || "Game started"}
          </div>
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 opacity-60 hover:opacity-100 shrink-0">
            <LogOut size={13} /> Back
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Chess Multiplayer ─────────────────────────────────────────────────────────
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
    s.on("chess:created", (state: GameState) => {
      setGameState(state);
      setMyColor("white");
      setPhase("lobby");
      setConnecting(false);
    });
    s.on("chess:state", (state: GameState) => {
      setGameState(state);
      if (state.status === "playing" && phase !== "game") setPhase("game");
      if (state.status === "ended") setPhase("ended");
    });
    socketRef.current = s;
    return s;
  }, [phase]);

  const handleCreate = () => {
    setConnecting(true);
    const s = connect();
    if (!s) return;
    s.on("connect", () => s.emit("chess:create"));
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error("Enter a 6-character code."); return; }
    setConnecting(true);
    const s = connect();
    if (!s) return;
    s.on("connect", () => {
      s.emit("chess:join", { code });
      setMyColor("black");
      setJoinCode("");
    });
  };

  useEffect(() => {
    if (gameState?.status === "playing") setPhase("game");
    if (gameState?.status === "ended") setPhase("ended");
  }, [gameState?.status]);

  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const handleMove = useCallback((from: string, to: string) => {
    socketRef.current?.emit("chess:move", { code: gameState?.code, from, to });
  }, [gameState?.code]);

  const handleResign = () => {
    if (window.confirm("Resign this game?")) {
      socketRef.current?.emit("chess:resign", { code: gameState?.code });
    }
  };

  const handleLeave = () => {
    socketRef.current?.emit("chess:leave", { code: gameState?.code });
    socketRef.current?.disconnect();
    socketRef.current = null;
    setPhase("setup");
    setGameState(null);
  };

  const isMyTurn = gameState ? (
    (myColor === "white" && gameState.turn === "w") ||
    (myColor === "black" && gameState.turn === "b")
  ) : false;

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    if (gameMode === "ai") {
      return <ChessAIGame onBack={() => setGameMode("menu")} difficulty={aiDifficulty} playerColor={aiPlayerColor} />;
    }
    return (
      <div className="space-y-5">
        {/* vs AI */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <p className="font-semibold text-sm">Play vs AI (Offline)</p>
          </div>
          <div className="flex gap-2">
            <Button variant={aiPlayerColor === "white" ? "default" : "outline"} size="sm" className="flex-1"
              onClick={() => setAIPlayerColor("white")}>♔ White</Button>
            <Button variant={aiPlayerColor === "black" ? "default" : "outline"} size="sm" className="flex-1"
              onClick={() => setAIPlayerColor("black")}>♚ Black</Button>
          </div>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as const).map(d => (
              <Button key={d} variant={aiDifficulty === d ? "default" : "outline"} size="sm" className="flex-1"
                onClick={() => setAIDifficulty(d)}>
                {d === "easy" ? "😊 Easy" : d === "medium" ? "🧠 Medium" : "💀 Hard"}
              </Button>
            ))}
          </div>
          <Button onClick={() => setGameMode("ai")} className="w-full gap-2">🎮 Start vs AI</Button>
        </div>

        {/* Multiplayer */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold text-center">Or play online</p>
        <div className="flex gap-2">
          <Button variant={mode === "create" ? "default" : "outline"} className="flex-1" onClick={() => setMode("create")}>
            Create Game
          </Button>
          <Button variant={mode === "join" ? "default" : "outline"} className="flex-1" onClick={() => setMode("join")}>
            Join Game
          </Button>
        </div>
        {mode === "create" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40">
              <span className="text-3xl">♔</span>
              <div>
                <p className="font-semibold text-sm">You will play as White</p>
                <p className="text-xs text-muted-foreground">White moves first</p>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={connecting} className="w-full gap-2">
              {connecting ? "Connecting…" : "Create Chess Room"}
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40">
              <span className="text-3xl">♚</span>
              <div>
                <p className="font-semibold text-sm">You will play as Black</p>
                <p className="text-xs text-muted-foreground">White moves first</p>
              </div>
            </div>
            <Button onClick={handleJoin} disabled={connecting || joinCode.trim().length !== 6} className="w-full">
              {connecting ? "Joining…" : "Join Game"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (phase === "lobby" && gameState) {
    return (
      <div className="space-y-5 text-center">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Your room code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-black tracking-widest text-primary font-mono">{gameState.code}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(gameState.code); toast.success("Copied!"); }}>
              <Copy size={14} />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className={`text-center p-4 rounded-xl border ${gameState.white ? "border-white/20 bg-white/5" : "border-border/30"}`}>
            <div className="text-3xl mb-1">♔</div>
            <p className="text-sm font-medium">{gameState.white?.name ?? "—"}</p>
            <Badge variant="outline" className="text-[10px] mt-1">White</Badge>
          </div>
          <span className="text-muted-foreground text-lg font-bold">vs</span>
          <div className={`text-center p-4 rounded-xl border ${gameState.black ? "border-gray-500/20 bg-gray-500/5" : "border-border/30 border-dashed"}`}>
            <div className="text-3xl mb-1">♚</div>
            <p className="text-sm font-medium">{gameState.black?.name ?? "Waiting…"}</p>
            <Badge variant="outline" className="text-[10px] mt-1">Black</Badge>
          </div>
        </div>
        {!gameState.black && (
          <p className="text-sm text-muted-foreground animate-pulse">Waiting for opponent to join…</p>
        )}
        <Button variant="outline" onClick={handleLeave} className="gap-2">
          <LogOut size={14} /> Leave
        </Button>
      </div>
    );
  }

  // ── Game ───────────────────────────────────────────────────────────────────
  if ((phase === "game" || phase === "ended") && gameState) {
    const opponent = myColor === "white" ? gameState.black : gameState.white;
    const me = myColor === "white" ? gameState.white : gameState.black;

    return (
      <div className="space-y-4">
        {/* Opponent info */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{myColor === "white" ? "♚" : "♔"}</span>
            <span className="text-sm font-medium">{opponent?.name ?? "?"}</span>
            {gameState.turn !== (myColor === "white" ? "w" : "b") && gameState.status === "playing" && (
              <Badge className="text-[10px] animate-pulse bg-amber-500/20 text-amber-300 border-none">Thinking…</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{myColor === "white" ? "Black" : "White"}</span>
        </div>

        {/* Board */}
        <div className="flex justify-center">
          <ChessBoard
            fen={gameState.fen}
            myColor={myColor}
            isMyTurn={isMyTurn && gameState.status === "playing"}
            onMove={handleMove}
            isCheck={gameState.isCheck}
            disabled={gameState.status !== "playing"}
          />
        </div>

        {/* My info */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{myColor === "white" ? "♔" : "♚"}</span>
            <span className="text-sm font-medium">{me?.name ?? "You"}</span>
            {isMyTurn && gameState.status === "playing" && (
              <Badge className="text-[10px] bg-green-500/20 text-green-300 border-none">Your turn</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{myColor === "white" ? "White" : "Black"}</span>
        </div>

        {/* Status */}
        {gameState.isCheck && gameState.status === "playing" && (
          <div className="text-center text-sm text-red-400 font-semibold animate-pulse">⚠️ Check!</div>
        )}
        {gameState.status === "ended" && gameState.result && (
          <div className="text-center p-4 rounded-xl bg-card/40 border border-border/40 space-y-2">
            <p className="text-lg font-bold">🏁 {gameState.result}</p>
            <Button onClick={handleLeave} className="gap-2 mt-2"><RotateCcw size={14} /> Play Again</Button>
          </div>
        )}

        {/* Controls */}
        {gameState.status === "playing" && (
          <div className="flex gap-2">
            <div className="flex-1 text-xs text-muted-foreground font-mono bg-card/30 rounded-lg p-2 overflow-hidden">
              {gameState.moveHistory.join(" ") || "Game started"}
            </div>
            <Button variant="outline" size="sm" onClick={handleResign} className="gap-1.5 text-red-400 border-red-400/30">
              <Flag size={13} /> Resign
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
