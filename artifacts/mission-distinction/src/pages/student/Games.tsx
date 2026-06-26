import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Brain, Stethoscope, Zap, Grid3x3, ArrowLeft, Users, Castle, Dices, Gamepad2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useXPStats } from "@/hooks/useXPStats";
import { RANKS } from "@/lib/ranks";
import wordScramblePoster from "@assets/IMG_4758_1782470391390.png";
import memoryMatchPoster from "@assets/IMG_4765_1782470458393.png";
import diagnosisPoster from "@assets/IMG_4759_1782470391391.png";
import spellingBeePoster from "@assets/IMG_4763_1782470427730.png";
import crosswordPoster from "@assets/IMG_4760_1782470391391.png";
import quizBattlePoster from "@assets/F8EC9F6A-CA5F-4B94-B9E8-00332D66570F_1782470305162.png";
import chessPoster from "@assets/579A5592-071D-448E-90D7-4C5503326266_1782470305162.png";
import ludoPoster from "@assets/22D4EE8A-9642-4BCB-BD18-514AE77AF495_1782470305162.png";
import snlPoster from "@assets/DB2E80A1-DC42-456B-A779-9DC7218518B3_1782470305162.png";
import WordScramble from "./games/WordScramble";
import MemoryMatch from "./games/MemoryMatch";
import DiagnosisChallenge from "./games/DiagnosisChallenge";
import SpellingBee from "./games/SpellingBee";
import Crossword from "./games/Crossword";
import MultiplayerGame from "./games/MultiplayerGame";
import ChessGame from "./games/ChessGame";
import LudoGame from "./games/LudoGame";
import SnakeAndLadder from "./games/SnakeAndLadder";

const SOLO_GAMES = [
  {
    id: "word-scramble",
    title: "Word Scramble",
    description: "Unscramble jumbled medical terms from their definitions.",
    icon: Shuffle,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10 border-violet-500/20",
    tag: "Vocabulary",
  },
  {
    id: "memory-match",
    title: "Memory Match",
    description: "Flip cards to pair medical terms with their definitions.",
    icon: Brain,
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-500/10 border-blue-500/20",
    tag: "Memory",
  },
  {
    id: "diagnosis",
    title: "Diagnosis Challenge",
    description: "Read clinical scenarios and pick the correct diagnosis.",
    icon: Stethoscope,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    tag: "Clinical",
  },
  {
    id: "spelling-bee",
    title: "Spelling Bee",
    description: "Can you spell tricky medical terms correctly?",
    icon: Zap,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10 border-amber-500/20",
    tag: "Spelling",
  },
  {
    id: "crossword",
    title: "Crossword Puzzle",
    description: "Solve an AI-generated medical crossword puzzle.",
    icon: Grid3x3,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-500/10 border-rose-500/20",
    tag: "Puzzle",
  },
] as const;

const MULTIPLAYER_GAMES = [
  {
    id: "multiplayer",
    title: "Quiz Battle",
    description: "Challenge batchmates in real-time! 10 AI medical questions, live leaderboard, speed bonuses.",
    icon: Users,
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    badge: "LIVE",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    detail: "Real-time · Up to 10 players · AI questions",
  },
  {
    id: "chess",
    title: "Chess",
    description: "2-player online chess with full move validation. Create a room, share the code, and play.",
    icon: Castle,
    color: "from-slate-500 to-gray-600",
    bg: "bg-slate-500/10 border-slate-500/30",
    badge: "2P",
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    detail: "Online 1v1 · Move validation · White vs Black",
  },
  {
    id: "ludo",
    title: "Ludo",
    description: "Classic Ludo for 2–4 players. Roll the dice, race your tokens home, send opponents back!",
    icon: Dices,
    color: "from-orange-500 to-red-600",
    bg: "bg-orange-500/10 border-orange-500/30",
    badge: "2-4P",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    detail: "Online multiplayer · 2–4 players · Classic rules",
  },
  {
    id: "snl",
    title: "Snake & Ladder",
    description: "Classic Snake and Ladder for 2–4 players. Roll the dice, climb ladders, and avoid snakes!",
    icon: Gamepad2,
    color: "from-teal-500 to-emerald-600",
    bg: "bg-teal-500/10 border-teal-500/30",
    badge: "2-4P",
    badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    detail: "Online multiplayer · 2–4 players · 🐍 Snakes & 🪜 Ladders",
  },
] as const;

type SoloId = typeof SOLO_GAMES[number]["id"];
type MultiId = typeof MULTIPLAYER_GAMES[number]["id"];
type GameId = SoloId | MultiId;

const GAME_REQUIRED_LEVELS: Record<string, number> = {
  "word-scramble": 1,
  "memory-match": 2,
  "spelling-bee": 2,
  "diagnosis": 3,
  "crossword": 4,
  "multiplayer": 2,
  "chess": 3,
  "ludo": 4,
  "snl": 5,
};

const GAME_POSTERS: Record<string, string> = {
  "word-scramble": wordScramblePoster,
  "memory-match": memoryMatchPoster,
  "diagnosis": diagnosisPoster,
  "spelling-bee": spellingBeePoster,
  "crossword": crosswordPoster,
  "multiplayer": quizBattlePoster,
  "chess": chessPoster,
  "ludo": ludoPoster,
  "snl": snlPoster,
};

const GAME_TAGLINES: Record<string, string> = {
  "word-scramble": "Unscramble the words. Expand your knowledge.",
  "memory-match": "Match. Remember. Master Medicine.",
  "diagnosis": "Think like a doctor. Solve the case. Save the patient.",
  "spelling-bee": "Spell it Right. Know it Well.",
  "crossword": "Clues Today. Knowledge Forever.",
  "multiplayer": "Knowledge. Speed. Victory.",
  "chess": "Think. Strategize. Conquer.",
  "ludo": "Roll. Move. Strategize. Win!",
  "snl": "Roll. Climb. Avoid. Win!",
};

function GameIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
  );
}

function LockOverlay({ requiredLevel }: { requiredLevel: number }) {
  const rank = RANKS.find(r => r.level === requiredLevel) ?? RANKS[requiredLevel - 1];
  return (
    <div className="absolute inset-0 rounded-2xl bg-background/75 backdrop-blur-[3px] flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
      <Lock size={22} className="text-muted-foreground" />
      <p className="text-xs font-semibold text-muted-foreground text-center leading-tight px-2">
        {rank.emoji} {rank.name}<br />
        <span className="font-normal opacity-70">{rank.min.toLocaleString()} XP required</span>
      </p>
    </div>
  );
}

type PeekGame = {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  tag?: string;
  badge?: string;
  detail?: string;
  requiredLevel: number;
  posterImage?: string;
  tagline?: string;
};

function GamePeekModal({ game, currentXp, onClose }: { game: PeekGame; currentXp: number; onClose: () => void }) {
  const rank = RANKS.find(r => r.level === game.requiredLevel) ?? RANKS[game.requiredLevel - 1];
  const xpNeeded = Math.max(0, rank.min - currentXp);
  const prevRank = RANKS.find(r => r.level === game.requiredLevel - 1) ?? RANKS[0];
  const progress = Math.min(100, Math.round(((currentXp - prevRank.min) / (rank.min - prevRank.min)) * 100));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-border/50 shadow-2xl"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Poster hero */}
          <div className="relative h-64 overflow-hidden bg-black">
            {game.posterImage ? (
              <img
                src={game.posterImage}
                alt={game.title}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                <game.icon size={48} className="text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
            >
              <X size={14} />
            </button>
            {game.tagline && (
              <p className="absolute bottom-3 left-0 right-0 text-center text-white/80 text-[11px] font-semibold tracking-wide px-4">
                {game.tagline}
              </p>
            )}
          </div>

          {/* Info */}
          <div className="bg-card p-4 space-y-3">

            {/* Lock status */}
            <div className="bg-background/60 border border-border/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Lock size={12} /> Locked
                </span>
                <span className="font-semibold text-foreground">{rank.emoji} {rank.name}</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{currentXp.toLocaleString()} XP</span>
                  <span>{rank.min.toLocaleString()} XP</span>
                </div>
                <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${game.color} rounded-full transition-all`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {xpNeeded > 0
                  ? <><span className="text-foreground font-semibold">{xpNeeded.toLocaleString()} XP</span> more to unlock</>
                  : "Almost there!"}
              </p>
            </div>

            <Button className="w-full" onClick={onClose}>
              Keep Earning XP
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Hub({ onSelect, rankLevel, currentXp }: { onSelect: (id: GameId) => void; rankLevel: number; currentXp: number }) {
  const [peekGame, setPeekGame] = useState<PeekGame | null>(null);

  return (
    <div className="space-y-6">
      {/* Locked game peek modal */}
      {peekGame && (
        <GamePeekModal game={peekGame} currentXp={currentXp} onClose={() => setPeekGame(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Medical Games</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-powered single-player games + real-time multiplayer — 1st Year MBBS
        </p>
      </div>

      {/* Multiplayer section */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">🎮 Multiplayer</p>
        <div className="space-y-3">
          {MULTIPLAYER_GAMES.map((g, i) => {
            const reqLevel = GAME_REQUIRED_LEVELS[g.id] ?? 1;
            const isLocked = rankLevel < reqLevel;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div
                  className={`relative overflow-hidden w-full text-left p-5 rounded-2xl border transition-all duration-200 ${g.bg} cursor-pointer ${!isLocked && "hover:scale-[1.01] hover:shadow-lg"}`}
                  onClick={() => isLocked
                    ? setPeekGame({ title: g.title, description: g.description, icon: g.icon, color: g.color, badge: g.badge, detail: g.detail, requiredLevel: reqLevel, posterImage: GAME_POSTERS[g.id], tagline: GAME_TAGLINES[g.id] })
                    : onSelect(g.id)
                  }
                >
                  {GAME_POSTERS[g.id] && (
                    <div className="absolute inset-0 z-0">
                      <img src={GAME_POSTERS[g.id]} alt="" className="w-full h-full object-cover object-center" />
                      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background/90" />
                    </div>
                  )}
                  {isLocked && <LockOverlay requiredLevel={reqLevel} />}
                  <div className={`relative z-10 flex items-start gap-4 ${isLocked ? "opacity-40" : ""}`}>
                    <GameIcon icon={g.icon} color={g.color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-foreground text-base">{g.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${g.badgeClass}`}>
                          {g.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
                      <p className="text-xs text-primary/70 mt-1.5 font-medium">✨ {g.detail}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Solo section */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">🧠 Single Player (AI-Powered)</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {SOLO_GAMES.map((g, i) => {
            const reqLevel = GAME_REQUIRED_LEVELS[g.id] ?? 1;
            const isLocked = rankLevel < reqLevel;
            const poster = GAME_POSTERS[g.id];
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <div
                  className={`relative overflow-hidden w-full text-left rounded-2xl border transition-all duration-200 ${g.bg} cursor-pointer ${!isLocked && "hover:scale-[1.02] hover:shadow-lg"}`}
                  onClick={() => isLocked
                    ? setPeekGame({ title: g.title, description: g.description, icon: g.icon, color: g.color, tag: g.tag, requiredLevel: reqLevel, posterImage: poster, tagline: GAME_TAGLINES[g.id] })
                    : onSelect(g.id)
                  }
                >
                  {/* Poster image hero */}
                  <div className="relative h-36 sm:h-40 overflow-hidden">
                    {poster ? (
                      <img src={poster} alt={g.title} className="w-full h-full object-cover object-center" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${g.color} flex items-center justify-center`}>
                        <g.icon size={40} className="text-white/70" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {/* Game name over the poster */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-bold text-white text-sm sm:text-base leading-tight drop-shadow-md">{g.title}</h3>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm mt-1 inline-block">
                        {g.tag}
                      </span>
                    </div>
                    {/* Lock overlay on poster */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
                        <Lock size={20} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    {isLocked ? (
                      (() => {
                        const rank = RANKS.find(r => r.level === reqLevel) ?? RANKS[reqLevel - 1];
                        return (
                          <p className="text-[11px] text-muted-foreground font-medium text-center">
                            {rank.emoji} {rank.name}<br />
                            <span className="opacity-70 font-normal">{rank.min.toLocaleString()} XP</span>
                          </p>
                        );
                      })()
                    ) : (
                      <>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{g.description}</p>
                        <p className="text-[10px] text-primary/70 font-medium mt-1.5">✨ AI-powered · ∞ rounds</p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="bg-card/30 border border-border/40 rounded-xl p-4 text-xs text-muted-foreground">
        <span className="text-primary font-semibold">💡 Tip: </span>
        Each AI game round generates fresh questions across Anatomy, Physiology, and Biochemistry. Earn XP to unlock more games!
      </div>
    </div>
  );
}

const SOLO_COMPONENTS: Partial<Record<GameId, React.ComponentType>> = {
  "word-scramble": WordScramble,
  "memory-match": MemoryMatch,
  "diagnosis": DiagnosisChallenge,
  "spelling-bee": SpellingBee,
  "crossword": Crossword,
};

const GAME_META: Record<string, { title: string; subtitle: string; icon: React.ElementType; color: string; bg: string }> = {
  multiplayer: { title: "Quiz Battle", subtitle: "Live Multiplayer · 1st Year MBBS", icon: Users, color: "from-indigo-500 to-blue-600", bg: "bg-indigo-500/10 border-indigo-500/30" },
  chess: { title: "Chess", subtitle: "Online 1v1 · White vs Black", icon: Castle, color: "from-slate-500 to-gray-600", bg: "bg-slate-500/10 border-slate-500/30" },
  ludo: { title: "Ludo", subtitle: "Online 2–4 Players", icon: Dices, color: "from-orange-500 to-red-600", bg: "bg-orange-500/10 border-orange-500/30" },
  snl: { title: "Snake & Ladder", subtitle: "Online 2–4 Players · 🐍🪜", icon: Gamepad2, color: "from-teal-500 to-emerald-600", bg: "bg-teal-500/10 border-teal-500/30" },
};

function GameShell({ gameId, onBack }: { gameId: GameId; onBack: () => void }) {
  const meta = GAME_META[gameId] || SOLO_GAMES.find(g => g.id === gameId);
  const icon = (meta as any)?.icon || Users;
  const color = (meta as any)?.color || "from-violet-500 to-purple-600";
  const bg = (meta as any)?.bg || "bg-violet-500/10 border-violet-500/20";
  const title = (meta as any)?.title || gameId;
  const subtitle = (meta as any)?.subtitle || (meta as any)?.tag || "";

  const header = (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Games
      </Button>
      <div className="flex items-center gap-2.5">
        <GameIcon icon={icon} color={color} />
        <div>
          <h2 className="font-bold text-foreground text-base leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  if (gameId === "multiplayer") {
    return (
      <div className="space-y-5">
        {header}
        <div className={`rounded-2xl border p-5 ${bg}`}>
          <MultiplayerGame onBack={onBack} />
        </div>
      </div>
    );
  }

  if (gameId === "chess") {
    return (
      <div className="space-y-5">
        {header}
        <div className={`rounded-2xl border p-5 ${bg}`}>
          <ChessGame onBack={onBack} />
        </div>
      </div>
    );
  }

  if (gameId === "ludo") {
    return (
      <div className="space-y-5">
        {header}
        <div className={`rounded-2xl border p-5 ${bg} overflow-x-auto`}>
          <LudoGame onBack={onBack} />
        </div>
      </div>
    );
  }

  if (gameId === "snl") {
    return (
      <div className="space-y-5">
        {header}
        <div className={`rounded-2xl border p-5 ${bg} overflow-x-auto`}>
          <SnakeAndLadder onBack={onBack} />
        </div>
      </div>
    );
  }

  const Component = SOLO_COMPONENTS[gameId];
  if (!Component) return null;

  return (
    <div className="space-y-5">
      {header}
      <div className={`rounded-2xl border p-5 ${bg}`}>
        <Component />
      </div>
    </div>
  );
}

export default function Games() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const { data: xpStats } = useXPStats();
  const rankLevel = xpStats?.currentRankLevel ?? 1;
  const currentXp = xpStats?.totalXp ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {activeGame ? (
        <GameShell gameId={activeGame} onBack={() => setActiveGame(null)} />
      ) : (
        <Hub onSelect={setActiveGame} rankLevel={rankLevel} currentXp={currentXp} />
      )}
    </div>
  );
}
