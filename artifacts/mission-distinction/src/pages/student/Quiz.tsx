import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListQuizzes,
  useGetQuiz,
  getListQuizzesQueryKey,
  getGetQuizQueryKey,
} from "@workspace/api-client-react";
import {
  Play, Clock, CheckCircle, ChevronLeft, ChevronRight,
  Timer, Trophy, XCircle, AlertCircle, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type QuizMode = "browse" | "taking" | "results";

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  correctAnswers: Array<{
    questionId: number;
    correct: boolean;
    correctOption: number;
    explanation: string | null;
  }>;
}

const SUBJECTS = ["all", "Anatomy", "Physiology", "Biochemistry", "NEET PG", "University Exams"];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function StudentQuiz() {
  const [mode, setMode] = useState<QuizMode>("browse");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  const questions: any[] = (quizData as any)?.questions ?? [];

  useEffect(() => {
    if (mode === "taking" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            doSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, selectedQuizId]);

  const startQuiz = (quiz: any) => {
    if (!quiz.questionCount || quiz.questionCount === 0) {
      toast.error("This quiz has no questions yet.");
      return;
    }
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
      const answerList = questions.map((q: any) => ({
        questionId: q.id,
        selectedOption: answers[q.id] ?? -1,
      }));
      const res = await fetch(`/api/quizzes/${selectedQuizId}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
              {result.passed
                ? <Trophy className="w-10 h-10 text-green-500" />
                : <AlertCircle className="w-10 h-10 text-red-500" />}
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
          {questions.map((q: any, idx: number) => {
            const ca = result.correctAnswers.find((c) => c.questionId === q.id);
            const isCorrect = ca?.correct;
            const selected = answers[q.id];
            return (
              <Card key={q.id} className={`border ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${isCorrect ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                      {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Q{idx + 1}. {q.text}</p>
                      <div className="space-y-1.5">
                        {(q.options as string[]).map((opt: string, i: number) => {
                          const isSelectedOpt = selected === i;
                          const isCorrectOpt = ca?.correctOption === i;
                          return (
                            <div key={i} className={`text-xs px-3 py-2 rounded-lg ${
                              isCorrectOpt
                                ? "bg-green-500/20 text-green-400 font-medium"
                                : isSelectedOpt && !isCorrectOpt
                                ? "bg-red-500/20 text-red-400"
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
                      {ca?.explanation && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                          <span className="font-semibold">Explanation: </span>{ca.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 pb-8">
          <Button variant="outline" className="flex-1" onClick={() => startQuiz(quizData as any)}>
            Try Again
          </Button>
          <Button className="flex-1" onClick={() => setMode("browse")}>
            Back to Quizzes
          </Button>
        </div>
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

    const quiz = quizData as any;
    const q = questions[currentQ];
    const answered = Object.keys(answers).length;
    const progressPct = ((currentQ + 1) / questions.length) * 100;
    const isLastQ = currentQ === questions.length - 1;
    const isLowTime = timeLeft < 60 && timeLeft > 0;

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost" size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => {
              if (window.confirm("Exit quiz? Your progress will be lost.")) {
                if (timerRef.current) clearInterval(timerRef.current);
                setMode("browse");
              }
            }}
          >
            <ArrowLeft size={16} /> Exit
          </Button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-sm font-bold ${
            isLowTime
              ? "border-red-500/50 bg-red-500/10 text-red-500 animate-pulse"
              : "border-border/50 bg-card/50"
          }`}>
            <Timer size={15} /> {formatTime(timeLeft)}
          </div>
        </div>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate pr-4">{quiz.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {currentQ + 1} / {questions.length}
              </span>
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
            <p className="text-base sm:text-lg font-semibold leading-relaxed mb-6">
              {q.text}
            </p>
            <div className="space-y-3">
              {(q.options as string[]).map((opt: string, i: number) => {
                const isSelected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                        : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-border"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs mr-3 shrink-0 ${
                      isSelected ? "border-primary bg-primary text-white" : "border-border/60"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-8">
          <Button
            variant="outline"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((p) => p - 1)}
            className="gap-2"
          >
            <ChevronLeft size={16} /> Prev
          </Button>
          <div className="flex-1" />
          {!isLastQ ? (
            <Button onClick={() => setCurrentQ((p) => p + 1)} className="gap-2">
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={doSubmit}
              disabled={submitting}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              {submitting ? "Submitting…" : "Submit Quiz"}
              <CheckCircle size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── Browse Screen ───────────────────────────────────────────────────────────
  const quizList: any[] = Array.isArray(quizzesData) ? quizzesData : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Quiz Center</h1>
        <p className="text-muted-foreground">Test your knowledge and track your performance.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 border border-border/50 h-auto p-1 flex-wrap justify-start">
            {SUBJECTS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s === "all" ? "All Quizzes" : s}
              </TabsTrigger>
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
              quizList.map((quiz: any) => (
                <Card key={quiz.id} className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {quiz.subject}
                        </Badge>
                        <Badge variant="outline" className={
                          quiz.difficulty === "easy" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          quiz.difficulty === "hard" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-orange-500/10 text-orange-500 border-orange-500/20"
                        }>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-base">{quiz.title}</h4>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle size={14} /> {quiz.questionCount || 0} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {quiz.durationMinutes || 30} mins
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => startQuiz(quiz)}
                      className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0 gap-2"
                    >
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
