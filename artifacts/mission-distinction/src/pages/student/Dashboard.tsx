import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  useGetStudentDashboardStats,
  useGetRecentActivity,
  useListAnnouncements,
  useListCommunityGroups,
  getGetStudentDashboardStatsQueryKey,
  getGetRecentActivityQueryKey,
  getListAnnouncementsQueryKey,
  getListCommunityGroupsQueryKey,
} from "@workspace/api-client-react";
import { FileText, File, CheckCircle, Flame, Play, BookOpen, Bookmark, Calendar, ArrowRight, MessageSquare, Bell } from "lucide-react";
import { Link } from "wouter";

interface DashboardActivity {
  id: number;
  type: "quiz" | "note" | "pdf" | "bookmark";
  description: string;
  createdAt: string;
  score?: string;
}

interface CommunityGroup {
  id: number;
  name: string;
  description?: string;
}

interface DashboardAnnouncement {
  id: number;
  title: string;
  type: "alert" | "update" | "info";
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
];

function is1stYear(year: string | undefined | null) {
  return !year || year.toLowerCase().startsWith("1st");
}

export default function StudentDashboard() {
  const { user, updateUser } = useAuth();
  const [savingYear, setSavingYear] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleYearChange = async (newYear: string) => {
    if (!user || newYear === user.year) return;
    setSavingYear(true);
    try {
      const res = await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: newYear }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update year");
      }
      const updated = await res.json();
      updateUser(updated);
      // Invalidate all cached content so every page re-fetches for the new year
      await queryClient.invalidateQueries();
      toast.success(`Switched to ${newYear} MBBS`);
      // Redirect to Coming Soon for years that don't have content yet
      if (!is1stYear(newYear)) {
        setLocation("/coming-soon");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update year");
    } finally {
      setSavingYear(false);
    }
  };

  const { data: stats, isLoading: statsLoading } = useGetStudentDashboardStats({
    query: { queryKey: getGetStudentDashboardStatsQueryKey() },
  });

  const { data: activities, isLoading: activitiesLoading } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() },
  });

  const { data: announcements, isLoading: announcementsLoading } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey({}) } }
  );

  const { data: communityGroups, isLoading: groupsLoading } = useListCommunityGroups({
    query: { queryKey: getListCommunityGroupsQueryKey() },
  });

  const recentAnnouncements = Array.isArray(announcements) ? (announcements as unknown as DashboardAnnouncement[]).slice(0, 3) : [];
  const recentGroups = Array.isArray(communityGroups) ? (communityGroups as CommunityGroup[]).slice(0, 3) : [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground">Ready to conquer your goals today?</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select
            value={user?.year || ""}
            onValueChange={handleYearChange}
            disabled={savingYear}
          >
            <SelectTrigger className="h-7 px-3 py-1 text-xs bg-card/50 border-border/60 rounded-full w-auto gap-1.5 focus:ring-1 focus:ring-primary/50">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y} className="text-xs">{y} MBBS</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="px-2 py-1 bg-card/50 max-w-[180px] truncate block">{user?.college || "My College"}</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium">Notes Read</p>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold">{stats?.notesCount || 0}</h2>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">total notes</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium">PDFs Downloaded</p>
              <File className="h-4 w-4 text-orange-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold">{stats?.pdfsDownloaded || 0}</h2>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">total downloads</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium">Quizzes Attempted</p>
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold">{stats?.quizzesAttempted || 0}</h2>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">quizzes done</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 border-primary/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium">Study Streak</p>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  {stats?.studyStreak || 0}
                </h2>
                <span className="text-sm font-bold text-orange-500">Days</span>
              </div>
            )}
            <p className="text-xs font-medium text-orange-400/80 mt-1">Keep it up! 🔥</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                ) : !activities || (activities as DashboardActivity[]).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No recent activity. Take a quiz or read some notes to get started!
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {(activities as DashboardActivity[]).map((activity) => (
                      <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {activity.type === "quiz" && <CheckCircle size={16} className="text-primary" />}
                          {activity.type === "note" && <FileText size={16} className="text-blue-500" />}
                          {activity.type === "pdf" && <File size={16} className="text-orange-500" />}
                          {activity.type === "bookmark" && <Bookmark size={16} className="text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50 capitalize">
                              {activity.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</span>
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
          {/* Community */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" /> Community Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {groupsLoading ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentGroups.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No groups yet.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentGroups.map((grp) => (
                    <div key={grp.id} className="p-3 flex items-start gap-3 hover:bg-muted/20 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {grp.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{grp.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{grp.description || "Study together"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 border-t border-border/40">
                <Link href="/student/community">
                  <Button variant="outline" className="w-full text-xs h-8 border-dashed">
                    View Community <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell size={16} className="text-secondary" /> News & Announcements
              </CardTitle>
              <Link href="/student/announcements">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {announcementsLoading ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : recentAnnouncements.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No announcements yet.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentAnnouncements.map((a) => (
                    <div key={a.id} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 uppercase tracking-wider ${
                          a.type === "alert" ? "text-red-500 border-red-500/30" :
                          a.type === "update" ? "text-primary border-primary/30" :
                          "text-blue-500 border-blue-500/30"
                        }`}>
                          {a.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="text-sm">{a.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
