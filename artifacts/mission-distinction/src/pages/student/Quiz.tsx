import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useListQuizzes,
  useGetQuiz,
  getListQuizzesQueryKey,
  getGetQuizQueryKey,
} from "@workspace/api-client-react";
import {
  Play, Clock, CheckCircle, ChevronLeft, ChevronRight,
  Timer, Trophy, XCircle, AlertCircle, ArrowLeft, Flag,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

type QuizMode = "browse" | "taking" | "results";

interface QuizSummary {
  id: number;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  durationMinutes: number;
}

interface QuizQuestion {
  id: number;
  text: string;
  questionType: string;
  options?: string[] | null;
}

interface QuizDetail extends QuizSummary {
  questions: QuizQuestion[];
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  correctAnswers: Array<{
    questionId: number;
    correct: boolean;
    correctOption: number | null;
    correctAnswerText: string | null;
    explanation: string | null;
    questionType: string;
  }>;
}

const SUBJECTS = ["all", "Anatomy", "Physiology", "Biochemistry", "NEET PG", "University Exams"];

const REPORT_REASONS = [
  "Wrong answer",
  "Outdated information",
  "Unclear question",
  "Spelling/grammar error",
  "Wrong options",
  "Other",
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getTypeLabel(type: string) {
  switch (type) {
    case "fill-blank": return "Fill in the Blank";
    case "true-false": return "True / False";
    case "name-following": return "Name the Following";
    case "one-word": return "One Word Answer";
    default: return "MCQ";
  }
}

function getTypeBadgeColor(type: string) {
  switch (type) {
    case "fill-blank": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "true-false": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "name-following": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "one-word": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default: return "bg-primary/10 text-primary border-primary/20";
  }
}

function WriteInInput({
  value, onChange, placeholder, maxLength, multiLine,
}: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; multiLine?: boolean }) {
  if (multiLine) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "Type your answer here…"}
        maxLength={maxLength ?? 300}
        rows={3}
        className="w-full bg-background/60 border border-border/50 focus:border-primary rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? "Type your answer…"}
      maxLength={maxLength ?? 100}
      className="w-full bg-background/60 border border-border/50 focus:border-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
    />
  );
}

function QuestionRenderer({
  q, answer, onAnswer,
}: { q: QuizQuestion; answer: number | string | undefined; onAnswer: (v: number | string) => void }) {
  const type = q.questionType || "mcq";

  if (type === "mcq") {
    return (
      <div className="space-y-3">
        {(q.options as string[]).map((opt: string, i: number) => {
          const isSelected = answer === i;
          return (
            <button key={i} onClick={() => onAnswer(i)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                  : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-border"
              }`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs mr-3 shrink-0 ${
                isSelected ? "border-primary bg-primary text-white" : "border-border/60"
              }`}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "true-false") {
    return (
      <div className="grid grid-cols-2 gap-4">
        {["True", "False"].map((opt, i) => {
          const isSelected = answer === i;
          return (
            <button key={opt} onClick={() => onAnswer(i)}
              className={`py-5 rounded-xl border text-base font-bold transition-all ${
                isSelected
                  ? (i === 0 ? "border-green-500 bg-green-500/15 text-green-400" : "border-red-500 bg-red-500/15 text-red-400")
                  : "border-border/40 bg-muted/20 hover:bg-muted/40"
              }`}>
              {i === 0 ? "✓ True" : "✗ False"}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "fill-blank") {
    const qText = q.text;
    const hasBlank = qText.includes("___") || qText.includes("____");
    return (
      <div className="space-y-4">
        {hasBlank && (
          <div className="text-sm text-muted-foreground bg-card/30 px-4 py-3 rounded-xl border border-border/30">
            Fill in the blank marked with <span className="font-mono text-primary">___</span>
          </div>
        )}
        <WriteInInput
          value={typeof answer === "string" ? answer : ""}
          onChange={onAnswer}
          placeholder="Type the missing word or phrase…"
          maxLength={100}
        />
      </div>
    );
  }

  if (type === "name-following") {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground bg-card/30 px-4 py-3 rounded-xl border border-border/30">
          Write the name of the structure, condition, or concept being described.
        </div>
        <WriteInInput
          value={typeof answer === "string" ? answer : ""}
          onChange={onAnswer}
          placeholder="Write the name here…"
          maxLength={150}
          multiLine={true}
        />
      </div>
    );
  }

  if (type === "one-word") {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground bg-card/30 px-4 py-3 rounded-xl border border-border/30">
          Answer in <span className="font-semibold text-foreground">one word</span> only.
        </div>
        <WriteInInput
          value={typeof answer === "string" ? answer : ""}
          onChange={onAnswer}
          placeholder="One word…"
          maxLength={40}
        />
      </div>
    );
  }

  return null;
}

function ReportDialog({
  open, onClose, questionId, quizId,
}: { open: boolean; onClose: () => void; questionId: number | null; quizId: number | null }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!questionId || !quizId) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/quizzes/${quizId}/questions/${questionId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Report submitted — thank you for improving our quiz content!");
      setDetails("");
      setReason(REPORT_REASONS[0]);
      onClose();
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag size={16} className="text-amber-400" /> Report Question
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Help us improve the quiz by reporting incorrect or unclear questions.
          </p>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Additional details <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe the issue in more detail…"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentQuiz() {
  const [mode, setMode] = useState<QuizMode>("browse");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportQuestionId, setReportQuestionId] = useState<number | null>(null);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const { data: quizzesData, isLoading } = useListQuizzes(
    { subject: activeTab === "all" ? undefined : activeTab },
    { query: { queryKey: getListQuizzesQueryKey({ subject: activeTab === "all" ? undefined : activeTab }) } }
  );

  const { data: quizData, isLoading: quizLoading } = useGetQuiz(selectedQuizId!, {
    query: { enabled: !!selectedQuizId, queryKey: getGetQuizQueryKey(selectedQuizId!) },
  });

  const quizDetail = quizData as QuizDetail | undefined;
  const questions: QuizQuestion[] = quizDetail?.questions ?? [];

  useEffect(() => {
    if (mode === "taking" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current!); doSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, selectedQuizId]);

  const startQuiz = (quiz: QuizSummary) => {
    if (!quiz.questionCount || quiz.questionCount === 0) { toast.error("This quiz has no questions yet."); return; }
    setSelectedQuizId(quiz.id);
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    submittedRef.current = false;
    setTimeLeft((quiz.durationMinutes || 30) * 60);
    setMode("taking");
  };

  const doSubmit = async () => {
    if (submittedRef.current || !selectedQuizId) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const answerList = questions.map((q) => {
        const ans = answers[q.id];
        const type = q.questionType || "mcq";
        if (type === "mcq" || type === "true-false") {
          return { questionId: q.id, selectedOption: typeof ans === "number" ? ans : -1 };
        }
        return { questionId: q.id, writtenAnswer: typeof ans === "string" ? ans : "" };
      });
      const res = await fetch(`/api/quizzes/${selectedQuizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answerList }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const data: QuizResult = await res.json();
      setResult(data);
      setMode("results");
      queryClient.invalidateQueries({ queryKey: ["getStudentDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["getMyProgress"] });
      queryClient.invalidateQueries({ queryKey: ["getRecentActivity"] });
    } catch {
      toast.error("Failed to submit quiz. Please try again.");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const openReport = (qId: number) => { setReportQuestionId(qId); setReportOpen(true); };

  // ─── Results Screen ──────────────────────────────────────────────────────────
  if (mode === "results" && result) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => setMode("browse")} className="gap-2 -ml-2">
          <ArrowLeft size={16} /> Back to Quizzes
        </Button>

        <Card className={`border-2 ${result.passed ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
          <CardContent className="p-8 text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${result.passed ? "bg-green-500/20" : "bg-red-500/20"}`}>
              {result.passed ? <Trophy className="w-10 h-10 text-green-500" /> : <AlertCircle className="w-10 h-10 text-red-500" />}
            </div>
            <div className={`text-5xl font-black mb-2 ${result.passed ? "text-green-500" : "text-red-500"}`}>
              {result.percentage}%
            </div>
            <Badge variant="outline" className={`text-sm px-3 py-1 ${result.passed ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-red-500/10 text-red-500 border-red-500/30"}`}>
              {result.passed ? "🎉 Passed!" : "Not Passed — Try Again"}
            </Badge>
            <p className="text-muted-foreground mt-3 text-sm">
              You scored <strong>{result.score}</strong> out of <strong>{result.total}</strong> questions correctly.
            </p>
            <p className="text-xs text-muted-foreground mt-1">Passing score: 60%</p>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold">Answer Review</h2>
        <div className="space-y-3">
          {questions.map((q, idx: number) => {
            const ca = result.correctAnswers.find((c) => c.questionId === q.id);
            const isCorrect = ca?.correct;
            const selected = answers[q.id];
            const type = q.questionType || "mcq";
            const isWriteIn = !["mcq", "true-false"].includes(type);

            return (
              <Card key={q.id} className={`border ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${isCorrect ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                      {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${getTypeBadgeColor(type)}`}>
                          {getTypeLabel(type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Q{idx + 1}</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{q.text}</p>

                      {isWriteIn ? (
                        <div className="space-y-1.5">
                          <div className="text-xs px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground">
                            <span className="font-medium text-foreground">Your answer: </span>
                            {typeof selected === "string" && selected ? (
                              <span className={isCorrect ? "text-green-400" : "text-red-400"}>{selected}</span>
                            ) : (
                              <span className="italic">No answer given</span>
                            )}
                          </div>
                          {!isCorrect && ca?.correctAnswerText && (
                            <div className="text-xs px-3 py-2 rounded-lg bg-green-500/10 text-green-400">
                              <span className="font-medium">Correct answer: </span>{ca.correctAnswerText}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {(q.options as string[]).map((opt: string, i: number) => {
                            const isSelectedOpt = selected === i;
                            const isCorrectOpt = ca?.correctOption === i;
                            return (
                              <div key={i} className={`text-xs px-3 py-2 rounded-lg ${
                                isCorrectOpt ? "bg-green-500/20 text-green-400 font-medium"
                                : isSelectedOpt && !isCorrectOpt ? "bg-red-500/20 text-red-400"
                                : "text-muted-foreground"
                              }`}>
                                <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                                {isCorrectOpt && <span className="ml-2 text-green-400">✓ Correct</span>}
                                {isSelectedOpt && !isCorrectOpt && <span className="ml-2 text-red-400">✗ Your answer</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {ca?.explanation && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                          <span className="font-semibold">Explanation: </span>{ca.explanation}
                        </div>
                      )}

                      <button
                        onClick={() => openReport(q.id)}
                        className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-amber-400 transition-colors"
                      >
                        <Flag size={11} /> Report this question
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 pb-8">
          <Button variant="outline" className="flex-1" onClick={() => startQuiz(quizDetail!)}>Try Again</Button>
          <Button className="flex-1" onClick={() => setMode("browse")}>Back to Quizzes</Button>
        </div>

        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          questionId={reportQuestionId}
          quizId={selectedQuizId}
        />
      </div>
    );
  }

  // ─── Taking Screen ───────────────────────────────────────────────────────────
  if (mode === "taking") {
    if (quizLoading || !quizData || questions.length === 0) {
      return (
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    const quiz = quizDetail!;
    const q = questions[currentQ];
    const type = q.questionType || "mcq";
    const isWriteIn = !["mcq", "true-false"].includes(type);
    const answered = Object.keys(answers).length;
    const progressPct = ((currentQ + 1) / questions.length) * 100;
    const isLastQ = currentQ === questions.length - 1;
    const isLowTime = timeLeft < 60 && timeLeft > 0;
    const currentAnswer = answers[q.id];
    const hasAnswer = currentAnswer !== undefined && currentAnswer !== "";

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"
            onClick={() => {
              if (window.confirm("Exit quiz? Your progress will be lost.")) {
                if (timerRef.current) clearInterval(timerRef.current);
                setMode("browse");
              }
            }}>
            <ArrowLeft size={16} /> Exit
          </Button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-sm font-bold ${
            isLowTime ? "border-red-500/50 bg-red-500/10 text-red-500 animate-pulse" : "border-border/50 bg-card/50"
          }`}>
            <Timer size={15} /> {formatTime(timeLeft)}
          </div>
        </div>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate pr-4">{quiz.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">{currentQ + 1} / {questions.length}</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{answered} of {questions.length} answered</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{quiz.subject}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="outline" className={`text-[10px] ${getTypeBadgeColor(type)}`}>
                {getTypeLabel(type)}
              </Badge>
              {isWriteIn && (
                <span className="text-xs text-muted-foreground">Write your answer below</span>
              )}
            </div>
            <p className="text-base sm:text-lg font-semibold leading-relaxed mb-6">{q.text}</p>
            <QuestionRenderer
              q={q}
              answer={currentAnswer}
              onAnswer={(v) => setAnswers(prev => ({ ...prev, [q.id]: v }))}
            />
            <button
              onClick={() => openReport(q.id)}
              className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors"
            >
              <Flag size={12} /> Report this question
            </button>
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-8">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)} className="gap-2">
            <ChevronLeft size={16} /> Prev
          </Button>
          <div className="flex-1" />
          {!isLastQ ? (
            <Button onClick={() => setCurrentQ(p => p + 1)} className="gap-2">
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={doSubmit} disabled={submitting}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600">
              {submitting ? "Submitting…" : "Submit Quiz"}
              <CheckCircle size={16} />
            </Button>
          )}
        </div>

        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          questionId={reportQuestionId}
          quizId={selectedQuizId}
        />
      </div>
    );
  }

  // ─── Browse Screen ───────────────────────────────────────────────────────────
  const quizList: QuizSummary[] = Array.isArray(quizzesData) ? (quizzesData as QuizSummary[]) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Quiz Center</h1>
        <p className="text-muted-foreground">Test your knowledge and track your performance.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {[
            { type: "mcq", label: "MCQ" },
            { type: "fill-blank", label: "Fill in the Blank" },
            { type: "true-false", label: "True / False" },
            { type: "name-following", label: "Name the Following" },
            { type: "one-word", label: "One Word" },
          ].map(t => (
            <Badge key={t.type} variant="outline" className={`text-[10px] ${getTypeBadgeColor(t.type)}`}>
              {t.label}
            </Badge>
          ))}
          <span className="self-center">— question types used in quizzes</span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 border border-border/50 h-auto p-1 flex-wrap justify-start">
            {SUBJECTS.map((s) => (
              <TabsTrigger key={s} value={s}>{s === "all" ? "All Quizzes" : s}</TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : quizList.length === 0 ? (
              <div className="col-span-2 p-12 text-center border border-dashed rounded-xl text-muted-foreground">
                No quizzes found for this category.
              </div>
            ) : (
              quizList.map((quiz) => (
                <Card key={quiz.id} className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{quiz.subject}</Badge>
                        <Badge variant="outline" className={
                          quiz.difficulty === "easy" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          quiz.difficulty === "hard" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-orange-500/10 text-orange-500 border-orange-500/20"
                        }>{quiz.difficulty}</Badge>
                      </div>
                      <h4 className="font-semibold text-base">{quiz.title}</h4>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle size={14} /> {quiz.questionCount || 0} Questions</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {quiz.durationMinutes || 30} mins</span>
                      </div>
                    </div>
                    <Button onClick={() => startQuiz(quiz)} className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0 gap-2">
                      <Play size={16} /> Start
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
