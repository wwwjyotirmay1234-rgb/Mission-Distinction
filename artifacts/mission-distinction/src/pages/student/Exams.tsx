import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Trash2, Globe, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "General", "University"];

interface Exam {
  id: number; userId: number | null; title: string; subject: string;
  examDate: string; description?: string; isGlobal: boolean; createdAt: string;
}

function Countdown({ target }: { target: string }) {
  const [diff, setDiff] = useState(new Date(target).getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => setDiff(new Date(target).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (diff <= 0) return <span className="text-red-400 font-bold text-sm">Today / Past</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  if (days > 30) return <span className="text-2xl font-bold tabular-nums">{days} <span className="text-sm font-normal text-muted-foreground">days</span></span>;

  return (
    <div className="flex items-end gap-1.5 tabular-nums">
      {days > 0 && <><span className="text-2xl font-bold">{days}</span><span className="text-xs text-muted-foreground mb-1">d</span></>}
      <span className="text-2xl font-bold">{String(hours).padStart(2, "0")}</span><span className="text-xs text-muted-foreground mb-1">h</span>
      <span className="text-2xl font-bold">{String(mins).padStart(2, "0")}</span><span className="text-xs text-muted-foreground mb-1">m</span>
      {days === 0 && <><span className="text-2xl font-bold">{String(secs).padStart(2, "0")}</span><span className="text-xs text-muted-foreground mb-1">s</span></>}
    </div>
  );
}

export default function StudentExams() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "Anatomy", examDate: "", description: "" });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ["exams"],
    queryFn: () => apiFetch("/api/exams").then(r => r.json()),
    refetchInterval: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exams"] }); setShowCreate(false); setForm({ title: "", subject: "Anatomy", examDate: "", description: "" }); toast.success("Exam added!"); },
    onError: () => toast.error("Failed to add exam"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/exams/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exams"] }); toast.success("Removed"); },
  });

  const upcoming = exams.filter(e => new Date(e.examDate) >= new Date()).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  const next = upcoming[0];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays size={22} className="text-primary" /> Exam Countdown</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your upcoming exams and stay ahead.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0"><Plus size={16} /> Add Exam</Button>
      </div>

      {/* Big next-exam hero */}
      {next && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-primary/70 uppercase tracking-wider font-semibold mb-1">Next Exam</p>
                <h2 className="text-xl font-bold">{next.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{next.subject}</Badge>
                  {next.isGlobal && <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10"><Globe size={9} className="mr-1" />Official</Badge>}
                </div>
                {next.description && <p className="text-xs text-muted-foreground mt-2">{next.description}</p>}
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock size={11} />{new Date(next.examDate).toLocaleDateString("en-IN", { dateStyle: "full" })}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground mb-1">Time left</p>
                <Countdown target={next.examDate} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : exams.length === 0 ? (
        <div className="py-14 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
          <CalendarDays size={28} className="mx-auto mb-3 opacity-30" />
          No exams added yet. Add your upcoming exams to see the countdown!
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.slice(next ? 1 : 0).map(exam => (
            <Card key={exam.id} className="bg-card/30 border-border/40 group">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm">{exam.title}</p>
                    {exam.isGlobal && <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10"><Globe size={9} className="mr-1" />Official</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{exam.subject}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(exam.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <Countdown target={exam.examDate} />
                  </div>
                  {(exam.userId === user?.id || user?.role === "admin") && !exam.isGlobal && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => deleteMutation.mutate(exam.id)}><Trash2 size={13} /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {exams.filter(e => new Date(e.examDate) < new Date()).length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-2 font-semibold uppercase tracking-wider">Past</p>
              {exams.filter(e => new Date(e.examDate) < new Date()).map(exam => (
                <Card key={exam.id} className="bg-card/20 border-border/20 opacity-60 group">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{exam.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{exam.subject}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(exam.examDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                      </div>
                    </div>
                    {(exam.userId === user?.id || user?.role === "admin") && !exam.isGlobal && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => deleteMutation.mutate(exam.id)}><Trash2 size={13} /></Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader><DialogTitle>Add Exam</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Exam Name</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Anatomy Internal Assessment 1" className="bg-background/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date &amp; Time</label>
              <input type="datetime-local" value={form.examDate} onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))}
                className="w-full h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Chapters 1-5, Upper Limb" className="bg-background/50 border-border/50 min-h-[70px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={!form.title.trim() || !form.examDate || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Adding…" : "Add Exam"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
