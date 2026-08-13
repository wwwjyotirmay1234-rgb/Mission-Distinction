import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Castle, Dices, Gamepad2, ArrowLeft, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useXPStats } from "@/hooks/useXPStats";
import { RANKS } from "@/lib/ranks";
import chessPoster from "@/assets/games/chess.png";
import ludoPoster from "@/assets/games/ludo.png";
import snlPoster from "@/assets/games/snl.png";
import ChessGame from "./games/ChessGame";
import LudoGame from "./games/LudoGame";
import SnakeAndLadder from "./games/SnakeAndLadder";

const GAMES = [
  {
    id: "chess" as const,
    title: "Chess",
    description: "2-player online chess with full move validation. Create a room, share the code, and play.",
    icon: Castle,
    color: "from-slate-500 to-gray-600",
    bg: "bg-slate-500/10 border-slate-500/30",
    badge: "2P",
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    detail: "Online 1v1 · Move validation · White vs Black",
    poster: chessPoster,
    tagline: "Think. Strategize. Conquer.",
    requiredLevel: 3,
  },
  {
    id: "ludo" as const,
    title: "Ludo",
    description: "Classic Ludo for 2–4 players. Roll the dice, race your tokens home, send opponents back!",
    icon: Dices,
    color: "from-orange-500 to-red-600",
    bg: "bg-orange-500/10 border-orange-500/30",
    badge: "2-4P",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    detail: "Online multiplayer · 2–4 players · Classic rules",
    poster: ludoPoster,
    tagline: "Roll. Move. Strategize. Win!",
    requiredLevel: 4,
  },
  {
    id: "snl" as const,
    title: "Snake & Ladder",
    description: "Classic Snake and Ladder for 2–4 players. Roll the dice, climb ladders, and avoid snakes!",
    icon: Gamepad2,
    color: "from-teal-500 to-emerald-600",
    bg: "bg-teal-500/10 border-teal-500/30",
    badge: "2-4P",
    badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    detail: "Online multiplayer · 2–4 players · 🐍 Snakes & 🪜 Ladders",
    poster: snlPoster,
    tagline: "Roll. Climb. Avoid. Win!",
    requiredLevel: 5,
  },
];

type GameId = "chess" | "ludo" | "snl";

function GameIcon({ icon: Icon, color }: { icon: React.ComponentType<{ className?: string; size?: number | string }>; color: string }) {
  return (
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
  );
}

type PeekGame = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  color: string;
  badge?: string;
  detail?: string;
  requiredLevel: number;
  poster?: string;
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
          <div className="relative h-64 overflow-hidden bg-black">
            {game.poster ? (
              <img src={game.poster} alt={game.title} className="w-full h-full object-cover object-center" />
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

          <div className="bg-card p-4 space-y-3">
            <div className="bg-background/60 border border-border/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Lock size={12} /> Locked
                </span>
                <span className="font-semibold text-foreground">{rank.emoji} {rank.name}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{currentXp.toLocaleString()} Goals</span>
                  <span>{rank.min.toLocaleString()} Goals</span>
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
                  ? <><span className="text-foreground font-semibold">{xpNeeded.toLocaleString()} Goals</span> more to unlock</>
                  : "Almost there!"}
              </p>
            </div>
            <Button className="w-full" onClick={onClose}>Keep Scoring Goals ⚽</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Hub({ onSelect, rankLevel, currentXp }: { onSelect: (id: GameId) => void; rankLevel: number; currentXp: number }) {
  const [peekGame, setPeekGame] = useState<PeekGame | null>(null);

  return (
    <div className="space-y-4 sm:space-y-6">
      {peekGame && (
        <GamePeekModal game={peekGame} currentXp={currentXp} onClose={() => setPeekGame(null)} />
      )}

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Games</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time multiplayer games — play with your batchmates
        </p>
      </div>

      <div className="space-y-3">
        {GAMES.map((g, i) => {
          const isLocked = rankLevel < g.requiredLevel;
          return (
            <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div
                className={`relative overflow-hidden w-full text-left p-5 rounded-2xl border transition-all duration-200 ${g.bg} cursor-pointer ${!isLocked && "hover:scale-[1.01] hover:shadow-lg"}`}
                onClick={() =>
                  isLocked
                    ? setPeekGame({ title: g.title, description: g.description, icon: g.icon, color: g.color, badge: g.badge, detail: g.detail, requiredLevel: g.requiredLevel, poster: g.poster, tagline: g.tagline })
                    : onSelect(g.id)
                }
              >
                {g.poster && (
                  <div className="absolute inset-0 z-0">
                    <img src={g.poster} alt="" className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background/90" />
                  </div>
                )}
                {isLocked && (
                  <div className="absolute inset-0 rounded-2xl bg-background/75 backdrop-blur-[3px] flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
                    <Lock size={22} className="text-muted-foreground" />
                    {(() => {
                      const rank = RANKS.find(r => r.level === g.requiredLevel) ?? RANKS[g.requiredLevel - 1];
                      return (
                        <p className="text-xs font-semibold text-muted-foreground text-center leading-tight px-2">
                          {rank.emoji} {rank.name}<br />
                          <span className="font-normal opacity-70">{rank.min.toLocaleString()} XP required</span>
                        </p>
                      );
                    })()}
                  </div>
                )}
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
  );
}

function GameShell({ gameId, onBack }: { gameId: GameId; onBack: () => void }) {
  const g = GAMES.find(x => x.id === gameId)!;

  const header = (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Games
      </Button>
      <div className="flex items-center gap-2.5">
        <GameIcon icon={g.icon} color={g.color} />
        <div>
          <h2 className="font-bold text-foreground text-base leading-tight">{g.title}</h2>
          <p className="text-xs text-muted-foreground">{g.detail}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {header}
      <div className={`rounded-2xl border p-5 ${g.bg} ${gameId !== "chess" ? "overflow-x-auto" : ""}`}>
        {gameId === "chess" && <ChessGame onBack={onBack} />}
        {gameId === "ludo" && <LudoGame onBack={onBack} />}
        {gameId === "snl" && <SnakeAndLadder onBack={onBack} />}
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
