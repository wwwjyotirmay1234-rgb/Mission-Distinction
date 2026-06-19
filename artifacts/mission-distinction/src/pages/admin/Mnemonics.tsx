import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Plus, Trash2, Sparkles, Shield } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "NEET PG", "General"];

interface Mnemonic {
  id: number; subject: string; topic: string; mnemonic: string; description?: string; createdAt: string;
}

export default function AdminMnemonics() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "Anatomy", topic: "", mnemonic: "", description: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: mnemonics = [], isLoading } = useQuery<Mnemonic[]>({
    queryKey: ["admin-mnemonics"],
    queryFn: () => apiFetch("/api/admin/content/mnemonics").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch("/api/admin/content/mnemonics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-mnemonics"] }); setShowCreate(false); setForm({ subject: "Anatomy", topic: "", mnemonic: "", description: "" }); toast.success("Mnemonic published to all students!"); },
    onError: () => toast.error("Failed to create mnemonic"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/content/mnemonics/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-mnemonics"] }); toast.success("Mnemonic removed"); },
  });

  async function generateWithAI() {
    if (!form.topic.trim()) { toast.error("Enter a topic first"); return; }
    setAiLoading(true);
    try {
      const res = await apiFetch("/api/ai/mnemonic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: form.subject, topic: form.topic }),
      });
      if (!res.ok) { toast.error("AI generation failed"); return; }
      const data = await res.json();
      setForm(p => ({ ...p, mnemonic: data.mnemonic ?? "", description: data.description ?? "" }));
      toast.success("AI mnemonic generated!");
    } catch { toast.error("AI generation failed"); }
    finally { setAiLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Lightbulb size={22} className="text-primary" /> Official Mnemonics</h1>
          <p className="text-muted-foreground text-sm mt-1">Publish mnemonics from Mission Distinction — visible to all students with an Official badge.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0"><Plus size={16} /> Add Mnemonic</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : mnemonics.length === 0 ? (
        <div className="py-14 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
          <Shield size={28} className="mx-auto mb-3 opacity-30" />
          No official mnemonics yet. Add one to share with all students.
        </div>
      ) : (
        <div className="space-y-3">
          {mnemonics.map(m => (
            <Card key={m.id} className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 gap-1"><Shield size={9} /> Official</Badge>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{m.subject}</Badge>
                      <span className="text-xs font-semibold text-muted-foreground">{m.topic}</span>
                    </div>
                    <p className="text-base font-bold text-primary/90 mb-1">"{m.mnemonic}"</p>
                    {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteMutation.mutate(m.id)}><Trash2 size={13} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60 sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield size={16} className="text-primary" /> Add Official Mnemonic</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
              <div className="flex gap-2">
                <Input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. Cranial Nerves in order" className="bg-background/50 border-border/50" />
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={generateWithAI} disabled={aiLoading || !form.topic.trim()}>
                  <Sparkles size={13} /> {aiLoading ? "…" : "AI"}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mnemonic</label>
              <Input value={form.mnemonic} onChange={e => setForm(p => ({ ...p, mnemonic: e.target.value }))} placeholder='e.g. "PASS THE DAMN EXAM"' className="bg-background/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Explanation</label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What each letter/word stands for" className="bg-background/50 border-border/50 min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={!form.topic.trim() || !form.mnemonic.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? "Publishing…" : "Publish to All Students"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
