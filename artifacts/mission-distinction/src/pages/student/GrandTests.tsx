import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Trophy, AlarmClock, BookOpen, CheckCircle2, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle, Star, TrendingUp,
  Clock, CalendarDays, FileText, RotateCcw, Camera, X,
  ImageIcon, Upload, Medal, Crown,
} from "lucide-react";
import { toast } from "sonner";

type GrandTest = {
  id: number; title: string; subject: string; description: string | null;
  duration_minutes: number; available_from: string | null; available_until: string | null;
  is_published: boolean; question_count: number;
  my_submission_id: number | null; my_status: string | null;
};
type Question = { id: number; question_text: string; question_type: string; max_marks: number; order_index: number; };
type GrandTestDetail = GrandTest & { questions: Question[] };
type AnswerResult = {
  id: number; question_id: number; answer_text: string; answer_image_url: string | null;
  ai_marks: number | null; ai_feedback: string | null;
  ai_key_points_covered: string | null; ai_key_points_missed: string | null;
  status: string; question_text: string; max_marks: number; order_index: number; question_type: string;
};
type SubmissionResult = GrandTestDetail & {
  status: string; total_marks_obtained: number | null; total_marks_possible: number | null;
  ai_overall_feedback: string | null; submitted_at: string | null; answers: AnswerResult[];
};
type LeaderEntry = {
  rank: number; name: string; email: string;
  total_marks_obtained: number; total_marks_possible: number; percentage: number; submitted_at: string;
};
type GradingProgress = {
  type: string; questionIndex?: number; total?: number; message?: string;
  marks?: number; maxMarks?: number; submissionId?: number;
  totalObtained?: number; totalPossible?: number; percentage?: number; overallFeedback?: string;
};

function useTests() {
  return useQuery<GrandTest[]>({
    queryKey: ["student-grand-tests"],
    queryFn: async () => {
      const r = await apiFetch("/api/grand-tests");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function getTestStatus(t: GrandTest): "upcoming" | "active" | "ended" {
  const now = Date.now();
  if (t.available_from && new Date(t.available_from).getTime() > now) return "upcoming";
  if (t.available_until && new Date(t.available_until).getTime() < now) return "ended";
  return "active";
}

// ─── Timer ───────────────────────────────────────────────────────────────────
function ExamTimer({ endsAt, onExpire }: { endsAt: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  const fired = useRef(false);
  const total = useRef(endsAt - Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r <= 0 && !fired.current) { fired.current = true; clearInterval(t); onExpire(); }
    }, 500);
    return () => clearInterval(t);
  }, [endsAt, onExpire]);
  const isLow = remaining < 5 * 60_000;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold transition-colors ${isLow ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : "bg-muted/30 border-border/40 text-foreground"}`}>
      <Clock size={14} className={isLow ? "text-red-400" : "text-muted-foreground"} />
      {fmtCountdown(remaining)}
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────
function ImageUploader({ imageUrl, onUploaded, onRemove }: {
  imageUrl: string | null;
  onUploaded: (url: string) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/api/upload/quiz-answer", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onUploaded(url);
      toast.success("Answer sheet uploaded!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (imageUrl) {
    return (
      <div className="relative inline-block">
        <img src={imageUrl} alt="Uploaded answer sheet" className="max-h-48 rounded-lg border border-border/40 object-contain bg-black/20" />
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"
        >
          <X size={12} />
        </button>
        <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
          <CheckCircle2 size={11} /> Handwritten sheet uploaded — AI will read and grade it
        </p>
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-dashed border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-2"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
        {uploading ? "Uploading…" : "Upload handwritten answer sheet"}
      </Button>
      <p className="text-[10px] text-muted-foreground mt-1">JPG / PNG — AI reads your handwriting and grades it</p>
    </div>
  );
}

// ─── Exam view ────────────────────────────────────────────────────────────────
function ExamView({ test, submissionId, onDone }: { test: GrandTestDetail; submissionId: number; onDone: (id: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(test.questions.map(q => [q.id, ""]))
  );
  const [images, setImages] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [gradingProgress, setGradingProgress] = useState<GradingProgress[]>([]);
  const [gradingDone, setGradingDone] = useState(false);
  const startedAt = useRef(Date.now());
  const endsAt = startedAt.current + test.duration_minutes * 60_000;

  const handleExpire = useCallback(() => {
    if (!submitting && !gradingDone) {
      toast.warning("Time's up! Submitting automatically…");
      handleSubmit();
    }
  }, [submitting, gradingDone]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setGradingProgress([{ type: "status", message: "Submitting and starting AI grading…" }]);
    try {
      const r = await apiFetch(`/api/grand-tests/submissions/${submissionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: test.questions.map(q => ({
            questionId: q.id,
            answerText: answers[q.id] || "",
            imageUrl: images[q.id] || null,
          })),
        }),
      });
      if (!r.ok || !r.body) throw new Error("Failed to submit");
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          if (part.startsWith("data: ")) {
            try {
              const evt: GradingProgress = JSON.parse(part.slice(6));
              setGradingProgress(prev => [...prev, evt]);
              if (evt.type === "done") { setGradingDone(true); setTimeout(() => onDone(submissionId), 1400); }
            } catch { /* ignore malformed events */ }
          }
        }
      }
    } catch {
      toast.error("Submission failed. Please try again.");
      setSubmitting(false);
      setGradingProgress([]);
    }
  };

  const q = test.questions[currentQ];
  const answered = test.questions.filter(qn => answers[qn.id]?.trim() || images[qn.id]).length;

  if (submitting) {
    const done = gradingProgress.filter(e => e.type === "graded").length;
    const total = test.questions.length;
    const currentMsg = [...gradingProgress].reverse().find(e => e.message)?.message || "Processing…";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
          {gradingDone
            ? <CheckCircle2 size={36} className="text-green-400" />
            : <Loader2 size={36} className="animate-spin text-amber-400" />}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">{gradingDone ? "Grading complete!" : "AI is grading your test…"}</h2>
          <p className="text-sm text-muted-foreground">{currentMsg}</p>
          <p className="text-xs text-muted-foreground/60">Using GPT-4o vision for handwritten sheets</p>
        </div>
        {total > 0 && (
          <div className="w-full max-w-sm space-y-2">
            <Progress value={(done / total) * 100} className="h-2.5" />
            <p className="text-xs text-muted-foreground">{done}/{total} answers graded</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-lg truncate">{test.title}</h2>
          <p className="text-xs text-muted-foreground">{answered}/{test.questions.length} answered · {test.subject}</p>
        </div>
        <ExamTimer endsAt={endsAt} onExpire={handleExpire} />
      </div>

      <Progress value={(answered / Math.max(1, test.questions.length)) * 100} className="h-1.5" />

      {/* Navigator */}
      <div className="flex flex-wrap gap-1.5">
        {test.questions.map((qn, i) => {
          const hasAnswer = !!(answers[qn.id]?.trim() || images[qn.id]);
          return (
            <button
              key={qn.id}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors border ${i === currentQ ? "bg-amber-500 text-white border-amber-500" : hasAnswer ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50"}`}
            >
              {images[qn.id] ? <ImageIcon size={11} className="mx-auto" /> : i + 1}
            </button>
          );
        })}
      </div>

      {/* Current question */}
      <Card className="bg-muted/20 border-border/40">
        <div className="px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">Q{currentQ + 1} of {test.questions.length}</Badge>
            <Badge variant="outline" className={`text-xs ${q.question_type === "long" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
              {q.question_type === "long" ? "Long Answer (LAQ)" : "Short Answer (SAQ)"}
            </Badge>
            <span className="text-xs text-muted-foreground">{q.max_marks} marks</span>
          </div>
          <p className="text-base font-medium leading-relaxed">{q.question_text}</p>
        </div>
        <div className="px-5 pb-5 space-y-3">
          <Textarea
            className="bg-background/50 resize-none min-h-[180px] text-sm leading-relaxed"
            placeholder={q.question_type === "long"
              ? "Type your answer here (key points, mechanisms, clinical relevance)…"
              : "Type a concise answer…"}
            value={answers[q.id] || ""}
            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{(answers[q.id] || "").length} characters</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Or upload handwritten sheet below</span>
          </div>
          <ImageUploader
            imageUrl={images[q.id] || null}
            onUploaded={url => setImages(prev => ({ ...prev, [q.id]: url }))}
            onRemove={() => setImages(prev => { const n = { ...prev }; delete n[q.id]; return n; })}
          />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)}>
            <ChevronLeft size={14} className="mr-1" /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={currentQ === test.questions.length - 1} onClick={() => setCurrentQ(c => c + 1)}>
            Next <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSubmit}>
          <CheckCircle2 size={14} className="mr-2" /> Submit Test
        </Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">Typed answers + uploaded sheets are both graded by AI using GPT-4o vision.</p>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ testId, currentUserEmail }: { testId: number; currentUserEmail?: string }) {
  const { data, isLoading } = useQuery<LeaderEntry[]>({
    queryKey: ["grand-test-leaderboard", testId],
    queryFn: async () => {
      const r = await apiFetch(`/api/grand-tests/${testId}/leaderboard`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 2 * 60_000,
  });

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={14} className="text-amber-400" />;
    if (rank === 2) return <Medal size={14} className="text-slate-300" />;
    if (rank === 3) return <Medal size={14} className="text-amber-700" />;
    return <span className="text-xs text-muted-foreground w-[14px] text-center">{rank}</span>;
  };

  if (isLoading) return <div className="flex items-center gap-2 py-4"><Loader2 size={16} className="animate-spin" /><span className="text-sm text-muted-foreground">Loading leaderboard…</span></div>;
  if (!data || data.length === 0) return <div className="text-center py-8 text-sm text-muted-foreground opacity-60">No results yet — be the first to submit!</div>;

  return (
    <div className="space-y-1.5">
      {data.map(entry => {
        const isMe = entry.email === currentUserEmail;
        return (
          <div key={entry.rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${isMe ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/20 border-border/30"}`}>
            <div className="w-5 flex items-center justify-center shrink-0">{rankIcon(Number(entry.rank))}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isMe ? "text-amber-400" : "text-foreground"}`}>
                {entry.name} {isMe && <span className="text-xs opacity-70">(you)</span>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">{entry.total_marks_obtained}/{entry.total_marks_possible}</p>
              <p className="text-xs text-muted-foreground">{entry.percentage}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Result view ──────────────────────────────────────────────────────────────
function ResultView({ submissionId, currentUserEmail, onBack }: { submissionId: number; currentUserEmail?: string; onBack: () => void }) {
  const { data, isLoading } = useQuery<SubmissionResult>({
    queryKey: ["grand-test-result", submissionId],
    queryFn: async () => {
      const r = await apiFetch(`/api/grand-tests/submissions/${submissionId}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    retry: 3,
  });

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-400" /></div>;
  if (!data) return <div className="text-center py-10 text-muted-foreground">Could not load results.</div>;

  const pct = data.total_marks_possible ? Math.round(((data.total_marks_obtained || 0) / data.total_marks_possible) * 100) : 0;
  const grade = pct >= 75 ? { label: "Distinction", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" }
    : pct >= 60 ? { label: "First Class", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" }
    : pct >= 50 ? { label: "Pass", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" }
    : { label: "Needs Work", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft size={14} className="mr-1" /> Back</Button>
        <h2 className="font-bold text-lg truncate">Result — {data.title}</h2>
      </div>

      <Tabs defaultValue="result">
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="result" className="gap-1.5 text-xs sm:text-sm"><Trophy size={13} /> My Result</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm"><Crown size={13} /> Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="result" className="mt-4 space-y-4">
          {/* Score card */}
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                <Trophy size={36} className="text-amber-400" />
              </div>
              <div>
                <div className="text-4xl font-bold">{data.total_marks_obtained ?? 0}<span className="text-xl text-muted-foreground">/{data.total_marks_possible ?? 0}</span></div>
                <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full border text-sm font-semibold ${grade.bg} ${grade.color}`}>
                  <Star size={13} /> {pct}% · {grade.label}
                </div>
              </div>
              <Progress value={pct} className="h-3 max-w-xs mx-auto" />
              {data.ai_overall_feedback && (
                <div className="bg-muted/30 rounded-lg p-4 text-left max-w-xl mx-auto">
                  <p className="text-xs font-semibold text-amber-400 mb-1.5">AI Examiner's Overall Feedback</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.ai_overall_feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-question breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Question-wise Breakdown</h3>
            {data.answers.sort((a, b) => a.order_index - b.order_index).map((ans, i) => (
              <Card key={ans.id} className="bg-muted/20 border-border/40">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">Q{i + 1}</Badge>
                      <Badge variant="outline" className={`text-xs ${ans.question_type === "long" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                        {ans.question_type === "long" ? "LAQ" : "SAQ"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={13} className="text-amber-400" />
                      <span className="text-sm font-bold">{ans.ai_marks ?? "—"}/{ans.max_marks}</span>
                    </div>
                  </div>

                  <p className="text-sm font-medium">{ans.question_text}</p>

                  {/* Student's typed answer */}
                  {ans.answer_text && (
                    <div className="bg-background/50 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Your typed answer</p>
                      <p className="text-sm whitespace-pre-wrap">{ans.answer_text}</p>
                    </div>
                  )}

                  {/* Uploaded image */}
                  {ans.answer_image_url && (
                    <div className="bg-background/50 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1"><ImageIcon size={11} /> Uploaded handwritten sheet</p>
                      <img src={ans.answer_image_url} alt="Handwritten answer" className="max-h-64 rounded border border-border/40 object-contain" />
                    </div>
                  )}

                  {!ans.answer_text && !ans.answer_image_url && (
                    <p className="text-sm text-muted-foreground italic">No answer provided</p>
                  )}

                  {/* AI feedback */}
                  {ans.ai_feedback && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-400">AI Examiner Feedback</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ans.ai_feedback}</p>
                      {ans.ai_key_points_covered && ans.ai_key_points_covered !== "None" && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-green-400 font-semibold shrink-0 mt-0.5">✓ Covered:</span>
                          {ans.ai_key_points_covered.split(",").map((pt, j) => (
                            <span key={j} className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded">{pt.trim()}</span>
                          ))}
                        </div>
                      )}
                      {ans.ai_key_points_missed && ans.ai_key_points_missed !== "None" && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-red-400 font-semibold shrink-0 mt-0.5">✗ Missed:</span>
                          {ans.ai_key_points_missed.split(",").map((pt, j) => (
                            <span key={j} className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded">{pt.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card className="bg-muted/20 border-border/40">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={16} className="text-amber-400" />
                <h3 className="font-semibold">Top Scores</h3>
              </div>
              <Leaderboard testId={data.id} currentUserEmail={currentUserEmail} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Test card ────────────────────────────────────────────────────────────────
function TestCard({ t, onStart, onViewResult, currentUserEmail }: {
  t: GrandTest; onStart: (t: GrandTest) => void; onViewResult: (subId: number) => void; currentUserEmail?: string;
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const status = getTestStatus(t);
  const hasResult = t.my_status === "graded";
  const inProgress = t.my_status === "in_progress";

  return (
    <Card className="bg-muted/20 border-border/40 hover:border-amber-500/30 transition-colors">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <Trophy size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{t.title}</h3>
              <Badge variant="outline" className="text-[10px] mt-0.5 bg-amber-500/5 border-amber-500/20 text-amber-400">{t.subject}</Badge>
            </div>
          </div>
          <div className="shrink-0">
            {hasResult && <Badge className="bg-amber-500/20 text-amber-400 border-none text-[10px]">Graded</Badge>}
            {inProgress && <Badge className="bg-orange-500/20 text-orange-400 border-none text-[10px]">In Progress</Badge>}
            {!t.my_status && status === "active" && <Badge className="bg-green-500/20 text-green-400 border-none text-[10px]">Open</Badge>}
            {!t.my_status && status === "upcoming" && <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400 text-[10px]">Upcoming</Badge>}
            {!t.my_status && status === "ended" && <Badge variant="secondary" className="text-[10px]">Closed</Badge>}
          </div>
        </div>

        {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><AlarmClock size={11} />{t.duration_minutes} min</span>
          <span className="flex items-center gap-1"><FileText size={11} />{t.question_count} questions</span>
          {t.available_from && <span className="flex items-center gap-1"><CalendarDays size={11} />{new Date(t.available_from).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>}
          {t.available_until && <span className="flex items-center gap-1"><Clock size={11} />Until {new Date(t.available_until).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>}
        </div>

        <div className="flex gap-2 pt-1">
          {hasResult && t.my_submission_id ? (
            <Button size="sm" className="flex-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/20" onClick={() => onViewResult(t.my_submission_id!)}>
              <TrendingUp size={13} className="mr-1.5" /> View AI Report Card
            </Button>
          ) : inProgress ? (
            <Button size="sm" className="flex-1" onClick={() => onStart(t)}>
              <RotateCcw size={13} className="mr-1.5" /> Resume Test
            </Button>
          ) : status === "active" && !t.my_status ? (
            <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => onStart(t)}>
              <BookOpen size={13} className="mr-1.5" /> Start Test
            </Button>
          ) : status === "upcoming" ? (
            <Button size="sm" className="flex-1" variant="outline" disabled><Clock size={13} className="mr-1.5" /> Not Open Yet</Button>
          ) : (
            <Button size="sm" className="flex-1" variant="outline" disabled><AlertTriangle size={13} className="mr-1.5" /> Window Closed</Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setShowLeaderboard(v => !v)}>
            <Crown size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Leaderboard</span>
          </Button>
        </div>

        {showLeaderboard && (
          <div className="border-t border-border/30 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Crown size={13} className="text-amber-400" />
              <span className="text-xs font-semibold">Top Scores</span>
            </div>
            <Leaderboard testId={t.id} currentUserEmail={currentUserEmail} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type View = { mode: "list" } | { mode: "exam"; test: GrandTestDetail; submissionId: number } | { mode: "result"; submissionId: number };

export default function StudentGrandTests() {
  const { data: tests, isLoading, refetch } = useTests();
  const [view, setView] = useState<View>({ mode: "list" });
  const currentUserEmail = (window as any).__md_user?.email as string | undefined;

  const handleStart = async (t: GrandTest) => {
    try {
      const [detailR, startR] = await Promise.all([
        apiFetch(`/api/grand-tests/${t.id}`),
        apiFetch(`/api/grand-tests/${t.id}/start`, { method: "POST" }),
      ]);
      if (!detailR.ok) throw new Error("Failed to load test");
      const detail: GrandTestDetail = await detailR.json();
      const startData = await startR.json();
      if (!startR.ok) {
        if (startData.error === "already_submitted") { setView({ mode: "result", submissionId: startData.submissionId }); return; }
        throw new Error("Failed to start");
      }
      setView({ mode: "exam", test: detail, submissionId: startData.submissionId });
    } catch { toast.error("Could not start the test. Please try again."); }
  };

  if (view.mode === "exam") {
    return <ExamView test={view.test} submissionId={view.submissionId} onDone={id => { refetch(); setView({ mode: "result", submissionId: id }); }} />;
  }
  if (view.mode === "result") {
    return <ResultView submissionId={view.submissionId} currentUserEmail={currentUserEmail} onBack={() => { refetch(); setView({ mode: "list" }); }} />;
  }

  const list = tests || [];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Trophy size={22} className="text-amber-400" /> Grand Test Series
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full-length timed mock papers — type or upload handwritten answers, get AI-graded results instantly.
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-muted/20 border-border/40 animate-pulse"><CardContent className="pt-5 h-40" /></Card>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center opacity-60">
          <Trophy size={48} />
          <div>
            <p className="font-semibold text-lg">No tests scheduled yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your admin will publish Grand Tests here. Check back soon!</p>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map(t => (
            <TestCard key={t.id} t={t} onStart={handleStart} onViewResult={id => setView({ mode: "result", submissionId: id })} currentUserEmail={currentUserEmail} />
          ))}
        </div>
      )}
    </div>
  );
}
