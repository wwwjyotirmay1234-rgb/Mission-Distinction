import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/contexts/SidebarContext";
import { useListAnnouncements, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import {
  LayoutDashboard, FileText, File, Users, Newspaper, TrendingUp,
  Calendar as CalendarIcon, Settings, Trophy, MessageSquare,
  Timer, Music, MessageCircleHeart,
  Bot, Gamepad2, Lock, Microscope, ChevronLeft, ChevronRight, BarChart2,
  GraduationCap, Stethoscope, Zap, ChevronDown, MoreHorizontal,
  Wand2, Camera, Store,
} from "lucide-react";
import { useXPStats } from "@/hooks/useXPStats";
import { XPProgressBar } from "@/components/XPProgressBar";
import { useAuth } from "@/contexts/AuthContext";
import { getSectionColor } from "@/lib/sectionColors";

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

interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

const MORE_GROUP_OPEN_KEY = "md_sidebar_more_open";

/* Stadium crowd silhouette SVG — painted at the base of the sidebar */
function StadiumCrowd({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 38"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0,38 C8,20 20,30 30,16 C40,4 52,24 62,12 C72,0 82,20 92,14 C102,8 112,22 122,16 C132,10 142,26 152,18 C162,10 174,28 184,20 C194,12 206,26 220,18 L220,38 Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M0,38 C6,26 18,34 28,24 C38,14 50,30 60,22 C70,14 80,28 90,22 C100,16 110,28 120,22 C130,16 142,30 152,24 C162,18 174,30 184,24 C194,18 206,30 220,24 L220,38 Z"
        fill="currentColor"
        opacity="0.10"
      />
    </svg>
  );
}

function SidebarContent({ onNavigate, forceExpanded }: { onNavigate?: () => void; forceExpanded?: boolean }) {
  const [location] = useLocation();
  const { data: xpStats } = useXPStats();
  const { user } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const [moreOpen, setMoreOpen] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MORE_GROUP_OPEN_KEY) === "1";
  });

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

  const toggleMore = () => {
    setMoreOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(MORE_GROUP_OPEN_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const dashboardItem: NavItem = { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" };

  const navGroups: NavGroup[] = [
    {
      label: "Learn",
      items: [
        { icon: Microscope, label: "Anatomy Hub", href: "/student/anatomy", comingSoon: !canSeeAnatomy },
        { icon: Stethoscope, label: "Practical Hub", href: "/student/practical-hub" },
        { icon: FileText, label: "Quiz Center", href: "/student/quiz" },
        { icon: Trophy, label: "Grand Tests", href: "/student/grand-tests" },
        { icon: FileText, label: "Notes & Books", href: "/student/notes" },
        { icon: File, label: "PDF Library", href: "/student/pdfs" },
      ],
    },
    {
      label: "Practice",
      items: [
        { icon: Wand2, label: "Custom Quiz", href: "/student/custom-quiz" },
        { icon: Stethoscope, label: "Grand Rounds", href: "/student/grand-rounds" },
        { icon: Stethoscope, label: "Clinical Cases", href: "/student/clinical-case" },
        { icon: BarChart2, label: "Quiz Analysis", href: "/student/quiz-analysis" },
        { icon: GraduationCap, label: "Scholar Hub", href: "/student/scholar-hub" },
        { icon: Zap, label: "Cheat Codes", href: "/student/cheat-codes" },
      ],
    },
    {
      label: "Community",
      items: [
        { icon: Store, label: "Notes Marketplace", href: "/student/notes-marketplace" },
        { icon: Users, label: "Community", href: "/student/community" },
        { icon: Users, label: "Study Rooms", href: "/student/study-rooms" },
        { icon: MessageSquare, label: "Doubt Board", href: "/student/doubts" },
        { icon: MessageCircleHeart, label: "Confession Board", href: "/student/confessions" },
        { icon: Newspaper, label: "News & Announcements", href: "/student/announcements", badge: unseenCount > 0 ? unseenCount : undefined },
      ],
    },
    {
      label: "Progress",
      items: [
        { icon: TrendingUp, label: "My Progress", href: "/student/progress" },
        { icon: Trophy, label: "Leaderboard", href: "/student/leaderboard" },
      ],
    },
    {
      label: "More",
      collapsible: true,
      items: [
        { icon: Camera, label: "Photo Doubt Solver", href: "/student/photo-doubt" },
        { icon: Bot, label: "AI Tools", href: "/student/ai-tools" },
        { icon: CalendarIcon, label: "Calendar", href: "/student/calendar" },
        { icon: Timer, label: "Study Tools", href: "/student/tools" },
        { icon: Gamepad2, label: "Medical Games", href: "/student/games" },
        { icon: Music, label: "Music", href: "/student/music" },
        { icon: Settings, label: "Settings", href: "/student/settings" },
      ],
    },
  ];

  function renderNavItem(item: NavItem) {
    const isActive = location === item.href || location.startsWith(item.href + "/");
    const required = item.requiredLevel ?? 1;
    const isLocked = required > rankLevel;
    const color = getSectionColor(item.href);

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
              : cn("text-muted-foreground hover:bg-muted hover:text-foreground")
          )}>
          <item.icon size={18} className={cn("shrink-0", isActive ? "text-primary-foreground" : color.text)} />
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
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden relative"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,160,60,0.055) 28px, rgba(0,160,60,0.055) 56px)",
      }}
    >
      {/* Logo + collapse toggle */}
      <div className={cn("flex items-center shrink-0 border-b border-sidebar-border", isCollapsed ? "justify-center py-4 px-2" : "px-4 py-4 gap-3")}>
        {!isCollapsed && (
          <>
            <div className="relative shrink-0">
              <img src="/md-logo-new.png" alt="Mission Distinction" className="h-8 w-8 object-contain rounded-lg" />
              <span className="absolute -bottom-1 -right-1 text-[10px] leading-none select-none">⚽</span>
            </div>
            <span className="font-bold text-base text-foreground tracking-tight truncate">
              Mission<span className="text-primary">Distinction</span>
            </span>
          </>
        )}
        {isCollapsed && (
          <div className="relative">
            <img src="/md-logo-new.png" alt="Mission Distinction" className="h-7 w-7 object-contain rounded-lg" />
            <span className="absolute -bottom-1 -right-1 text-[9px] leading-none select-none">⚽</span>
          </div>
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
      <nav className={cn("flex-1 py-2 space-y-3 overflow-y-auto", isCollapsed ? "px-1" : "px-3")}>
        {/* Dashboard — pinned, always visible above the groups */}
        {renderNavItem(dashboardItem)}

        {navGroups.map((group) => {
          const isMoreCollapsedGroup = !!group.collapsible;
          const groupOpen = isMoreCollapsedGroup ? moreOpen : true;
          return (
            <div key={group.label}>
              {!isCollapsed && (
                isMoreCollapsedGroup ? (
                  <button
                    onClick={toggleMore}
                    className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><MoreHorizontal size={12} />{group.label}</span>
                    <ChevronDown size={12} className={cn("transition-transform", groupOpen && "rotate-180")} />
                  </button>
                ) : (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                    {group.label}
                  </div>
                )
              )}
              {(groupOpen || isCollapsed) && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Stadium crowd silhouette — decorative */}
      <div className={cn("w-full text-primary pointer-events-none select-none shrink-0", isCollapsed ? "opacity-50" : "opacity-100")}>
        <StadiumCrowd className="w-full h-9" />
      </div>

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
