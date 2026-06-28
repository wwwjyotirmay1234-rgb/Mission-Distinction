import { useTheme } from "@/contexts/ThemeContext";

export function Watermark() {
  const { theme } = useTheme();
  if (theme !== "light") return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none z-[9999] flex items-center justify-center"
    >
      <img
        src={`${import.meta.env.BASE_URL}md-logo-new.png`}
        alt=""
        draggable={false}
        style={{
          width: "min(55vw, 420px)",
          opacity: 0.06,
          filter: "grayscale(30%)",
          userSelect: "none",
        }}
      />
    </div>
  );
}
