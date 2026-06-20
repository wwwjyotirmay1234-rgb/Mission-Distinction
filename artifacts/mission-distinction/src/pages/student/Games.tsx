import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shuffle, Brain, Stethoscope, Zap, Grid3x3, ArrowLeft, Users, Castle, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import WordScramble from "./games/WordScramble";
import MemoryMatch from "./games/MemoryMatch";
import DiagnosisChallenge from "./games/DiagnosisChallenge";
import SpellingBee from "./games/SpellingBee";
import Crossword from "./games/Crossword";
import MultiplayerGame from "./games/MultiplayerGame";
import ChessGame from "./games/ChessGame";
import LudoGame from "./games/LudoGame";

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
] as const;

type SoloId = typeof SOLO_GAMES[number]["id"];
type MultiId = typeof MULTIPLAYER_GAMES[number]["id"];
type GameId = SoloId | MultiId;

function GameIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
  );
}

function Hub({ onSelect }: { onSelect: (id: GameId) => void }) {
  return (
    <div className="space-y-6">
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
          {MULTIPLAYER_GAMES.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <button
                onClick={() => onSelect(g.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${g.bg}`}
              >
                <div className="flex items-start gap-4">
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
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Solo section */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">🧠 Single Player (AI-Powered)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOLO_GAMES.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <button
                onClick={() => onSelect(g.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${g.bg}`}
              >
                <div className="flex items-start gap-4">
                  <GameIcon icon={g.icon} color={g.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground text-base">{g.title}</h3>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-foreground/10 text-muted-foreground">
                        {g.tag}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className="text-primary font-medium">AI-powered</span> · Infinite rounds
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-card/30 border border-border/40 rounded-xl p-4 text-xs text-muted-foreground">
        <span className="text-primary font-semibold">💡 Tip: </span>
        Each AI game round generates fresh questions across Anatomy, Physiology, and Biochemistry.
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {activeGame ? (
        <GameShell gameId={activeGame} onBack={() => setActiveGame(null)} />
      ) : (
        <Hub onSelect={setActiveGame} />
      )}
    </div>
  );
}
