import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Plus, ChevronLeft, CheckCircle2, Trash2, Users, X, Share2, ThumbsUp } from "lucide-react";

function shareDoubtToWhatsApp(title: string, subject: string) {
  const appUrl = window.location.origin;
  const text = `📚 *MBBS Doubt (${subject})*\n\n${title}\n\nCan anyone help? Discuss on Mission Distinction 🎓\n→ ${appUrl}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "General"];

// ─── Types ────────────────────────────────────────────────────────────────────

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
  helpfulCount: number;
  myVote: boolean;
  isAiGenerated: boolean;
  createdAt: string;
}

interface DoubtDetail extends Doubt {
  answers: DoubtAnswer[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Community Tab ────────────────────────────────────────────────────────────

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

function CommunityTab() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [newQ, setNewQ] = useState({ subject: "Anatomy", title: "" });
  const [answerText, setAnswerText] = useState("");
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
    refetchInterval: (query: any) => {
      // RQ v5: callback receives the Query object; data lives at query.state.data
      const d = query?.state?.data as DoubtDetail | undefined;
      if (!d || (d.answers && d.answers.length > 0)) return false;
      const ageMs = Date.now() - new Date(d.createdAt).getTime();
      return ageMs < 2 * 60 * 1000 ? 5000 : false;
    },
    refetchIntervalInBackground: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: { subject: string; title: string; question: string }) =>
      apiFetch("/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
      setShowCreate(false);
      setNewQ({ subject: "Anatomy", title: "" });
      toast.success("Question posted to community!");
    },
    onError: () => toast.error("Failed to post question"),
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      apiFetch(`/api/doubts/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: text }),
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubt", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
      setAnswerText("");
      toast.success("Answer posted!");
    },
    onError: () => toast.error("Failed to post answer"),
  });

  const acceptMutation = useMutation({
    mutationFn: ({ doubtId, answerId }: { doubtId: number; answerId: number }) =>
      apiFetch(`/api/doubts/${doubtId}/answers/${answerId}/accept`, { method: "PATCH" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubt", selectedId] });
      toast.success("Answer accepted!");
    },
    onError: () => toast.error("Failed to accept answer"),
  });

  const helpfulMutation = useMutation({
    mutationFn: ({ doubtId, answerId }: { doubtId: number; answerId: number }) =>
      apiFetch(`/api/doubts/${doubtId}/answers/${answerId}/helpful`, { method: "POST" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubt", selectedId] });
    },
    onError: () => toast.error("Failed to vote"),
  });

  // ── Detail view ──
  if (selectedId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => { setSelectedId(null); }}>
          <ChevronLeft size={16} /> Back
        </Button>

        {detailLoading || !doubtDetail ? (
          <div className="space-y-3">
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
                <h2 className="text-base font-bold mb-1">{doubtDetail.title}</h2>
                {doubtDetail.question && doubtDetail.question !== doubtDetail.title && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{doubtDetail.question}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Asked by <strong>{doubtDetail.authorName}</strong></p>
                  <button
                    onClick={() => shareDoubtToWhatsApp(doubtDetail.title, doubtDetail.subject)}
                    title="Share on WhatsApp"
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[#25D366]/35 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/10 transition-colors"
                  >
                    <Share2 size={12} /> Share
                  </button>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm font-semibold">
              {doubtDetail.answers.length} Answer{doubtDetail.answers.length !== 1 ? "s" : ""}
            </p>

            {doubtDetail.answers.length === 0 && (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                No answers yet — be the first to help!
              </div>
            )}

            {doubtDetail.answers.map((ans) => (
              <Card key={ans.id} className={`border ${
                ans.isAccepted
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-border/40 bg-card/30"
              }`}>
                <CardContent className="p-4">
                  {ans.isAccepted && (
                    <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold mb-2">
                      <CheckCircle2 size={14} /> Accepted Answer
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-line">{ans.answer}</div>
                  <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => helpfulMutation.mutate({ doubtId: doubtDetail.id, answerId: ans.id })}
                        disabled={helpfulMutation.isPending}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          ans.myVote
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                            : "border-border/50 text-muted-foreground hover:border-blue-500/30 hover:text-blue-400"
                        }`}
                      >
                        <ThumbsUp size={11} />
                        {(ans.helpfulCount ?? 0) > 0 ? ans.helpfulCount : "Helpful"}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        <strong>{ans.authorName}</strong> · {timeAgo(ans.createdAt)}
                      </p>
                    </div>
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
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Share your knowledge…"
                  rows={3}
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none mb-3"
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

  // ── List view ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
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
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Ask Peers
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : doubts.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No community questions yet.{filterSubject !== "All" ? " Try a different subject." : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {doubts.map((doubt) => (
            <Card
              key={doubt.id}
              className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors cursor-pointer"
              onClick={() => { setSelectedId(doubt.id); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {doubt.subject}
                      </Badge>
                      {doubt.resolved && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500 border-green-500/20">
                          ✓ Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{doubt.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{timeAgo(doubt.createdAt)}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground justify-end">
                      <MessageSquare size={11} /> {doubt.answerCount}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Asked by {doubt.authorName}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ask peers dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-card border border-border/60 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Ask the Community</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
                <Select value={newQ.subject} onValueChange={v => setNewQ(p => ({ ...p, subject: v }))}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Question</label>
                <Input
                  value={newQ.title}
                  onChange={e => setNewQ(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. What is the function of the SA node?"
                  className="bg-background/50 border-border/50"
                  onKeyDown={e => { if (e.key === "Enter" && newQ.title.trim()) createMutation.mutate({ subject: newQ.subject, title: newQ.title, question: newQ.title }); }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!newQ.title.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate({ subject: newQ.subject, title: newQ.title, question: newQ.title })}
              >
                {createMutation.isPending ? "Posting…" : "Post Question"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentDoubts() {
  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users size={20} className="text-primary" /> Doubt Board
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Ask questions and get answers from your batchmates</p>
      </div>

      <CommunityTab />
    </div>
  );
}
