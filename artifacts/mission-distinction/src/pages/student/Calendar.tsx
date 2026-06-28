import React, { useState, useMemo } from "react";
import { useListCalendarEvents, getListCalendarEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, ChevronLeft, ChevronRight, X, BookOpen, GraduationCap,
  Bell, Target, Clock, Flame, CheckCircle2, CalendarDays, Trash2
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Subject colours ─────────────────────────────────────────────────
const SUBJECT_COLOR: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  Anatomy:      { dot: "#3b82f6", bg: "bg-blue-500/15",   text: "text-blue-600 dark:text-blue-300",   label: "Anatomy" },
  Physiology:   { dot: "#22c55e", bg: "bg-green-500/15",  text: "text-green-600 dark:text-green-300",  label: "Physiology" },
  Biochemistry: { dot: "#f97316", bg: "bg-orange-500/15", text: "text-orange-600 dark:text-orange-300",label: "Biochemistry" },
  Pathology:    { dot: "#14b8a6", bg: "bg-teal-500/15",   text: "text-teal-600 dark:text-teal-300",   label: "Pathology" },
  Pharmacology: { dot: "#a855f7", bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-300",label: "Pharmacology" },
  Microbiology: { dot: "#ec4899", bg: "bg-pink-500/15",   text: "text-pink-600 dark:text-pink-300",   label: "Microbiology" },
};
const OTHER_COLOR = { dot: "#ef4444", bg: "bg-red-500/15", text: "text-red-600 dark:text-red-300", label: "Other" };
function subjectColor(subject?: string | null) {
  return subject ? (SUBJECT_COLOR[subject] ?? OTHER_COLOR) : OTHER_COLOR;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SUBJECTS = ["Anatomy","Physiology","Biochemistry","Pathology","Pharmacology","Microbiology","General"];
type View = "month" | "week" | "day" | "agenda";

interface CalEvent {
  id: number;
  title: string;
  description?: string | null;
  subject?: string | null;
  startTime: string;
  endTime: string;
  color?: string | null;
}

// ── Calendar grid helpers ────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(d: Date) { return isSameDay(d, new Date()); }

// ── Add Event Modal ──────────────────────────────────────────────────
interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultDate?: string;
  defaultType?: string;
}
function AddEventModal({ open, onClose, onCreated, defaultDate, defaultType }: AddEventModalProps) {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultDateStr = defaultDate ?? `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [title, setTitle] = useState(defaultType ? `${defaultType} — ` : "");
  const [subject, setSubject] = useState("Anatomy");
  const [date, setDate] = useState(defaultDateStr);
  const [startH, setStartH] = useState("09");
  const [startM, setStartM] = useState("00");
  const [endH, setEndH] = useState("10");
  const [endM, setEndM] = useState("00");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle(defaultType ? `${defaultType} — ` : "");
      setDate(defaultDate ?? defaultDateStr);
    }
  }, [open, defaultType, defaultDate]);

  const save = async () => {
    if (!title.trim()) { toast.error("Add a title"); return; }
    setSaving(true);
    try {
      const sc = subjectColor(subject);
      const start = new Date(`${date}T${startH}:${startM}:00`).toISOString();
      const end   = new Date(`${date}T${endH}:${endM}:00`).toISOString();
      if (end <= start) { toast.error("End time must be after start"); setSaving(false); return; }
      const res = await apiFetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), subject, startTime: start, endTime: end, color: sc.dot }),
      });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed to save"); return; }
      toast.success("Event added!");
      onCreated();
      onClose();
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">Add Event</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Anatomy Study Session"
              className="w-full h-10 rounded-lg px-3 text-sm bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full h-10 rounded-lg px-3 text-sm bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full h-10 rounded-lg px-3 text-sm bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start time</label>
              <div className="flex gap-1">
                <select value={startH} onChange={e => setStartH(e.target.value)} className="flex-1 h-10 rounded-lg px-2 text-sm bg-muted/50 border border-border text-foreground focus:outline-none">
                  {Array.from({length:24},(_,i)=>String(i).padStart(2,"0")).map(h=><option key={h} value={h}>{h}</option>)}
                </select>
                <select value={startM} onChange={e => setStartM(e.target.value)} className="flex-1 h-10 rounded-lg px-2 text-sm bg-muted/50 border border-border text-foreground focus:outline-none">
                  {["00","15","30","45"].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">End time</label>
              <div className="flex gap-1">
                <select value={endH} onChange={e => setEndH(e.target.value)} className="flex-1 h-10 rounded-lg px-2 text-sm bg-muted/50 border border-border text-foreground focus:outline-none">
                  {Array.from({length:24},(_,i)=>String(i).padStart(2,"0")).map(h=><option key={h} value={h}>{h}</option>)}
                </select>
                <select value={endM} onChange={e => setEndM(e.target.value)} className="flex-1 h-10 rounded-lg px-2 text-sm bg-muted/50 border border-border text-foreground focus:outline-none">
                  {["00","15","30","45"].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={save} disabled={saving || !title.trim()}
            className="w-full h-10 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
            {saving ? "Saving…" : "Save Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Month Grid ───────────────────────────────────────────────────────
function MonthGrid({ year, month, events, onDayClick, selectedDay, onEventClick }:{
  year: number; month: number; events: CalEvent[];
  onDayClick: (d: Date) => void; selectedDay: Date | null;
  onEventClick: (e: CalEvent) => void;
}) {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrev = getDaysInMonth(year, month - 1);

  const cells: { date: Date; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), current: false });
  }

  const eventsMap = useMemo(() => {
    const m: Record<string, CalEvent[]> = {};
    events.forEach(ev => {
      const key = new Date(ev.startTime).toDateString();
      if (!m[key]) m[key] = [];
      m[key].push(ev);
    });
    return m;
  }, [events]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 border-l border-t border-border/40">
        {cells.map((cell, i) => {
          const key = cell.date.toDateString();
          const dayEvts = eventsMap[key] ?? [];
          const today = isToday(cell.date);
          const selected = selectedDay && isSameDay(cell.date, selectedDay);
          return (
            <div
              key={i}
              onClick={() => cell.current && onDayClick(cell.date)}
              className={cn(
                "border-r border-b border-border/40 min-h-[80px] p-1.5 transition-colors",
                cell.current ? "cursor-pointer hover:bg-muted/30" : "bg-muted/10",
                selected && cell.current && "bg-primary/5"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1",
                today ? "bg-primary text-white" : cell.current ? "text-foreground" : "text-muted-foreground/40"
              )}>
                {cell.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvts.slice(0, 2).map(ev => {
                  const sc = subjectColor(ev.subject);
                  return (
                    <div key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      className={cn("flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:opacity-80 transition-opacity", sc.bg)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.dot }} />
                      <span className={cn("text-[10px] font-medium truncate", sc.text)}>{ev.title}</span>
                    </div>
                  );
                })}
                {dayEvts.length > 2 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvts.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Agenda View ──────────────────────────────────────────────────────
function AgendaView({ events, onEventClick }: { events: CalEvent[]; onEventClick: (e: CalEvent) => void }) {
  const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const upcoming = sorted.filter(e => new Date(e.startTime) >= new Date(new Date().setHours(0,0,0,0)));
  if (upcoming.length === 0) return <div className="py-12 text-center text-muted-foreground text-sm">No upcoming events. Add one with the + button above.</div>;
  let lastDate = "";
  return (
    <div className="space-y-1">
      {upcoming.map(ev => {
        const d = new Date(ev.startTime);
        const dateStr = d.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });
        const showHeader = dateStr !== lastDate;
        lastDate = dateStr;
        const sc = subjectColor(ev.subject);
        return (
          <React.Fragment key={ev.id}>
            {showHeader && <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-3 pb-1 border-b border-border/30">{dateStr}</h4>}
            <div onClick={() => onEventClick(ev)} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-90 transition-opacity", sc.bg)}>
              <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: sc.dot }} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", sc.text)}>{ev.title}</p>
                {ev.subject && <p className="text-xs text-muted-foreground">{ev.subject}</p>}
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Event Detail / Delete modal ──────────────────────────────────────
function EventDetailModal({ event, onClose, onDeleted }: { event: CalEvent; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const sc = subjectColor(event.subject);
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const del = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/calendar/${event.id}`, { method: "DELETE" });
      toast.success("Event deleted");
      onDeleted();
      onClose();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", sc.text)}>{event.subject || "Other"}</span>
            <h3 className="text-base font-bold text-foreground mt-0.5">{event.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0"><X size={16} /></button>
        </div>
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays size={14} />
            <span>{start.toLocaleDateString("en-IN", { weekday: "short", month: "long", day: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        <button onClick={del} disabled={deleting}
          className="w-full h-9 rounded-xl text-sm font-semibold text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete Event"}
        </button>
      </div>
    </div>
  );
}

// ── Streak heat map (last 28 days) ───────────────────────────────────
function StudyStreak({ events }: { events: CalEvent[] }) {
  const days = 28;
  const today = new Date();
  const eventDates = new Set(events.map(e => new Date(e.startTime).toDateString()));

  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (eventDates.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  const grid: { date: Date; active: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    grid.push({ date: d, active: eventDates.has(d.toDateString()) });
  }

  const dayLabels = ["M","T","W","T","F","S","S"];

  return (
    <div className="bg-card/50 border border-border/40 rounded-2xl p-5">
      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={22} className="text-orange-500" />
            <span className="text-3xl font-black text-foreground">{streak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Day study streak</p>
          <p className="text-xs text-orange-500 font-semibold mt-0.5">
            {streak > 5 ? "🔥 Keep it up! You're on fire!" : streak > 0 ? "Keep going!" : "Start your streak today!"}
          </p>
        </div>
      </div>
      {/* Heatmap grid */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {dayLabels.map((l, i) => <div key={i} className="w-7 text-center text-[9px] text-muted-foreground font-semibold">{l}</div>)}
        </div>
        <div className="flex flex-wrap gap-1">
          {grid.map((cell, i) => (
            <div key={i} title={cell.date.toLocaleDateString()}
              className={cn("w-7 h-7 rounded-md transition-colors", cell.active ? "bg-primary/70" : "bg-muted/60")} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
export default function StudentCalendar() {
  const qc = useQueryClient();
  const today = new Date();
  const [view, setView] = useState<View>("month");
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>();
  const [addDefaultType, setAddDefaultType] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data: rawEvents = [] } = useListCalendarEvents(
    { query: { queryKey: getListCalendarEventsQueryKey() } }
  );
  const events = rawEvents as CalEvent[];

  const refresh = () => qc.invalidateQueries({ queryKey: getListCalendarEventsQueryKey() });

  const goBack = () => {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); }
    else setCurMonth(m => m - 1);
  };
  const goFwd = () => {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); }
    else setCurMonth(m => m + 1);
  };
  const goToday = () => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); };

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter(e => new Date(e.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [events]);

  const todayEvts = useMemo(() =>
    events
      .filter(e => isSameDay(new Date(e.startTime), today))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [events]
  );

  const openAddDay = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    setAddDefaultDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setAddDefaultType(undefined);
    setAddOpen(true);
  };

  const quickAdd = (type: string) => {
    setAddDefaultType(type);
    setAddDefaultDate(undefined);
    setAddOpen(true);
  };

  const legendItems = [
    ...Object.entries(SUBJECT_COLOR).filter(([k]) => ["Anatomy","Physiology","Biochemistry","Pathology"].includes(k)),
    ["Other", OTHER_COLOR] as const,
  ];

  return (
    <div className="space-y-5 -mx-2 sm:-mx-0">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Plan your study. Master every day.</p>
        </div>
        <button
          onClick={() => { setAddDefaultDate(undefined); setAddDefaultType(undefined); setAddOpen(true); }}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
        >
          <Plus size={15} /> Add Event
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        {/* ── Left: Calendar ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* View tabs + nav */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-0.5 p-1 bg-muted/40 border border-border/40 rounded-xl">
              {(["month","week","day","agenda"] as View[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                    view === v ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >{v}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={goToday} className="h-8 px-3 rounded-lg text-xs font-semibold border border-border/50 bg-card/40 hover:bg-muted/50 text-foreground transition-colors">Today</button>
              <button onClick={goBack} className="w-8 h-8 rounded-lg border border-border/50 bg-card/40 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft size={15} /></button>
              <button onClick={goFwd}  className="w-8 h-8 rounded-lg border border-border/50 bg-card/40 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><ChevronRight size={15} /></button>
            </div>
          </div>

          {/* Calendar panel */}
          <div className="bg-card/50 border border-border/40 rounded-2xl overflow-hidden">
            {view !== "agenda" && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                <CalendarDays size={16} className="text-primary" />
                <h2 className="text-base font-bold text-foreground">{MONTHS[curMonth]} {curYear}</h2>
              </div>
            )}
            <div className="p-3">
              {view === "month" && (
                <MonthGrid year={curYear} month={curMonth} events={events}
                  onDayClick={openAddDay} selectedDay={selectedDay}
                  onEventClick={setSelectedEvent} />
              )}
              {view === "agenda" && (
                <div className="px-1">
                  <h2 className="text-base font-bold text-foreground mb-3">Upcoming Events</h2>
                  <AgendaView events={events} onEventClick={setSelectedEvent} />
                </div>
              )}
              {(view === "week" || view === "day") && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
                  <p>{view === "week" ? "Week" : "Day"} view — switch to Month or Agenda to see your events</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider self-center">Legend</span>
            {legendItems.map(([key, val]) => {
              const c = val as typeof OTHER_COLOR;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: c.dot }} />
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                </div>
              );
            })}
          </div>

          {/* Study Streak */}
          <StudyStreak events={events} />

          {/* Study Progress */}
          <div className="bg-card/50 border border-border/40 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Study Progress</h3>
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <div className="flex items-center gap-6">
              {/* Circle */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#7c3aed" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - (todayEvts.length > 0 ? 0.68 : events.filter(e => isSameDay(new Date(e.startTime), today) || new Date(e.startTime) < today).length / Math.max(events.length, 1) || 0.42))}`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
                  {events.length > 0 ? Math.round(events.filter(e => new Date(e.startTime) < new Date()).length / Math.max(events.length,1) * 100) : 0}%
                </span>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 flex-1">
                {[
                  { label: "Sessions", val: events.filter(e => new Date(e.startTime) < new Date()).length },
                  { label: "Upcoming", val: upcoming.length },
                  { label: "This Month", val: events.filter(e => { const d = new Date(e.startTime); return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); }).length },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-black text-foreground">{s.val}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-full xl:w-72 shrink-0 space-y-4">
          {/* Upcoming Events */}
          <div className="bg-card/50 border border-border/40 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-bold text-foreground">Upcoming Events</h3>
              <button className="text-xs text-primary hover:underline">View all</button>
            </div>
            <div className="divide-y divide-border/30">
              {upcoming.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  <CalendarDays size={24} className="mx-auto mb-2 opacity-30" />
                  No upcoming events
                </div>
              ) : upcoming.map(ev => {
                const sc = subjectColor(ev.subject);
                const d = new Date(ev.startTime);
                const isEventToday = isSameDay(d, today);
                const isTom = isSameDay(d, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
                const dayLabel = isEventToday ? "Today" : isTom ? "Tomorrow" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                return (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", sc.bg)}>
                      <BookOpen size={16} style={{ color: sc.dot }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px] text-muted-foreground">{dayLabel} · {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                      {ev.subject && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                          <span className={cn("text-[11px]", sc.text)}>{ev.subject}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-card/50 border border-border/40 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-bold text-foreground">Today's Schedule</h3>
              <button className="text-xs text-primary hover:underline">View all</button>
            </div>
            <div className="px-4 py-3 space-y-3">
              {todayEvts.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  <CheckCircle2 size={20} className="mx-auto mb-1.5 opacity-30" />
                  Nothing scheduled for today
                </div>
              ) : todayEvts.map(ev => {
                const sc = subjectColor(ev.subject);
                const d = new Date(ev.startTime);
                const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                    className="flex items-start gap-3 cursor-pointer group">
                    <span className="text-[11px] text-muted-foreground w-16 shrink-0 pt-0.5 font-mono">{timeStr}</span>
                    <div className="flex-1 min-w-0">
                      <div className={cn("rounded-xl px-3 py-2 group-hover:opacity-90 transition-opacity", sc.bg)}>
                        <p className={cn("text-xs font-bold truncate", sc.text)}>{ev.title}</p>
                        {ev.subject && <p className="text-[10px] text-muted-foreground mt-0.5">{ev.subject}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Add */}
          <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Quick Add</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Study Session", icon: BookOpen, color: "text-primary bg-primary/10 hover:bg-primary/20" },
                { label: "Exam",          icon: GraduationCap, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" },
                { label: "Reminder",      icon: Bell, color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20" },
                { label: "Goal",          icon: Target, color: "text-green-600 dark:text-green-400 bg-green-500/10 hover:bg-green-500/20" },
              ].map(item => (
                <button key={item.label} onClick={() => quickAdd(item.label)}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border border-border/30 transition-colors", item.color)}>
                  <item.icon size={20} />
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEventModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={refresh}
        defaultDate={addDefaultDate} defaultType={addDefaultType} />
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onDeleted={refresh} />
      )}
    </div>
  );
}
