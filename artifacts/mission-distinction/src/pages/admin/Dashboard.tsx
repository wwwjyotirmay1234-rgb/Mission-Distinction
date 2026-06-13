import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminDashboardStats, useGetTopSubjects, useGetStudentGrowth, useGetContentOverview,
  getGetAdminDashboardStatsQueryKey, getGetTopSubjectsQueryKey, getGetStudentGrowthQueryKey, getGetContentOverviewQueryKey 
} from "@workspace/api-client-react";
import { Users, FileText, File, Book, CheckCircle, Plus, Megaphone, Newspaper, LayoutGrid, Activity, Calendar } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, Admin! 🚀</h1>
          <p className="text-muted-foreground">Here is what's happening on your platform today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-card/50">
            <Calendar className="mr-2 h-4 w-4" /> This Week
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs sm:text-sm font-medium">Total Students</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold">{stats?.totalStudents || 0}</h2>
                <span className="text-[10px] sm:text-xs text-green-500 font-medium">+{stats?.studentsChangePercent || 0}%</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs sm:text-sm font-medium">Total Notes</p>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold">{stats?.totalNotes || 0}</h2>
                <span className="text-[10px] sm:text-xs text-green-500 font-medium">+{stats?.notesChangePercent || 0}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs sm:text-sm font-medium">Total PDFs</p>
              <File className="h-4 w-4 text-orange-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold">{stats?.totalPdfs || 0}</h2>
                <span className="text-[10px] sm:text-xs text-green-500 font-medium">+{stats?.pdfsChangePercent || 0}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs sm:text-sm font-medium">Total Books</p>
              <Book className="h-4 w-4 text-purple-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold">{stats?.totalBooks || 0}</h2>
                <span className="text-[10px] sm:text-xs text-green-500 font-medium">+{stats?.booksChangePercent || 0}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs sm:text-sm font-medium">Total Quizzes</p>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold">{stats?.totalQuizzes || 0}</h2>
                <span className="text-[10px] sm:text-xs text-green-500 font-medium">+{stats?.quizzesChangePercent || 0}%</span>
              </div>
            )}
          </CardContent>
        </Card>
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
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                          itemStyle={{ color: '#fff' }}
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
                        <Pie
                          data={overview || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {(overview || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend 
                          verticalAlign="middle" 
                          align="right" 
                          layout="vertical"
                          iconType="circle"
                          wrapperStyle={{ fontSize: '12px' }}
                        />
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
              {[
                { label: "Add Note", icon: Plus, bg: "bg-primary/20", color: "text-primary" },
                { label: "Upload PDF", icon: File, bg: "bg-orange-500/20", color: "text-orange-500" },
                { label: "Add Book", icon: Book, bg: "bg-purple-500/20", color: "text-purple-500" },
                { label: "Create Quiz", icon: CheckCircle, bg: "bg-green-500/20", color: "text-green-500" },
                { label: "Announce", icon: Megaphone, bg: "bg-red-500/20", color: "text-red-500" },
                { label: "Publish News", icon: Newspaper, bg: "bg-blue-500/20", color: "text-blue-500" },
                { label: "Add Subject", icon: LayoutGrid, bg: "bg-yellow-500/20", color: "text-yellow-500" },
              ].map((action, i) => (
                <Button key={i} variant="outline" className="h-auto py-3 px-2 flex flex-col items-center gap-2 bg-card/40 border-border/40 hover:bg-card hover:-translate-y-0.5 transition-transform">
                  <div className={`w-8 h-8 rounded-full ${action.bg} ${action.color} flex items-center justify-center`}>
                    <action.icon size={16} />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button variant="ghost" size="sm" className="text-secondary h-8">View All</Button>
            </div>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {[
                    { user: "Rahul Sharma", action: "registered as new student", time: "10 mins ago", icon: Users, color: "text-blue-500" },
                    { user: "Dr. Anjali", action: "uploaded a new PDF 'Anatomy Notes CH1'", time: "45 mins ago", icon: File, color: "text-orange-500" },
                    { user: "System", action: "Quiz 'NEET Mock 1' was published", time: "2 hours ago", icon: CheckCircle, color: "text-green-500" },
                    { user: "Priya Singh", action: "reported an issue with a question", time: "3 hours ago", icon: Activity, color: "text-red-500" }
                  ].map((act, i) => (
                    <div key={i} className="p-4 flex items-start gap-4 hover:bg-muted/20">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <act.icon size={14} className={act.color} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm"><span className="font-medium text-foreground">{act.user}</span> <span className="text-muted-foreground">{act.action}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{act.time}</p>
                      </div>
                    </div>
                  ))}
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

          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Megaphone size={16} className="text-secondary" /> Recent Announcements
              </CardTitle>
              <a href="#" className="text-xs text-secondary hover:underline">Manage All</a>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {[
                  { title: "System Maintenance", date: "Oct 24, 2023" },
                  { title: "New Content Upload Guidelines", date: "Oct 20, 2023" },
                ].map((ann, i) => (
                  <div key={i} className="p-4 hover:bg-muted/20">
                    <p className="text-sm font-medium line-clamp-1">{ann.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ann.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity size={16} className="text-green-500" /> System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-medium">{stats?.totalStudents || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Today</span>
                <span className="font-medium">{stats?.activeUsersToday || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Content Published</span>
                <span className="font-medium">{stats?.totalContentPublished || 0}</span>
              </div>
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
