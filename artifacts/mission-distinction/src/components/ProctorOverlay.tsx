import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { ShieldCheck, Camera, CameraOff, AlertTriangle } from "lucide-react";

interface Props {
  sessionId: string;
  quizId: number;
  onAutoSubmit: () => void;
  children: React.ReactNode;
}

const MAX_TAB_VIOLATIONS = 3;
const MAX_TOTAL_VIOLATIONS = 5;
const FRAME_INTERVAL_MS = 30_000;

const MINOR_EVENTS = new Set(["session_started", "camera_error", "right_click"]);

export default function ProctorOverlay({ sessionId, quizId, onAutoSubmit, children }: Props) {
  const [violations, setViolations] = useState(0);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const violationsRef = useRef(0);
  const tabViolationsRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const analyzeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logEvent = useCallback(async (eventType: string, details?: Record<string, any>, aiAnalysis?: string) => {
    try {
      await apiFetch("/api/proctoring/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, quizId, eventType, details, aiAnalysis }),
      });
    } catch { }
  }, [sessionId, quizId]);

  const checkAutoSubmit = useCallback((newCount: number, newTabCount: number) => {
    if (autoSubmittedRef.current) return;
    if (newCount >= MAX_TOTAL_VIOLATIONS || newTabCount >= MAX_TAB_VIOLATIONS) {
      autoSubmittedRef.current = true;
      setAutoSubmitting(true);
      logEvent("auto_submitted", { violationCount: newCount, tabViolations: newTabCount });
      toast.error("🚨 Too many violations — your exam is being submitted automatically.", { duration: 6000 });
      setTimeout(onAutoSubmit, 2500);
    }
  }, [logEvent, onAutoSubmit]);

  const handleViolation = useCallback((eventType: string, message: string, details?: Record<string, any>, aiAnalysis?: string) => {
    if (autoSubmittedRef.current) return;

    logEvent(eventType, details, aiAnalysis);

    if (MINOR_EVENTS.has(eventType)) {
      toast.warning(`⚠️ ${message}`, { duration: 3000, id: `proctor-${eventType}` });
      return;
    }

    const newCount = violationsRef.current + 1;
    violationsRef.current = newCount;
    setViolations(newCount);

    if (eventType === "tab_switch" || eventType === "fullscreen_exit") {
      tabViolationsRef.current += 1;
    }

    const remaining = MAX_TOTAL_VIOLATIONS - newCount;
    checkAutoSubmit(newCount, tabViolationsRef.current);

    if (!autoSubmittedRef.current) {
      toast.warning(
        `⚠️ ${message} — ${remaining} warning${remaining !== 1 ? "s" : ""} remaining before auto-submit.`,
        { duration: 6000, id: "proctor-violation" }
      );
    }
  }, [logEvent, checkAutoSubmit]);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }
        setCameraOk(true);
        logEvent("session_started");
      })
      .catch((err) => {
        if (!cancelled) setCameraOk(false);
        logEvent("camera_error", { error: err.message });
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [logEvent]);

  useEffect(() => {
    const el = containerRef.current || document.documentElement;
    el.requestFullscreen?.().catch(() => { });
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { });
    };
  }, []);

  useEffect(() => {
    analyzeIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !streamRef.current || autoSubmittedRef.current || !cameraOk) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 320; canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        const res = await apiFetch("/api/proctoring/analyze-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, quizId, imageBase64 }),
        });
        if (!res.ok) return;
        const { safe, issues, analysis } = await res.json() as { safe: boolean; issues: string[]; analysis: string };
        if (!safe && issues.length > 0) {
          const label: Record<string, string> = {
            no_face: "No face detected in frame",
            multiple_faces: "Multiple people detected",
            phone_detected: "Phone/device detected",
            looking_away: "Looking away from screen",
          };
          const msg = issues.map((i: string) => label[i] || i).join(", ");
          handleViolation("ai_flag", msg, { issues }, analysis);
        }
      } catch { }
    }, FRAME_INTERVAL_MS);

    return () => {
      if (analyzeIntervalRef.current) clearInterval(analyzeIntervalRef.current);
    };
  }, [sessionId, quizId, cameraOk, handleViolation]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !autoSubmittedRef.current) {
        handleViolation("tab_switch", "You switched tabs or minimized the window");
      }
    };
    const onBlur = () => {
      if (!autoSubmittedRef.current && !document.hidden) {
        handleViolation("tab_switch", "You left the exam window");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [handleViolation]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && !autoSubmittedRef.current) {
        handleViolation("fullscreen_exit", "You exited fullscreen mode");
        setTimeout(() => {
          const el = containerRef.current || document.documentElement;
          el.requestFullscreen?.().catch(() => { });
        }, 1200);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [handleViolation]);

  useEffect(() => {
    const block = (e: Event) => {
      e.preventDefault();
      handleViolation("copy_paste", `${e.type.charAt(0).toUpperCase() + e.type.slice(1)} is not allowed`, { type: e.type });
    };
    const blockCtx = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("Right-click is disabled during this exam.", { id: "no-rightclick", duration: 2000 });
      logEvent("right_click");
    };
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", blockCtx);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", blockCtx);
    };
  }, [handleViolation, logEvent]);

  const dotColor = violations === 0
    ? "bg-green-500"
    : violations <= 2
    ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div ref={containerRef} className="relative">
      {autoSubmitting && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
          <div className="text-center space-y-4 p-8 max-w-sm">
            <div className="text-5xl">🚨</div>
            <h2 className="text-2xl font-bold text-red-400">Exam Auto-Submitted</h2>
            <p className="text-muted-foreground text-sm">
              The proctoring system detected too many violations. Your answers have been recorded.
            </p>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur border border-border/50 rounded-full px-3 py-1.5 text-xs shadow-lg pointer-events-auto">
          <ShieldCheck size={12} className={violations === 0 ? "text-green-400" : "text-red-400"} />
          <span className="text-muted-foreground font-medium">Proctored Exam</span>
          {violations > 0 && (
            <span className="flex items-center gap-1 text-red-400 font-semibold">
              <AlertTriangle size={10} />
              {violations}/{MAX_TOTAL_VIOLATIONS}
            </span>
          )}
          <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className={`w-20 h-[60px] rounded-lg overflow-hidden border shadow-lg transition-opacity ${
            cameraOk === true ? "border-green-500/40 opacity-80 hover:opacity-100" :
            cameraOk === false ? "border-red-500/40 opacity-60" :
            "border-border/30 opacity-40"
          } bg-black`}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-1 text-[10px] pointer-events-auto">
            {cameraOk === true && <><Camera size={9} className="text-green-400" /><span className="text-green-400">Camera on</span></>}
            {cameraOk === false && <><CameraOff size={9} className="text-red-400" /><span className="text-red-400">No camera</span></>}
            {cameraOk === null && <span className="text-muted-foreground">Starting…</span>}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
