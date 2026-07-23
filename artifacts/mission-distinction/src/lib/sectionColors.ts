/**
 * Section color identity system — ⚽ Football World Cup Edition.
 * Each feature area maps to a national-team jersey colour so students
 * can navigate by colour, not just text.
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
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    gradient: "from-emerald-500/15 to-emerald-500/0",
    ring: "ring-emerald-500/40",
  },
  anatomy: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    gradient: "from-blue-500/15 to-blue-500/0",
    ring: "ring-blue-500/40",
  },
  progress: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    gradient: "from-yellow-500/15 to-yellow-500/0",
    ring: "ring-yellow-500/40",
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
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    gradient: "from-amber-500/15 to-amber-500/0",
    ring: "ring-amber-500/40",
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
  "/student/calendar": "tools",
  "/student/tools": "tools",
  "/student/cheat-codes": "learning",
  "/student/confessions": "community",
  "/student/study-rooms": "community",
  "/student/clinical-case": "clinical",
  "/student/music": "tools",
  "/student/settings": "tools",
};

export function getSectionColor(href: string): SectionColor {
  const key = ROUTE_SECTION[href] ?? "learning";
  return SECTION_COLORS[key];
}
