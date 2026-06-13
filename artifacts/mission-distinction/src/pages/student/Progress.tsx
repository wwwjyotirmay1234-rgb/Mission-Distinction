import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetMyProgress, getGetMyProgressQueryKey } from "@workspace/api-client-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Clock, Award, FileText, Badge } from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";

export default function StudentProgress() {
  const { data: progress, isLoading } = useGetMyProgress({
    query: { queryKey: getGetMyProgressQueryKey() }
  });

  const radarData = progress?.subjectProgress?.map(s => ({
    subject: s.subject,
    score: s.percentage
  })) || [
    { subject: 'Anatomy', score: 80 },
    { subject: 'Physiology', score: 65 },
    { subject: 'Biochem', score: 90 },
    { subject: 'Pharma', score: 40 },
    { subject: 'Micro', score: 55 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];
  const overallPercentage = progress ? Math.round((progress.avgScore + (progress.notesCompleted > 0 ? 80 : 0)) / 2) || 75 : 75;

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
                    data={[{ value: overallPercentage }, { value: 100 - overallPercentage }]}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={60} startAngle={90} endAngle={-270}
                    dataKey="value" stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{overallPercentage}%</span>
              </div>
            </div>
            <h3 className="font-semibold">Overall Mastery</h3>
            <p className="text-xs text-muted-foreground mt-1">Based on quizzes & reading</p>
          </CardContent>
        </Card>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mb-4">
                <Clock size={20} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Weekly Study Time</p>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold">{progress?.studyHoursWeek || 0}h</h3>}
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
                <Award size={20} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg Quiz Score</p>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold">{progress?.avgScore || 0}%</h3>}
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                <FileText size={20} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes Completed</p>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold">{progress?.notesCompleted || 0}</h3>}
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
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Weekly Goals</span>
                <span className="text-primary font-bold">80%</span>
              </CardTitle>
              <ProgressBar value={80} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center"><Target size={14} /></div>
                  <span className="text-sm">Complete Anatomy Unit 2</span>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Done</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center"><Target size={14} /></div>
                  <span className="text-sm">Take Physiology Mock Test</span>
                </div>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">In Progress</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
