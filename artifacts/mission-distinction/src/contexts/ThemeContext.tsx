import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";
export type FontSize = "sm" | "md" | "lg";

const FONT_SCALE: Record<FontSize, string> = {
  sm: "90%",
  md: "100%",
  lg: "112%",
};

interface ThemeContextValue {
  theme: Theme;
  isLight: boolean;
  toggleTheme: () => void;
  setForcedDark: (v: boolean) => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  isLight: false,
  toggleTheme: () => {},
  setForcedDark: () => {},
  fontSize: "md",
  setFontSize: () => {},
});

function getInitialTheme(): Theme {
  try {
    const migrated = localStorage.getItem("md_theme_v2");
    if (migrated === "light" || migrated === "dark") return migrated;
    const saved = localStorage.getItem("md_theme");
    if (saved === "light") {
      localStorage.removeItem("md_theme");
      localStorage.setItem("md_theme_v2", "dark");
      return "dark";
    }
    if (saved === "dark") {
      localStorage.setItem("md_theme_v2", "dark");
      localStorage.removeItem("md_theme");
      return "dark";
    }
  } catch {}
  return "dark";
}

function getInitialFontSize(): FontSize {
  try {
    const saved = localStorage.getItem("md_font_size");
    if (saved === "sm" || saved === "md" || saved === "lg") return saved;
  } catch {}
  return "md";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [forcedDark, setForcedDark] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>(getInitialFontSize);

  const isLight = !forcedDark && theme === "light";

  useEffect(() => {
    const root = document.documentElement;
    if (!isLight) {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
    try {
      localStorage.setItem("md_theme_v2", theme);
    } catch {}
  }, [theme, isLight]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SCALE[fontSize];
    try {
      localStorage.setItem("md_font_size", fontSize);
    } catch {}
  }, [fontSize]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const setFontSize = (s: FontSize) => setFontSizeState(s);

  return (
    <ThemeContext.Provider value={{ theme, isLight, toggleTheme, setForcedDark, fontSize, setFontSize }}>
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
