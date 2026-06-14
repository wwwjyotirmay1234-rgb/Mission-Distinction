import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/contexts/SidebarContext";
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
  Activity,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  {
    icon: Database,
    label: "Content",
    href: "/admin/content",
    subItems: [
      { label: "Notes", href: "/admin/content/notes" },
      { label: "PDF Library", href: "/admin/content/pdfs" },
      { label: "Books Library", href: "/admin/content/books" },
    ],
  },
  { icon: FileText, label: "Quizzes", href: "/admin/quizzes" },
  { icon: Newspaper, label: "News & Discoveries", href: "/admin/news" },
  { icon: Megaphone, label: "Announcements", href: "/admin/announcements" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: FileBarChart, label: "Reports", href: "/admin/reports" },
  { icon: MessageSquare, label: "Feedback", href: "/admin/feedback" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <>
      <div className="p-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 bg-secondary/20 text-secondary rounded-lg flex items-center justify-center border border-secondary/30">
          <Activity size={18} className="text-secondary" />
        </div>
        <span className="font-bold text-lg text-foreground tracking-tight">
          Admin<span className="text-secondary">Portal</span>
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");

          if (item.subItems) {
            const isParentActive = location.startsWith(item.href);
            return (
              <div key={item.href} className="mb-2">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    isParentActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </div>
                <div className="ml-9 mt-1 space-y-1 border-l border-border pl-3">
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

          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-1",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-secondary-foreground" : "text-muted-foreground"}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AdminSidebar() {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-sidebar border-r border-sidebar-border flex-col fixed left-0 top-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar as Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border flex flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
