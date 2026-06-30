import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/contexts/SidebarContext";
import { useListAnnouncements, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import {
  LayoutDashboard, FileText, File, Users, Newspaper, TrendingUp,
  Calendar as CalendarIcon, Settings, Trophy, MessageSquare,
  Timer, Music, BookOpen, Lightbulb, MessageCircleHeart,
  Bot, Gamepad2, Lock, Microscope, ChevronLeft, ChevronRight, BarChart2,
  GraduationCap,
} from "lucide-react";
import { useXPStats } from "@/hooks/useXPStats";
import { XPProgressBar } from "@/components/XPProgressBar";
import { useAuth } from "@/contexts/AuthContext";

const ANATOMY_PREVIEW_EMAIL = "www.jyotirmay1234@gmail.com";
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

function SidebarContent({ onNavigate, forceExpanded }: { onNavigate?: () => void; forceExpanded?: boolean }) {
  const [location] = useLocation();
  const { data: xpStats } = useXPStats();
  const { user } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();

  const isCollapsed = forceExpanded ? false : collapsed;

  const xp = xpStats?.totalXp ?? 0;
  const rankLevel = xpStats?.currentRankLevel ?? 1;
  const canSeeAnatomy = user?.email === ANATOMY_PREVIEW_EMAIL;

  const { data: announcements } = useListAnnouncements(
    {}, { query: { queryKey: getListAnnouncementsQueryKey({}), staleTime: 60_000 } }
  );
  const unseenCount = React.useMemo(() => {
    const list = Array.isArray(announcements) ? (announcements as any[]) : [];
    return getUnseenCount(list);
  }, [announcements]);

  const navItems: NavItem[] = [
    { icon: Microscope, label: "Anatomy Hub", href: "/student/anatomy", comingSoon: !canSeeAnatomy },
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: FileText, label: "Quiz Center", href: "/student/quiz" },
    { icon: BarChart2, label: "Quiz Analysis", href: "/student/quiz-analysis" },
    { icon: FileText, label: "Notes & Books", href: "/student/notes" },
    { icon: GraduationCap, label: "Scholar Hub", href: "/student/scholar-hub" },
    { icon: File, label: "PDF Library", href: "/student/pdfs" },
    { icon: Users, label: "Community", href: "/student/community" },
    { icon: Newspaper, label: "News & Announcements", href: "/student/announcements", badge: unseenCount > 0 ? unseenCount : undefined },
    { icon: TrendingUp, label: "My Progress", href: "/student/progress" },
    { icon: Trophy, label: "Leaderboard", href: "/student/leaderboard" },
    { icon: MessageSquare, label: "Doubt Board", href: "/student/doubts" },
    { icon: CalendarIcon, label: "Calendar", href: "/student/calendar" },
    { icon: Timer, label: "Study Tools", href: "/student/tools" },
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo + collapse toggle */}
      <div className={cn("flex items-center shrink-0 border-b border-sidebar-border", isCollapsed ? "justify-center py-4 px-2" : "px-4 py-4 gap-3")}>
        {!isCollapsed && (
          <>
            <img src="/md-logo-new.png" alt="Mission Distinction" className="h-8 w-8 object-contain rounded-lg shrink-0" />
            <span className="font-bold text-base text-foreground tracking-tight truncate">
              Mission<span className="text-primary">Distinction</span>
            </span>
          </>
        )}
        {isCollapsed && (
          <img src="/md-logo-new.png" alt="Mission Distinction" className="h-7 w-7 object-contain rounded-lg" />
        )}
        {/* Collapse toggle — only on desktop */}
        {!forceExpanded && (
          <button
            onClick={() => setCollapsed(!isCollapsed)}
            className={cn(
              "shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              isCollapsed ? "mt-2 block" : "ml-auto"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className={cn("flex-1 py-2 space-y-0.5 overflow-y-auto", isCollapsed ? "px-1" : "px-3")}>
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const required = item.requiredLevel ?? 1;
          const isLocked = required > rankLevel;

          if (item.comingSoon) {
            return (
              <div key={item.href}
                title={isCollapsed ? item.label + " (Coming soon)" : "Coming soon"}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium cursor-not-allowed text-muted-foreground/40 select-none",
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                )}>
                <item.icon size={18} className="shrink-0 text-muted-foreground/30" />
                {!isCollapsed && <><span className="flex-1 truncate">{item.label}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-muted/60 text-muted-foreground/50 px-1.5 py-0.5 rounded-full shrink-0">Soon</span></>}
              </div>
            );
          }

          if (isLocked) {
            return (
              <Link key={item.href} href="/student/progress" onClick={() => onNavigate?.()}>
                <div title={isCollapsed ? item.label + ` (Unlock at Level ${required})` : `Unlock at Level ${required}`}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground",
                    isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                  )}>
                  <item.icon size={18} className="shrink-0 text-muted-foreground/40" />
                  {!isCollapsed && <><span className="flex-1 truncate">{item.label}</span>
                    <Lock size={12} className="text-muted-foreground/40 shrink-0" /></>}
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}
              onClick={() => {
                if (item.href === "/student/announcements") markAnnouncementsSeen();
                onNavigate?.();
              }}>
              <div title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer relative",
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                <item.icon size={18} className={cn("shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                {item.badge !== undefined && (
                  <span className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1",
                    isCollapsed ? "absolute top-0.5 right-0.5" : "ml-auto"
                  )}>
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* XP bar */}
      {xpStats && (
        <div className={cn("border-t border-sidebar-border shrink-0", isCollapsed ? "p-2" : "p-3")}>
          <Link href="/student/progress" onClick={() => onNavigate?.()}>
            <div className={cn(
              "group cursor-pointer rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors",
              isCollapsed ? "p-2 flex justify-center" : "p-3"
            )}>
              {isCollapsed
                ? <Trophy size={16} className="text-primary" aria-label={`${xp.toLocaleString()} XP`} />
                : <XPProgressBar xp={xp} compact />
              }
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export function StudentSidebar() {
  const { open, setOpen, collapsed, hidden } = useSidebar();
  const sidebarWidth = collapsed ? "w-[60px]" : "w-[220px]";

  return (
    <>
      {/* Desktop fixed sidebar — hidden completely when user hides it */}
      <aside className={cn(
        "hidden md:flex h-screen bg-sidebar border-r border-sidebar-border flex-col fixed left-0 top-0 transition-[width] duration-200 ease-in-out overflow-hidden",
        sidebarWidth,
        hidden && "!hidden"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile sheet — always full width */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-[220px] bg-sidebar border-sidebar-border flex flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} forceExpanded />
        </SheetContent>
      </Sheet>
    </>
  );
}
