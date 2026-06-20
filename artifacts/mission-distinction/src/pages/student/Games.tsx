import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shuffle, Brain, Stethoscope, Zap, Grid3x3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WordScramble from "./games/WordScramble";
import MemoryMatch from "./games/MemoryMatch";
import DiagnosisChallenge from "./games/DiagnosisChallenge";
import SpellingBee from "./games/SpellingBee";
import Crossword from "./games/Crossword";

const GAMES = [
  {
    id: "word-scramble",
    title: "Word Scramble",
    description: "Unscramble jumbled medical terms from their definitions. Test your vocabulary!",
    icon: Shuffle,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10 border-violet-500/20",
    tag: "Vocabulary",
  },
  {
    id: "memory-match",
    title: "Memory Match",
    description: "Flip cards to pair medical terms with their definitions. Race against time!",
    icon: Brain,
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-500/10 border-blue-500/20",
    tag: "Memory",
  },
  {
    id: "diagnosis",
    title: "Diagnosis Challenge",
    description: "Read AI-generated clinical scenarios and pick the correct answer from 4 options.",
    icon: Stethoscope,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    tag: "Clinical",
  },
  {
    id: "spelling-bee",
    title: "Spelling Bee",
    description: "Can you spell tricky medical terms? Read the definition and type the word.",
    icon: Zap,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10 border-amber-500/20",
    tag: "Spelling",
  },
  {
    id: "crossword",
    title: "Crossword Puzzle",
    description: "Solve an AI-generated medical crossword with across &amp; down clues.",
    icon: Grid3x3,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-500/10 border-rose-500/20",
    tag: "Puzzle",
  },
] as const;

type GameId = typeof GAMES[number]["id"];

function GameIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
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
          AI-generated games covering Anatomy, Physiology &amp; Biochemistry — 1st Year MBBS
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <button
              onClick={() => onSelect(g.id)}
              className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${g.bg} hover:border-opacity-40`}
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
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-primary font-medium">AI-powered</span>
                <span>· Infinite rounds · 1st Year subjects</span>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-card/30 border border-border/40 rounded-xl p-4 text-xs text-muted-foreground">
        <span className="text-primary font-semibold">💡 Tip: </span>
        Each round generates fresh AI content. Play multiple rounds for comprehensive revision across Anatomy, Physiology, and Biochemistry.
      </div>
    </div>
  );
}

function GameShell({ gameId, onBack }: { gameId: GameId; onBack: () => void }) {
  const game = GAMES.find(g => g.id === gameId)!;

  const GAME_COMPONENTS: Record<GameId, React.ComponentType> = {
    "word-scramble": WordScramble,
    "memory-match": MemoryMatch,
    "diagnosis": DiagnosisChallenge,
    "spelling-bee": SpellingBee,
    "crossword": Crossword,
  };

  const Component = GAME_COMPONENTS[gameId];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Games
        </Button>
        <div className="flex items-center gap-2.5">
          <GameIcon icon={game.icon} color={game.color} />
          <div>
            <h2 className="font-bold text-foreground text-base leading-tight">{game.title}</h2>
            <p className="text-xs text-muted-foreground">{game.tag} · 1st Year MBBS</p>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-5 ${game.bg}`}>
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
