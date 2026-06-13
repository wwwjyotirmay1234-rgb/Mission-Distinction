import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  Activity
} from "lucide-react";

export function StudentSidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: FileText, label: "Quiz", href: "/student/quiz" },
    { icon: File, label: "Notes", href: "/student/notes" },
    { icon: File, label: "PDF Library", href: "/student/pdfs" },
    { icon: Users, label: "Community", href: "/student/community" },
    { icon: Newspaper, label: "News & Announcements", href: "/student/announcements" },
    { icon: TrendingUp, label: "My Progress", href: "/student/progress" },
    { icon: Bookmark, label: "Bookmarks", href: "/student/bookmarks" },
    { icon: CalendarIcon, label: "Calendar", href: "/student/calendar" },
    { icon: Settings, label: "Settings", href: "/student/settings" },
  ];

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center border border-primary/30">
          <Activity size={18} className="text-primary" />
        </div>
        <span className="font-bold text-lg text-foreground tracking-tight">Mission<span className="text-primary">Distinction</span></span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={18} className={isActive ? "text-primary-foreground" : "text-muted-foreground"} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-card border border-border rounded-xl p-4 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full pointer-events-none" />
          <h4 className="text-sm font-bold mb-1">Need Help?</h4>
          <p className="text-xs text-muted-foreground mb-3">Contact our mentor support 24/7</p>
          <button className="w-full py-2 bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold rounded-lg transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  );
}
