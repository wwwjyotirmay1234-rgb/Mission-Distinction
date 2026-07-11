import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import { ScreenshotButton } from "@/components/ScreenshotButton";
import { 
  TrendingUp, 
  BookOpen, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RotateCcw,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Brain,
  Trophy,
  BarChart2,
  Zap,
  TrendingDown,
  Star,
  History,
  FileText,
  Download,
  ClipboardCheck,
  Mic,
  Layers,
  Stethoscope,
  ListOrdered,
} from "lucide-react";

interface WeakTopic {
  subject: string;
  total: number;
  accuracy: number;
}

interface Mistake {
  id: number;
  questionId: number;
  questionText: string;
  options: string[];
  correctOption: number;
  correctAnswer: string;
  explanation: string;
  subject: string;
  quizTitle: string;
  createdAt: string;
}

interface PerQuizBreakdown {
  quizId: number;
  quizTitle: string;
  subject: string;
  total: number;
  accuracy: number;
}

interface ExamReadiness {
  score: number | null;
  band: string;
  accuracy: number;
  totalQuestionsAttempted: number;
  trend: number;
  recentAccuracy: number;
  projectedScore: number | null;
  vivaAvgScore: number | null;
  vivaCount: number;
  weeksToExam: number | null;
  sessionsNeededThisWeek: number;
}


interface StudyPlan {
  id: number;
  generatedAt: string;
  planJson: {
    summary: string;
    days: {
      day: string;
      focus: string;
      tasks: string[];
    }[];
  };
  weakSubjects: string[];
}

function ReQuizSession({ mistakes, onDone }: { mistakes: Mistake[]; onDone: () => void }) {
  const mcq = mistakes.filter(m => Array.isArray(m.options) && m.options.length >= 2 && m.correctOption != null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (mcq.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <AlertCircle className="text-muted-foreground" size={40} />
        <p className="text-muted-foreground text-center">No MCQ mistakes available to re-quiz.</p>
        <Button onClick={onDone} variant="outline" className="gap-2"><ChevronLeft size={16} /> Back</Button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / mcq.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy size={32} className="text-primary" />
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{pct}%</p>
          <p className="text-muted-foreground mt-1">{score} / {mcq.length} correct this time</p>
          {pct >= 70
            ? <Badge className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">Great improvement!</Badge>
            : <Badge className="mt-3 bg-amber-500/20 text-amber-400 border-amber-500/30">Keep practicing!</Badge>}
        </div>
        <Button onClick={onDone} className="gap-2"><ChevronLeft size={16} /> Back to Mistakes</Button>
      </div>
    );
  }

  const m = mcq[idx];

  function handleSelect(i: number) {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
  }

  function next() {
    if (selected === m.correctOption) setScore(s => s + 1);
    if (idx + 1 >= mcq.length) { setDone(true); }
    else { setIdx(i => i + 1); setSelected(null); setRevealed(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={onDone}>
            <ChevronLeft size={16} /> Exit Re-quiz
          </Button>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {idx + 1} / {mcq.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{score} correct so far</span>
      </div>
      <Progress value={((idx) / mcq.length) * 100} className="h-1.5" />
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-6">
          <Badge variant="outline" className="text-[10px] mb-3 border-primary/20 text-primary">{m.subject}</Badge>
          <p className="text-sm font-semibold leading-relaxed mb-5">{m.questionText}</p>
          <div className="space-y-2">
            {m.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrectOpt = revealed && i === m.correctOption;
              const isWrong = revealed && isSelected && i !== m.correctOption;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                    isCorrectOpt ? "border-green-500/50 bg-green-500/10 text-green-400 font-medium"
                    : isWrong ? "border-red-500/50 bg-red-500/10 text-red-400"
                    : isSelected ? "border-primary/40 bg-primary/10"
                    : "border-border/40 hover:border-border hover:bg-card/60"
                  }`}
                >
                  <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                  {isCorrectOpt && <span className="ml-2 text-green-400 text-xs">✓ Correct</span>}
                  {isWrong && <span className="ml-2 text-red-400 text-xs">✗ Wrong</span>}
                </button>
              );
            })}
          </div>
          {revealed && m.explanation && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 leading-relaxed">
              <strong>Explanation: </strong>{m.explanation}
            </div>
          )}
          {revealed && (
            <Button onClick={next} className="mt-4 w-full gap-2">
              {idx + 1 >= mcq.length ? "See Results" : "Next Question"} <ChevronRight size={16} />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  score?: number | null;
  createdAt: string;
}

function activityIcon(type: string) {
  switch (type) {
    case "quiz": return <ClipboardCheck size={13} className="text-primary" />;
    case "note": return <FileText size={13} className="text-blue-400" />;
    case "pdf": return <Download size={13} className="text-green-400" />;
    case "viva": return <Mic size={13} className="text-purple-400" />;
    case "flashcard_reviewed": return <Layers size={13} className="text-amber-400" />;
    case "clinical_case_attempt": return <Stethoscope size={13} className="text-teal-400" />;
    case "clinical_case_bonus": return <Star size={13} className="text-yellow-400" />;
    default: return <BookOpen size={13} className="text-muted-foreground" />;
  }
}

function groupByDay(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const map = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const d = new Date(item.createdAt);
    const key = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
    (map.get(key) ?? map.set(key, []).get(key)!).push(item);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function MyProgress() {
  const [activeTab, setActiveTab] = useState("overview");
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [perQuizBreakdown, setPerQuizBreakdown] = useState<PerQuizBreakdown[]>([]);
  const [readiness, setReadiness] = useState<ExamReadiness | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [reQuizMistakes, setReQuizMistakes] = useState<Mistake[] | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wtRes, mRes, erRes, spRes, pqRes, actRes] = await Promise.all([
        apiFetch("/api/analytics/weak-topics"),
        apiFetch("/api/analytics/mistakes"),
        apiFetch("/api/analytics/exam-readiness"),
        apiFetch("/api/analytics/study-plan/latest"),
        apiFetch("/api/analytics/per-quiz-breakdown"),
        apiFetch("/api/progress/activity"),
      ]);

      if (wtRes.ok) {
        const data = await wtRes.json();
        setWeakTopics(data.subjects || []);
      }
      if (mRes.ok) {
        const data = await mRes.json();
        setMistakes(data.mistakes || []);
      }
      if (erRes.ok) {
        const data = await erRes.json();
        setReadiness(data);
      }
      if (spRes.ok) {
        const data = await spRes.json();
        setStudyPlan(data.plan);
      }
      if (pqRes.ok) {
        const data = await pqRes.json();
        setPerQuizBreakdown(data.breakdown || []);
      }
      if (actRes.ok) {
        const data = await actRes.json();
        setActivityLog(Array.isArray(data) ? data.slice(0, 200) : []);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
      toast.error("Failed to load progress data");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const generatePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await apiFetch("/api/analytics/study-plan/generate", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setStudyPlan({
          id: data.id,
          generatedAt: data.generatedAt,
          planJson: data.plan,
          weakSubjects: data.weakSubjects
        });
        toast.success("Study plan generated successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate study plan");
      }
    } catch (error) {
      toast.error("Network error while generating study plan");
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (reQuizMistakes !== null) {
    return (
      <div className="space-y-6 pb-12">
        <ReQuizSession mistakes={reQuizMistakes} onDone={() => setReQuizMistakes(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="text-primary" /> My Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your learning journey, identify weak spots, and prepare for exams.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/50 border border-border/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Exam Readiness</TabsTrigger>
          <TabsTrigger value="weak-topics">Weak Topics</TabsTrigger>
          <TabsTrigger value="mistakes">Mistake Notebook</TabsTrigger>
          <TabsTrigger value="study-plan">Study Plan</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1"><History size={13} />Revision History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card id="md-capture-area" className="md:col-span-2 bg-card/40 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="text-primary" size={20} /> Exam Readiness Score
                  </CardTitle>
                  <ScreenshotButton />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : readiness && readiness.score !== null ? (
                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row items-center justify-around py-2 gap-8">
                      {/* Dial */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                            <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={440} strokeDashoffset={440 - (440 * readiness.score) / 100} strokeLinecap="round" className="text-primary transition-all duration-1000 ease-out" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold">{readiness.score}</span>
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Now</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="mt-3 text-sm px-4 py-1 border-primary/30 bg-primary/10 text-primary">{readiness.band}</Badge>
                        {readiness.projectedScore !== null && (
                          <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${readiness.projectedScore >= readiness.score ? "text-green-400" : "text-red-400"}`}>
                            {readiness.projectedScore >= readiness.score ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            Projected: <span className="font-bold">{readiness.projectedScore}</span>
                          </div>
                        )}
                      </div>

                      {/* Subject breakdown */}
                      <div className="flex-1 w-full max-w-xs space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subject Breakdown</h4>
                        <div className="space-y-3">
                          {weakTopics.slice(0, 5).map((topic, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-medium">
                                <span>{topic.subject}</span>
                                <span>{topic.accuracy}%</span>
                              </div>
                              <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
                                <div className={`h-full rounded-full ${topic.accuracy < 60 ? 'bg-red-500/60' : topic.accuracy < 80 ? 'bg-amber-500/60' : 'bg-green-500/60'}`} style={{ width: `${Math.max(0, Math.min(100, topic.accuracy))}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CTA / action row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {readiness.sessionsNeededThisWeek > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                          <Zap size={16} className="text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-300">Boost to 75%</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Do <span className="font-bold text-foreground">{readiness.sessionsNeededThisWeek} more quiz session{readiness.sessionsNeededThisWeek > 1 ? "s" : ""}</span> this week to reach the target score.
                            </p>
                          </div>
                        </div>
                      )}
                      {readiness.vivaCount > 0 && readiness.vivaAvgScore !== null && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/8 border border-primary/20">
                          <Brain size={16} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-primary">Viva Performance</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Avg score <span className="font-bold text-foreground">{readiness.vivaAvgScore}%</span> across {readiness.vivaCount} session{readiness.vivaCount > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      )}
                      {readiness.weeksToExam !== null && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-card/60 border border-border/40">
                          <Calendar size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold">Exam Countdown</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              <span className="font-bold text-foreground">{readiness.weeksToExam} week{readiness.weeksToExam !== 1 ? "s" : ""}</span> until next university exam
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-muted-foreground">Not enough data to calculate readiness score yet. Keep practicing!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-20" /> : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{readiness?.accuracy || 0}%</span>
                      {readiness && readiness.trend !== 0 && (
                        <span className={`text-xs font-medium ${readiness.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {readiness.trend > 0 ? '+' : ''}{readiness.trend}% trend
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Questions Solved</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-20" /> : (
                    <span className="text-3xl font-bold">{readiness?.totalQuestionsAttempted || 0}</span>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-20" /> : (
                    <span className="text-3xl font-bold">{readiness?.recentAccuracy || 0}%</span>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weak-topics" className="space-y-4 outline-none">
          <Card className="bg-card/40 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Topic-wise Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : weakTopics.length > 0 ? (
                <div className="space-y-6">
                  {weakTopics.map((topic, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{topic.subject}</span>
                        <span className={topic.accuracy < 60 ? 'text-red-400' : topic.accuracy < 80 ? 'text-amber-400' : 'text-green-400'}>
                          {topic.accuracy}% accuracy
                        </span>
                      </div>
                      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                            topic.accuracy < 60 ? 'bg-red-500/60' : topic.accuracy < 80 ? 'bg-amber-500/60' : 'bg-green-500/60'
                          }`}
                          style={{ width: `${topic.accuracy}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{topic.total} attempts recorded</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No topic data available yet. Complete more quizzes to see analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-quiz breakdown */}
          {!loading && perQuizBreakdown.length > 0 && (
            <Card className="bg-card/40 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart2 size={18} className="text-primary" /> Per-Quiz Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {perQuizBreakdown.map((q, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{q.quizTitle}</p>
                          <p className="text-[10px] text-muted-foreground">{q.subject} · {q.total} questions</p>
                        </div>
                        <span className={`text-sm font-semibold shrink-0 ${q.accuracy < 60 ? 'text-red-400' : q.accuracy < 80 ? 'text-amber-400' : 'text-green-400'}`}>
                          {q.accuracy}%
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-full ${
                            q.accuracy < 60 ? 'bg-red-500/60' : q.accuracy < 80 ? 'bg-amber-500/60' : 'bg-green-500/60'
                          }`}
                          style={{ width: `${q.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-4 outline-none">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Mistake Notebook</h3>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {mistakes.length} recorded
              </Badge>
            </div>
            {mistakes.filter(m => Array.isArray(m.options) && m.options.length >= 2).length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setReQuizMistakes(mistakes)}
              >
                <RotateCcw size={14} /> Re-quiz My Mistakes
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : mistakes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mistakes.map((mistake) => (
                <Card key={mistake.id} className="bg-card/30 border-border/40 hover:border-primary/30 transition-colors flex flex-col">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary">
                        {mistake.subject}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(mistake.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-tight line-clamp-3">{mistake.questionText}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3 flex-1">
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 p-2 rounded bg-red-500/5 border border-red-500/10">
                        <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="text-muted-foreground">Correct: </span>
                          <span className="text-green-400 font-medium">{mistake.correctAnswer}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Brain size={12} className="text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase">Explanation</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 italic">
                        {mistake.explanation}
                      </p>
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 text-right italic">
                      From: {mistake.quizTitle}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/40 border-border/50 border-dashed">
              <CardContent className="py-20 text-center">
                <CheckCircle2 className="mx-auto text-green-500/40 mb-4" size={48} />
                <h3 className="text-lg font-medium">Clear record!</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                  You haven't made any mistakes yet, or they've been cleared. Keep up the great work!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="study-plan" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="text-primary" size={20} /> AI-Generated Study Plan
              </h3>
              {studyPlan && (
                <p className="text-xs text-muted-foreground mt-1">
                  Generated on {new Date(studyPlan.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <Button onClick={generatePlan} disabled={generatingPlan} className="gap-2">
              <Sparkles size={16} />
              {generatingPlan ? "Generating..." : "Generate New Plan"}
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : studyPlan ? (
            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-5">
                  <p className="text-sm italic leading-relaxed text-foreground/90">
                    "{studyPlan.planJson.summary}"
                  </p>
                  {studyPlan.weakSubjects.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground self-center mr-1">Focusing on:</span>
                      {studyPlan.weakSubjects.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] bg-card border-border/50">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {studyPlan.planJson.days.map((day, i) => (
                  <Card key={i} className="bg-card/40 border-border/50 hover:border-primary/20 transition-all">
                    <CardHeader className="p-4 pb-2 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-sm font-bold text-primary">{day.day}</CardTitle>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">{day.focus}</p>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <ul className="space-y-2">
                        {day.tasks.map((task, ti) => (
                          <li key={ti} className="flex gap-2 text-xs leading-relaxed group">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1 shrink-0 group-hover:bg-primary transition-colors" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="bg-card/40 border-border/50 border-dashed">
              <CardContent className="py-20 text-center">
                <Calendar className="mx-auto text-muted-foreground/40 mb-4" size={48} />
                <h3 className="text-lg font-medium">No study plan yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2 mb-6">
                  Click the button above to generate a personalized 7-day study plan based on your performance.
                </p>
                <Button onClick={generatePlan} disabled={generatingPlan} variant="outline" className="gap-2">
                  <Sparkles size={16} /> Generate First Plan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Smart Study Queue — always visible when quiz data is available */}
          {!loading && weakTopics.length > 0 && (
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListOrdered className="text-primary" size={18} /> Smart Study Queue
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Ranked by quiz performance — red topics need the most attention.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...weakTopics]
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .slice(0, 6)
                  .map((topic, i) => {
                    const tag = i === 0 ? "URGENT" : i < 3 ? "FOCUS" : "REVIEW";
                    const tagColor = i === 0
                      ? "border-red-500/30 text-red-400 bg-red-500/8"
                      : i < 3
                      ? "border-amber-500/30 text-amber-400 bg-amber-500/8"
                      : "border-border/40 text-muted-foreground bg-muted/20";
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50 border border-border/30 hover:border-primary/20 transition-colors">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${tagColor}`}>{tag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{topic.subject}</p>
                          <p className="text-[10px] text-muted-foreground">{topic.total} questions attempted</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-14 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${topic.accuracy < 60 ? "bg-red-500/60" : topic.accuracy < 80 ? "bg-amber-500/60" : "bg-green-500/60"}`}
                              style={{ width: `${Math.max(2, topic.accuracy)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold w-9 text-right ${topic.accuracy < 60 ? "text-red-400" : topic.accuracy < 80 ? "text-amber-400" : "text-green-400"}`}>
                            {topic.accuracy}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Revision History Tab ── */}
        <TabsContent value="activity" className="space-y-6 outline-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="text-primary" size={20} /> Revision History
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Everything you've studied — notes, PDFs, quizzes, viva sessions, flashcards.</p>
            </div>
            {activityLog.length > 0 && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {activityLog.length} activities
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : activityLog.length === 0 ? (
            <Card className="bg-card/40 border-border/40 border-dashed">
              <CardContent className="py-16 text-center">
                <History className="mx-auto text-muted-foreground/30 mb-3" size={40} />
                <p className="font-medium">No activity recorded yet</p>
                <p className="text-xs text-muted-foreground mt-2">Start studying — every quiz, note, viva, and flashcard review will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupByDay(activityLog).map((group, gi) => (
                <div key={gi}>
                  <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground/70 mb-3 flex items-center gap-2">
                    <Calendar size={11} /> {group.label}
                    <span className="font-normal normal-case tracking-normal text-muted-foreground/50">· {group.items.length} {group.items.length === 1 ? "activity" : "activities"}</span>
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                          {activityIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug truncate">{item.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {item.score != null && (
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${item.score >= 70 ? "bg-green-500/10 text-green-400 border-green-500/20" : item.score >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                            {item.score}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
