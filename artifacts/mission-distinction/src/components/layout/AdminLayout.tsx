import React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Header } from "./Header";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useSidebar } from "@/contexts/SidebarContext";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { hidden, collapsed } = useSidebar();

  const marginClass = hidden
    ? "md:ml-0"
    : collapsed
    ? "md:ml-14"
    : "md:ml-64";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminSidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${marginClass}`}>
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
}
