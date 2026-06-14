import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetMyProgress, getGetMyProgressQueryKey, useListQuizAttempts, getListQuizAttemptsQueryKey } from "@workspace/api-client-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Award, FileText, CheckCircle, Flame } from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StudentProgress() {
  const { data: progress, isLoading } = useGetMyProgress({
    query: { queryKey: getGetMyProgressQueryKey() },
  });

  const { data: attempts, isLoading: attemptsLoading } = useListQuizAttempts({
    query: { queryKey: getListQuizAttemptsQueryKey() },
  });

  const subjectProgress = progress?.subjectProgress ?? [];
  const avgScore = progress?.avgScore ?? 0;
  const quizzesAttempted = progress?.quizzesAttempted ?? 0;
  const notesCompleted = progress?.notesCompleted ?? 0;
  const studyStreak = progress?.studyStreak ?? 0;
  const studyHoursWeek = progress?.studyHoursWeek ?? 0;

  const radarData = subjectProgress.length > 0
    ? subjectProgress.map((s) => ({ subject: s.subject, score: s.percentage }))
    : null;

  const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];
  const overallPct = avgScore;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">My Progress</h1>
        <p className="text-muted-foreground">Track your learning journey and subject mastery.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-32 w-32 relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: overallPct || 0 }, { value: 100 - (overallPct || 0) }]}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={60}
                    startAngle={90} endAngle={-270}
                    dataKey="value" stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isLoading ? <Skeleton className="h-8 w-12" /> : <span className="text-2xl font-bold">{overallPct}%</span>}
              </div>
            </div>
            <h3 className="font-semibold">Avg Quiz Score</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {quizzesAttempted} quiz{quizzesAttempted !== 1 ? "zes" : ""} taken
            </p>
          </CardContent>
        </Card>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mb-4">
                <Clock size={20} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Study Time (Week)</p>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold">{studyHoursWeek}h</h3>}
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
                <Flame size={20} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Study Streak</p>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  {studyStreak} 🔥
                </h3>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                <FileText size={20} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes Read</p>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold">{notesCompleted}</h3>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/40 border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {!radarData ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground text-sm">
                <CheckCircle size={32} className="mb-3 opacity-30" />
                <p>Take some quizzes to see your subject radar chart.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} itemStyle={{ color: "hsl(var(--primary))" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Quiz Attempts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attemptsLoading ? (
              <div className="p-4 space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !attempts || attempts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No quizzes attempted yet. Head to the Quiz Center!
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {[...(attempts as any[])].reverse().slice(0, 8).map((a: any) => (
                  <div key={a.id} className="p-4 flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full shrink-0 ${a.percentage >= 60 ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.quizTitle}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.subject}</Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-base font-bold ${a.percentage >= 60 ? "text-green-500" : "text-red-500"}`}>
                        {a.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">{a.score}/{a.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {subjectProgress.length > 0 && (
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Subject Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectProgress.map((s) => (
              <div key={s.subject} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{s.subject}</span>
                  <span className={`font-bold ${s.percentage >= 60 ? "text-green-500" : "text-red-500"}`}>
                    {s.percentage}%
                  </span>
                </div>
                <ProgressBar value={s.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
