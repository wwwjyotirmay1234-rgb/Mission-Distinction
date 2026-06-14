import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStudentDashboardStats, useGetRecentActivity, getGetStudentDashboardStatsQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { FileText, File, CheckCircle, Flame, Play, BookOpen, Bookmark, Calendar, ArrowRight, MessageSquare, Bell } from "lucide-react";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetStudentDashboardStats({
    query: { queryKey: getGetStudentDashboardStatsQueryKey() }
  });

  const { data: activities, isLoading: activitiesLoading } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() }
  });

  // Mock data for Continue Learning
  const continueLearning = [
    { subject: "Anatomy", topic: "Upper Limb - Muscles", progress: 65, color: "bg-blue-500" },
    { subject: "Physiology", topic: "Cardiovascular System", progress: 32, color: "bg-red-500" },
    { subject: "Biochemistry", topic: "Carbohydrate Metabolism", progress: 85, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground">Ready to conquer your goals today?</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-card/50">{user?.year || "1st Year MBBS"}</Badge>
          <Badge variant="outline" className="px-3 py-1 bg-card/50">{user?.college || "My College"}</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Notes Read</p>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold">{stats?.notesCount || 0}</h2>
                <span className="text-xs text-green-500 font-medium">+{stats?.notesChangePercent || 0}%</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">from last week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">PDFs Downloaded</p>
              <File className="h-4 w-4 text-orange-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold">{stats?.pdfsDownloaded || 0}</h2>
                <span className="text-xs text-green-500 font-medium">+{stats?.pdfsChangePercent || 0}%</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Quizzes Attempted</p>
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold">{stats?.quizzesAttempted || 0}</h2>
                <span className="text-xs text-green-500 font-medium">+{stats?.quizzesChangePercent || 0}%</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 border-primary/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Study Streak</p>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">{stats?.studyStreak || 0}</h2>
                <span className="text-sm font-bold text-orange-500">Days</span>
              </div>
            )}
            <p className="text-xs font-medium text-orange-400/80 mt-1">Keep it up! 🔥</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Continue Learning</h2>
              <Link href="/student/notes">
                <Button variant="ghost" size="sm" className="text-primary h-8">View All <ArrowRight className="ml-1 w-4 h-4" /></Button>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
              {continueLearning.map((item, i) => (
                <Card key={i} className="min-w-[280px] snap-start bg-card/40 border-border/40 shrink-0">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{item.subject}</p>
                        <h3 className="font-semibold line-clamp-1">{item.topic}</h3>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color} bg-opacity-20 text-white`}>
                        <Play className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-1.5" />
                    </div>
                    <Button className="w-full mt-4 h-8 text-xs" variant="secondary">Continue</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { icon: CheckCircle, label: "Take Quiz", href: "/student/quiz", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: FileText, label: "My Notes", href: "/student/notes", color: "text-purple-500", bg: "bg-purple-500/10" },
                { icon: File, label: "PDF Library", href: "/student/pdfs", color: "text-orange-500", bg: "bg-orange-500/10" },
                { icon: Bookmark, label: "Bookmarks", href: "/student/bookmarks", color: "text-red-500", bg: "bg-red-500/10" },
                { icon: Flame, label: "Progress", href: "/student/progress", color: "text-yellow-500", bg: "bg-yellow-500/10" },
                { icon: Calendar, label: "Calendar", href: "/student/calendar", color: "text-green-500", bg: "bg-green-500/10" },
              ].map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-card/80 bg-card/40 border border-border/30 cursor-pointer transition-all hover:-translate-y-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${item.bg} ${item.color}`}>
                      <item.icon size={20} />
                    </div>
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-0">
                {activitiesLoading ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !activities || activities.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No recent activity found.</div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {activity.type === 'quiz' && <CheckCircle size={16} className="text-primary" />}
                          {activity.type === 'note' && <FileText size={16} className="text-blue-500" />}
                          {activity.type === 'pdf' && <File size={16} className="text-orange-500" />}
                          {activity.type === 'bookmark' && <Bookmark size={16} className="text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50 capitalize">{activity.type}</Badge>
                            <span className="text-xs text-muted-foreground">2 hours ago</span>
                          </div>
                        </div>
                        {activity.score && (
                          <div className="text-sm font-bold text-primary">{activity.score}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" /> Community Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {[
                  { name: "NEET PG 2025 Aspirants", msgs: 12, latest: "Has anyone completed the..." },
                  { name: "Anatomy Study Group", msgs: 3, latest: "Check out these flashcards" },
                  { name: "1st Year Doubts", msgs: 0, latest: "Thanks for the explanation!" }
                ].map((grp, i) => (
                  <div key={i} className="p-3 flex items-start gap-3 hover:bg-muted/20 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {grp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium truncate">{grp.name}</p>
                        {grp.msgs > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary rounded-full">{grp.msgs}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{grp.latest}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border/40">
                <Button variant="outline" className="w-full text-xs h-8 border-dashed">Join a New Group</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell size={16} className="text-secondary" /> News & Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {[
                  { title: "New Physiology Quiz Added", type: "update", time: "2h ago" },
                  { title: "Server Maintenance on Sunday", type: "alert", time: "1d ago" },
                  { title: "Welcome to the new platform!", type: "news", time: "3d ago" }
                ].map((news, i) => (
                  <div key={i} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 uppercase tracking-wider
                        ${news.type === 'alert' ? 'text-red-500 border-red-500/30' : 
                          news.type === 'update' ? 'text-primary border-primary/30' : 'text-blue-500 border-blue-500/30'}`}>
                        {news.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{news.time}</span>
                    </div>
                    <p className="text-sm">{news.title}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
