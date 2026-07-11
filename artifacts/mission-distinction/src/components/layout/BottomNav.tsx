import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Home, CheckCircle, Users, User, GraduationCap,
  Microscope, Stethoscope, FileText, File, GraduationCap as ScholarIcon,
  Zap, BarChart2, TrendingUp, Trophy, Bot, Calendar as CalendarIcon,
  Timer, Gamepad2, Music, Settings, MessageSquare, MessageCircleHeart,
} from "lucide-react";
import { getSectionColor } from "@/lib/sectionColors";
import { useSidebar } from "@/contexts/SidebarContext";

// Bottom nav now shows on every device size (phone, tablet, desktop), not
// just mobile. On desktop the fixed sidebar still occupies the left edge,
// so we inset the bar by the sidebar's current width to avoid overlap.
function useSidebarInset() {
  const { collapsed, hidden } = useSidebar();
  const [isDesktop, setIsDesktop] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = () => setIsDesktop(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  if (!isDesktop || hidden) return 0;
  return collapsed ? 60 : 220;
}

interface DrawerLink {
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  label: string;
  href: string;
}

const LEARN_LINKS: DrawerLink[] = [
  { icon: Microscope, label: "Anatomy Hub", href: "/student/anatomy" },
  { icon: Stethoscope, label: "Practical Hub", href: "/student/practical-hub" },
  { icon: FileText, label: "Notes & Books", href: "/student/notes" },
  { icon: Trophy, label: "Grand Tests", href: "/student/grand-tests" },
  { icon: File, label: "PDF Library", href: "/student/pdfs" },
  { icon: ScholarIcon, label: "Scholar Hub", href: "/student/scholar-hub" },
  { icon: Zap, label: "Cheat Codes", href: "/student/cheat-codes" },
  { icon: Stethoscope, label: "Clinical Cases", href: "/student/clinical-case" },
  { icon: BarChart2, label: "Quiz Analysis", href: "/student/quiz-analysis" },
  { icon: TrendingUp, label: "My Progress", href: "/student/progress" },
  { icon: Trophy, label: "Leaderboard", href: "/student/leaderboard" },
  { icon: MessageSquare, label: "Doubt Board", href: "/student/doubts" },
  { icon: MessageCircleHeart, label: "Confession Board", href: "/student/confessions" },
  { icon: Bot, label: "AI Tools", href: "/student/ai-tools" },
  { icon: CalendarIcon, label: "Calendar", href: "/student/calendar" },
  { icon: Timer, label: "Study Tools", href: "/student/tools" },
  { icon: Gamepad2, label: "Medical Games", href: "/student/games" },
  { icon: Music, label: "Music", href: "/student/music" },
  { icon: Settings, label: "Settings", href: "/student/settings" },
];

// Short vibration pulse on tap — Android Chrome supports the Vibration API,
// iOS Safari doesn't, so this is silently a no-op there.
function tapFeedback() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
  } catch {}
}

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const [learnOpen, setLearnOpen] = React.useState(false);
  const sidebarInset = useSidebarInset();

  const isActive = (href: string) => location === href || location.startsWith(href + "/");
  const isLearnActive = LEARN_LINKS.some((l) => isActive(l.href));

  const items: { icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number }>; label: string; href?: string; onClick?: () => void; active: boolean }[] = [
    { icon: Home, label: "Home", href: "/student/dashboard", active: isActive("/student/dashboard") },
    { icon: GraduationCap, label: "Learn", onClick: () => { tapFeedback(); setLearnOpen(true); }, active: isLearnActive },
    { icon: CheckCircle, label: "Quiz", href: "/student/quiz", active: isActive("/student/quiz") },
    { icon: Users, label: "Community", href: "/student/community", active: isActive("/student/community") },
    { icon: User, label: "Profile", href: "/student/settings", active: isActive("/student/settings") },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 right-0 z-40 bg-sidebar/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] transition-[left] duration-200 ease-in-out"
        style={{ boxShadow: "0 -2px 12px rgba(0,0,0,0.35)", left: sidebarInset }}
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div className="grid grid-cols-5 h-16 max-w-3xl mx-auto">
          {items.map((item) => {
            const content = (
              <div className="flex flex-col items-center justify-center gap-1 h-full">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200 ease-out",
                    "w-12 h-7",
                    item.active ? "bg-primary/20 scale-100" : "bg-transparent scale-90"
                  )}
                >
                  <item.icon
                    size={21}
                    strokeWidth={item.active ? 2.4 : 2}
                    className={item.active ? "text-primary" : "text-muted-foreground"}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10.5px] leading-none transition-colors",
                    item.active ? "font-semibold text-primary" : "font-medium text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={tapFeedback}
                  className="min-h-[48px] flex items-stretch justify-center active:bg-muted/30 transition-colors touch-manipulation"
                >
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="min-h-[48px] flex items-stretch justify-center active:bg-muted/30 transition-colors touch-manipulation"
              >
                {content}
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={learnOpen} onOpenChange={setLearnOpen}>
        <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>Learn</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 mt-4 pb-6">
            {LEARN_LINKS.map((link) => {
              const color = getSectionColor(link.href);
              return (
                <button
                  key={link.href}
                  onClick={() => { tapFeedback(); setLearnOpen(false); setLocation(link.href); }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 min-h-[76px] rounded-xl bg-card/60 border border-border/40 active:scale-95 active:bg-card transition-transform touch-manipulation"
                >
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", color.bg)}>
                    <link.icon size={17} className={color.text} />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{link.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
