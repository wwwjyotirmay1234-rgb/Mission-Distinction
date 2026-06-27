import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ScreenshotButton() {
  const [capturing, setCapturing] = useState(false);
  const flashRef = useRef<HTMLDivElement>(null);

  const capture = async () => {
    if (capturing) return;
    setCapturing(true);

    // Brief camera flash effect
    const flash = flashRef.current;
    if (flash) {
      flash.style.opacity = "0.35";
      setTimeout(() => { flash.style.opacity = "0"; }, 180);
    }

    try {
      const target = document.getElementById("md-capture-area") || document.body;

      const canvas = await html2canvas(target, {
        backgroundColor: "#09090b",
        useCORS: true,
        allowTaint: true,
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        logging: false,
        ignoreElements: (el) => el.classList.contains("no-screenshot"),
      });

      // Stamp branding watermark
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const pad = 12;
        const text = "Mission Distinction";
        ctx.font = `bold ${14 * (canvas.width / target.offsetWidth)}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(124,58,237,0.7)";
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, canvas.width - tw - pad * (canvas.width / target.offsetWidth), canvas.height - pad * (canvas.width / target.offsetWidth));
      }

      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { reject(new Error("Capture failed")); return; }

          const filename = `mission-distinction-${Date.now()}.png`;
          const file = new File([blob], filename, { type: "image/png" });

          // Web Share API (mobile)
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: "Mission Distinction" });
              resolve();
              return;
            } catch (e: any) {
              // User cancelled share — not an error
              if (e?.name === "AbortError") { resolve(); return; }
            }
          }

          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          toast.success("Screenshot saved!");
          resolve();
        }, "image/png");
      });
    } catch {
      toast.error("Screenshot failed. Try again.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <>
      {/* Full-screen flash overlay */}
      <div
        ref={flashRef}
        className="pointer-events-none fixed inset-0 bg-white z-[9999] transition-opacity duration-150"
        style={{ opacity: 0 }}
      />

      <button
        onClick={capture}
        disabled={capturing}
        title="Take screenshot"
        aria-label="Take screenshot"
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted disabled:opacity-50"
      >
        {capturing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Camera size={18} />
        )}
      </button>
    </>
  );
}
