import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetMyProgress, getGetMyProgressQueryKey, useListQuizAttempts, getListQuizAttemptsQueryKey } from "@workspace/api-client-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Award, FileText, CheckCircle, Flame, Zap, Trophy, BookOpen, Download, Users } from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { XPProgressBar } from "@/components/XPProgressBar";
import { RankBadge } from "@/components/RankBadge";
import { useXPStats } from "@/hooks/useXPStats";
import { RANKS } from "@/lib/ranks";

interface QuizAttempt {
  id: number;
  quizTitle: string;
  subject: string;
  percentage: number;
  score: number;
  total: number;
  createdAt: string;
}

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

  const { data: xpStats, isLoading: xpLoading } = useXPStats();
  const xp = xpStats?.totalXp ?? 0;
  const rankLevel = xpStats?.currentRankLevel ?? 1;

  const XP_SOURCES = [
    { icon: Trophy, label: "Quiz completion", xp: "50 XP" },
    { icon: CheckCircle, label: "Correct answer", xp: "5 XP each" },
    { icon: Flame, label: "Daily login", xp: "30 XP + streak bonus" },
    { icon: BookOpen, label: "Reading notes", xp: "15 XP" },
    { icon: Download, label: "PDF download", xp: "10 XP" },
    { icon: Users, label: "Community post", xp: "30 XP" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">My Progress</h1>
        <p className="text-muted-foreground">Track your learning journey and subject mastery.</p>
      </div>

      {/* ── XP & Rank Card ── */}
      <Card className="bg-card/40 border-border/40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 pointer-events-none" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Zap size={18} className="text-amber-400" /> XP & Rank
            </h3>
            <RankBadge level={rankLevel} showName size="md" />
          </div>
          {xpLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : (
            <XPProgressBar xp={xp} />
          )}

          <div className="mt-5 pt-4 border-t border-border/30">
            <p className="text-xs font-semibold text-muted-foreground mb-3">How to earn XP</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {XP_SOURCES.map(({ icon: Icon, label, xp: xpVal }) => (
                <div key={label} className="flex items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-1.5">
                  <Icon size={13} className="text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">{label}</p>
                    <p className="text-xs font-bold text-amber-400">{xpVal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Rank Progression ── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Rank Progression</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {RANKS.map(rank => {
            const unlocked = rankLevel >= rank.level;
            return (
              <div
                key={rank.level}
                className={`rounded-xl border p-3 text-center transition-all ${
                  unlocked
                    ? `${rank.bgClass} ${rank.borderClass}`
                    : "border-border/30 bg-muted/10 opacity-50"
                }`}
              >
                <div className="text-2xl mb-1">{unlocked ? rank.emoji : "🔒"}</div>
                <p className={`text-[10px] font-bold ${unlocked ? rank.textClass : "text-muted-foreground"}`}>
                  {rank.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {rank.min === 0 ? "Start" : rank.min.toLocaleString() + " XP"}
                </p>
                {unlocked && (
                  <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${rank.bgClass} ${rank.textClass}`}>
                    ✓ Unlocked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent XP History ── */}
      {xpStats?.recentHistory && xpStats.recentHistory.length > 0 && (
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Recent XP Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {xpStats.recentHistory.slice(0, 8).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Zap size={12} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-amber-400 shrink-0">+{tx.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                {[...(attempts as QuizAttempt[])].reverse().slice(0, 8).map((a) => (
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
