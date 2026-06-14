import React from "react";
import { Search, Bell, LogOut, User as UserIcon, Menu } from "lucide-react";
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

export function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { setOpen } = useSidebar();

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

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 gap-3">
      {/* Hamburger — only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </Button>

      {/* Search bar */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search for notes, quizzes, topics..."
          className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 sm:gap-3 pl-2 cursor-pointer outline-none">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
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
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                setLocation(user?.role === "admin" ? "/admin/settings" : "/student/settings")
              }
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
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
