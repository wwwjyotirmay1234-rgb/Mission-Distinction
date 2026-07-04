import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Plus, Pencil, Trash2, GripVertical } from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"] as const;
type Subject = (typeof SUBJECTS)[number];

interface VivaQuestion {
  id: number;
  subject: Subject;
  questionText: string;
  topic: string | null;
  difficulty: string | null;
  orderIndex: number;
  createdAt: string;
}

export default function VivaQuestionBank() {
  const [activeSubject, setActiveSubject] = useState<Subject>("Anatomy");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<VivaQuestion | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [orderIndex, setOrderIndex] = useState("0");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery<VivaQuestion[]>({
    queryKey: ["viva-questions"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/viva-questions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const subjectQuestions = (questions ?? []).filter((q) => q.subject === activeSubject);

  function openCreate() {
    setEditing(null);
    setQuestionText("");
    setTopic("");
    setDifficulty("");
    setOrderIndex(String((subjectQuestions.length ?? 0)));
    setShowDialog(true);
  }

  function openEdit(q: VivaQuestion) {
    setEditing(q);
    setQuestionText(q.questionText);
    setTopic(q.topic ?? "");
    setDifficulty(q.difficulty ?? "");
    setOrderIndex(String(q.orderIndex));
    setShowDialog(true);
  }

  async function handleSave() {
    if (!questionText.trim()) { toast.error("Question text is required"); return; }
    setSaving(true);
    try {
      const payload = {
        subject: activeSubject,
        questionText: questionText.trim(),
        topic: topic.trim() || null,
        difficulty: difficulty.trim() || null,
        orderIndex: Number(orderIndex) || 0,
      };
      const res = editing
        ? await apiFetch(`/api/admin/viva-questions/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/admin/viva-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        toast.success(editing ? "Question updated" : "Question added");
        queryClient.invalidateQueries({ queryKey: ["viva-questions"] });
        setShowDialog(false);
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Failed to save question");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await apiFetch(`/api/admin/viva-questions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Question deleted");
      queryClient.invalidateQueries({ queryKey: ["viva-questions"] });
    } else {
      toast.error("Failed to delete question");
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mic className="w-6 h-6 text-primary" /> Practical Hub Question Bank
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add the exact viva questions you want Dr. Rao to ask per subject. When a subject has bank questions, the examiner asks these first before falling back to AI-generated questions.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Question
        </Button>
      </div>

      <Tabs value={activeSubject} onValueChange={(v) => setActiveSubject(v as Subject)}>
        <TabsList>
          {SUBJECTS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s} {questions ? `(${questions.filter((q) => q.subject === s).length})` : ""}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : !subjectQuestions.length ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Mic className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No custom questions for {activeSubject} yet — the examiner will generate questions with AI.</p>
            </CardContent>
          </Card>
        ) : (
          subjectQuestions
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((q) => (
              <Card key={q.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {q.topic && <Badge variant="outline" className="text-xs">{q.topic}</Badge>}
                      {q.difficulty && <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>}
                      <span className="text-xs text-muted-foreground">Order: {q.orderIndex}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(q)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> {editing ? "Edit" : "Add"} {activeSubject} Question
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Question</label>
              <Textarea
                placeholder="e.g. Describe the boundaries and contents of the femoral triangle."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="bg-muted/30 resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Topic (optional)</label>
                <Input placeholder="e.g. Lower limb" value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Difficulty (optional)</label>
                <Select value={difficulty || "unset"} onValueChange={(v) => setDifficulty(v === "unset" ? "" : v)}>
                  <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Any</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Order</label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} className="bg-muted/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
