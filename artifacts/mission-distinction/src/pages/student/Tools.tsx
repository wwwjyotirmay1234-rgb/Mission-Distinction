import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, AlarmClock, Play, Pause, RotateCcw, Flag, Bell, BellOff, Plus, Trash2, Music, Upload, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const MIN_STOPWATCH_XP_MS = 5 * 60 * 1000;

function awardActivityXP(type: string) {
  apiFetch("/api/xp/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  }).catch(() => {});
}

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

async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

async function showAlarmNotification(title: string, body: string, alarmId: string) {
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        requireInteraction: true,
        tag: "alarm-" + alarmId,
        data: { alarmId, type: "alarm" },
        ...(({ vibrate: [500, 300, 500, 300, 500], actions: [{ action: "dismiss", title: "Dismiss" }] }) as NotificationOptions),
      });
      return;
    }
  } catch {}
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon-192.png" });
  }
}

// ─── IndexedDB audio storage ───────────────────────────────────────────────────
const DB_NAME = "md_alarm_audio";
const STORE = "blobs";

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAudioBlob(id: string, blob: Blob) {
  const db = await openAudioDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAudioBlob(id: string): Promise<Blob | null> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteAudioBlob(id: string) {
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

// ─── Active alarm audio tracking ──────────────────────────────────────────────
// Module-level so any code path can stop the currently ringing alarm.
let _alarmAudio: { el: HTMLAudioElement; url: string } | null = null;

// ─── Dedup set: alarms fired in this session ───────────────────────────────────
// Prevents double-fire when both the in-app interval AND the SW fire at the same time,
// or when React defers the state update and the next interval tick sees fired=false again.
const _firedIds = new Set<string>();

function stopCurrentAlarmAudio() {
  if (_alarmAudio) {
    try { _alarmAudio.el.pause(); _alarmAudio.el.currentTime = 0; } catch {}
    try { URL.revokeObjectURL(_alarmAudio.url); } catch {}
    _alarmAudio = null;
  }
}

// ─── Built-in soothing tones ──────────────────────────────────────────────────
function playBeep() {
  try {
    const ctx = new AudioContext();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.35);
      osc.start(ctx.currentTime + i * 0.4);
      osc.stop(ctx.currentTime + i * 0.4 + 0.35);
    }
    setTimeout(() => ctx.close(), 2500);
  } catch {}
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.55;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
      osc.start(t); osc.stop(t + 1.6);
    });
    setTimeout(() => ctx.close(), 4500);
  } catch {}
}

function playBell() {
  try {
    const ctx = new AudioContext();
    const harmonics = [440, 1212.5, 1889.2, 2924.8];
    const vols =      [0.3,  0.14,   0.08,   0.04];
    harmonics.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vols[i], ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 3.5);
    });
    setTimeout(() => ctx.close(), 4500);
  } catch {}
}

function playGong() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine"; osc.frequency.value = 110;
    filter.type = "lowpass"; filter.frequency.value = 900;
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 5);
    setTimeout(() => ctx.close(), 6000);
  } catch {}
}

function playBirds() {
  try {
    const ctx = new AudioContext();
    const chirps = [
      { base: 2200, rise: 600, t: 0 },
      { base: 2800, rise: -400, t: 0.28 },
      { base: 2100, rise: 700, t: 0.56 },
      { base: 3000, rise: -500, t: 0.84 },
      { base: 2400, rise: 500, t: 1.12 },
    ];
    chirps.forEach(({ base, rise, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(base, ctx.currentTime + t);
      osc.frequency.linearRampToValueAtTime(base + rise, ctx.currentTime + t + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.22);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.22);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch {}
}

async function playCustomAudio(id: string): Promise<void> {
  stopCurrentAlarmAudio(); // always stop whatever was ringing before
  try {
    const blob = await getAudioBlob(id);
    if (!blob) { playBeep(); return; }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.8;
    _alarmAudio = { el: audio, url };
    await audio.play();
    // Auto-stop after 60 s — behave like a real alarm, not a music player
    const autoStop = setTimeout(() => {
      if (_alarmAudio?.el === audio) stopCurrentAlarmAudio();
    }, 60_000);
    audio.onended = () => {
      clearTimeout(autoStop);
      if (_alarmAudio?.el === audio) { URL.revokeObjectURL(url); _alarmAudio = null; }
    };
  } catch { playBeep(); }
}

type RingtoneId = "beep" | "chime" | "bell" | "gong" | "birds" | "custom";

const RINGTONES: { id: RingtoneId; label: string; emoji: string }[] = [
  { id: "beep",  label: "Beep",  emoji: "🔔" },
  { id: "chime", label: "Chime", emoji: "🎵" },
  { id: "bell",  label: "Bell",  emoji: "🔔" },
  { id: "gong",  label: "Gong",  emoji: "🥁" },
  { id: "birds", label: "Birds", emoji: "🐦" },
  { id: "custom",label: "Custom",emoji: "🎶" },
];

function previewTone(id: RingtoneId, alarmId?: string) {
  switch (id) {
    case "beep":  return playBeep();
    case "chime": return playChime();
    case "bell":  return playBell();
    case "gong":  return playGong();
    case "birds": return playBirds();
    case "custom": if (alarmId) playCustomAudio(alarmId); break;
  }
}

async function playAlarmSound(alarm: Alarm) {
  if (alarm.ringtone === "custom") {
    await playCustomAudio(alarm.id);
  } else {
    previewTone(alarm.ringtone as RingtoneId);
  }
}

// ─── Service Worker alarm scheduling ─────────────────────────────────────────
async function getSwActive() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.active ?? null;
  } catch { return null; }
}

async function scheduleAlarmInSW(alarm: Alarm) {
  const sw = await getSwActive();
  sw?.postMessage({ type: "ALARM_SCHEDULE", alarm });
}

async function cancelAlarmInSW(alarmId: string) {
  const sw = await getSwActive();
  sw?.postMessage({ type: "ALARM_CANCEL", alarmId });
}

async function syncAllAlarmsToSW(alarms: Alarm[]) {
  const sw = await getSwActive();
  sw?.postMessage({ type: "ALARM_RESCHEDULE_ALL", alarms });
}

// ─── Stopwatch persistence ─────────────────────────────────────────────────────
const SW_KEY = "md_stopwatch_v1";
type SWSnap = { running: boolean; baseMs: number; wallStart: number; laps: number[] };

function readSwSnap(): SWSnap | null {
  try { return JSON.parse(localStorage.getItem(SW_KEY) ?? "null"); } catch { return null; }
}
function writeSwSnap(s: SWSnap) {
  try { localStorage.setItem(SW_KEY, JSON.stringify(s)); } catch {}
}
function clearSwSnap() {
  try { localStorage.removeItem(SW_KEY); } catch {}
}

// ─── Stopwatch ────────────────────────────────────────────────────────────────
function Stopwatch() {
  // Restore state from localStorage, accounting for time that passed while away
  const restored = (() => {
    const s = readSwSnap();
    if (!s) return { running: false, baseMs: 0, laps: [] as number[] };
    const baseMs = s.running ? s.baseMs + (Date.now() - s.wallStart) : s.baseMs;
    return { running: s.running, baseMs, laps: s.laps };
  })();

  const [running, setRunning] = useState(restored.running);
  const [elapsed, setElapsed] = useState(restored.baseMs);
  const [laps, setLaps] = useState<number[]>(restored.laps);

  const startRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const baseRef = useRef<number>(restored.baseMs);
  const wallStartRef = useRef<number>(Date.now());
  const lapsRef = useRef<number[]>(restored.laps);

  const tick = useCallback(() => {
    setElapsed(baseRef.current + (performance.now() - startRef.current));
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  // On mount: resume the animation loop if the stopwatch was running when we left
  useEffect(() => {
    if (restored.running) {
      startRef.current = performance.now();
      wallStartRef.current = Date.now();
      frameRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    startRef.current = performance.now();
    wallStartRef.current = Date.now();
    writeSwSnap({ running: true, baseMs: baseRef.current, wallStart: wallStartRef.current, laps: lapsRef.current });
    setRunning(true);
    frameRef.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    cancelAnimationFrame(frameRef.current);
    const newBase = baseRef.current + (performance.now() - startRef.current);
    baseRef.current = newBase;
    writeSwSnap({ running: false, baseMs: newBase, wallStart: 0, laps: lapsRef.current });
    setRunning(false);
    if (newBase >= MIN_STOPWATCH_XP_MS) {
      awardActivityXP("stopwatch_session");
    }
  };

  const reset = () => {
    cancelAnimationFrame(frameRef.current);
    baseRef.current = 0;
    lapsRef.current = [];
    setRunning(false); setElapsed(0); setLaps([]);
    clearSwSnap();
  };

  const lap = () => {
    const currentMs = baseRef.current + (performance.now() - startRef.current);
    setLaps(prev => {
      const next = [...prev, currentMs];
      lapsRef.current = next;
      writeSwSnap({ running: true, baseMs: baseRef.current, wallStart: wallStartRef.current, laps: next });
      return next;
    });
  };

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
          <div className="font-mono text-5xl font-bold tracking-tight tabular-nums">{formatMs(elapsed)}</div>
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
          {running && <Button size="lg" variant="outline" onClick={lap}><Flag size={16} className="mr-2" /> Lap</Button>}
          {!running && elapsed > 0 && <Button size="lg" variant="outline" onClick={reset}><RotateCcw size={16} className="mr-2" /> Reset</Button>}
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
type Alarm = {
  id: string;
  time: string;
  label: string;
  active: boolean;
  fired: boolean;
  ringtone: RingtoneId;
  customAudioName?: string;
};

const ALARM_KEY = "md_study_alarms_v2";

function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(ALARM_KEY);
    if (!raw) return [];
    const parsed: Alarm[] = JSON.parse(raw);
    return parsed.map(a => ({ ...a, fired: false, ringtone: a.ringtone ?? "beep" }));
  } catch { return []; }
}

function saveAlarms(alarms: Alarm[]) {
  try { localStorage.setItem(ALARM_KEY, JSON.stringify(alarms)); } catch {}
}

function AlarmClock_() {
  const [alarms, setAlarmsState] = useState<Alarm[]>(loadAlarms);
  const [newTime, setNewTime] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newRingtone, setNewRingtone] = useState<RingtoneId>("chime");
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomBlob, setNewCustomBlob] = useState<Blob | null>(null);
  const [notifGranted, setNotifGranted] = useState(() => {
    try { return typeof Notification !== "undefined" && Notification.permission === "granted"; } catch { return false; }
  });
  const [previewing, setPreviewing] = useState(false);
  const checkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const setAlarms = (updater: Alarm[] | ((prev: Alarm[]) => Alarm[])) => {
    setAlarmsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveAlarms(next);
      return next;
    });
  };

  // On mount: sync all alarms to SW so it can fire background notifications
  useEffect(() => {
    syncAllAlarmsToSW(loadAlarms());
  }, []);

  // SW message listener: ALARM_FIRED (fired in background) + ALARM_DISMISS (user tapped Dismiss)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      const { type, alarmId } = event.data ?? {};
      if (type === "ALARM_FIRED") {
        // Guard against double-fire (SW + in-app interval can both fire at the same moment)
        if (_firedIds.has(alarmId)) return;
        _firedIds.add(alarmId);
        const currentAlarms = loadAlarms();
        const target = currentAlarms.find(a => a.id === alarmId);
        if (target) {
          if (document.visibilityState === "visible") {
            playAlarmSound(target);
          }
          toast(`⏰ ${target.label || `Alarm at ${target.time}`}`, {
            duration: 60_000,
            action: { label: "Dismiss", onClick: () => stopCurrentAlarmAudio() },
          });
          awardActivityXP("alarm_used");
          setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, fired: true, active: false } : a));
        }
      }
      if (type === "ALARM_DISMISS") {
        stopCurrentAlarmAudio();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // In-app interval check: fires when the app is active (foreground)
  useEffect(() => {
    checkRef.current = setInterval(() => {
      const now = new Date();
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      // Use _firedIds to prevent double-fire even if React hasn't flushed the state update yet
      const toFire = loadAlarms().filter(
        a => a.active && !a.fired && a.time === hhmm && !_firedIds.has(a.id)
      );
      if (toFire.length === 0) return;
      // Mark fired immediately in the dedup set (synchronous, no React delay)
      toFire.forEach(a => _firedIds.add(a.id));
      for (const a of toFire) {
        playAlarmSound(a);
        showAlarmNotification("⏰ Alarm!", a.label || `Alarm set for ${a.time}`, a.id);
        toast(`⏰ ${a.label || `Alarm at ${a.time}`}`, {
          duration: 60_000,
          action: { label: "Dismiss", onClick: () => stopCurrentAlarmAudio() },
        });
        awardActivityXP("alarm_used");
      }
      setAlarms(prev => prev.map(a =>
        toFire.some(f => f.id === a.id) ? { ...a, fired: true, active: false } : a
      ));
    }, 1_000);
    return () => { if (checkRef.current) clearInterval(checkRef.current); };
  }, []);

  // Missed-alarm check: when the app regains focus after being backgrounded, fire any
  // alarms that fired while the SW was killed and the timer was throttled.
  useEffect(() => {
    const checkMissed = () => {
      if (document.visibilityState !== "visible") return;
      const now = new Date();
      const missed = loadAlarms().filter(a => {
        if (!a.active || _firedIds.has(a.id)) return false;
        const [h, m] = a.time.split(":").map(Number);
        const alarmMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0).getTime();
        const diffMs = now.getTime() - alarmMs;
        // Fire if alarm was set for within the last 5 minutes
        return diffMs >= 0 && diffMs < 5 * 60 * 1000;
      });
      if (missed.length === 0) return;
      missed.forEach(a => _firedIds.add(a.id));
      for (const a of missed) {
        playAlarmSound(a);
        toast(`⏰ ${a.label || `Alarm at ${a.time}`}`, {
          duration: 60_000,
          action: { label: "Dismiss", onClick: () => stopCurrentAlarmAudio() },
        });
        awardActivityXP("alarm_used");
      }
      setAlarms(prev => prev.map(a =>
        missed.some(m => m.id === a.id) ? { ...a, fired: true, active: false } : a
      ));
    };
    document.addEventListener("visibilitychange", checkMissed);
    // Also run immediately on mount in case the page load itself was triggered by tapping the alarm notification
    checkMissed();
    return () => document.removeEventListener("visibilitychange", checkMissed);
  }, []);

  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { toast.error("Audio file must be under 30 MB."); return; }
    setNewCustomBlob(file);
    setNewCustomName(file.name.replace(/\.[^.]+$/, ""));
    toast.success(`"${file.name.replace(/\.[^.]+$/, "")}" selected`);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const previewNew = () => {
    if (previewing) return;
    setPreviewing(true);
    if (newRingtone === "custom" && newCustomBlob) {
      const url = URL.createObjectURL(newCustomBlob);
      const audio = new Audio(url);
      audio.volume = 0.8;
      audio.play().catch(() => {});
      audio.onended = () => { URL.revokeObjectURL(url); setPreviewing(false); };
      setTimeout(() => { audio.pause(); URL.revokeObjectURL(url); setPreviewing(false); }, 8000);
    } else {
      previewTone(newRingtone);
      setTimeout(() => setPreviewing(false), 3000);
    }
  };

  const addAlarm = async () => {
    if (!newTime) { toast.error("Pick a time first."); return; }
    if (newRingtone === "custom" && !newCustomBlob) { toast.error("Please upload a custom audio file first."); return; }
    if (!notifGranted) {
      const ok = await requestNotificationPermission();
      setNotifGranted(ok);
      if (!ok) toast("Notifications blocked — alarm will still play in the app.", { icon: "ℹ️" });
    }
    const id = crypto.randomUUID();
    const alarm: Alarm = {
      id, time: newTime, label: newLabel.trim(), active: true, fired: false,
      ringtone: newRingtone,
      customAudioName: newRingtone === "custom" ? newCustomName : undefined,
    };
    if (newRingtone === "custom" && newCustomBlob) {
      await saveAudioBlob(id, newCustomBlob);
    }
    setAlarms(prev => [...prev, alarm]);
    scheduleAlarmInSW(alarm);
    setNewTime(""); setNewLabel(""); setNewCustomName(""); setNewCustomBlob(null);
    const tone = newRingtone === "custom" ? `🎶 ${newCustomName || "Custom song"}` : RINGTONES.find(r => r.id === newRingtone)?.label ?? newRingtone;
    toast.success(`Alarm set for ${newTime} · ${tone}`);
  };

  const toggle = (id: string) => {
    setAlarms(prev => {
      const next = prev.map(a => a.id === id ? { ...a, active: !a.active, fired: false } : a);
      const toggled = next.find(a => a.id === id);
      if (toggled) {
        if (toggled.active) scheduleAlarmInSW(toggled);
        else cancelAlarmInSW(id);
      }
      return next;
    });
  };

  const remove = async (id: string) => {
    stopCurrentAlarmAudio(); // stop music if this alarm was ringing
    cancelAlarmInSW(id);
    await deleteAudioBlob(id);
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const ringtoneLabel = (a: Alarm) => {
    if (a.ringtone === "custom") return `🎶 ${a.customAudioName || "Custom"}`;
    return RINGTONES.find(r => r.id === a.ringtone)?.label ?? a.ringtone;
  };

  return (
    <Card className="bg-card/40 border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlarmClock size={18} className="text-primary" /> Alarm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Time + Label row */}
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
        </div>

        {/* Ringtone picker */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Music size={13} /> <span>Ringtone</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {RINGTONES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setNewRingtone(r.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${newRingtone === r.id ? "bg-primary/20 border-primary/60 text-primary" : "bg-background/40 border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          {/* Custom audio upload */}
          {newRingtone === "custom" && (
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => audioInputRef.current?.click()}
              >
                <Upload size={13} /> {newCustomBlob ? "Change File" : "Upload Song"}
              </Button>
              {newCustomName && (
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">🎶 {newCustomName}</span>
              )}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioFile}
              />
            </div>
          )}

          {/* Preview + Set row */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={previewing || (newRingtone === "custom" && !newCustomBlob)}
              onClick={previewNew}
            >
              <Volume2 size={13} /> {previewing ? "Playing…" : "Preview"}
            </Button>
            <Button onClick={addAlarm} size="sm" className="gap-1.5">
              <Plus size={15} /> Set Alarm
            </Button>
          </div>
        </div>

        {/* Alarm list */}
        {alarms.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6 border border-dashed border-border/40 rounded-lg">
            No alarms set. Add one above!
          </div>
        ) : (
          <div className="space-y-2">
            {[...alarms].sort((a, b) => a.time.localeCompare(b.time)).map(alarm => (
              <div
                key={alarm.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${alarm.fired ? "border-border/20 opacity-50" : alarm.active ? "border-primary/30 bg-primary/5" : "border-border/30"}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-lg">{alarm.time}</span>
                    {alarm.fired && <Badge variant="outline" className="text-[10px] px-1.5 border-green-500/30 text-green-400">Fired</Badge>}
                    {alarm.active && !alarm.fired && <Badge variant="outline" className="text-[10px] px-1.5 border-primary/30 text-primary">Active</Badge>}
                    {!alarm.active && !alarm.fired && <Badge variant="outline" className="text-[10px] px-1.5">Off</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {alarm.label && <p className="text-xs text-muted-foreground truncate">{alarm.label}</p>}
                    <span className="text-[11px] text-muted-foreground/70">{ringtoneLabel(alarm)}</span>
                  </div>
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
          Alarms fire even when you switch apps. For best reliability, keep the app in Recent Apps (don't force-close it).
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
