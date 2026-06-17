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
  Activity,
  Trophy,
  MessageSquare,
} from "lucide-react";

const LAST_SEEN_KEY = "md_announcements_last_seen";

function getUnseenCount(announcements: any[]): number {
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  if (!lastSeen) return announcements.length;
  return announcements.filter((a) => new Date(a.createdAt) > new Date(lastSeen)).length;
}

function markAnnouncementsSeen() {
  localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();

  const { data: announcements } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey({}), staleTime: 60_000 } }
  );

  const unseenCount = React.useMemo(() => {
    const list = Array.isArray(announcements) ? (announcements as any[]) : [];
    return getUnseenCount(list);
  }, [announcements]);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: FileText, label: "Quiz Center", href: "/student/quiz" },
    { icon: FileText, label: "Notes", href: "/student/notes" },
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
    { icon: Settings, label: "Settings", href: "/student/settings" },
  ];

  return (
    <>
      <div className="p-6 flex items-center gap-3 shrink-0">
        <img src="/logo.jpeg" alt="Mission Distinction" className="h-8 w-8 object-contain rounded-lg" />
        <span className="font-bold text-lg text-foreground tracking-tight">
          Mission<span className="text-primary">Distinction</span>
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
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
                {(item as any).badge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                    {(item as any).badge > 9 ? "9+" : (item as any).badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

    </>
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
