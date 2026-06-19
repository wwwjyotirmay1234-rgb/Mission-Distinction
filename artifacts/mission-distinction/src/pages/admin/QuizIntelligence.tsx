import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain, TrendingUp, Target, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizStat {
  quizId: number;
  quizTitle: string;
  subject: string;
  attempts: number;
  avgScore: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgTime: number;
}

interface FeatureUsage { feature: string; count: number; color: string; }

export default function QuizIntelligence() {
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);
  const [distributions, setDistributions] = useState<Record<number, { range: string; count: number }[]>>({});

  const { data: overview, isLoading } = useQuery({
    queryKey: ["quiz-intelligence"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/quiz-intelligence/overview");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ quizzes: QuizStat[]; totals: { totalAttempts: number; avgScore: number; passRate: number } }>;
    },
  });

  const { data: featureUsage } = useQuery<FeatureUsage[]>({
    queryKey: ["feature-usage"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/quiz-intelligence/feature-usage");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  async function loadDistribution(quizId: number) {
    if (expandedQuiz === quizId) { setExpandedQuiz(null); return; }
    if (!distributions[quizId]) {
      const res = await apiFetch(`/api/admin/quiz-intelligence/quiz/${quizId}/distribution`);
      if (res.ok) {
        const data = await res.json();
        setDistributions(prev => ({ ...prev, [quizId]: data.distribution }));
      }
    }
    setExpandedQuiz(quizId);
  }

  const totals = overview?.totals;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> Quiz Intelligence
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Performance analytics across all quizzes and features</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Attempts", value: totals?.totalAttempts ?? 0, icon: Target, color: "text-blue-400" },
          { label: "Avg Score", value: `${totals?.avgScore ?? 0}%`, icon: TrendingUp, color: "text-purple-400" },
          { label: "Pass Rate", value: `${totals?.passRate ?? 0}%`, icon: Brain, color: "text-emerald-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              {isLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold">{s.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Usage Chart */}
      {featureUsage && featureUsage.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Feature Usage Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={featureUsage} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="feature" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {featureUsage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-quiz table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Per-Quiz Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : !overview?.quizzes?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No quiz attempts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {overview.quizzes.map(quiz => (
                <div key={quiz.quizId}>
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm truncate">{quiz.quizTitle || `Quiz #${quiz.quizId}`}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5">{quiz.subject}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{quiz.attempts} attempts</span>
                          <span>Avg: {quiz.avgScore}%</span>
                          <span className={quiz.passRate >= 60 ? "text-emerald-400" : "text-amber-400"}>
                            Pass rate: {quiz.passRate}%
                          </span>
                          {quiz.avgTime > 0 && <span><Clock className="inline w-3 h-3 mr-0.5" />{Math.round(quiz.avgTime / 60)}m avg</span>}
                        </div>
                        <div className="mt-2">
                          <Progress value={quiz.passRate} className="h-1.5" />
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => loadDistribution(quiz.quizId)} className="text-xs shrink-0">
                        {expandedQuiz === quiz.quizId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>

                    {expandedQuiz === quiz.quizId && distributions[quiz.quizId] && (
                      <div className="mt-4 pt-4 border-t border-border/40">
                        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Score Distribution</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <BarChart data={distributions[quiz.quizId]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
