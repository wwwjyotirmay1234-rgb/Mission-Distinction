import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Database,
  FileText,
  Newspaper,
  Megaphone,
  BarChart3,
  FileBarChart,
  MessageSquare,
  Settings,
  Crown,
  Zap,
  Shield,
  AlertTriangle,
  ClipboardList,
  Brain,
  Pin,
  Lightbulb,
  BookOpen,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  {
    icon: Database,
    label: "Content",
    href: "/admin/content",
    subItems: [
      { label: "Quick Upload", href: "/admin/content/quick-upload" },
      { label: "Notes", href: "/admin/content/notes" },
      { label: "PDF Library", href: "/admin/content/pdfs" },
      { label: "Books Library", href: "/admin/content/books" },
      { label: "PYQs", href: "/admin/content/pyqs" },
      { label: "Scholar Hub", href: "/admin/scholar-hub" },
    ],
  },
  {
    icon: FileText,
    label: "Quizzes",
    href: "/admin/quizzes",
    subItems: [
      { label: "Manage Quizzes", href: "/admin/quizzes" },
      { label: "Student Submissions", href: "/admin/quiz-submissions" },
    ],
  },
  {
    icon: Lightbulb,
    label: "Study Tools",
    href: "/admin/study-tools",
    subItems: [
      { label: "Mnemonics", href: "/admin/study-tools/mnemonics" },
      { label: "Flashcard Decks", href: "/admin/study-tools/flashcards" },
    ],
  },
  { icon: Newspaper, label: "News & Discoveries", href: "/admin/news" },
  { icon: Megaphone, label: "Announcements", href: "/admin/announcements" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Brain, label: "Quiz Intelligence", href: "/admin/quiz-intelligence" },
  { icon: FileBarChart, label: "Reports", href: "/admin/reports" },
  { icon: MessageSquare, label: "Feedback", href: "/admin/feedback" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

const premiumNavItems = [
  { icon: Zap, label: "Live Activity Feed", href: "/admin/activity-feed", color: "text-yellow-400" },
  { icon: Shield, label: "Moderation Center", href: "/admin/moderation", color: "text-blue-400" },
  { icon: AlertTriangle, label: "Student Warnings", href: "/admin/warnings", color: "text-amber-400" },
  { icon: ClipboardList, label: "Audit Log", href: "/admin/audit-log", color: "text-purple-400" },
  { icon: Pin, label: "Pinned Notices", href: "/admin/notices", color: "text-emerald-400" },
];

function SidebarContent({ onNavigate, isCollapsed }: { onNavigate?: () => void; isCollapsed?: boolean }) {
  const [location] = useLocation();
  const { isSuperAdmin } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <>
      <div className={cn("flex items-center shrink-0 border-b border-sidebar-border", isCollapsed ? "p-3 justify-center" : "p-4 gap-3 justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img src="/md-logo-new.png" alt="Mission Distinction" className="h-8 w-8 object-contain rounded-lg shrink-0" />
            <span className="font-bold text-lg text-foreground tracking-tight truncate">
              Admin<span className="text-secondary">Portal</span>
            </span>
          </div>
        )}
        {isCollapsed && (
          <img src="/md-logo-new.png" alt="Mission Distinction" className="h-8 w-8 object-contain rounded-lg" />
        )}
        {/* Collapse toggle — only on desktop sidebar */}
        {onNavigate === undefined && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto py-3 pb-4">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");

          if (item.subItems && !isCollapsed) {
            const isParentActive = location.startsWith(item.href);
            return (
              <div key={item.href} className="mb-1">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                    isParentActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </div>
                <div className="ml-9 mt-0.5 space-y-0.5 border-l border-border pl-3">
                  {item.subItems.map((subItem) => {
                    const isSubActive = location === subItem.href;
                    return (
                      <Link key={subItem.href} href={subItem.href} onClick={onNavigate}>
                        <div
                          className={cn(
                            "block px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                            isSubActive
                              ? "bg-secondary/20 text-secondary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {subItem.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Collapsed: show parent icon only, navigate to first subItem or main href
          const href = item.subItems ? item.subItems[0].href : item.href;

          return (
            <Link key={item.href} href={href} onClick={onNavigate}>
              <div
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isCollapsed ? "justify-center p-2.5 mx-1" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-secondary-foreground" : "text-muted-foreground"}
                />
                {!isCollapsed && item.label}
              </div>
            </Link>
          );
        })}

        {/* Premium Admin Features */}
        <div className={cn("pt-2 mt-1", !isCollapsed && "border-t border-border/40")}>
          {!isCollapsed && (
            <p className="px-3 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-2 mt-1">
              Premium Tools
            </p>
          )}
          {premiumNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate}>
                <div
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isCollapsed ? "justify-center p-2.5 mx-1" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon size={18} className={isActive ? "text-primary" : item.color} />
                  {!isCollapsed && item.label}
                </div>
              </Link>
            );
          })}
        </div>

        {isSuperAdmin && (
          <>
            <div className="my-2 border-t border-border/40" />
            <Link href="/admin/super" onClick={onNavigate}>
              <div
                title={isCollapsed ? "Super Admin" : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isCollapsed ? "justify-center p-2.5 mx-1" : "gap-3 px-3 py-2.5",
                  location === "/admin/super"
                    ? "bg-yellow-500/20 text-yellow-400 shadow-sm"
                    : "text-yellow-500/70 hover:bg-yellow-500/10 hover:text-yellow-400"
                )}
              >
                <Crown size={18} />
                {!isCollapsed && "Super Admin"}
              </div>
            </Link>
          </>
        )}
      </nav>
    </>
  );
}

export function AdminSidebar() {
  const { open, setOpen, hidden, collapsed } = useSidebar();

  const desktopWidth = collapsed ? "w-14" : "w-64";
  const desktopTranslate = hidden ? "-translate-x-full" : "translate-x-0";

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen bg-sidebar border-r border-sidebar-border flex-col fixed left-0 top-0 z-20 transition-all duration-300",
          desktopWidth,
          desktopTranslate
        )}
      >
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* Mobile sidebar as Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border flex flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} isCollapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
