import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
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
  Brain
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

interface ExamReadiness {
  score: number | null;
  band: string;
  accuracy: number;
  totalQuestionsAttempted: number;
  trend: number;
  recentAccuracy: number;
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

export default function MyProgress() {
  const [activeTab, setActiveTab] = useState("overview");
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [readiness, setReadiness] = useState<ExamReadiness | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wtRes, mRes, erRes, spRes] = await Promise.all([
        apiFetch("/api/analytics/weak-topics"),
        apiFetch("/api/analytics/mistakes"),
        apiFetch("/api/analytics/exam-readiness"),
        apiFetch("/api/analytics/study-plan/latest")
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
        <TabsList className="bg-card/50 border border-border/50 p-1">
          <TabsTrigger value="overview">Exam Readiness</TabsTrigger>
          <TabsTrigger value="weak-topics">Weak Topics</TabsTrigger>
          <TabsTrigger value="mistakes">Mistake Notebook</TabsTrigger>
          <TabsTrigger value="study-plan">Study Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-card/40 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="text-primary" size={20} /> Exam Readiness Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : readiness && readiness.score !== null ? (
                  <div className="flex flex-col lg:flex-row items-center justify-around py-4 gap-8">
                    <div className="flex flex-col items-center">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted/20"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * readiness.score) / 100}
                            strokeLinecap="round"
                            className="text-primary transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold">{readiness.score}</span>
                          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Score</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`mt-4 text-sm px-4 py-1 border-primary/30 bg-primary/10 text-primary`}>
                        {readiness.band}
                      </Badge>
                    </div>

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
                              <div
                                className={`h-full rounded-full ${topic.accuracy < 60 ? 'bg-red-500/60' : topic.accuracy < 80 ? 'bg-amber-500/60' : 'bg-green-500/60'}`}
                                style={{ width: `${Math.max(0, Math.min(100, topic.accuracy))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
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
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-4 outline-none">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mistake Notebook</h3>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {mistakes.length} mistakes recorded
            </Badge>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
