import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, ChevronLeft, Play, Clock, BookOpen, LogOut, Video } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import VideoCall from "@/components/VideoCall";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "General", "NEET PG"];

interface Room {
  id: number; hostId: number; hostName: string; name: string; subject: string;
  timerMinutes: number; status: string; startedAt?: string; endsAt?: string;
  memberCount: number; createdAt: string;
}
interface Member { id: number; userId: number; userName: string; }

function formatMmSs(ms: number) {
  if (ms <= 0) return "00:00";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


function RoomView({ roomId, onBack }: { roomId: number; onBack: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const { data, isLoading } = useQuery<Room & { members: Member[] }>({
    queryKey: ["study-room", roomId],
    queryFn: () => apiFetch(`/api/study-rooms/${roomId}`).then(r => r.json()),
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: () => apiFetch(`/api/study-rooms/${roomId}/start`, { method: "PATCH" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["study-room", roomId] }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiFetch(`/api/study-rooms/${roomId}/leave`, { method: "POST" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["study-rooms"] }); onBack(); },
  });

  useEffect(() => {
    apiFetch(`/api/study-rooms/${roomId}/heartbeat`, { method: "POST" }).catch(() => {});
    heartbeatRef.current = setInterval(() => {
      apiFetch(`/api/study-rooms/${roomId}/heartbeat`, { method: "POST" }).catch(() => {});
    }, 20000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [roomId]);

  useEffect(() => {
    if (!data?.endsAt || data.status !== "active") return;
    const tick = setInterval(() => {
      const left = new Date(data.endsAt!).getTime() - Date.now();
      if (left <= 0) { setTimeLeft(0); setTimerDone(true); clearInterval(tick); } else { setTimeLeft(left); }
    }, 1000);
    setTimeLeft(new Date(data.endsAt).getTime() - Date.now());
    return () => clearInterval(tick);
  }, [data?.endsAt, data?.status]);

  if (isLoading || !data) return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>;

  const isHost = data.hostId === user?.id;
  const pct = data.endsAt && data.startedAt
    ? Math.max(0, Math.min(100, (timeLeft / (data.timerMinutes * 60000)) * 100))
    : 100;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={onBack}><ChevronLeft size={16} /> All Rooms</Button>
      </div>

      <Card className="border-primary/30 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{data.name}</h2>
                <Badge variant="outline" className={`text-xs ${data.status === "active" ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border/40 text-muted-foreground"}`}>
                  {data.status === "active" ? "● Active" : "Waiting"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{data.subject}</Badge>
                <span className="text-xs text-muted-foreground">Hosted by {data.hostName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={videoOpen ? "default" : "outline"}
                className={`gap-1.5 text-xs ${videoOpen ? "bg-primary text-primary-foreground" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                onClick={() => setVideoOpen(v => !v)}
              >
                <Video size={13} /> {videoOpen ? "End Call" : "Video Call"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => leaveMutation.mutate()}>
                <LogOut size={13} /> Leave
              </Button>
            </div>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {data.status === "active" ? (
                  <>
                    <span className="text-3xl font-bold tabular-nums font-mono">{formatMmSs(timeLeft)}</span>
                    {timerDone && <span className="text-xs text-green-400 font-semibold mt-1">Done!</span>}
                  </>
                ) : (
                  <>
                    <Clock size={24} className="text-primary mb-1" />
                    <span className="text-base font-bold">{data.timerMinutes}:00</span>
                  </>
                )}
              </div>
            </div>
            {isHost && data.status === "waiting" && (
              <Button className="gap-2" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                <Play size={16} /> Start Timer
              </Button>
            )}
            {!isHost && data.status === "waiting" && <p className="text-xs text-muted-foreground">Waiting for host to start the timer…</p>}
            {timerDone && <p className="text-sm text-green-400 font-semibold">🎉 Session complete! Great work everyone.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">{data.members?.length ?? 0} Active Members</h3>
        <div className="flex flex-wrap gap-2">
          {(data.members ?? []).map(m => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/50 border border-border/40">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {m.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium">{m.userName}</span>
              {m.userId === data.hostId && <span className="text-[10px] text-primary">host</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Video call hint when not open */}
      {!videoOpen && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setVideoOpen(true)}>
          <Video size={18} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">Start a Video Call</p>
            <p className="text-xs text-muted-foreground">Face-to-face study with your room members — works right inside the app</p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto shrink-0 border-primary/30 text-primary hover:bg-primary/10 text-xs gap-1">
            <Video size={12} /> Join
          </Button>
        </div>
      )}

      {videoOpen && (
        <VideoCall
          roomKey={`room-${roomId}`}
          title={data.name}
          onClose={() => setVideoOpen(false)}
        />
      )}
    </div>
  );
}

export default function StudentStudyRooms() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "Anatomy", timerMinutes: "25" });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["study-rooms"],
    queryFn: () => apiFetch("/api/study-rooms").then(r => r.json()),
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch("/api/study-rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: (room) => { queryClient.invalidateQueries({ queryKey: ["study-rooms"] }); setShowCreate(false); setForm({ name: "", subject: "Anatomy", timerMinutes: "25" }); setSelectedRoomId(room.id); toast.success("Room created!"); },
  });

  const joinMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/study-rooms/${id}/join`, { method: "POST" }).then(r => r.json()),
    onSuccess: (_, id) => { setSelectedRoomId(id); },
  });

  if (selectedRoomId) return <RoomView roomId={selectedRoomId} onBack={() => { setSelectedRoomId(null); queryClient.invalidateQueries({ queryKey: ["study-rooms"] }); }} />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users size={22} className="text-primary" /> Study Rooms</h1>
          <p className="text-muted-foreground text-sm mt-1">Study together in virtual rooms with a shared countdown timer.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0"><Plus size={16} /> Create Room</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : rooms.length === 0 ? (
        <div className="py-14 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
          <Users size={28} className="mx-auto mb-3 opacity-30" />
          No active study rooms. Create one and invite your batchmates!
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => (
            <Card key={room.id} className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors cursor-pointer" onClick={() => joinMutation.mutate(room.id)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold">{room.name}</p>
                      <Badge variant="outline" className={`text-[10px] ${room.status === "active" ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border/40 text-muted-foreground"}`}>
                        {room.status === "active" ? "● Live" : "Waiting"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{room.subject}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} /> {room.timerMinutes} min</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Users size={10} /> {room.memberCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Host: {room.hostName}</p>
                  </div>
                  <Button size="sm" className="shrink-0" onClick={e => { e.stopPropagation(); joinMutation.mutate(room.id); }} disabled={joinMutation.isPending}>
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader><DialogTitle>Create Study Room</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Room Name</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Anatomy Pre-Exam Grind" className="bg-background/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Timer Duration</label>
              <Select value={form.timerMinutes} onValueChange={v => setForm(p => ({ ...p, timerMinutes: v }))}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["15", "25", "30", "45", "60", "90", "120"].map(v => <SelectItem key={v} value={v}>{v} minutes</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={!form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Creating…" : "Create Room"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
