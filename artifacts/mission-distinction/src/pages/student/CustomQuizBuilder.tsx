import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy, Target } from "lucide-react";

interface Question {
  id: number;
  text: string;
  questionType: string;
  options: string[] | null;
}

interface QuizSession {
  sessionId: string;
  subject: string;
  questionIds: number[];
  questions: Question[];
  totalQuestions: number;
}

interface BreakdownItem {
  questionId: number;
  text: string;
  correct: boolean;
  studentAnswer: number | null;
  correctOption: number | null;
  correctAnswer: string | null;
  explanation: string | null;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  breakdown: BreakdownItem[];
}

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry",
  "Pathology", "Pharmacology", "Microbiology",
  "Forensic Medicine", "Community Medicine",
  "General Medicine", "General Surgery",
  "Obstetrics & Gynaecology", "Paediatrics",
];

export default function CustomQuizBuilder() {
  const [step, setStep] = useState<"configure" | "quiz" | "results">("configure");
  const [subject, setSubject] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [reviewIdx, setReviewIdx] = useState<number | null>(null);

  const metaQuery = useQuery({
    queryKey: ["custom-quiz-meta"],
    queryFn: () => apiFetchJson<{ subjects: string[]; tagsBySubject: Record<string, string[]> }>("/api/quizzes/custom/meta"),
  });

  const availableTags = ((subject && metaQuery.data?.tagsBySubject?.[subject]) ?? []) as string[];

  const buildMutation = useMutation({
    mutationFn: (body: object) =>
      apiFetchJson<QuizSession>("/api/quizzes/custom/build", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data) => {
      setSession(data);
      setAnswers(new Array(data.questions.length).fill(null));
      setCurrentIdx(0);
      setStep("quiz");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to build quiz"),
  });

  const submitMutation = useMutation({
    mutationFn: (body: object) =>
      apiFetchJson<QuizResult>("/api/quizzes/custom/submit", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data) => {
      setResult(data);
      setStep("results");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit quiz"),
  });

  const handleBuild = () => {
    if (!subject) { toast.error("Please select a subject"); return; }
    buildMutation.mutate({
      subject,
      topicTags: selectedTags.length > 0 ? selectedTags : undefined,
      count: questionCount,
    });
  };

  const handleAnswer = (optionIdx: number) => {
    if (!session) return;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (!session) return;
    if (currentIdx < session.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = () => {
    if (!session) return;
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    submitMutation.mutate({
      subject: session.subject,
      questionIds: session.questionIds,
      answers,
    });
  };

  const resetAll = () => {
    setStep("configure");
    setSession(null);
    setAnswers([]);
    setResult(null);
    setCurrentIdx(0);
    setReviewIdx(null);
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (step === "configure") {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 max-w-xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚽</span>
            <h1 className="text-xl font-bold text-foreground">Custom Quiz Builder</h1>
          </div>
          <p className="text-sm text-muted-foreground">Build a personalised MCQ quiz from the PYQ bank</p>
        </div>

        <div className="space-y-6">
          {/* Subject */}
          <div className="bg-card/60 rounded-xl p-4 border border-border/40">
            <label className="block text-sm font-semibold text-foreground mb-3">Select Subject *</label>
            <Select value={subject} onValueChange={v => { setSubject(v); setSelectedTags([]); }}>
              <SelectTrigger className="bg-muted/30 border-border text-foreground">
                <SelectValue placeholder="Choose a subject..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic Tags */}
          {subject && availableTags.length > 0 && (
            <div className="bg-card/60 rounded-xl p-4 border border-border/40">
              <label className="block text-sm font-semibold text-foreground mb-1">Filter by Topics <span className="text-muted-foreground font-normal">(optional)</span></label>
              <p className="text-xs text-muted-foreground mb-3">Leave blank to include all topics</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {availableTags.slice(0, 60).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted/20 border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button onClick={() => setSelectedTags([])} className="mt-2 text-xs text-primary hover:underline">
                  Clear selection ({selectedTags.length} selected)
                </button>
              )}
            </div>
          )}

          {/* Question Count */}
          <div className="bg-card/60 rounded-xl p-4 border border-border/40">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Number of Questions: <span className="text-primary font-bold">{questionCount}</span>
            </label>
            <Slider
              value={[questionCount]}
              onValueChange={([v]) => setQuestionCount(v)}
              min={5}
              max={50}
              step={5}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5 (quick)</span>
              <span>25 (medium)</span>
              <span>50 (full)</span>
            </div>
          </div>

          <Button
            onClick={handleBuild}
            disabled={!subject || buildMutation.isPending}
            className="w-full font-bold py-3 text-base rounded-xl"
          >
            {buildMutation.isPending ? "Building Quiz..." : `Start ${questionCount}-Question Quiz →`}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "quiz" && session) {
    const q = session.questions[currentIdx];
    const answered = answers[currentIdx];
    const progress = ((currentIdx) / session.questions.length) * 100;

    return (
      <div className="min-h-screen bg-background text-foreground p-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground">{session.subject}</p>
            <p className="text-sm font-semibold text-foreground">Q {currentIdx + 1} / {session.questions.length}</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/30">
            {answers.filter(a => a !== null).length} answered
          </Badge>
        </div>

        <Progress value={progress} className="h-1 mb-5" />

        <div className="bg-card/60 rounded-xl p-4 border border-border/40 mb-4">
          <p className="text-foreground font-medium leading-relaxed text-sm">{q.text}</p>
        </div>

        <div className="space-y-2 mb-6">
          {(q.options ?? []).map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                answered === i
                  ? "bg-primary/15 border-primary text-foreground"
                  : "bg-card/40 border-border/40 text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span className="font-bold mr-2 text-primary">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {currentIdx < session.questions.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-700"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-4 justify-center">
          {session.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                i === currentIdx
                  ? "bg-primary text-primary-foreground"
                  : answers[i] !== null
                  ? "bg-primary/20 text-primary"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "results" && result && session) {
    const grade =
      result.percentage >= 80 ? "Distinction 🏆" :
      result.percentage >= 60 ? "Merit ⭐" :
      result.percentage >= 40 ? "Pass 🥅" : "Needs Revision";

    const gradeColor =
      result.percentage >= 80 ? "text-amber-400" :
      result.percentage >= 60 ? "text-green-400" :
      result.percentage >= 40 ? "text-blue-400" : "text-red-400";

    return (
      <div className="min-h-screen bg-background text-foreground p-4 max-w-xl mx-auto">
        <div className="bg-gradient-to-br from-primary/20 to-amber-500/10 border border-primary/30 rounded-2xl p-6 mb-5 text-center">
          <Trophy className="mx-auto mb-2 text-amber-400" size={32} />
          <div className="text-5xl font-black text-foreground mb-1">{result.percentage}%</div>
          <div className={`text-lg font-bold ${gradeColor} mb-1`}>{grade}</div>
          <div className="text-sm text-muted-foreground">{result.score} / {result.total} correct — {session.subject}</div>
        </div>

        <Button onClick={resetAll} variant="outline" className="w-full mb-4">
          <RotateCcw size={14} className="mr-2" /> Build Another Quiz
        </Button>

        <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Target size={14} /> Answer Review
        </h2>
        <div className="space-y-3">
          {result.breakdown.map((item, i) => (
            <div
              key={item.questionId}
              className={`bg-card/50 rounded-xl border p-4 cursor-pointer transition-all ${
                item.correct ? "border-green-500/30" : "border-red-500/30"
              }`}
              onClick={() => setReviewIdx(reviewIdx === i ? null : i)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {item.correct
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <XCircle size={16} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{item.text}</p>
                  {reviewIdx === i && (
                    <div className="mt-3 space-y-2">
                      {item.correctOption !== null && (
                        <p className="text-xs text-green-400">
                          ✓ Correct: Option {String.fromCharCode(65 + item.correctOption)}
                          {session.questions[i]?.options?.[item.correctOption]
                            ? ` — ${session.questions[i].options![item.correctOption]}`
                            : ""}
                        </p>
                      )}
                      {!item.correct && item.studentAnswer !== null && (
                        <p className="text-xs text-red-400">
                          ✗ Your answer: Option {String.fromCharCode(65 + item.studentAnswer)}
                        </p>
                      )}
                      {item.explanation && (
                        <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">{item.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {reviewIdx === i ? "▲" : "▼"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
