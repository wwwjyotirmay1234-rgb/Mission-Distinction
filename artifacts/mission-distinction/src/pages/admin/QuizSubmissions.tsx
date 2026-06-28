import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Brain, CheckCircle, Clock, Eye, FileText, RefreshCw,
  User, BookOpen, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon,
  ShieldAlert, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

type Submission = {
  id: number;
  user_id: number;
  quiz_id: number;
  attempt_id: number;
  question_id: number;
  answer_text: string | null;
  answer_image_url: string | null;
  max_marks: number;
  ai_marks: number | null;
  ai_feedback: string | null;
  admin_marks: number | null;
  admin_feedback: string | null;
  status: "pending" | "ai_graded" | "graded";
  created_at: string;
  graded_at: string | null;
  question_text: string;
  question_max_marks: number;
  model_answer: string | null;
  quiz_title: string;
  quiz_subject: string;
  student_name: string;
  student_email: string;
};

function statusBadge(status: string) {
  if (status === "graded") return <Badge className="bg-green-500/15 text-green-400 border-green-500/30">Graded</Badge>;
  if (status === "ai_graded") return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">AI Graded</Badge>;
  return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Pending</Badge>;
}

function SubmissionCard({ sub, onGraded }: { sub: Submission; onGraded: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [marks, setMarks] = useState(String(sub.admin_marks ?? sub.ai_marks ?? ""));
  const [feedback, setFeedback] = useState(sub.admin_feedback ?? sub.ai_feedback ?? "");
  const [saving, setSaving] = useState(false);

  const handleAiGrade = async () => {
    setAiGrading(true);
    try {
      const result = await customFetch<Submission>(`/api/quiz-submissions/${sub.id}/ai-grade`, { method: "POST" });
      toast.success(`AI graded: ${result.ai_marks}/${sub.max_marks} marks`);
      setMarks(String(result.ai_marks ?? ""));
      setFeedback(result.ai_feedback ?? "");
      onGraded();
    } catch {
      toast.error("AI grading failed. Please try again.");
    } finally {
      setAiGrading(false);
    }
  };

  const handleSaveGrade = async () => {
    const m = parseInt(marks);
    if (isNaN(m) || m < 0 || m > sub.max_marks) {
      toast.error(`Marks must be between 0 and ${sub.max_marks}`);
      return;
    }
    setSaving(true);
    try {
      await customFetch(`/api/quiz-submissions/${sub.id}/grade`, {
        method: "PATCH",
        body: JSON.stringify({ adminMarks: m, adminFeedback: feedback.trim() || null }),
      });
      toast.success("Grade saved successfully!");
      setGradeOpen(false);
      onGraded();
    } catch {
      toast.error("Failed to save grade.");
    } finally {
      setSaving(false);
    }
  };

  const questionType = sub.question_text ? "Question" : "Unknown";
  const shortAnswer = sub.answer_text ? sub.answer_text.slice(0, 120) + (sub.answer_text.length > 120 ? "…" : "") : null;

  return (
    <Card className="bg-card/40 border-border/40 hover:border-border/60 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {statusBadge(sub.status)}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User size={11} /> {sub.student_name || sub.student_email}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen size={11} /> {sub.quiz_title}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(sub.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>

            <p className="text-sm font-medium mb-1 line-clamp-2">{sub.question_text}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Max: <strong className="text-foreground">{sub.max_marks} marks</strong></span>
              {sub.status !== "pending" && (
                <span>
                  {sub.admin_marks !== null
                    ? <span className="text-green-400 font-semibold">Admin: {sub.admin_marks}/{sub.max_marks}</span>
                    : sub.ai_marks !== null
                    ? <span className="text-blue-400 font-semibold">AI: {sub.ai_marks}/{sub.max_marks}</span>
                    : null}
                </span>
              )}
              {sub.answer_image_url && (
                <span className="flex items-center gap-1 text-purple-400">
                  <ImageIcon size={11} /> Image answer
                </span>
              )}
            </div>

            {shortAnswer && (
              <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">"{shortAnswer}"</p>
            )}
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap">
            {sub.status !== "graded" && (
              <Button variant="outline" size="sm" onClick={handleAiGrade} disabled={aiGrading} className="gap-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10">
                {aiGrading ? <RefreshCw size={13} className="animate-spin" /> : <Brain size={13} />}
                {aiGrading ? "Grading…" : "AI Grade"}
              </Button>
            )}
            <Button size="sm" onClick={() => setGradeOpen(true)} className="gap-1.5">
              <CheckCircle size={13} /> {sub.status === "graded" ? "Edit Grade" : "Grade"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(e => !e)} className="gap-1">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "Collapse" : "View"}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-border/30 pt-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Student's Answer</p>
              {sub.answer_text ? (
                <div className="bg-background/40 border border-border/30 rounded-xl p-3 text-sm whitespace-pre-wrap leading-relaxed">
                  {sub.answer_text}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No typed answer.</p>
              )}
              {sub.answer_image_url && (
                <div className="mt-2">
                  <a href={sub.answer_image_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={sub.answer_image_url}
                      alt="Handwritten answer"
                      className="max-h-64 rounded-xl border border-border/40 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">Click image to open full size</p>
                </div>
              )}
            </div>

            {sub.model_answer && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Model Answer</p>
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-sm whitespace-pre-wrap leading-relaxed text-green-300">
                  {sub.model_answer}
                </div>
              </div>
            )}

            {(sub.ai_feedback || sub.admin_feedback) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {sub.admin_feedback ? "Admin Feedback" : "AI Feedback"}
                </p>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-sm">
                  {sub.admin_feedback || sub.ai_feedback}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" /> Grade Answer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded-xl p-3 text-sm">
              <p className="font-medium mb-1">{sub.question_text}</p>
              <p className="text-muted-foreground text-xs">Student: {sub.student_name || sub.student_email}</p>
            </div>

            {sub.ai_marks !== null && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-sm">
                <Brain size={14} className="text-blue-400 shrink-0" />
                <div>
                  <span className="font-medium text-blue-400">AI Suggestion: {sub.ai_marks}/{sub.max_marks} marks</span>
                  {sub.ai_feedback && <p className="text-xs text-muted-foreground mt-0.5">{sub.ai_feedback}</p>}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Marks <span className="text-muted-foreground text-xs">(0 – {sub.max_marks})</span></Label>
              <Input
                type="number"
                min={0}
                max={sub.max_marks}
                value={marks}
                onChange={e => setMarks(e.target.value)}
                className="bg-background/50 w-28"
                placeholder={`0–${sub.max_marks}`}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Feedback <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Add constructive feedback for the student…"
                className="bg-background/50 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGrade} disabled={saving}>
              {saving ? "Saving…" : "Save Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

type ProctoredAttempt = {
  attempt_id: number;
  quiz_title: string;
  subject: string;
  score: number;
  total: number;
  percentage: number;
  violation_count: number;
  is_flagged: boolean;
  proctoring_flagged_at: string | null;
  created_at: string;
  user_id: number;
  student_name: string;
  student_email: string;
};

function ProctoredAttemptsList() {
  const [, navigate] = useLocation();

  const { data, isLoading, refetch } = useQuery<ProctoredAttempt[]>({
    queryKey: ["admin-proctored-attempts"],
    queryFn: async () => {
      const res = await apiFetch("/api/proctoring/all-attempts");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const attempts = data ?? [];
  const flaggedCount = attempts.filter(a => a.is_flagged).length;

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {flaggedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm">
          <ShieldAlert size={14} className="text-red-400 shrink-0" />
          <span className="text-red-300">
            <strong>{flaggedCount}</strong> flagged attempt{flaggedCount !== 1 ? "s" : ""} detected — review immediately.
          </span>
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <ShieldCheck className="w-10 h-10 opacity-20" />
          <div className="text-center">
            <p className="font-medium">No proctored attempts yet</p>
            <p className="text-sm mt-1">Attempts from proctored quizzes will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {attempts.map(a => (
            <Card
              key={a.attempt_id}
              className={`border-border/40 cursor-pointer hover:border-primary/40 transition-colors ${a.is_flagged ? "border-red-500/30 bg-red-500/5" : "bg-card/30"}`}
              onClick={() => navigate(`/admin/proctoring/${a.attempt_id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {a.is_flagged
                    ? <ShieldAlert size={18} className="text-red-400 shrink-0" />
                    : <ShieldCheck size={18} className="text-green-400 shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{a.quiz_title}</p>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">{a.subject}</Badge>
                      {a.is_flagged && <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10 shrink-0">FLAGGED</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.student_name} · {a.student_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-sm font-semibold">{a.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Violations</p>
                    <p className={`text-sm font-semibold ${a.violation_count === 0 ? "text-green-400" : a.violation_count < 3 ? "text-amber-400" : "text-red-400"}`}>
                      {a.violation_count}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                    <Eye size={12} /> Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2 text-muted-foreground">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>
    </div>
  );
}

export default function QuizSubmissions() {
  const [tab, setTab] = useState("scripts");
  const [status, setStatus] = useState("pending");
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<Submission[]>({
    queryKey: ["admin-quiz-submissions", status],
    queryFn: () => customFetch(`/api/quiz-submissions/admin/all${status !== "all" ? `?status=${status}` : ""}`),
    enabled: tab === "scripts",
  });

  const submissions = data ?? [];
  const pendingCount = submissions.filter(s => s.status === "pending").length;
  const aiGradedCount = submissions.filter(s => s.status === "ai_graded").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary" /> Submissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review answer scripts and proctored exam reports
          </p>
        </div>
        {tab === "scripts" && (
          <Button variant="outline" onClick={() => refetch()} size="sm" className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card/50">
          <TabsTrigger value="scripts" className="gap-1.5"><FileText size={13} />Answer Scripts</TabsTrigger>
          <TabsTrigger value="proctored" className="gap-1.5"><ShieldCheck size={13} />Proctored Exams</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "proctored" ? (
        <ProctoredAttemptsList />
      ) : (
        <>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm">
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <span className="text-amber-300">
                <strong>{pendingCount}</strong> answer{pendingCount !== 1 ? "s" : ""} awaiting review
                {aiGradedCount > 0 && `, ${aiGradedCount} AI-graded (confirm with final marks)`}
              </span>
            </div>
          )}

          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="bg-card/50">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="ai_graded">AI Graded</TabsTrigger>
              <TabsTrigger value="graded">Graded</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <CheckCircle className="w-10 h-10 opacity-20" />
              <div className="text-center">
                <p className="font-medium">No submissions here</p>
                <p className="text-sm mt-1">
                  {status === "pending"
                    ? "All caught up — no pending answer scripts."
                    : "No submissions with this status yet."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => (
                <SubmissionCard
                  key={sub.id}
                  sub={sub}
                  onGraded={() => {
                    queryClient.invalidateQueries({ queryKey: ["admin-quiz-submissions"] });
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
