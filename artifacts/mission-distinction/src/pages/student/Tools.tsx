import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, AlarmClock, Play, Pause, RotateCcw, Flag, Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function pad(n: number, digits = 2) {
  return String(n).padStart(digits, "0");
}

function formatMs(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const cs = Math.floor((ms % 1_000) / 10);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.35);
      osc.start(ctx.currentTime + i * 0.4);
      osc.stop(ctx.currentTime + i * 0.4 + 0.35);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[playBeep] AudioContext failed:", e);
  }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

function showNotification(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo.jpeg" });
  }
}

// ─── Stopwatch ────────────────────────────────────────────────────────────────
function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const baseRef = useRef<number>(0);

  const tick = useCallback(() => {
    setElapsed(baseRef.current + (performance.now() - startRef.current));
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const start = () => {
    startRef.current = performance.now();
    setRunning(true);
    frameRef.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    cancelAnimationFrame(frameRef.current);
    baseRef.current += performance.now() - startRef.current;
    setRunning(false);
  };

  const reset = () => {
    cancelAnimationFrame(frameRef.current);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    baseRef.current = 0;
  };

  const lap = () => setLaps(prev => [...prev, elapsed]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const lastLap = laps.length > 0 ? laps[laps.length - 1] : 0;
  const lapElapsed = elapsed - lastLap;

  return (
    <Card className="bg-card/40 border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer size={18} className="text-primary" /> Stopwatch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center">
          <div className="font-mono text-5xl font-bold tracking-tight tabular-nums">
            {formatMs(elapsed)}
          </div>
          {laps.length > 0 && (
            <div className="text-sm text-muted-foreground mt-1 font-mono">
              Lap {laps.length + 1}: {formatMs(lapElapsed)}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          {!running ? (
            <Button size="lg" className="w-28" onClick={start}>
              <Play size={18} className="mr-2" /> {elapsed === 0 ? "Start" : "Resume"}
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="w-28" onClick={pause}>
              <Pause size={18} className="mr-2" /> Pause
            </Button>
          )}
          {running && (
            <Button size="lg" variant="outline" onClick={lap}>
              <Flag size={16} className="mr-2" /> Lap
            </Button>
          )}
          {!running && elapsed > 0 && (
            <Button size="lg" variant="outline" onClick={reset}>
              <RotateCcw size={16} className="mr-2" /> Reset
            </Button>
          )}
        </div>

        {laps.length > 0 && (
          <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border/40 rounded-lg p-3">
            <div className="flex justify-between text-xs text-muted-foreground font-medium mb-2 px-1">
              <span>Lap</span><span>Split</span><span>Total</span>
            </div>
            {[...laps].reverse().map((total, ri) => {
              const i = laps.length - 1 - ri;
              const split = i === 0 ? total : total - laps[i - 1];
              const best = Math.min(...laps.map((l, j) => j === 0 ? l : l - laps[j - 1]));
              const worst = Math.max(...laps.map((l, j) => j === 0 ? l : l - laps[j - 1]));
              const isB = split === best && laps.length > 1;
              const isW = split === worst && laps.length > 1;
              return (
                <div key={i} className={`flex justify-between text-xs font-mono px-1 py-0.5 rounded ${isB ? "text-green-400" : isW ? "text-red-400" : ""}`}>
                  <span className="w-8">#{i + 1}</span>
                  <span>{formatMs(split)}</span>
                  <span className="text-muted-foreground">{formatMs(total)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Alarm ────────────────────────────────────────────────────────────────────
type Alarm = { id: string; time: string; label: string; active: boolean; fired: boolean };

const ALARM_KEY = "md_study_alarms";

function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(ALARM_KEY);
    if (!raw) return [];
    const parsed: Alarm[] = JSON.parse(raw);
    return parsed.map(a => ({ ...a, fired: false, active: a.active }));
  } catch { return []; }
}

function saveAlarms(alarms: Alarm[]) {
  try { localStorage.setItem(ALARM_KEY, JSON.stringify(alarms)); } catch {}
}

function AlarmClock_() {
  const [alarms, setAlarmsState] = useState<Alarm[]>(loadAlarms);
  const [newTime, setNewTime] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [notifGranted, setNotifGranted] = useState(Notification.permission === "granted");
  const checkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setAlarms = (updater: Alarm[] | ((prev: Alarm[]) => Alarm[])) => {
    setAlarmsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveAlarms(next);
      return next;
    });
  };

  useEffect(() => {
    checkRef.current = setInterval(() => {
      const now = new Date();
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setAlarms(prev => {
        let changed = false;
        const next = prev.map(a => {
          if (a.active && !a.fired && a.time === hhmm) {
            playBeep();
            showNotification("⏰ Alarm!", a.label || `Alarm set for ${a.time}`);
            toast.success(`⏰ Alarm! ${a.label || a.time}`, { duration: 8000 });
            changed = true;
            return { ...a, fired: true, active: false };
          }
          return a;
        });
        return changed ? next : prev;
      });
    }, 1_000);
    return () => { if (checkRef.current) clearInterval(checkRef.current); };
  }, []);

  const addAlarm = async () => {
    if (!newTime) { toast.error("Pick a time first."); return; }
    if (!notifGranted) {
      const ok = await requestNotificationPermission();
      setNotifGranted(ok);
      if (!ok) toast("Notifications blocked — alarm will still beep in the app.", { icon: "ℹ️" });
    }
    const alarm: Alarm = { id: crypto.randomUUID(), time: newTime, label: newLabel.trim(), active: true, fired: false };
    setAlarms(prev => [...prev, alarm]);
    setNewTime("");
    setNewLabel("");
    toast.success(`Alarm set for ${newTime}${alarm.label ? ` — ${alarm.label}` : ""}`);
  };

  const toggle = (id: string) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: !a.active, fired: false } : a));
  const remove = (id: string) => setAlarms(prev => prev.filter(a => a.id !== id));

  return (
    <Card className="bg-card/40 border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlarmClock size={18} className="text-primary" /> Alarm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="time"
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
            className="flex-1 h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            maxLength={40}
            onKeyDown={e => { if (e.key === "Enter") addAlarm(); }}
            className="flex-1 h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button onClick={addAlarm} className="shrink-0">
            <Plus size={16} className="mr-1.5" /> Set Alarm
          </Button>
        </div>

        {alarms.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6 border border-dashed border-border/40 rounded-lg">
            No alarms set. Add one above!
          </div>
        ) : (
          <div className="space-y-2">
            {[...alarms].sort((a, b) => a.time.localeCompare(b.time)).map(alarm => (
              <div key={alarm.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${alarm.fired ? "border-border/20 opacity-50" : alarm.active ? "border-primary/30 bg-primary/5" : "border-border/30"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{alarm.time}</span>
                    {alarm.fired && <Badge variant="outline" className="text-[10px] px-1.5 border-green-500/30 text-green-400">Fired</Badge>}
                    {alarm.active && !alarm.fired && <Badge variant="outline" className="text-[10px] px-1.5 border-primary/30 text-primary">Active</Badge>}
                    {!alarm.active && !alarm.fired && <Badge variant="outline" className="text-[10px] px-1.5">Off</Badge>}
                  </div>
                  {alarm.label && <p className="text-xs text-muted-foreground truncate mt-0.5">{alarm.label}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => toggle(alarm.id)} title={alarm.active ? "Disable" : "Enable"}>
                  {alarm.active ? <Bell size={15} className="text-primary" /> : <BellOff size={15} className="text-muted-foreground" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive/70 hover:text-destructive" onClick={() => remove(alarm.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          Alarms are saved across page refreshes. Keep this tab open for alarms to fire.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentTools() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Study Tools</h1>
        <p className="text-muted-foreground">Stopwatch for timed practice. Alarm to stay on schedule.</p>
      </div>
      <Stopwatch />
      <AlarmClock_ />
    </div>
  );
}
