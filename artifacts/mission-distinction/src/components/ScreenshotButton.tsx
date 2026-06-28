import React, { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

async function loadHtml2Canvas() {
  const mod = await import("html2canvas");
  return mod.default ?? mod;
}

export function ScreenshotButton() {
  const [capturing, setCapturing] = useState(false);
  const flashRef = useRef<HTMLDivElement>(null);

  const capture = async () => {
    if (capturing) return;
    setCapturing(true);

    const flash = flashRef.current;
    if (flash) {
      flash.style.opacity = "0.35";
      setTimeout(() => { flash.style.opacity = "0"; }, 180);
    }

    try {
      const html2canvas = await loadHtml2Canvas();
      const target = document.getElementById("md-capture-area") || document.body;

      const canvas = await html2canvas(target as HTMLElement, {
        backgroundColor: "#09090b",
        useCORS: true,
        allowTaint: false,
        scale: Math.min(window.devicePixelRatio, 2),
        logging: false,
        removeContainer: true,
        ignoreElements: (el: Element) =>
          el.classList.contains("no-screenshot") ||
          el.tagName === "VIDEO" ||
          el.tagName === "CANVAS" ||
          el.tagName === "IFRAME",
        onclone: (_doc: Document, clone: HTMLElement) => {
          clone.querySelectorAll<HTMLElement>("[style*='backdrop-filter']").forEach(el => {
            el.style.backdropFilter = "none";
            el.style.webkitBackdropFilter = "none";
          });
        },
      } as Parameters<typeof html2canvas>[1]);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const scale = canvas.width / target.offsetWidth;
        const pad = 12 * scale;
        const fontSize = 13 * scale;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(124,58,237,0.75)";
        const text = "Mission Distinction";
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, canvas.width - tw - pad, canvas.height - pad);
      }

      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { reject(new Error("Blob creation failed")); return; }

          const filename = `mission-distinction-${Date.now()}.png`;
          const file = new File([blob], filename, { type: "image/png" });

          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: "Mission Distinction" });
              resolve();
              return;
            } catch (e: unknown) {
              if ((e as { name?: string })?.name === "AbortError") { resolve(); return; }
            }
          }

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
    } catch (err) {
      console.error("[Screenshot]", err);
      toast.error("Couldn't capture. Try sharing from your phone's screenshot instead.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <>
      <div
        ref={flashRef}
        className="pointer-events-none fixed inset-0 bg-white z-[9999] transition-opacity duration-150"
        style={{ opacity: 0 }}
      />
      <button
        onClick={capture}
        disabled={capturing}
        title="Take screenshot to share your progress"
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
