import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setForcedDark: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setForcedDark: () => {},
});

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem("md_theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [forcedDark, setForcedDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (forcedDark || theme === "dark") {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
    try {
      localStorage.setItem("md_theme", theme);
    } catch {}
  }, [theme, forcedDark]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setForcedDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ForceDark({ children }: { children: React.ReactNode }) {
  const { setForcedDark } = useContext(ThemeContext);
  const setRef = useRef(setForcedDark);
  setRef.current = setForcedDark;

  useEffect(() => {
    setRef.current(true);
    return () => setRef.current(false);
  }, []);

  return <>{children}</>;
}
