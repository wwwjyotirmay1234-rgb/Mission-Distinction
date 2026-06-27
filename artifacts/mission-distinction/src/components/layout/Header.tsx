import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, LogOut, User as UserIcon, Menu, Zap, Megaphone, Newspaper, CalendarDays, AlertTriangle } from "lucide-react";
import { ScreenshotButton } from "@/components/ScreenshotButton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/contexts/SidebarContext";
import { RankBadge } from "@/components/RankBadge";
import { useXPStats } from "@/hooks/useXPStats";
import { getRankForXp } from "@/lib/ranks";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LS_KEY = "md_notifications_last_seen";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string; color?: string }>> = {
  event: CalendarDays,
  news: Newspaper,
  alert: AlertTriangle,
  general: Megaphone,
};

const TYPE_COLOR: Record<string, string> = {
  event: "text-green-400 bg-green-500/10",
  news: "text-blue-400 bg-blue-500/10",
  alert: "text-red-400 bg-red-500/10",
  general: "text-primary bg-primary/10",
};

// ── Notifications Bell ────────────────────────────────────────────────────────

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const v = localStorage.getItem(LS_KEY);
    return v ? parseInt(v, 10) : 0;
  });
  const [, setLocation] = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  // Fetch announcements once on mount
  useEffect(() => {
    apiFetch("/api/announcements")
      .then(r => r.json())
      .then((data: Announcement[]) => {
        if (Array.isArray(data)) setItems(data.slice(0, 20));
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = items.filter(a => new Date(a.createdAt).getTime() > lastSeen).length;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) {
      // Mark all as read when opening
      const now = Date.now();
      setLastSeen(now);
      localStorage.setItem(LS_KEY, String(now));
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    setLocation("/student/announcements");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-primary rounded-full text-[9px] font-bold text-white border border-background leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {unreadCount === 0 && items.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary/40 rounded-full border border-background" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
            </div>
            <button
              onClick={handleViewAll}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Bell size={28} className="mx-auto mb-2 opacity-20" />
                No notifications yet
              </div>
            ) : (
              items.map(item => {
                const isUnread = new Date(item.createdAt).getTime() > lastSeen;
                const Icon = TYPE_ICON[item.type] ?? Megaphone;
                const colorClass = TYPE_COLOR[item.type] ?? TYPE_COLOR.general;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
                      isUnread && "bg-primary/5"
                    )}
                    onClick={handleViewAll}
                  >
                    <div className={cn("mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center", colorClass)}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium leading-snug line-clamp-1", isUnread && "text-foreground font-semibold")}>
                          {item.title}
                        </p>
                        {isUnread && <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {item.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border/60 px-4 py-2.5">
              <button
                onClick={handleViewAll}
                className="w-full text-center text-xs text-primary hover:underline"
              >
                See all announcements →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Header ───────────────────────────────────────────────────────────────

export function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { setOpen } = useSidebar();
  const { data: xpStats } = useXPStats();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "MD";

  const xp = xpStats?.totalXp ?? 0;
  const rankLevel = xpStats?.currentRankLevel ?? 1;
  const rank = getRankForXp(xp);

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </Button>

      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search for notes, quizzes, topics..."
          className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {user?.role !== "admin" && xpStats && (
          <button
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => setLocation("/student/progress")}
          >
            <Zap size={12} className="text-amber-400" />
            <span className="text-xs font-bold text-foreground">{xp.toLocaleString()}</span>
            <span className={`text-xs font-semibold ${rank.textClass}`}>{rank.emoji}</span>
          </button>
        )}

        {user?.role !== "admin" && <ScreenshotButton />}
        {user?.role !== "admin" && <NotificationsBell />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 sm:gap-3 pl-2 cursor-pointer outline-none">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  {user?.role !== "admin" && rankLevel > 0 && (
                    <RankBadge level={rankLevel} size="xs" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.role === "admin" ? "Super Admin" : user?.year || "Student"}
                </p>
              </div>
              <Avatar className="h-9 w-9 border border-border shrink-0">
                <AvatarImage key={user?.avatarUrl || "none"} src={user?.avatarUrl || ""} alt={user?.fullName} />
                <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="font-semibold">{user?.fullName}</p>
                {user?.role !== "admin" && xpStats && (
                  <div className="flex items-center gap-1.5">
                    <RankBadge level={rankLevel} showName size="xs" />
                    <span className="text-xs text-muted-foreground">· {xp.toLocaleString()} XP</span>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                setLocation(user?.role === "admin" ? "/admin/settings" : "/student/settings")
              }
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            {user?.role !== "admin" && (
              <DropdownMenuItem onClick={() => setLocation("/student/progress")}>
                <Zap className="mr-2 h-4 w-4 text-amber-400" />
                <span>My XP & Rank</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
