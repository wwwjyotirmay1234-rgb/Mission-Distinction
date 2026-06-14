import React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Header } from "./Header";
import { SidebarProvider } from "@/contexts/SidebarContext";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col md:ml-64 min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
