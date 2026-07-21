import React, { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  hidden: boolean;
  setHidden: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  open: false, setOpen: () => {},
  collapsed: false, setCollapsed: () => {},
  hidden: false, setHidden: () => {},
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

  const [hidden, setHiddenState] = useState(() => {
    try { return localStorage.getItem("md_sidebar_hidden") === "1"; } catch { return false; }
  });
  const setHidden = (v: boolean) => {
    setHiddenState(v);
    try { localStorage.setItem("md_sidebar_hidden", v ? "1" : "0"); } catch {}
  };

  return (
    <SidebarContext.Provider value={{ open, setOpen, collapsed, setCollapsed, hidden, setHidden }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
