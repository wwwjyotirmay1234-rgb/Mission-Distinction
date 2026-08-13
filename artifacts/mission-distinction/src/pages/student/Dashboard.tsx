import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { registerPushIfNeeded } from "@/lib/pushSubscription";
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
import { 
  FileText, File, CheckCircle, Flame, Play, BookOpen, Bookmark, 
  Calendar, ArrowRight, MessageSquare, Bell, GraduationCap, 
  ChevronDown, Brain, CheckCircle2, XCircle, RotateCcw, Sparkles,
  Stethoscope, Share2, AlarmClock,
} from "lucide-react";
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

function QuestionOfDayWidget() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/analytics/question-of-day");
      if (res.ok) {
        const data = await res.json();
        setQuestion(data);
        if (data.answered) {
          setSelected(data.wasCorrect ? data.questionJson.correctOption : -1); // Simple logic for display
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleAnswer = async (index: number) => {
    if (!question || question.answered || submitting) return;
    setSubmitting(true);
    setSelected(index);
    try {
      const res = await apiFetch(`/api/analytics/question-of-day/${question.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedOption: index }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestion({ ...question, answered: true, wasCorrect: data.wasCorrect });
        if (data.wasCorrect) {
          toast.success("Correct answer! +5 XP earned 🧠");
        } else {
          toast.error("Not quite right, check the explanation!");
        }
      }
    } catch (e) {
      toast.error("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (!question) return null;

  const q = question.questionJson;
  const isAnswered = question.answered;

  return (
    <Card className="bg-card/40 border-blue-500/20 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Brain size={60} className="text-blue-400" />
      </div>
      <CardHeader className="p-4 pb-2 border-b border-blue-500/20 bg-blue-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" /> Question of the Day
          </CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase border-blue-500/30 text-blue-300 bg-blue-500/10">
            {question.subject}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className="text-sm font-medium leading-relaxed">{q.text}</p>
        
        <div className="space-y-2">
          {q.options.map((option: string, i: number) => {
            const isSelected = selected === i;
            const isCorrect = isAnswered && i === q.correctOption;
            const isWrong = isAnswered && isSelected && !question.wasCorrect;
            
            let variantCls = "border-border/40 bg-background/40 hover:bg-muted/40";
            if (isAnswered) {
              if (isCorrect) variantCls = "border-green-500/50 bg-green-500/10 text-green-300";
              else if (isWrong) variantCls = "border-red-500/40 bg-red-500/10 text-red-400";
              else if (isSelected) variantCls = "border-primary/40 bg-primary/10";
            } else if (isSelected) {
              variantCls = "border-primary/50 bg-primary/10";
            }

            return (
              <button
                key={i}
                disabled={isAnswered || submitting}
                onClick={() => handleAnswer(i)}
                className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${variantCls} ${!isAnswered && !submitting ? 'active:scale-[0.98]' : ''}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{option}</span>
                {isCorrect && <CheckCircle2 size={14} className="text-green-400 shrink-0" />}
                {isWrong && <XCircle size={14} className="text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-bold text-primary uppercase mb-1">Explanation</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">{q.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Day 0=Sun,1=Mon,...6=Sat — weekly MBBS subject rotation
const WEEKLY_PLAN: { subject: string; topic: string; icon: string; color: string; href: string }[][] = [
  // Sunday
  [
    { subject: "Revision", topic: "Review this week's weak areas", icon: "🔁", color: "text-purple-400", href: "/student/quiz" },
    { subject: "PYQs", topic: "Solve 10 past year questions", icon: "📄", color: "text-amber-400", href: "/student/notes" },
  ],
  // Monday
  [
    { subject: "Anatomy", topic: "Gross Anatomy — Upper Limb", icon: "🦴", color: "text-blue-400", href: "/student/pdfs" },
    { subject: "Physiology", topic: "Blood & Body Fluids", icon: "🩸", color: "text-red-400", href: "/student/notes" },
  ],
  // Tuesday
  [
    { subject: "Biochemistry", topic: "Enzyme Kinetics & Metabolism", icon: "⚗️", color: "text-green-400", href: "/student/notes" },
    { subject: "Anatomy", topic: "Histology — Epithelium & Connective Tissue", icon: "🔬", color: "text-blue-400", href: "/student/pdfs" },
  ],
  // Wednesday
  [
    { subject: "Physiology", topic: "Cardiovascular System", icon: "🫀", color: "text-red-400", href: "/student/notes" },
    { subject: "Biochemistry", topic: "Carbohydrate & Lipid Metabolism", icon: "⚗️", color: "text-green-400", href: "/student/pdfs" },
  ],
  // Thursday
  [
    { subject: "Anatomy", topic: "Neuroanatomy — Brain & Spinal Cord", icon: "🧠", color: "text-blue-400", href: "/student/pdfs" },
    { subject: "Physiology", topic: "Respiratory System", icon: "🫁", color: "text-red-400", href: "/student/notes" },
  ],
  // Friday
  [
    { subject: "Biochemistry", topic: "Vitamins, Minerals & Nutrition", icon: "💊", color: "text-green-400", href: "/student/notes" },
    { subject: "Anatomy", topic: "Embryology Essentials", icon: "🦠", color: "text-blue-400", href: "/student/pdfs" },
  ],
  // Saturday
  [
    { subject: "Mock Quiz", topic: "Full-length timed MCQ practice", icon: "✅", color: "text-primary", href: "/student/quiz" },
    { subject: "Anatomy", topic: "Lower Limb & Back", icon: "🦴", color: "text-blue-400", href: "/student/pdfs" },
  ],
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function TodayStudyPlanWidget() {
  const today = new Date().getDay();
  const plan = WEEKLY_PLAN[today];
  const dayName = DAY_NAMES[today];

  return (
    <Card className="bg-card/40 border-border/40">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar size={15} className="text-primary" />
          Today's Study Plan
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 ml-1 border-primary/30 text-primary">{dayName}</Badge>
        </CardTitle>
        <span className="text-[11px] text-muted-foreground">Day {today + 1} of 7 · 1st Year MBBS</span>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plan.map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-lg shrink-0 border border-border/40 group-hover:border-primary/30">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${item.color}`}>{item.subject}</p>
                  <p className="text-sm font-medium text-foreground leading-snug mt-0.5 line-clamp-2">{item.topic}</p>
                </div>
                <ArrowRight size={13} className="shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1 ml-auto" />
              </div>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 text-center">
          Suggested topics rotate daily — adapt to your own schedule as needed.
        </p>
      </CardContent>
    </Card>
  );
}

function ExamCountdownWidget() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/exams")
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setExams(data.filter(e => e.isGlobal)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (exams.length === 0) return null;

  return (
    <Card className="bg-card/40 border-red-500/20">
      <CardHeader className="p-4 pb-2 border-b border-red-500/10">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlarmClock size={15} className="text-red-400" /> Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {exams.slice(0, 4).map(exam => {
          const days = Math.ceil((new Date(exam.examDate).getTime() - Date.now()) / 86400000);
          const urgent = days <= 7;
          const warning = days <= 30;
          const color = urgent ? "text-red-400" : warning ? "text-amber-400" : "text-green-400";
          const bg = urgent ? "border-red-500/25 bg-red-500/5" : warning ? "border-amber-500/25 bg-amber-500/5" : "border-border/40 bg-muted/10";
          return (
            <div key={exam.id} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${bg}`}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{exam.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {exam.subject} · {new Date(exam.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className={`text-right shrink-0 ${color}`}>
                <p className="text-base font-bold leading-none">{days > 0 ? days : "—"}</p>
                <p className="text-[10px] leading-none mt-0.5">{days > 0 ? "days" : "past"}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ClinicalCaseWidget() {
  const [loading, setLoading] = useState(true);
  const [clinicalCase, setClinicalCase] = useState<{ id: number; scenario: string; subject: string; attempted: boolean } | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    apiFetch("/api/clinical-cases/today")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setClinicalCase(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-36 w-full rounded-2xl" />;
  if (!clinicalCase) return null;

  return (
    <Card
      className="bg-card/40 border-red-500/20 overflow-hidden relative group cursor-pointer hover:border-red-500/40 transition-colors"
      onClick={() => setLocation("/student/clinical-case")}
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Stethoscope size={56} className="text-red-400" />
      </div>
      <CardHeader className="p-4 pb-2 border-b border-red-500/20 bg-red-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Stethoscope size={15} className="text-red-400" /> Clinical Case of the Day
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] uppercase border-red-500/30 text-red-300 bg-red-500/10">
              {clinicalCase.subject}
            </Badge>
            {clinicalCase.attempted && (
              <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/25 bg-green-500/5">
                ✓ Done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">{clinicalCase.scenario}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {clinicalCase.attempted ? "View your feedback →" : "+15 XP · AI evaluation"}
          </span>
          <ArrowRight size={13} className="text-red-400" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user, updateUser } = useAuth();
  const [savingYear, setSavingYear] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [pendingYear, setPendingYear] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setTimeout(() => registerPushIfNeeded(), 3000);
    }
  }, [user?.id]);

  const handleYearChange = async (newYear: string) => {
    if (!user || newYear === user.year) return;
    // Ask for confirmation before switching years
    setPendingYear(newYear);
  };

  const confirmYearChange = async () => {
    if (!user || !pendingYear) return;
    setSavingYear(true);
    const newYear = pendingYear;
    setPendingYear(null);
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
      toast.success(`Switched to ${newYear} MBBS! 🎓`);
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
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(" ")[0]}! ⚽
          </h1>
          <p className="text-sm text-muted-foreground">Kick off your study session — match day is every day.</p>
        </div>
        <div className="flex flex-row flex-wrap gap-2 items-center">
          {/* Academic Year selector */}
          <div className="flex items-center gap-2 bg-card border border-border/60 rounded-xl px-3 py-2 shadow-sm">
            <GraduationCap size={15} className="text-primary shrink-0" />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Academic Year</span>
            <Select
              value={user?.year || ""}
              onValueChange={handleYearChange}
              disabled={savingYear}
            >
              <SelectTrigger className="h-7 px-2 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1 font-semibold text-foreground w-auto min-w-[90px]">
                <SelectValue placeholder="Select year" />
                <ChevronDown size={12} className="text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y} className="text-sm">
                    <span className="font-medium">{y} MBBS</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {savingYear && <span className="text-[10px] text-muted-foreground animate-pulse">Saving…</span>}
          </div>
          <Badge variant="outline" className="px-2 py-1.5 bg-card/50 max-w-[180px] truncate text-xs">{user?.college || "My College"}</Badge>
        </div>

        {/* Year change confirmation dialog */}
        {pendingYear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPendingYear(null)} />
            <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Change Academic Year?</h3>
                  <p className="text-xs text-muted-foreground">This updates your year across the app</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                You're switching to <span className="font-semibold text-foreground">{pendingYear} MBBS</span>.
                {!is1stYear(pendingYear) && (
                  <span className="block mt-1 text-amber-400/90">
                    ⚠️ Content for {pendingYear} is coming soon — you'll be redirected to the waiting page.
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                  onClick={() => setPendingYear(null)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  onClick={confirmYearChange}
                >
                  Yes, Switch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between pb-1.5">
              <p className="text-xs sm:text-sm font-medium">Notes Read</p>
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
            </div>
            {statsLoading ? <Skeleton className="h-7 w-12 mt-1" /> : (
              <h2 className="text-2xl sm:text-3xl font-bold">{stats?.notesCount || 0}</h2>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">total notes</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between pb-1.5">
              <p className="text-xs sm:text-sm font-medium">PDFs</p>
              <File className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
            </div>
            {statsLoading ? <Skeleton className="h-7 w-12 mt-1" /> : (
              <h2 className="text-2xl sm:text-3xl font-bold">{stats?.pdfsDownloaded || 0}</h2>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">downloaded</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-primary/20 relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between pb-1.5">
              <p className="text-xs sm:text-sm font-medium">Matches</p>
              <span className="text-sm sm:text-base shrink-0">⚽</span>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-12 mt-1" /> : (
              <h2 className="text-2xl sm:text-3xl font-bold text-primary">{stats?.quizzesAttempted || 0}</h2>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">played</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 border-amber-500/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between pb-1.5">
              <p className="text-xs sm:text-sm font-medium">Win Streak</p>
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
            </div>
            {statsLoading ? <Skeleton className="h-7 w-12 mt-1" /> : (
              <div className="flex items-baseline gap-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                  {stats?.studyStreak || 0}
                </h2>
                <span className="text-xs font-bold text-amber-500">Days</span>
              </div>
            )}
            <p className="text-[10px] sm:text-xs font-medium text-amber-400/80 mt-1">Keep it up! 🔥</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Study Plan */}
      <TodayStudyPlanWidget />

      {/* Clinical Case + Question of Day — full width, visible immediately on all screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ClinicalCaseWidget />
        <QuestionOfDayWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Quick Access */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3">Quick Access</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              {[
                { icon: CheckCircle, label: "Take Quiz", href: "/student/quiz", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: FileText, label: "My Notes", href: "/student/notes", color: "text-purple-500", bg: "bg-purple-500/10" },
                { icon: File, label: "PDF Library", href: "/student/pdfs", color: "text-orange-500", bg: "bg-orange-500/10" },
                { icon: Flame, label: "Progress", href: "/student/progress", color: "text-yellow-500", bg: "bg-yellow-500/10" },
                { icon: Calendar, label: "Calendar", href: "/student/calendar", color: "text-green-500", bg: "bg-green-500/10" },
              ].map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl hover:bg-card/80 bg-card/40 border border-border/30 cursor-pointer transition-all hover:-translate-y-1 active:scale-95">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 ${item.bg} ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-2">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3">Recent Activity</h2>
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
                    No recent activity. Take a quiz or read some notes to kick off! ⚽
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
          {/* Exam Countdown */}
          <ExamCountdownWidget />

          {/* Community */}
          <Card className="bg-card/40 border-pink-500/20">
            <CardHeader className="p-4 pb-2 border-b border-pink-500/20 bg-pink-500/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare size={16} className="text-pink-400" /> Community Chat
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
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center text-xs shrink-0">
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
              <div className="p-3 border-t border-pink-500/10">
                <Link href="/student/community">
                  <Button variant="outline" className="w-full text-xs h-8 border-dashed border-pink-500/30 text-pink-300 hover:bg-pink-500/10">
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

      {/* Invite Batchmates */}
      <button
        onClick={() => {
          const appUrl = window.location.origin;
          const text = `🎓 *Mission Distinction — MBBS Study App*\n\nHey! Come study with me on Mission Distinction 📚\n\n✅ AI Viva Examiner\n✅ Clinical Cases of the Day\n✅ Instant Doubt Solver\n✅ PYQ Quizzes & Flashcards\n\nFree to use → ${appUrl}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        }}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[#25D366]/25 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors text-left group"
      >
        <div className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/25 transition-colors">
          <Share2 size={16} className="text-[#25D366]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#25D366]">Invite Batchmates</p>
          <p className="text-xs text-muted-foreground">Share Mission Distinction with your batch on WhatsApp</p>
        </div>
        <ArrowRight size={14} className="text-[#25D366]/60 shrink-0" />
      </button>
    </div>
  );
}
