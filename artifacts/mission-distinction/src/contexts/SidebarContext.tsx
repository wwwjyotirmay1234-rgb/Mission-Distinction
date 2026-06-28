import React, { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  open: false, setOpen: () => {},
  collapsed: false, setCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsedState] = useState(() => {
    try { return localStorage.getItem("md_sidebar_collapsed") === "1"; } catch { return false; }
  });

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try { localStorage.setItem("md_sidebar_collapsed", v ? "1" : "0"); } catch {}
  };

  return (
    <SidebarContext.Provider value={{ open, setOpen, collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
