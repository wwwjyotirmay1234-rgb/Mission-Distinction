import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListUsers, useGetAdminDashboardStats } from "@workspace/api-client-react";
import { Users, BookOpen, Download, TrendingUp, GraduationCap, Building2, FileBarChart } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string; color?: string }>; color: string }) {
  return (
    <Card className="bg-card/40 border-border/40">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground font-medium">{value} <span className="text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminReports() {
  const { data: usersData, isLoading: loadingUsers } = useListUsers({ role: "student", limit: 1000 });
  const { data: stats, isLoading: loadingStats } = useGetAdminDashboardStats();

  const students = usersData?.users ?? [];

  const byCollege = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => { if (s.college) map[s.college] = (map[s.college] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [students]);

  const byYear = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => { const y = s.year || "Unknown"; map[y] = (map[y] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [students]);

  const maxCollege = byCollege[0]?.[1] ?? 1;
  const maxYear = byYear[0]?.[1] ?? 1;

  const handleExportCSV = () => {
    const rows = [
      ["Name", "Email", "Year", "College", "Joined"],
      ...students.map((s) => [
        s.fullName,
        s.email,
        s.year || "",
        s.college || "",
        new Date(s.createdAt).toLocaleDateString("en-IN"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mission-distinction-students-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colorsCollege = ["bg-primary", "bg-secondary", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"];
  const colorsYear = ["bg-primary", "bg-secondary", "bg-blue-500", "bg-yellow-500"];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-secondary" /> Reports
          </h1>
          <p className="text-muted-foreground">Platform analytics, enrollment data, and content summary.</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={loadingUsers}>
          <Download className="mr-2 h-4 w-4" /> Export Students CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          Array(4).fill(0).map((_, i) => <Card key={i} className="bg-card/40 border-border/40"><CardContent className="p-5"><Skeleton className="h-8 w-full" /></CardContent></Card>)
        ) : (
          <>
            <StatCard label="Total Students" value={stats?.totalStudents ?? 0} icon={Users} color="bg-primary/10 border border-primary/20 text-primary" />
            <StatCard label="Notes" value={stats?.totalNotes ?? 0} icon={BookOpen} color="bg-blue-500/10 border border-blue-500/20 text-blue-400" />
            <StatCard label="PDFs" value={stats?.totalPdfs ?? 0} icon={Download} color="bg-green-500/10 border border-green-500/20 text-green-400" />
            <StatCard label="Quizzes" value={stats?.totalQuizzes ?? 0} icon={TrendingUp} color="bg-secondary/10 border border-secondary/20 text-secondary" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment by year */}
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-secondary" /> Enrollment by Year
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingUsers ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : byYear.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students yet.</p>
            ) : (
              byYear.map(([year, count], i) => (
                <BarRow key={year} label={year} value={count} max={maxYear} color={colorsYear[i % colorsYear.length]} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Enrollment by college */}
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-secondary" /> Enrollment by College
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingUsers ? (
              Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : byCollege.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students yet.</p>
            ) : (
              byCollege.slice(0, 10).map(([college, count], i) => (
                <BarRow key={college} label={college} value={count} max={maxCollege} color={colorsCollege[i % colorsCollege.length]} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student list snapshot */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-secondary" /> Recent Registrations
            {!loadingUsers && <Badge variant="outline" className="ml-1 text-xs">{students.length} total</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No students registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Name</th>
                    <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">Email</th>
                    <th className="text-left py-2 pr-4 font-medium">Year</th>
                    <th className="text-left py-2 font-medium hidden md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 15).map((s) => (
                    <tr key={s.id} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="py-2.5 pr-4 font-medium text-foreground">{s.fullName}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{s.email}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
                          {s.year || "—"}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground hidden md:table-cell">
                        {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length > 15 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Showing 15 of {students.length}. Export CSV to see all.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
