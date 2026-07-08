/**
 * Section color identity system.
 * Each major feature area gets a consistent color across sidebar icons,
 * dashboard cards, and badges so students can navigate by color, not just text.
 */
export type SectionKey =
  | "learning"
  | "anatomy"
  | "progress"
  | "exams"
  | "clinical"
  | "community"
  | "tools";

export interface SectionColor {
  text: string;
  bg: string;
  border: string;
  gradient: string;
  ring: string;
}

export const SECTION_COLORS: Record<SectionKey, SectionColor> = {
  learning: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    gradient: "from-violet-500/15 to-violet-500/0",
    ring: "ring-violet-500/40",
  },
  anatomy: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    gradient: "from-blue-500/15 to-blue-500/0",
    ring: "ring-blue-500/40",
  },
  progress: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    gradient: "from-emerald-500/15 to-emerald-500/0",
    ring: "ring-emerald-500/40",
  },
  exams: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    gradient: "from-orange-500/15 to-orange-500/0",
    ring: "ring-orange-500/40",
  },
  clinical: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    gradient: "from-red-500/15 to-red-500/0",
    ring: "ring-red-500/40",
  },
  community: {
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    gradient: "from-pink-500/15 to-pink-500/0",
    ring: "ring-pink-500/40",
  },
  tools: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    gradient: "from-cyan-500/15 to-cyan-500/0",
    ring: "ring-cyan-500/40",
  },
};

/** Maps a student route href to its section color key. */
export const ROUTE_SECTION: Record<string, SectionKey> = {
  "/student/anatomy": "anatomy",
  "/student/dashboard": "learning",
  "/student/practical-hub": "clinical",
  "/student/quiz": "exams",
  "/student/quiz-analysis": "progress",
  "/student/notes": "learning",
  "/student/scholar-hub": "learning",
  "/student/pdfs": "learning",
  "/student/community": "community",
  "/student/announcements": "community",
  "/student/progress": "progress",
  "/student/leaderboard": "progress",
  "/student/doubts": "community",
  "/student/calendar": "tools",
  "/student/tools": "tools",
  "/student/cheat-codes": "learning",
  "/student/confessions": "community",
  "/student/study-rooms": "community",
  "/student/clinical-case": "clinical",
  "/student/ai-tools": "tools",
  "/student/games": "tools",
  "/student/music": "tools",
  "/student/settings": "tools",
};

export function getSectionColor(href: string): SectionColor {
  const key = ROUTE_SECTION[href] ?? "learning";
  return SECTION_COLORS[key];
}
