import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus, ChevronLeft, Send, CheckCircle2, Bot, Sparkles, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

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

async function fetchDoubts(subject?: string): Promise<Doubt[]> {
  const url = subject && subject !== "All" ? `/api/doubts?subject=${subject}` : "/api/doubts";
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

async function fetchDoubt(id: number): Promise<DoubtDetail> {
  const res = await apiFetch(`/api/doubts/${id}`);
  if (!res.ok) throw new Error("Failed to load question");
  return res.json();
}

async function createDoubt(data: { subject: string; title: string; question: string }) {
  const res = await apiFetch("/api/doubts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to post question");
  return res.json();
}

async function postAnswer(doubtId: number, answer: string) {
  const res = await apiFetch(`/api/doubts/${doubtId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) throw new Error("Failed to post answer");
  return res.json();
}

async function acceptAnswer(doubtId: number, answerId: number) {
  const res = await apiFetch(`/api/doubts/${doubtId}/answers/${answerId}/accept`, {
    method: "PATCH",
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

function AiAnswerPanel({ doubtId, onClose }: { doubtId: number; onClose: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const ask = async () => {
    setText("");
    setDone(false);
    setError("");
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem("mission_token");
      const res = await fetch(`/api/doubts/${doubtId}/ai-answer`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setError("AI could not answer this question. Please try again.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) setText((t) => t + parsed.content);
            if (parsed.done) setDone(true);
            if (parsed.error) setError(parsed.error);
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    ask();
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot size={14} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-primary">AI Tutor</span>
          {loading && (
            <span className="flex items-center gap-1 text-xs text-primary/70">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </span>
              thinking…
            </span>
          )}
          {done && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-green-500/40 text-green-400">Done</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {!loading && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary/70 hover:text-primary" onClick={ask} title="Regenerate">
              <RotateCcw size={13} />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={onClose} title="Close">
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Answer body */}
      <div className="px-4 py-3 min-h-[60px] max-h-[420px] overflow-y-auto">
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : text ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{text}</div>
        ) : loading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        ) : null}
      </div>
      <p className="px-4 pb-2.5 text-[10px] text-muted-foreground/50">AI answers may contain errors. Always verify with your textbooks.</p>
    </div>
  );
}

export default function StudentDoubts() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [form, setForm] = useState({ subject: "Anatomy", title: "", question: "" });
  const [showAiPanel, setShowAiPanel] = useState(false);
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
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => { setSelectedId(null); setShowAiPanel(false); }}>
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
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Asked by <strong>{doubtDetail.authorName}</strong></p>
                  <Button
                    size="sm"
                    variant={showAiPanel ? "default" : "outline"}
                    className={`h-8 gap-1.5 text-xs ${showAiPanel ? "bg-primary" : "border-primary/40 text-primary hover:bg-primary/10"}`}
                    onClick={() => setShowAiPanel((v) => !v)}
                  >
                    <Sparkles size={13} />
                    {showAiPanel ? "Hide AI Answer" : "Ask AI"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Answer Panel */}
            {showAiPanel && (
              <AiAnswerPanel
                key={selectedId}
                doubtId={selectedId}
                onClose={() => setShowAiPanel(false)}
              />
            )}

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
          <p className="text-muted-foreground">Ask questions — get answers from AI or your peers.</p>
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
              onClick={() => { setSelectedId(doubt.id); setShowAiPanel(false); }}
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
