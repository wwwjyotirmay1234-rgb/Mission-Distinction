import React from "react";
import { Search, Bell, LogOut, User as UserIcon, Menu, Zap } from "lucide-react";
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

        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>

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
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.fullName} />
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
