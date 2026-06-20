export interface Rank {
  level: number;
  name: string;
  emoji: string;
  min: number;
  max: number | null;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  glowClass: string;
  unlocksLabel: string;
}

export const RANKS: Rank[] = [
  {
    level: 1,
    name: "Novice Scholar",
    emoji: "🥼",
    min: 0,
    max: 499,
    color: "#9ca3af",
    bgClass: "bg-gray-500/10",
    textClass: "text-gray-400",
    borderClass: "border-gray-500/30",
    glowClass: "shadow-gray-500/20",
    unlocksLabel: "Core features",
  },
  {
    level: 2,
    name: "Foundation Learner",
    emoji: "📚",
    min: 500,
    max: 1499,
    color: "#22c55e",
    bgClass: "bg-green-500/10",
    textClass: "text-green-400",
    borderClass: "border-green-500/30",
    glowClass: "shadow-green-500/20",
    unlocksLabel: "Mnemonics",
  },
  {
    level: 3,
    name: "Clinical Aspirant",
    emoji: "🩺",
    min: 1500,
    max: 3499,
    color: "#3b82f6",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    glowClass: "shadow-blue-500/20",
    unlocksLabel: "Flashcards",
  },
  {
    level: 4,
    name: "Distinction Achiever",
    emoji: "⚕️",
    min: 3500,
    max: 6999,
    color: "#a855f7",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    glowClass: "shadow-purple-500/20",
    unlocksLabel: "Study Rooms & Confessions",
  },
  {
    level: 5,
    name: "Mission Master",
    emoji: "🏆",
    min: 7000,
    max: 14999,
    color: "#f59e0b",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    glowClass: "shadow-amber-500/20",
    unlocksLabel: "AI Tools & Medical Games",
  },
  {
    level: 6,
    name: "Legend of Distinction",
    emoji: "👑",
    min: 15000,
    max: null,
    color: "#ef4444",
    bgClass: "bg-gradient-to-r from-red-500/10 via-amber-500/10 to-purple-500/10",
    textClass: "text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-purple-400",
    borderClass: "border-amber-500/40",
    glowClass: "shadow-amber-500/30",
    unlocksLabel: "All features unlocked",
  },
];

export const RANK_FEATURE_GATES: Record<string, number> = {};

export function getRankForXp(xp: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.min) rank = r;
    else break;
  }
  return rank;
}

export function getNextRank(xp: number): Rank | null {
  return RANKS.find(r => r.min > xp) ?? null;
}

export function getProgressToNext(xp: number): number {
  const next = getNextRank(xp);
  if (!next) return 100;
  const current = getRankForXp(xp);
  const range = next.min - current.min;
  const earned = xp - current.min;
  return Math.min(100, Math.round((earned / range) * 100));
}

export function canAccessFeature(userLevel: number, path: string): boolean {
  const required = RANK_FEATURE_GATES[path];
  if (!required) return true;
  return userLevel >= required;
}

export function getRequiredRankForPath(path: string): Rank | null {
  const required = RANK_FEATURE_GATES[path];
  if (!required) return null;
  return RANKS.find(r => r.level === required) ?? null;
}
