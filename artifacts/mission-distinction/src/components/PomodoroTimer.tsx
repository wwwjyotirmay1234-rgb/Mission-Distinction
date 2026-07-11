import React, { useState, useEffect, useRef } from "react";
import { Timer, X, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Mode = "focus" | "short" | "long";

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};

const MODE_COLORS: Record<Mode, string> = {
  focus: "text-red-400",
  short: "text-green-400",
  long: "text-blue-400",
};

const MODE_BG: Record<Mode, string> = {
  focus: "bg-red-500/10 border-red-500/20",
  short: "bg-green-500/10 border-green-500/20",
  long: "bg-blue-500/10 border-blue-500/20",
};

function playBeep() {
  try {
    const ctx = new AudioContext();
    const notes = [880, 660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.15);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.16);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

function fmt(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export function PomodoroTimer() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<Mode>("focus");

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            playBeep();
            const finished = modeRef.current;
            if (finished === "focus") setSessions(s => s + 1);
            toast.success(`${MODE_LABELS[finished]} complete! 🍅`, { duration: 5000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const switchMode = (m: Mode) => {
    setMode(m);
    modeRef.current = m;
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(DURATIONS[m]);
  };

  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(DURATIONS[modeRef.current]);
  };

  const total = DURATIONS[mode];
  const progress = (total - timeLeft) / total;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const paused = !running && timeLeft < DURATIONS[mode] && timeLeft > 0;

  return (
    <div className="fixed bottom-[5.5rem] right-20 z-[58] flex flex-col items-end gap-2">
      {open && (
        <div className={`rounded-2xl border p-4 shadow-2xl backdrop-blur-sm bg-card/95 w-60 ${MODE_BG[mode]}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Pomodoro Timer</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setOpen(false)}>
              <X size={13} />
            </Button>
          </div>

          <div className="flex gap-1 mb-4 bg-muted/30 p-0.5 rounded-lg">
            {(["focus", "short", "long"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all ${
                  mode === m
                    ? `${MODE_COLORS[m]} bg-background shadow-sm`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative w-20 h-20">
              <svg width="80" height="80" viewBox="0 0 50 50" className="-rotate-90">
                <circle cx="25" cy="25" r={radius} fill="none" stroke="currentColor"
                  className="text-muted-foreground/20" strokeWidth="3" />
                <circle
                  cx="25" cy="25" r={radius} fill="none"
                  stroke="currentColor" className={MODE_COLORS[mode]}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold tabular-nums leading-none ${MODE_COLORS[mode]}`}>
                  {fmt(timeLeft)}
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5">{MODE_LABELS[mode]}</span>
              </div>
            </div>

            {sessions > 0 && (
              <div className="flex gap-0.5 flex-wrap justify-center max-w-[180px]">
                {Array(Math.min(sessions, 8)).fill(null).map((_, i) => (
                  <span key={i} className="text-xs">🍅</span>
                ))}
                {sessions > 8 && <span className="text-xs text-muted-foreground">+{sessions - 8}</span>}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className={`flex-1 gap-1.5 text-xs h-8 ${running ? "bg-muted hover:bg-muted/80 text-foreground border border-border/50" : ""}`}
              variant={running ? "outline" : "default"}
              onClick={() => setRunning(r => !r)}
            >
              {running
                ? <><Pause size={12} /> Pause</>
                : paused
                  ? <><Play size={12} /> Resume</>
                  : <><Play size={12} /> Start</>
              }
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={reset} title="Reset">
              <RotateCcw size={13} />
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        title="Pomodoro Timer"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg border backdrop-blur-sm transition-all text-sm ${
          running
            ? `${MODE_BG[mode]} ${MODE_COLORS[mode]}`
            : paused
              ? "bg-card/90 border-amber-500/30 text-amber-400"
              : "bg-card/90 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
        }`}
      >
        <Timer size={15} className={running ? "animate-pulse" : ""} />
        {(running || paused) && (
          <span className="text-xs font-mono font-semibold tabular-nums">{fmt(timeLeft)}</span>
        )}
      </button>
    </div>
  );
}
