import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";

function buildWatermarkDataUrl(text: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 380;
  canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-30 * (Math.PI / 180));
  ctx.font = "600 13px Inter, sans-serif";
  ctx.fillStyle = "rgba(124, 58, 237, 0.13)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Mission Distinction", 0, -14);
  ctx.font = "500 11px Inter, sans-serif";
  ctx.fillStyle = "rgba(167, 139, 250, 0.11)";
  ctx.fillText(text, 0, 8);
  ctx.restore();
  return canvas.toDataURL("image/png");
}

export function Watermark() {
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  const label = user
    ? `${(user as any).fullName || "Student"} · ${(user as any).email || ""}`
    : "Mission Distinction";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const url = buildWatermarkDataUrl(label);
    el.style.backgroundImage = `url(${url})`;
  }, [label]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundRepeat: "repeat",
        backgroundSize: "380px 200px",
        pointerEvents: "none",
        zIndex: 9999,
        userSelect: "none",
      }}
    />
  );
}
