import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch, type User as ApiUser } from "@workspace/api-client-react";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Shield, Key, User, Info, Eye, EyeOff, CheckCircle2, Camera, Loader2, CalendarDays, Trash2, Plus, ArrowRight, Users } from "lucide-react";
import { MBBS_YEARS, SESSION_YEARS } from "@/lib/colleges";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminSettings() {
  const { user, login, token, updateUser } = useAuth();

  const [name, setName] = useState(user?.fullName ?? "");
  const [savingName, setSavingName] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Promote batch ──────────────────────────────────────────────────────────
  const [promoteForm, setPromoteForm] = useState({ fromYear: "1st Year", fromSessionYear: "2025-26", toYear: "2nd Year" });
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [sampleStudents, setSampleStudents] = useState<{ fullName: string; email: string }[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const handlePromotePreview = async () => {
    setPreviewing(true);
    setPreviewCount(null);
    setSampleStudents([]);
    try {
      const params = new URLSearchParams({ fromYear: promoteForm.fromYear, fromSessionYear: promoteForm.fromSessionYear });
      const r = await apiFetch(`/api/super-admin/promote-batch/preview?${params}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setPreviewCount(data.count);
      setSampleStudents(data.sample ?? []);
    } catch { toast.error("Failed to load preview."); }
    finally { setPreviewing(false); }
  };

  const handlePromoteBatch = async () => {
    setPromoting(true);
    try {
      const r = await apiFetch("/api/super-admin/promote-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promoteForm),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      const data = await r.json();
      toast.success(`${data.promoted} student${data.promoted !== 1 ? "s" : ""} promoted to ${promoteForm.toYear}!`);
      setPreviewCount(null);
      setSampleStudents([]);
    } catch (err: any) { toast.error(err.message || "Promotion failed."); }
    finally { setPromoting(false); }
  };

  // ── Exam schedule ──────────────────────────────────────────────────────────
  const [globalExams, setGlobalExams] = useState<any[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examForm, setExamForm] = useState({ title: "", subject: "All Subjects", examDate: "", sessionYear: "2025-26" });
  const [savingExam, setSavingExam] = useState(false);

  useEffect(() => {
    apiFetch("/api/exams?all=1")
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setGlobalExams(data.filter(e => e.isGlobal).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())))
      .catch(() => {})
      .finally(() => setExamsLoading(false));
  }, []);

  const handleAddExam = async () => {
    if (!examForm.title.trim() || !examForm.examDate) { toast.error("Please fill in title and date."); return; }
    setSavingExam(true);
    try {
      const r = await apiFetch("/api/exams/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examForm.title.trim(),
          subject: examForm.subject,
          examDate: examForm.examDate,
          sessionYear: examForm.sessionYear === "all" ? null : examForm.sessionYear,
        }),
      });
      if (!r.ok) throw new Error();
      const newExam = await r.json();
      setGlobalExams(prev => [...prev, newExam].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()));
      setExamForm({ title: "", subject: "All Subjects", examDate: "", sessionYear: "2025-26" });
      toast.success("Exam date added! Students will see the countdown.");
    } catch { toast.error("Failed to add exam."); }
    finally { setSavingExam(false); }
  };

  const handleDeleteExam = async (id: number) => {
    try {
      const r = await apiFetch(`/api/exams/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setGlobalExams(prev => prev.filter(e => e.id !== id));
      toast.success("Exam removed.");
    } catch { toast.error("Failed to delete exam."); }
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() ?? "AD";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Image must be under 30 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await apiFetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json();
        throw new Error(d.error || "Upload failed");
      }
      const { url } = await uploadRes.json();
      const patchRes = await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!patchRes.ok) throw new Error("Failed to save avatar");
      const updatedUser = await patchRes.json();
      updateUser(updatedUser);
      login({ token: token!, user: updatedUser });
      setAvatarUrl(url);
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    setSavingName(true);
    try {
      const updated = await customFetch<ApiUser>(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });
      login({ token: token!, user: updated });
      toast.success("Name updated successfully.");
    } catch {
      toast.error("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      toast.error("All password fields are required.");
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await customFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      toast.success("Password changed successfully.");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password. Check your current password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account and platform configuration.</p>
      </div>

      {/* Profile card */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-secondary" /> Admin Profile
          </CardTitle>
          <CardDescription>Update your display name. Email cannot be changed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                <AvatarImage key={avatarUrl || user?.avatarUrl || "none"} src={avatarUrl || user?.avatarUrl || ""} />
                <AvatarFallback className="text-xl bg-secondary/20 text-secondary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <p className="font-semibold text-foreground">{user?.fullName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wider border-secondary/30 text-secondary bg-secondary/5">
                  Administrator
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                className="gap-2 w-fit"
                asChild
              >
                <label htmlFor="admin-avatar-upload" className="cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : "Change Avatar"}
                </label>
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 30 MB</p>
            </div>
            <input
              id="admin-avatar-upload"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={handleAvatarChange}
            />
          </div>

          <Separator className="border-border/40" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                className="bg-background/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                className="bg-muted/50 text-muted-foreground"
                value={user?.email ?? ""}
                disabled
              />
            </div>
          </div>
          <Button onClick={handleSaveName} disabled={savingName || name === user?.fullName}>
            {savingName ? "Saving..." : "Save Name"}
          </Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4 text-secondary" /> Change Password
          </CardTitle>
          <CardDescription>Update your admin account password. Minimum 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["current", "next", "confirm"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <Label>
                {field === "current"
                  ? "Current Password"
                  : field === "next"
                  ? "New Password"
                  : "Confirm New Password"}
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  className="bg-background/50 pr-10"
                  placeholder="••••••••"
                  value={pwForm[field]}
                  onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                />
                {field === "next" && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw((p) => !p)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <Button onClick={handleChangePassword} disabled={savingPw}>
            {savingPw ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Platform info */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-secondary" /> Platform Information
          </CardTitle>
          <CardDescription>Configuration details for Mission Distinction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Platform Name", value: "Mission Distinction" },
            { label: "Target Audience", value: "1st Year MBBS — Odisha" },
            { label: "Admin Invite Code", value: "Protected — set via ADMIN_INVITE_CODE env var" },
            { label: "Authentication", value: "JWT + Firebase Google Auth" },
            { label: "Database", value: "PostgreSQL (Drizzle ORM)" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/40 bg-muted/10"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground">{value}</span>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-2 px-4 py-3 rounded-lg border border-green-500/20 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <span className="text-sm text-green-400">All systems operational</span>
          </div>
        </CardContent>
      </Card>

      {/* Exam Schedule */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-secondary" /> Exam Schedule
          </CardTitle>
          <CardDescription>Set exam dates per batch — students see a live countdown on their dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Exam Title</Label>
              <Input className="bg-background/50" placeholder="e.g. Anatomy Theory Exam" value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Select value={examForm.subject} onValueChange={v => setExamForm(f => ({ ...f, subject: v }))}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All Subjects", "Anatomy", "Physiology", "Biochemistry"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Batch</Label>
              <Select value={examForm.sessionYear} onValueChange={v => setExamForm(f => ({ ...f, sessionYear: v }))}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches (shared)</SelectItem>
                  <SelectItem value="2025-26">2025-26 Batch</SelectItem>
                  <SelectItem value="2026-27">2026-27 Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Exam Date & Time</Label>
              <Input type="datetime-local" className="bg-background/50" value={examForm.examDate} onChange={e => setExamForm(f => ({ ...f, examDate: e.target.value }))} />
            </div>
          </div>
          <Button onClick={handleAddExam} disabled={savingExam} className="gap-2">
            {savingExam ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {savingExam ? "Adding…" : "Add Exam Date"}
          </Button>

          <Separator />

          {/* Existing exams */}
          {examsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : globalExams.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No exam dates added yet.</p>
          ) : (
            <div className="space-y-2">
              {globalExams.map((exam: any) => {
                const days = Math.ceil((new Date(exam.examDate).getTime() - Date.now()) / 86400000);
                return (
                  <div key={exam.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-muted/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exam.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {exam.subject} · {new Date(exam.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${exam.sessionYear ? "border-blue-500/30 text-blue-400" : "border-green-500/30 text-green-400"}`}>
                          {exam.sessionYear ?? "All Batches"}
                        </Badge>
                      </div>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${days <= 7 ? "text-red-400" : days <= 30 ? "text-amber-400" : "text-muted-foreground"}`}>
                      {days > 0 ? `${days}d left` : "Past"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDeleteExam(exam.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promote Batch — super admin only */}
      {user?.isSuperAdmin && (
        <Card className="bg-card/40 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" /> Promote Batch
            </CardTitle>
            <CardDescription>Move all students in a batch from one academic year to the next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From Year</Label>
                <Select value={promoteForm.fromYear} onValueChange={v => { setPromoteForm(f => ({ ...f, fromYear: v })); setPreviewCount(null); setSampleStudents([]); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{MBBS_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Session Year</Label>
                <Select value={promoteForm.fromSessionYear} onValueChange={v => { setPromoteForm(f => ({ ...f, fromSessionYear: v })); setPreviewCount(null); setSampleStudents([]); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{SESSION_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Promote To</Label>
                <Select value={promoteForm.toYear} onValueChange={v => { setPromoteForm(f => ({ ...f, toYear: v })); setPreviewCount(null); setSampleStudents([]); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{MBBS_YEARS.filter(y => y !== promoteForm.fromYear).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <Button variant="outline" size="sm" onClick={handlePromotePreview} disabled={previewing} className="w-full">
              {previewing ? <Loader2 size={14} className="animate-spin mr-2" /> : <ArrowRight size={14} className="mr-2" />}
              {previewing ? "Loading preview…" : "Preview affected students"}
            </Button>

            {previewCount !== null && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                <p className="text-sm font-medium text-amber-400">
                  {previewCount === 0
                    ? "No students found matching this batch."
                    : `${previewCount} student${previewCount !== 1 ? "s" : ""} will be promoted from ${promoteForm.fromYear} → ${promoteForm.toYear}`}
                </p>
                {sampleStudents.length > 0 && (
                  <ul className="space-y-0.5">
                    {sampleStudents.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground truncate">{s.fullName} — {s.email}</li>
                    ))}
                    {previewCount > 5 && <li className="text-xs text-muted-foreground">…and {previewCount - 5} more</li>}
                  </ul>
                )}
                {previewCount > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold" disabled={promoting}>
                        {promoting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                        Confirm & Promote {previewCount} student{previewCount !== 1 ? "s" : ""}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Promote {previewCount} student{previewCount !== 1 ? "s" : ""}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will move all {promoteForm.fromSessionYear} students currently in <strong>{promoteForm.fromYear}</strong> to <strong>{promoteForm.toYear}</strong>. This cannot be undone automatically.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePromoteBatch} className="bg-amber-500 hover:bg-amber-600 text-black">
                          Yes, promote them
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security note */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-secondary" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Password Hashing", desc: "SHA-256 with server-side salt" },
            { label: "Session Tokens", desc: "JWT signed tokens, 30-day expiry" },
            { label: "Route Protection", desc: "Admin middleware on all write operations" },
            { label: "Input Validation", desc: "All IDs and inputs validated server-side" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start justify-between px-4 py-3 rounded-lg border border-border/40 bg-muted/10 gap-4">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-sm text-muted-foreground text-right">{desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
