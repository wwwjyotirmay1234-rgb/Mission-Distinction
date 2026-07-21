import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Trophy, CheckCircle, XCircle, Clock, TrendingUp, BarChart2,
  ChevronRight, BookOpen, ArrowLeft, Lightbulb, AlertCircle,
  Target, Award, Flame, Star, Brain, FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizAttempt {
  id: number;
  quizId: number;
  quizTitle: string;
  subject: string;
  score: number;
  total: number;
  percentage: number;
  hasPending: boolean;
  createdAt: string;
}

interface ReviewQuestion {
  id: number;
  text: string;
  questionType: string;
  options: string[] | null;
  correctOption: number | null;
  correctAnswer: string | null;
  explanation: string | null;
  maxMarks: number | null;
}

interface SubjectiveSubmission {
  id: number;
  question_id: number;
  question_text: string;
  answer_text: string | null;
  answer_image_url: string | null;
  max_marks: number;
  ai_marks: number | null;
  ai_feedback: string | null;
  ai_lacking: string | null;
  admin_marks: number | null;
  admin_feedback: string | null;
  admin_lacking: string | null;
  model_answer: string | null;
  status: "pending" | "ai_graded" | "graded";
}

interface ReviewData {
  attempt: QuizAttempt;
  quiz: {
    id: number;
    title: string;
    subject: string;
    difficulty: string;
    durationMinutes: number | null;
    description: string | null;
  };
  questions: ReviewQuestion[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d > 365 ? "numeric" : undefined });
}

function getScoreColor(pct: number) {
  if (pct >= 80) return "text-green-400";
  if (pct >= 60) return "text-blue-400";
  if (pct >= 40) return "text-amber-400";
  return "text-red-400";
}

function getScoreBg(pct: number) {
  if (pct >= 80) return "bg-green-500/10 border-green-500/20";
  if (pct >= 60) return "bg-blue-500/10 border-blue-500/20";
  if (pct >= 40) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function getDifficultyColor(d: string) {
  if (d === "easy") return "bg-green-500/10 text-green-400 border-green-500/20";
  if (d === "hard") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

function getTypeLabel(type: string) {
  switch (type) {
    case "fill-blank": return "Fill-in-Blank";
    case "true-false": return "True/False";
    case "name-following": return "Name the Following";
    case "one-word": return "One Word";
    case "short_answer": return "SAQ";
    case "long_answer": return "LAQ";
    default: return "MCQ";
  }
}

// ─── Stats computation ───────────────────────────────────────────────────────
function computeStats(attempts: QuizAttempt[]) {
  const graded = attempts.filter(a => a.total > 0);
  const total = attempts.length;
  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((s, a) => s + a.percentage, 0) / graded.length)
    : 0;
  const bestScore = graded.length > 0 ? Math.max(...graded.map(a => a.percentage)) : 0;
  const passCount = graded.filter(a => a.percentage >= 60).length;
  const passRate = graded.length > 0 ? Math.round((passCount / graded.length) * 100) : 0;

  const subjectMap: Record<string, { total: number; sum: number; count: number }> = {};
  for (const a of graded) {
    if (!subjectMap[a.subject]) subjectMap[a.subject] = { total: 0, sum: 0, count: 0 };
    subjectMap[a.subject].sum += a.percentage;
    subjectMap[a.subject].count += 1;
    subjectMap[a.subject].total += 1;
  }
  const subjectPerf = Object.entries(subjectMap).map(([subject, { sum, count }]) => ({
    subject: subject.length > 15 ? subject.slice(0, 14) + "…" : subject,
    fullSubject: subject,
    avg: Math.round(sum / count),
    count,
  })).sort((a, b) => b.avg - a.avg);

  const trend = [...graded]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-20)
    .map((a, i) => ({
      idx: i + 1,
      score: a.percentage,
      label: new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    }));

  return { total, avgScore, bestScore, passRate, passCount, subjectPerf, trend };
}

// ─── Review Panel ─────────────────────────────────────────────────────────────
function ReviewPanel({ attemptId, onClose }: { attemptId: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<ReviewData>({
    queryKey: ["quiz-attempt-review", attemptId],
    queryFn: async () => {
      const res = await apiFetch(`/api/quizzes/attempts/${attemptId}/review`);
      if (!res.ok) throw new Error("Failed to load review");
      return res.json();
    },
    staleTime: 300_000,
  });

  const { data: submissions } = useQuery<SubjectiveSubmission[]>({
    queryKey: ["quiz-submissions-attempt", attemptId],
    queryFn: async () => {
      const res = await apiFetch(`/api/quiz-submissions/my?attemptId=${attemptId}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
    enabled: !!attemptId,
  });

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0 bg-background border-border/60">
        <SheetHeader className="p-5 border-b border-border/40 sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
              <ArrowLeft size={16} />
            </Button>
            <div className="min-w-0">
              <SheetTitle className="text-base truncate">
                {isLoading ? "Loading…" : data?.quiz.title ?? "Quiz Review"}
              </SheetTitle>
              {data && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.quiz.subject} · {timeAgo(data.attempt.createdAt)}
                  {data.attempt.total > 0 && ` · ${data.attempt.score}/${data.attempt.total} correct`}
                </p>
              )}
            </div>
          </div>

          {data && data.attempt.total > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border ${getScoreBg(data.attempt.percentage)}`}>
                <div className={`text-2xl font-black ${getScoreColor(data.attempt.percentage)}`}>
                  {data.attempt.percentage}%
                </div>
                <div className="flex-1">
                  <Progress value={data.attempt.percentage} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.attempt.percentage >= 60 ? "✓ Passed" : "✗ Not Passed"} · Passing: 60%
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={`shrink-0 capitalize ${getDifficultyColor(data.quiz.difficulty)}`}>
                {data.quiz.difficulty}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <div className="p-5 space-y-4">
          {isLoading && (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p>Failed to load review. Please try again.</p>
            </div>
          )}

          {data && data.questions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p>No questions found for this quiz.</p>
            </div>
          )}

          {data && data.questions.map((q, idx) => {
            const isSubjective = ["short_answer", "long_answer"].includes(q.questionType);
            const correctIdx = q.correctOption;
            const correctText = q.correctAnswer;
            const explanation = q.explanation;

            return (
              <Card key={q.id} className="bg-card/50 border-border/40">
                <CardContent className="p-4 space-y-3">
                  {/* Question header */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5">Q{idx + 1}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/40 text-muted-foreground shrink-0">
                      {getTypeLabel(q.questionType)}
                    </Badge>
                    {q.maxMarks && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary shrink-0">
                        {q.maxMarks} mark{q.maxMarks !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-medium leading-relaxed">{q.text}</p>

                  {/* MCQ options */}
                  {q.questionType === "mcq" && q.options && (
                    <div className="space-y-1.5">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                            i === correctIdx
                              ? "border-green-500/40 bg-green-500/10 text-green-300"
                              : "border-border/30 bg-muted/10 text-muted-foreground"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center shrink-0 font-bold ${
                            i === correctIdx ? "border-green-500 bg-green-500 text-white" : "border-border/50"
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {i === correctIdx && <CheckCircle size={13} className="text-green-400 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True/False */}
                  {q.questionType === "true-false" && q.options && (
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold text-center border ${
                            i === correctIdx
                              ? "border-green-500/40 bg-green-500/10 text-green-300"
                              : "border-border/30 bg-muted/10 text-muted-foreground"
                          }`}
                        >
                          {i === correctIdx ? "✓ " : ""}{opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Write-in correct answer */}
                  {!["mcq", "true-false"].includes(q.questionType) && !isSubjective && correctText && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <CheckCircle size={13} className="text-green-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wide mb-0.5">Correct Answer</p>
                        <p className="text-sm text-green-300">{correctText}</p>
                      </div>
                    </div>
                  )}

                  {/* Subjective model answer */}
                  {isSubjective && explanation && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                      <Lightbulb size={13} className="text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-1">Model Answer / Key Points</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
                      </div>
                    </div>
                  )}

                  {/* Explanation (for objective questions) */}
                  {!isSubjective && explanation && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <Lightbulb size={13} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide mb-0.5">Explanation</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
                      </div>
                    </div>
                  )}

                  {/* No answer info for subjective */}
                  {isSubjective && !explanation && (
                    <p className="text-xs text-muted-foreground italic">
                      This is a subjective question — graded by AI or admin.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* ── Subjective Answer Feedback Section ── */}
          {submissions && submissions.length > 0 && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2 border-t border-border/30 pt-4">
                <FileText size={14} className="text-primary" />
                <p className="text-sm font-semibold">Your Subjective Answer Results</p>
              </div>
              {submissions.map((sub, idx) => {
                const finalMarks = sub.admin_marks ?? sub.ai_marks;
                const finalLacking = sub.admin_lacking ?? sub.ai_lacking;
                const finalFeedback = sub.admin_feedback ?? sub.ai_feedback;
                const gradedByAi = sub.admin_marks === null && sub.ai_marks !== null;
                return (
                  <Card key={sub.id} className={`border-border/40 ${
                    sub.status === "pending"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : sub.status === "graded"
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-blue-500/5 border-blue-500/20"
                  }`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">SAQ/LAQ #{idx + 1}</p>
                          <p className="text-sm font-medium mt-0.5 leading-snug">{sub.question_text}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {sub.status === "pending" ? (
                            <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                              <Clock size={11} /> Pending review
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 text-sm font-black ${
                              finalMarks !== null && finalMarks >= sub.max_marks * 0.6
                                ? "text-green-400" : "text-red-400"
                            }`}>
                              {finalMarks}/{sub.max_marks}
                              <span className="text-xs font-normal text-muted-foreground ml-0.5">marks</span>
                            </span>
                          )}
                          {sub.status !== "pending" && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              sub.status === "graded"
                                ? "bg-green-500/15 text-green-400"
                                : "bg-blue-500/15 text-blue-400"
                            }`}>
                              {sub.status === "graded" ? "Admin Graded" : "AI Graded"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Student's answer */}
                      {sub.answer_text && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your Answer</p>
                          <div className="bg-background/40 border border-border/30 rounded-lg p-2.5 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {sub.answer_text}
                          </div>
                        </div>
                      )}

                      {/* Model answer (shown after grading) */}
                      {sub.status !== "pending" && sub.model_answer && (
                        <div>
                          <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <Lightbulb size={9} /> Perfect / Model Answer
                          </p>
                          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2.5 text-xs text-green-200 whitespace-pre-wrap leading-relaxed">
                            {sub.model_answer}
                          </div>
                        </div>
                      )}

                      {/* What was lacking */}
                      {sub.status !== "pending" && finalLacking && finalLacking.toLowerCase() !== "none — all key points covered." && (
                        <div>
                          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <XCircle size={9} /> What was Lacking
                          </p>
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5 text-xs text-red-200 whitespace-pre-wrap leading-relaxed">
                            {finalLacking}
                          </div>
                        </div>
                      )}

                      {/* Overall feedback */}
                      {sub.status !== "pending" && finalFeedback && (
                        <div>
                          <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                            {gradedByAi ? <Brain size={9} /> : <CheckCircle size={9} />}
                            {gradedByAi ? "AI Feedback" : "Admin Feedback"}
                          </p>
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5 text-xs text-muted-foreground leading-relaxed">
                            {finalFeedback}
                          </div>
                        </div>
                      )}

                      {sub.status === "pending" && (
                        <p className="text-xs text-muted-foreground italic">
                          Your answer is being reviewed. Model answer and feedback will appear here once graded.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuizAnalysis() {
  const [reviewAttemptId, setReviewAttemptId] = useState<number | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const { data: attempts, isLoading } = useQuery<QuizAttempt[]>({
    queryKey: ["quiz-attempts-my"],
    queryFn: async () => {
      const res = await apiFetch("/api/quizzes/attempts/my");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const allAttempts = attempts ?? [];
  const stats = computeStats(allAttempts);

  const subjects = ["all", ...Array.from(new Set(allAttempts.map(a => a.subject)))];
  const filtered = subjectFilter === "all"
    ? allAttempts
    : allAttempts.filter(a => a.subject === subjectFilter);

  const STAT_CARDS = [
    {
      label: "Total Attempts",
      value: stats.total,
      suffix: "",
      icon: BarChart2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Avg Score",
      value: stats.avgScore,
      suffix: "%",
      icon: Target,
      color: stats.avgScore >= 60 ? "text-green-400" : "text-amber-400",
      bg: stats.avgScore >= 60 ? "bg-green-500/10" : "bg-amber-500/10",
    },
    {
      label: "Best Score",
      value: stats.bestScore,
      suffix: "%",
      icon: Award,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Pass Rate",
      value: stats.passRate,
      suffix: "%",
      icon: Flame,
      color: stats.passRate >= 60 ? "text-green-400" : "text-red-400",
      bg: stats.passRate >= 60 ? "bg-green-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart2 size={22} className="text-primary" /> Quiz Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review your performance, spot weak areas, and study the correct answers.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, suffix, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center`}>
                  <Icon size={13} className={color} />
                </div>
              </div>
              {isLoading
                ? <Skeleton className="h-8 w-16" />
                : <p className={`text-3xl font-black ${color}`}>{value}{suffix}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      {!isLoading && allAttempts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Subject performance */}
          {stats.subjectPerf.length > 0 && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen size={14} className="text-primary" /> Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.subjectPerf.map(s => (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium truncate max-w-[140px]" title={s.fullSubject}>{s.subject}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground">{s.count} attempt{s.count !== 1 ? "s" : ""}</span>
                          <span className={`font-bold ${getScoreColor(s.avg)}`}>{s.avg}%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={s.avg} className="h-2" />
                        {s.avg < 60 && (
                          <div className="absolute top-0 h-full w-px bg-amber-400/60" style={{ left: "60%" }} />
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    — line at 60% passing threshold
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score trend */}
          {stats.trend.length >= 2 && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" /> Score Trend
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">(last {stats.trend.length} attempts)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="idx" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        labelFormatter={(v) => `Attempt ${v}`}
                        formatter={(v: number) => [`${v}%`, "Score"]}
                      />
                      <Line
                        type="monotone" dataKey="score" stroke="hsl(var(--primary))"
                        strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subject bar chart if only 1 attempt (no trend) */}
          {stats.trend.length < 2 && stats.subjectPerf.length > 1 && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 size={14} className="text-primary" /> Score by Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.subjectPerf} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(v: number) => [`${v}%`, "Avg Score"]}
                      />
                      <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                        {stats.subjectPerf.map((s, i) => (
                          <Cell key={i} fill={s.avg >= 60 ? "hsl(var(--primary))" : "hsl(0 72% 51%)"} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Attempts list */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" /> Attempt History
            {!isLoading && <span className="text-sm font-normal text-muted-foreground">({allAttempts.length})</span>}
          </h2>

          {/* Subject filter pills */}
          {subjects.length > 2 && (
            <div className="flex gap-1.5 flex-wrap">
              {subjects.slice(0, 6).map(s => (
                <button
                  key={s}
                  onClick={() => setSubjectFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                    subjectFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/40 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        )}

        {!isLoading && allAttempts.length === 0 && (
          <Card className="bg-card/30 border-border/40">
            <CardContent className="py-16 text-center">
              <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold text-foreground mb-1">No Quiz Attempts Yet</h3>
              <p className="text-sm text-muted-foreground">
                Go to Quiz Center and take your first quiz to see your analysis here.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && filtered.length === 0 && allAttempts.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No attempts for the selected subject.
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(attempt => {
              const passed = attempt.percentage >= 60;
              const pending = attempt.hasPending && attempt.total === 0;

              return (
                <Card
                  key={attempt.id}
                  className="bg-card/40 border-border/40 hover:bg-card/60 transition-colors cursor-pointer group"
                  onClick={() => setReviewAttemptId(attempt.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Score circle */}
                      <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 border-2 ${
                        pending
                          ? "border-amber-500/40 bg-amber-500/10"
                          : passed
                          ? "border-green-500/30 bg-green-500/10"
                          : "border-red-500/30 bg-red-500/10"
                      }`}>
                        {pending
                          ? <Clock size={18} className="text-amber-400" />
                          : <>
                              <span className={`text-sm font-black leading-none ${passed ? "text-green-400" : "text-red-400"}`}>
                                {attempt.percentage}
                              </span>
                              <span className={`text-[9px] font-medium ${passed ? "text-green-400/70" : "text-red-400/70"}`}>%</span>
                            </>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{attempt.quizTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/40 text-muted-foreground">
                            {attempt.subject}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {pending ? "Pending review" : `${attempt.score}/${attempt.total} correct`}
                          </span>
                          <span className="text-xs text-muted-foreground">{timeAgo(attempt.createdAt)}</span>
                        </div>
                      </div>

                      {/* Pass/fail badge + arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!pending && (
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 hidden sm:flex ${
                            passed ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"
                          }`}>
                            {passed ? "✓ Passed" : "✗ Failed"}
                          </Badge>
                        )}
                        <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    {!pending && (
                      <div className="mt-2.5 ml-15">
                        <Progress value={attempt.percentage} className="h-1 ml-[60px]" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Insight callouts */}
      {!isLoading && allAttempts.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.subjectPerf.filter(s => s.avg < 60).length > 0 && (
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Subjects to Improve</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.subjectPerf.filter(s => s.avg < 60).map(s => s.fullSubject).join(", ")} — avg below 60%.
                    Focus your revision on these.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.subjectPerf.filter(s => s.avg >= 80).length > 0 && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 flex items-start gap-3">
                <Star size={16} className="text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-300">Strong Subjects</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.subjectPerf.filter(s => s.avg >= 80).map(s => s.fullSubject).join(", ")} — great work!
                    Keep practicing to stay sharp.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.trend.length >= 3 && (() => {
            const recent = stats.trend.slice(-3);
            const older = stats.trend.slice(0, -3);
            const recentAvg = recent.reduce((s, a) => s + a.score, 0) / recent.length;
            const olderAvg = older.length > 0 ? older.reduce((s, a) => s + a.score, 0) / older.length : recentAvg;
            const delta = Math.round(recentAvg - olderAvg);
            if (delta >= 5) return (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <TrendingUp size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Improving! 🚀</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your last 3 attempts averaged {Math.round(recentAvg)}% — up {delta}% from before. Keep it up!
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
            return null;
          })()}
        </div>
      )}

      {/* Review panel */}
      {reviewAttemptId !== null && (
        <ReviewPanel attemptId={reviewAttemptId} onClose={() => setReviewAttemptId(null)} />
      )}
    </div>
  );
}
