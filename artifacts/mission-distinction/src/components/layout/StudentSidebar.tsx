import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/contexts/SidebarContext";
import { useListAnnouncements, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  FileText,
  File,
  Users,
  Newspaper,
  TrendingUp,
  Bookmark,
  Calendar as CalendarIcon,
  Settings,
  Trophy,
  MessageSquare,
  Timer,
  Music,
  BookOpen,
  Lightbulb,
  CalendarDays,
  MessageCircleHeart,
  Bot,
  Gamepad2,
  Lock,
  Microscope,
} from "lucide-react";
import { useXPStats } from "@/hooks/useXPStats";
import { XPProgressBar } from "@/components/XPProgressBar";

const LAST_SEEN_KEY = "md_announcements_last_seen";

function getUnseenCount(announcements: any[]): number {
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  if (!lastSeen) return announcements.length;
  return announcements.filter((a) => new Date(a.createdAt) > new Date(lastSeen)).length;
}

function markAnnouncementsSeen() {
  localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

interface NavItem {
  icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string; color?: string }>;
  label: string;
  href: string;
  badge?: number;
  requiredLevel?: number;
  comingSoon?: boolean;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { data: xpStats } = useXPStats();

  const xp = xpStats?.totalXp ?? 0;
  const rankLevel = xpStats?.currentRankLevel ?? 1;

  const { data: announcements } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey({}), staleTime: 60_000 } }
  );

  const unseenCount = React.useMemo(() => {
    const list = Array.isArray(announcements) ? (announcements as any[]) : [];
    return getUnseenCount(list);
  }, [announcements]);

  const navItems: NavItem[] = [
    { icon: Microscope, label: "Anatomy Hub", href: "/student/anatomy", comingSoon: true },
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: FileText, label: "Quiz Center", href: "/student/quiz" },
    { icon: FileText, label: "Notes & Books", href: "/student/notes" },
    { icon: File, label: "PDF Library", href: "/student/pdfs" },
    { icon: Users, label: "Community", href: "/student/community" },
    {
      icon: Newspaper,
      label: "News & Announcements",
      href: "/student/announcements",
      badge: unseenCount > 0 ? unseenCount : undefined,
    },
    { icon: TrendingUp, label: "My Progress", href: "/student/progress" },
    { icon: Trophy, label: "Leaderboard", href: "/student/leaderboard" },
    { icon: MessageSquare, label: "Doubt Board", href: "/student/doubts" },
    { icon: Bookmark, label: "Bookmarks", href: "/student/bookmarks" },
    { icon: CalendarIcon, label: "Calendar", href: "/student/calendar" },
    { icon: Timer, label: "Study Tools", href: "/student/tools" },
    { icon: CalendarDays, label: "Exam Countdown", href: "/student/exams" },
    { icon: Lightbulb, label: "Mnemonics", href: "/student/mnemonics" },
    { icon: BookOpen, label: "Flashcards", href: "/student/flashcards" },
    { icon: MessageCircleHeart, label: "Confession Board", href: "/student/confessions" },
    { icon: Users, label: "Study Rooms", href: "/student/study-rooms" },
    { icon: Bot, label: "AI Tools", href: "/student/ai-tools" },
    { icon: Gamepad2, label: "Medical Games", href: "/student/games" },
    { icon: Music, label: "Music", href: "/student/music" },
    { icon: Settings, label: "Settings", href: "/student/settings" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 shrink-0">
        <img src="/logo.jpeg" alt="Mission Distinction" className="h-8 w-8 object-contain rounded-lg" />
        <span className="font-bold text-lg text-foreground tracking-tight">
          Mission<span className="text-primary">Distinction</span>
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const required = item.requiredLevel ?? 1;
          const isLocked = required > rankLevel;

          if (item.comingSoon) {
            return (
              <div key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed text-muted-foreground/40 select-none"
                title="Coming soon"
              >
                <item.icon size={18} className="text-muted-foreground/30" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide bg-muted/60 text-muted-foreground/50 px-1.5 py-0.5 rounded-full shrink-0">Soon</span>
              </div>
            );
          }

          if (isLocked) {
            return (
              <Link
                key={item.href}
                href="/student/progress"
                onClick={() => onNavigate?.()}
              >
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground"
                  title={`Unlock at Level ${required}`}
                >
                  <item.icon size={18} className="text-muted-foreground/40" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <Lock size={12} className="text-muted-foreground/40 shrink-0" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href === "/student/announcements") markAnnouncementsSeen();
                onNavigate?.();
              }}
            >
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-primary-foreground" : "text-muted-foreground"}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* XP compact bar at bottom */}
      {xpStats && (
        <div className="p-4 border-t border-sidebar-border shrink-0">
          <Link href="/student/progress" onClick={() => onNavigate?.()}>
            <div className="group cursor-pointer rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors p-3">
              <XPProgressBar xp={xp} compact />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export function StudentSidebar() {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <aside className="hidden md:flex w-64 h-screen bg-sidebar border-r border-sidebar-border flex-col fixed left-0 top-0">
        <SidebarContent />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border flex flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
