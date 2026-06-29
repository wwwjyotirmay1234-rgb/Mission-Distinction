import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetAdminDashboardStats, useGetTopSubjects, useGetStudentGrowth, useGetContentOverview,
  useListAnnouncements,
  getGetAdminDashboardStatsQueryKey, getGetTopSubjectsQueryKey, getGetStudentGrowthQueryKey,
  getGetContentOverviewQueryKey, getListAnnouncementsQueryKey,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { Link } from "wouter";
import {
  Users, FileText, File, Book, CheckCircle, Plus, Megaphone, Newspaper,
  LayoutGrid, Activity, UserPlus, MessageSquare, Brain, Home,
} from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

function timeAgo(dateStr: string | Date) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const EVENT_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  register: { icon: UserPlus, color: "text-blue-400" },
  quiz:     { icon: CheckCircle, color: "text-green-400" },
  activity: { icon: Activity, color: "text-primary" },
  doubt:    { icon: MessageSquare, color: "text-amber-400" },
  study_room: { icon: Users, color: "text-purple-400" },
  confession: { icon: Brain, color: "text-pink-400" },
};

const QUICK_ACTIONS = [
  { label: "Add Note",    icon: Plus,        bg: "bg-primary/20",      color: "text-primary",     href: "/admin/content/notes" },
  { label: "Upload PDF",  icon: File,        bg: "bg-orange-500/20",   color: "text-orange-500",  href: "/admin/content/pdfs" },
  { label: "Add Book",    icon: Book,        bg: "bg-purple-500/20",   color: "text-purple-500",  href: "/admin/content/books" },
  { label: "Create Quiz", icon: CheckCircle, bg: "bg-green-500/20",    color: "text-green-500",   href: "/admin/quizzes" },
  { label: "Announce",    icon: Megaphone,   bg: "bg-red-500/20",      color: "text-red-500",     href: "/admin/announcements" },
  { label: "Publish News",icon: Newspaper,   bg: "bg-blue-500/20",     color: "text-blue-500",    href: "/admin/announcements" },
  { label: "Dashboard",   icon: Home,        bg: "bg-yellow-500/20",   color: "text-yellow-500",  href: "/admin/dashboard" },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useGetAdminDashboardStats({
    query: { queryKey: getGetAdminDashboardStatsQueryKey() }
  });
  const { data: topSubjects, isLoading: topLoading } = useGetTopSubjects({
    query: { queryKey: getGetTopSubjectsQueryKey() }
  });
  const { data: growth, isLoading: growthLoading } = useGetStudentGrowth({
    query: { queryKey: getGetStudentGrowthQueryKey() }
  });
  const { data: overview, isLoading: overviewLoading } = useGetContentOverview({
    query: { queryKey: getGetContentOverviewQueryKey() }
  });
  const { data: announcements, isLoading: annLoading } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey({}) } }
  );
  const { data: activityFeed, isLoading: feedLoading } = useQuery({
    queryKey: ["admin-activity-feed"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/activity-feed");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        events: { id: string; type: string; label: string; meta: string; time: string }[];
        stats: { totalUsers: number; todayRegistrations: number; todayQuizAttempts: number };
      }>;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const recentAnnouncements = Array.isArray(announcements) ? (announcements as any[]).slice(0, 3) : [];
  const recentEvents = activityFeed?.events?.slice(0, 6) ?? [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(" ")[0] ?? "Admin"}! 🚀
          </h1>
          <p className="text-muted-foreground">Here is what's happening on your platform today.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(
          [
            { label: "Total Students", value: stats?.totalStudents, change: stats?.studentsChangePercent, icon: Users as React.ElementType, color: "text-blue-500" },
            { label: "Total Notes",    value: stats?.totalNotes,    change: stats?.notesChangePercent,    icon: FileText as React.ElementType, color: "text-primary" },
            { label: "Total PDFs",     value: stats?.totalPdfs,     change: stats?.pdfsChangePercent,     icon: File as React.ElementType, color: "text-orange-500" },
            { label: "Total Books",    value: stats?.totalBooks,    change: stats?.booksChangePercent,    icon: Book as React.ElementType, color: "text-purple-500" },
            { label: "Total Quizzes",  value: stats?.totalQuizzes,  change: stats?.quizzesChangePercent,  icon: CheckCircle as React.ElementType, color: "text-green-500" },
          ] as { label: string; value: number | undefined; change: number | undefined; icon: React.ElementType; color: string }[]
        ).map(({ label, value, change, icon: Icon, color }) => (
          <Card key={label} className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-xs sm:text-sm font-medium">{label}</p>
                {React.createElement(Icon as any, { className: `h-4 w-4 ${color}` })}
              </div>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl sm:text-3xl font-bold">{value || 0}</h2>
                  {(change ?? 0) > 0 && (
                    <span className="text-[10px] sm:text-xs text-green-500 font-medium">+{change}%</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Student Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  {growthLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growth || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Content Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full relative">
                  {overviewLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={overview || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                          {(overview || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none -ml-[120px]">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats?.totalContentPublished || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="outline" className="w-full h-auto py-3 px-2 flex flex-col items-center gap-2 bg-card/40 border-border/40 hover:bg-card hover:-translate-y-0.5 transition-transform">
                    <div className={`w-8 h-8 rounded-full ${action.bg} ${action.color} flex items-center justify-center`}>
                      <action.icon size={16} />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity — live from API */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Link href="/admin/audit-log">
                <Button variant="ghost" size="sm" className="text-primary h-8">View All</Button>
              </Link>
            </div>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {feedLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="p-4 flex items-start gap-4">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))
                  ) : recentEvents.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <Activity size={24} className="mx-auto mb-2 opacity-30" />
                      No recent activity yet.
                    </div>
                  ) : (
                    recentEvents.map((evt) => {
                      const cfg = EVENT_ICON[evt.type] ?? EVENT_ICON.activity;
                      const Icon = cfg.icon;
                      return (
                        <div key={evt.id} className="p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            {React.createElement(cfg.icon as any, { size: 14, className: cfg.color })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground line-clamp-1">{evt.label}</p>
                            {evt.meta && <p className="text-xs text-muted-foreground mt-0.5">{evt.meta}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(evt.time)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid size={16} className="text-primary" /> Top Subjects (1st Year)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {topLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (topSubjects || []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No subject data yet.</p>
              ) : (
                (topSubjects || []).map((subject, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{subject.subject}</span>
                      <span className="text-muted-foreground">{subject.percentage}%</span>
                    </div>
                    <Progress value={subject.percentage} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Announcements — live */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Megaphone size={16} className="text-amber-400" /> Recent Announcements
              </CardTitle>
              <Link href="/admin/announcements">
                <span className="text-xs text-primary hover:underline cursor-pointer">Manage</span>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {annLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentAnnouncements.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No announcements yet.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentAnnouncements.map((ann: any) => (
                    <div key={ann.id} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className={`text-[9px] shrink-0 mt-0.5 capitalize ${
                          ann.type === "alert" ? "border-red-500/40 text-red-400 bg-red-500/10"
                          : ann.type === "update" ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                          : "border-border/40 text-muted-foreground"
                        }`}>{ann.type}</Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{ann.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(ann.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity size={16} className="text-green-500" /> System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { label: "Total Users",       value: stats?.totalStudents || 0 },
                { label: "Active Today",       value: stats?.activeUsersToday || 0 },
                { label: "Content Published",  value: stats?.totalContentPublished || 0 },
                { label: "Today Joins",        value: activityFeed?.stats?.todayRegistrations || 0 },
                { label: "Today Quiz Attempts",value: activityFeed?.stats?.todayQuizAttempts || 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Server Status</span>
                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 hover:bg-green-500/10 px-1.5 py-0">Online</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">App Version</span>
                <span className="font-medium text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{stats?.appVersion || "v1.0.0"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
