import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetAdminDashboardStats, useListNotes, useListPdfs, useListBooks, useListQuizzes, useListUsers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import {
  Users, FileText, BookOpen, Brain, TrendingUp, Award, Activity, BarChart2
} from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdminAnalytics() {
  const { data: stats, isLoading: statsLoading } = useGetAdminDashboardStats();
  const { data: notes } = useListNotes({});
  const { data: pdfs } = useListPdfs({});
  const { data: books } = useListBooks({});
  const { data: quizzes } = useListQuizzes({});
  const { data: usersData } = useListUsers({ page: 1, limit: 100 });

  const notesList = Array.isArray(notes) ? notes : [];
  const pdfList = Array.isArray(pdfs) ? pdfs : [];
  const bookList = Array.isArray(books) ? books : [];
  const quizList = Array.isArray(quizzes) ? quizzes : [];
  const users = usersData?.users ?? [];

  const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Medicine", "Surgery"];

  const subjectContentData = SUBJECTS.map(subject => ({
    subject: subject.slice(0, 5),
    Notes: notesList.filter(n => n.subject === subject).length,
    PDFs: pdfList.filter(p => p.subject === subject).length,
    Books: bookList.filter(b => b.subject === subject).length,
  }));

  const contentPieData = [
    { name: "Notes", value: notesList.length },
    { name: "PDFs", value: pdfList.length },
    { name: "Books", value: bookList.length },
    { name: "Quizzes", value: quizList.length },
  ].filter(d => d.value > 0);

  const studentRoleData = [
    { name: "Students", value: users.filter((u: any) => u.role === "student").length },
    { name: "Admins", value: users.filter((u: any) => u.role === "admin").length },
  ];

  const quizSubjectData = SUBJECTS.map(subject => ({
    subject: subject.slice(0, 5),
    Quizzes: quizList.filter((q: any) => q.subject === subject).length,
  })).filter(d => d.Quizzes > 0);

  const registrationMonthData = (() => {
    const months: Record<string, number> = {};
    users.forEach((u: any) => {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({ month: month.slice(5), Students: count }));
  })();

  const totalDownloads = notesList.reduce((s, n) => s + (n.downloadCount || 0), 0)
    + pdfList.reduce((s, p) => s + (p.downloadCount || 0), 0)
    + bookList.reduce((s, b) => s + (b.downloadCount || 0), 0);

  const topNotes = [...notesList].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 5);
  const topPdfs = [...pdfList].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Platform-wide usage statistics and content insights.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: statsLoading ? null : (stats as any)?.totalStudents ?? users.filter((u: any) => u.role === "student").length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Total Content", value: notesList.length + pdfList.length + bookList.length + quizList.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Downloads", value: totalDownloads, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Total Quizzes", value: quizList.length, icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.value === null ? (
                  <Skeleton className="h-6 w-12 mt-0.5" />
                ) : (
                  <p className="text-xl font-bold">{stat.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" /> Content per Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectContentData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Notes" fill="#6366f1" radius={[3,3,0,0]} />
                <Bar dataKey="PDFs" fill="#f59e0b" radius={[3,3,0,0]} />
                <Bar dataKey="Books" fill="#8b5cf6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Student Registrations (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrationMonthData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={registrationMonthData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="Students" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Content Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {contentPieData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No content added yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={contentPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {contentPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Quizzes per Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizSubjectData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No quizzes added yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={quizSubjectData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} allowDecimals={false} />
                  <YAxis dataKey="subject" type="category" tick={{ fontSize: 11, fill: "#888" }} width={40} />
                  <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="Quizzes" fill="#8b5cf6" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" /> Top Downloaded Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topNotes.length === 0 ? (
              <div className="py-8 text-sm text-center text-muted-foreground">No notes added yet</div>
            ) : (
              <div className="space-y-2">
                {topNotes.map((note, i) => (
                  <div key={note.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{note.subject}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{note.downloadCount || 0} DL</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-400" /> Top Downloaded PDFs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPdfs.length === 0 ? (
              <div className="py-8 text-sm text-center text-muted-foreground">No PDFs added yet</div>
            ) : (
              <div className="space-y-2">
                {topPdfs.map((pdf, i) => (
                  <div key={pdf.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pdf.title}</p>
                      <p className="text-xs text-muted-foreground">{pdf.subject}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{pdf.downloadCount || 0} DL</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> User Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {studentRoleData.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/10 min-w-[140px]">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
