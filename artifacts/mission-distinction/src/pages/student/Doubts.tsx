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
import { MessageSquare, Plus, ChevronLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "NEET PG", "General"];

interface Doubt {
  id: number;
  userId: number;
  authorName: string;
  subject: string;
  title: string;
  question: string;
  answerCount: number;
  resolved: boolean;
  createdAt: string;
}

interface DoubtAnswer {
  id: number;
  doubtId: number;
  userId: number;
  authorName: string;
  answer: string;
  isAccepted: boolean;
  createdAt: string;
}

interface DoubtDetail extends Doubt {
  answers: DoubtAnswer[];
}

const token = () => localStorage.getItem("token") ?? "";

async function fetchDoubts(subject?: string): Promise<Doubt[]> {
  const url = subject && subject !== "All" ? `/api/doubts?subject=${subject}` : "/api/doubts";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

async function fetchDoubt(id: number): Promise<DoubtDetail> {
  const res = await fetch(`/api/doubts/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!res.ok) throw new Error("Failed to load question");
  return res.json();
}

async function createDoubt(data: { subject: string; title: string; question: string }) {
  const res = await fetch("/api/doubts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to post question");
  return res.json();
}

async function postAnswer(doubtId: number, answer: string) {
  const res = await fetch(`/api/doubts/${doubtId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) throw new Error("Failed to post answer");
  return res.json();
}

async function acceptAnswer(doubtId: number, answerId: number) {
  const res = await fetch(`/api/doubts/${doubtId}/answers/${answerId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error("Failed to accept answer");
  return res.json();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StudentDoubts() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [form, setForm] = useState({ subject: "Anatomy", title: "", question: "" });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: doubts = [], isLoading } = useQuery({
    queryKey: ["doubts", filterSubject],
    queryFn: () => fetchDoubts(filterSubject),
  });

  const { data: doubtDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["doubt", selectedId],
    queryFn: () => fetchDoubt(selectedId!),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: createDoubt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
      setShowCreate(false);
      setForm({ subject: "Anatomy", title: "", question: "" });
      toast.success("Question posted!");
    },
    onError: () => toast.error("Failed to post question"),
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => postAnswer(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubt", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
      setAnswerText("");
      toast.success("Answer posted!");
    },
    onError: () => toast.error("Failed to post answer"),
  });

  const acceptMutation = useMutation({
    mutationFn: ({ doubtId, answerId }: { doubtId: number; answerId: number }) => acceptAnswer(doubtId, answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubt", selectedId] });
      toast.success("Answer marked as accepted!");
    },
    onError: () => toast.error("Failed to accept answer"),
  });

  // ─── Detail view ──────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setSelectedId(null)}>
          <ChevronLeft size={16} /> Back to Doubts
        </Button>

        {detailLoading || !doubtDetail ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {doubtDetail.subject}
                    </Badge>
                    {doubtDetail.resolved && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                        ✓ Resolved
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(doubtDetail.createdAt)}</span>
                </div>
                <h2 className="text-lg font-bold mb-2">{doubtDetail.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{doubtDetail.question}</p>
                <p className="text-xs text-muted-foreground mt-3">Asked by <strong>{doubtDetail.authorName}</strong></p>
              </CardContent>
            </Card>

            <h3 className="text-base font-semibold">
              {doubtDetail.answers.length} Answer{doubtDetail.answers.length !== 1 ? "s" : ""}
            </h3>

            {doubtDetail.answers.length === 0 && (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                No answers yet. Be the first to help!
              </div>
            )}

            {doubtDetail.answers.map((ans) => (
              <Card key={ans.id} className={`border ${ans.isAccepted ? "border-green-500/40 bg-green-500/5" : "border-border/40 bg-card/30"}`}>
                <CardContent className="p-4">
                  {ans.isAccepted && (
                    <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold mb-2">
                      <CheckCircle2 size={14} /> Accepted Answer
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{ans.answer}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>{ans.authorName}</strong> · {timeAgo(ans.createdAt)}
                    </p>
                    {!ans.isAccepted && doubtDetail.userId === user?.id && !doubtDetail.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => acceptMutation.mutate({ doubtId: doubtDetail.id, answerId: ans.id })}
                      >
                        <CheckCircle2 size={12} /> Accept
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">Your Answer</p>
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Share your knowledge…"
                  className="min-h-[100px] bg-background/50 border-border/50 mb-3 text-sm"
                />
                <Button
                  className="gap-2"
                  disabled={!answerText.trim() || answerMutation.isPending}
                  onClick={() => answerMutation.mutate({ id: selectedId, text: answerText })}
                >
                  <Send size={14} /> {answerMutation.isPending ? "Posting…" : "Post Answer"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <MessageSquare size={22} className="text-primary" /> Doubt Board
          </h1>
          <p className="text-muted-foreground">Ask questions and help your peers.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus size={16} /> Ask Question
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", ...SUBJECTS].map((s) => (
          <button
            key={s}
            onClick={() => setFilterSubject(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterSubject === s
                ? "bg-primary text-white border-primary"
                : "bg-card/40 border-border/50 text-muted-foreground hover:border-border"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : doubts.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No questions yet.{filterSubject !== "All" ? " Try a different subject." : " Be the first to ask!"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map((doubt) => (
            <Card
              key={doubt.id}
              className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors cursor-pointer"
              onClick={() => setSelectedId(doubt.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {doubt.subject}
                      </Badge>
                      {doubt.resolved && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500 border-green-500/20">
                          ✓ Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate">{doubt.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doubt.question}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{timeAgo(doubt.createdAt)}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground justify-end">
                      <MessageSquare size={12} /> {doubt.answerCount}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Asked by {doubt.authorName}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={form.subject} onValueChange={(v) => setForm((p) => ({ ...p, subject: v }))}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Question Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. What is the function of the SA node?"
                className="bg-background/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Details</label>
              <Textarea
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                placeholder="Add more context to your question…"
                className="min-h-[100px] bg-background/50 border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              disabled={!form.title.trim() || !form.question.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? "Posting…" : "Post Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
