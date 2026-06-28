import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Users, Crown, Trophy, Copy, LogOut, Zap, Timer, CheckCircle2, XCircle, Share2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QB_SESSION_KEY = "qb_active_room";

function saveRoomSession(code: string, subject: string) {
  try { sessionStorage.setItem(QB_SESSION_KEY, JSON.stringify({ code, subject, ts: Date.now() })); } catch {}
}
function clearRoomSession() {
  try { sessionStorage.removeItem(QB_SESSION_KEY); } catch {}
}
function loadRoomSession(): { code: string; subject: string } | null {
  try {
    const raw = sessionStorage.getItem(QB_SESSION_KEY);
    if (!raw) return null;
    const { code, subject, ts } = JSON.parse(raw);
    if (Date.now() - ts > 3 * 3600 * 1000) { clearRoomSession(); return null; } // expire after 3h
    return { code, subject };
  } catch { return null; }
}

function copyInviteMessage(code: string) {
  const msg = `Join my Quiz Battle on Mission Distinction! 🎓\nRoom Code: ${code}\n(Medical Games → Quiz Battle → Join Room)`;
  navigator.clipboard.writeText(msg).then(() => toast.success("Invite message copied! Paste it in Community chat 💬")).catch(() => toast.info(`Room Code: ${code}`));
}

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

interface Player { id: number; name: string; score: number; answered: boolean; }
interface Question { text: string; options: string[]; timeLimit: number; questionNum: number; total: number; }

type Phase = "setup" | "lobby" | "loading" | "question" | "reveal" | "ended";

function getRankEmoji(rank: number) {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return `${rank + 1}th`;
}

export default function MultiplayerGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [subject, setSubject] = useState("Anatomy");
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<number | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ id: number; name: string; score: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recover room code if user navigated away
  const [savedSession, setSavedSession] = useState<{ code: string; subject: string } | null>(null);
  useEffect(() => { setSavedSession(loadRoomSession()); }, []);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startTimer = (seconds: number) => {
    stopTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { stopTimer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const connect = useCallback(() => {
    const token = localStorage.getItem("mission_token");
    if (!token) { toast.error("Please log in first."); return null; }

    const socket = io({ path: "/api/socket.io/", auth: { token }, transports: ["websocket", "polling"] });

    socket.on("connect_error", (err) => {
      toast.error("Connection failed: " + err.message);
      setConnecting(false);
    });

    socket.on("game:error", ({ message }: { message: string }) => {
      toast.error(message);
      setConnecting(false);
      if (phase !== "lobby") setPhase("setup");
    });

    socket.on("game:created", ({ code, players: ps }: { code: string; players: Player[] }) => {
      setRoomCode(code);
      setPlayers(ps);
      setHostId(ps[0]?.id ?? null);
      setMyId(ps[0]?.id ?? null);
      setPhase("lobby");
      setConnecting(false);
      saveRoomSession(code, subject);
      setSavedSession(null);
      // Auto-toast with code so they can note it even before sharing
      toast.success(`Room created! Code: ${code}`, { duration: 8000, description: "Tap Copy Invite to share without leaving this page." });
    });

    socket.on("game:joined", ({ code, players: ps, hostId: hid }: { code: string; players: Player[]; hostId: number }) => {
      setRoomCode(code);
      setPlayers(ps);
      setHostId(hid);
      setPhase("lobby");
      setConnecting(false);
      const meIdx = ps.length - 1;
      setMyId(ps[meIdx]?.id ?? null);
      saveRoomSession(code, subject);
      setSavedSession(null);
    });

    socket.on("game:player-joined", ({ players: ps, name }: { players: Player[]; name: string }) => {
      setPlayers(ps);
      toast.success(`${name} joined the room!`);
    });

    socket.on("game:player-left", ({ players: ps, name }: { players: Player[]; name: string }) => {
      setPlayers(ps);
      toast(`${name} left the game.`);
    });

    socket.on("game:host-changed", ({ hostId: hid, players: ps }: { hostId: number; players: Player[] }) => {
      setHostId(hid);
      setPlayers(ps);
      toast("You are now the host!");
    });

    socket.on("game:loading", ({ message }: { message: string }) => {
      setPhase("loading");
    });

    socket.on("game:started", ({ total }: { total: number }) => {
      setSelectedAnswer(null);
      setCorrectOption(null);
    });

    socket.on("game:question", (q: Question) => {
      setQuestion(q);
      setSelectedAnswer(null);
      setCorrectOption(null);
      setPhase("question");
      startTimer(q.timeLimit);
    });

    socket.on("game:answer-result", ({ correct, correctOption: co, score }: { correct: boolean; correctOption: number; score: number }) => {
      setCorrectOption(co);
      setMyScore(score);
      if (correct) toast.success("Correct! +points");
      else toast.error("Wrong answer.");
    });

    socket.on("game:scores", ({ scores }: { scores: Player[] }) => {
      setPlayers(scores);
    });

    socket.on("game:question-timeout", ({ correctOption: co, scores }: { correctOption: number; scores: Player[] }) => {
      stopTimer();
      setCorrectOption(co);
      setPlayers(scores);
      setPhase("reveal");
    });

    socket.on("game:ended", ({ leaderboard: lb }: { leaderboard: { id: number; name: string; score: number }[] }) => {
      stopTimer();
      setLeaderboard(lb);
      setPhase("ended");
    });

    socket.on("xp-awarded", ({ xpEarned, reason }: { xpEarned: number; reason: string }) => {
      toast.success(`+${xpEarned} XP earned from ${reason}!`, { duration: 5000 });
    });

    socketRef.current = socket;
    return socket;
  }, [phase]);

  const handleCreate = () => {
    setConnecting(true);
    const socket = connect();
    if (!socket) return;
    socket.on("connect", () => {
      socket.emit("game:create", { subject });
    });
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error("Enter a 6-character room code."); return; }
    setConnecting(true);
    const socket = connect();
    if (!socket) return;
    socket.on("connect", () => {
      socket.emit("game:join", { code });
    });
  };

  const handleStart = () => {
    socketRef.current?.emit("game:start", { code: roomCode });
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null || !socketRef.current || !question) return;
    setSelectedAnswer(idx);
    socketRef.current.emit("game:answer", { code: roomCode, answerIndex: idx });
  };

  const handleLeave = () => {
    stopTimer();
    socketRef.current?.emit("game:leave", { code: roomCode });
    socketRef.current?.disconnect();
    socketRef.current = null;
    clearRoomSession();
    setSavedSession(null);
    setPhase("setup");
    setPlayers([]);
    setRoomCode("");
    setQuestion(null);
    setSelectedAnswer(null);
    setCorrectOption(null);
    setMyScore(0);
  };

  // Rejoin a room after navigating away
  const handleRejoin = () => {
    if (!savedSession) return;
    setJoinCode(savedSession.code);
    setMode("join");
    // Auto-fill join code and trigger join
    setConnecting(true);
    const socket = connect();
    if (!socket) return;
    socket.on("connect", () => {
      socket.emit("game:join", { code: savedSession.code });
    });
  };

  useEffect(() => {
    return () => {
      stopTimer();
      socketRef.current?.disconnect();
    };
  }, []);

  const isHost = myId === hostId;

  // ── Setup Phase ──────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        {/* ── Saved room recovery banner ── */}
        {savedSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-300">You left an active room</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Room <span className="font-mono font-bold text-amber-300 tracking-widest">{savedSession.code}</span>
                  {" "}· {savedSession.subject}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                onClick={handleRejoin} disabled={connecting}>
                <RefreshCw size={13} /> {connecting ? "Rejoining…" : "Rejoin Room"}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 border-amber-500/40"
                onClick={() => copyInviteMessage(savedSession.code)}>
                <Copy size={13} /> Copy Code
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground"
                onClick={() => { clearRoomSession(); setSavedSession(null); }}>
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2">
          <Button variant={mode === "create" ? "default" : "outline"} className="flex-1" onClick={() => setMode("create")}>
            Create Room
          </Button>
          <Button variant={mode === "join" ? "default" : "outline"} className="flex-1" onClick={() => setMode("join")}>
            Join Room
          </Button>
        </div>

        {mode === "create" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Subject</p>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-card/40 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={connecting} className="w-full gap-2">
              <Users size={15} /> {connecting ? "Connecting…" : "Create Game Room"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              A 6-character code will be generated — share it with friends to join.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Room Code</p>
              <Input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono uppercase bg-card/40 border-border/40"
              />
            </div>
            <Button onClick={handleJoin} disabled={connecting || joinCode.trim().length !== 6} className="w-full gap-2">
              <Zap size={15} /> {connecting ? "Joining…" : "Join Game"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Lobby Phase ──────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div className="space-y-5">
        {/* ── Room code card ── */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Your Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-black tracking-[0.2em] text-primary font-mono">{roomCode}</span>
          </div>
          <Badge variant="outline" className="block text-center mx-auto w-fit bg-primary/10 text-primary border-primary/20 text-xs">
            {subject} · {players.length} player{players.length !== 1 ? "s" : ""}
          </Badge>
          {/* Share buttons */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => copyInviteMessage(roomCode)}>
              <Share2 size={14} /> Copy Invite Message
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => {
              navigator.clipboard.writeText(roomCode);
              toast.success("Code copied!");
            }}>
              <Copy size={13} /> Code only
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            💡 Use <strong>Copy Invite Message</strong> — paste it in Community chat without leaving this page
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Players</p>
          {players.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card/40 border border-border/40">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {p.name[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium">{p.name}</span>
              {p.id === hostId && <Crown size={14} className="text-amber-400" />}
              {p.id === myId && <Badge variant="outline" className="text-[10px]">You</Badge>}
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2">
          {isHost ? (
            <Button onClick={handleStart} disabled={players.length < 1} className="flex-1 gap-2">
              <Zap size={15} /> Start Game {players.length < 2 && "(need 2+ players)"}
            </Button>
          ) : (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">
              Waiting for host to start…
            </div>
          )}
          <Button variant="outline" size="icon" onClick={handleLeave}>
            <LogOut size={15} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">Share the room code with friends to play together</p>
      </div>
    );
  }

  // ── Loading Phase ─────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="space-y-4 py-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <Zap size={28} className="text-primary" />
        </div>
        <p className="font-semibold">Generating questions…</p>
        <p className="text-sm text-muted-foreground">AI is crafting 10 medical questions on {subject}</p>
        <Skeleton className="h-2 w-48 mx-auto" />
      </div>
    );
  }

  // ── Question Phase ───────────────────────────────────────────────────────────
  if (phase === "question" && question) {
    const timePct = (timeLeft / question.timeLimit) * 100;
    const isLow = timeLeft <= 5;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Q{question.questionNum} of {question.total}</span>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-sm ${isLow ? "text-red-400 animate-pulse" : ""}`}>
            <Timer size={14} /> {timeLeft}s
          </div>
        </div>
        <Progress value={timePct} className={`h-1.5 ${isLow ? "[&>div]:bg-red-500" : ""}`} />

        <div className="px-4 py-5 rounded-xl bg-card/40 border border-border/40">
          <p className="text-base font-semibold leading-relaxed">{question.text}</p>
        </div>

        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={selectedAnswer !== null}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary"
                    : selectedAnswer !== null
                    ? "border-border/20 bg-muted/10 opacity-50"
                    : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-border"
                }`}>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs mr-3 shrink-0 ${
                  isSelected ? "border-primary bg-primary text-white" : "border-border/60"
                }`}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        <div className="pt-2 space-y-1">
          <p className="text-[11px] text-muted-foreground text-center">Live Scores</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[...players].sort((a, b) => b.score - a.score).slice(0, 6).map(p => (
              <div key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                p.id === myId ? "border-primary/40 bg-primary/10" : "border-border/30 bg-card/30"
              }`}>
                {p.answered && <CheckCircle2 size={10} className="text-green-400" />}
                <span className={p.id === myId ? "text-primary font-semibold" : ""}>{p.name.split(" ")[0]}</span>
                <span className="text-muted-foreground font-mono">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Reveal Phase ─────────────────────────────────────────────────────────────
  if (phase === "reveal" && question) {
    return (
      <div className="space-y-4">
        <div className="text-center text-sm font-medium text-muted-foreground">
          Q{question.questionNum} of {question.total} — Time's up!
        </div>

        <div className="px-4 py-4 rounded-xl bg-card/40 border border-border/40">
          <p className="text-sm font-semibold">{question.text}</p>
        </div>

        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const isCorrect = correctOption === i;
            const isSelected = selectedAnswer === i;
            return (
              <div key={i} className={`px-4 py-3 rounded-xl border text-sm flex items-center gap-2 ${
                isCorrect ? "border-green-500/40 bg-green-500/10 text-green-300" :
                isSelected && !isCorrect ? "border-red-500/40 bg-red-500/10 text-red-300" :
                "border-border/20 opacity-50"
              }`}>
                {isCorrect ? <CheckCircle2 size={14} className="shrink-0" /> : isSelected ? <XCircle size={14} className="shrink-0" /> : <span className="w-3.5" />}
                <span className="font-mono mr-1">{String.fromCharCode(65 + i)}.</span>
                {opt}
                {isCorrect && <span className="ml-auto text-xs font-medium">Correct</span>}
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Next question in a moment…
        </div>
      </div>
    );
  }

  // ── Ended Phase ──────────────────────────────────────────────────────────────
  if (phase === "ended") {
    const myRank = leaderboard.findIndex(p => p.id === myId);
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-2">{myRank === 0 ? "🏆" : myRank === 1 ? "🥈" : myRank === 2 ? "🥉" : "🎓"}</div>
          <h3 className="text-xl font-bold">Game Over!</h3>
          <p className="text-sm text-muted-foreground">
            You finished {getRankEmoji(myRank)} with <strong className="text-foreground">{myScore} points</strong>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Final Leaderboard</p>
          {leaderboard.map((p, rank) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rank * 0.08 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                p.id === myId ? "border-primary/40 bg-primary/10" : "border-border/40 bg-card/40"
              }`}>
              <span className="text-lg w-8 text-center">{rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`}</span>
              <span className="flex-1 text-sm font-medium">{p.name}</span>
              <span className="font-mono font-bold text-sm text-primary">{p.score} pts</span>
              {p.id === myId && <Badge variant="outline" className="text-[10px]">You</Badge>}
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleLeave}>Back to Games</Button>
          <Button className="flex-1 gap-2" onClick={() => {
            handleLeave();
          }}>
            <Trophy size={14} /> Play Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
