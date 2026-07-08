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

interface DrawerLink {
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  label: string;
  href: string;
}

const LEARN_LINKS: DrawerLink[] = [
  { icon: Microscope, label: "Anatomy Hub", href: "/student/anatomy" },
  { icon: Stethoscope, label: "Practical Hub", href: "/student/practical-hub" },
  { icon: FileText, label: "Notes & Books", href: "/student/notes" },
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

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const [learnOpen, setLearnOpen] = React.useState(false);

  const isActive = (href: string) => location === href || location.startsWith(href + "/");
  const isLearnActive = LEARN_LINKS.some((l) => isActive(l.href));

  const items: { icon: React.ComponentType<{ className?: string; size?: number | string }>; label: string; href?: string; onClick?: () => void; active: boolean }[] = [
    { icon: Home, label: "Home", href: "/student/dashboard", active: isActive("/student/dashboard") },
    { icon: GraduationCap, label: "Learn", onClick: () => setLearnOpen(true), active: isLearnActive },
    { icon: CheckCircle, label: "Quiz", href: "/student/quiz", active: isActive("/student/quiz") },
    { icon: Users, label: "Community", href: "/student/community", active: isActive("/student/community") },
    { icon: User, label: "Profile", href: "/student/settings", active: isActive("/student/settings") },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border pb-[env(safe-area-inset-bottom)]"
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div className="grid grid-cols-5 h-14">
          {items.map((item) => {
            const content = (
              <div className={cn(
                "flex flex-col items-center justify-center gap-0.5 h-full transition-colors",
                item.active ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon size={20} className={item.active ? "text-primary" : "text-muted-foreground"} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            );
            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className="active:bg-muted/40">
                  {content}
                </Link>
              );
            }
            return (
              <button key={item.label} onClick={item.onClick} className="active:bg-muted/40">
                {content}
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={learnOpen} onOpenChange={setLearnOpen}>
        <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Learn</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 mt-4 pb-6">
            {LEARN_LINKS.map((link) => {
              const color = getSectionColor(link.href);
              return (
                <button
                  key={link.href}
                  onClick={() => { setLearnOpen(false); setLocation(link.href); }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-card/60 border border-border/40 active:scale-95 transition-transform"
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
