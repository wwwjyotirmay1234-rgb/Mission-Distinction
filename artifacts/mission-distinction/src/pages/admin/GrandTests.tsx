import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, MoreVertical, Trash2, Pencil, ClipboardList,
  Users, Trophy, Eye, EyeOff, AlarmClock, BookOpen,
  ChevronDown, ChevronRight, CheckCircle2, Loader2, Star, KeyRound, Lock, Copy,
} from "lucide-react";
import BatchMigrateButton from "@/components/admin/BatchMigrateButton";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Mixed", "University Exams"];

type GrandTest = {
  id: number; title: string; subject: string; description: string | null;
  duration_minutes: number; available_from: string | null; available_until: string | null;
  is_published: boolean; question_count: number; submission_count: number; created_at: string;
  session_year: string | null; answers_released?: boolean;
};
type Question = {
  id: number; test_id: number; question_text: string; question_type: string;
  max_marks: number; order_index: number; model_answer: string | null;
};

const QKEY = ["grand-tests-admin"];
const Q_DETAIL_KEY = (id: number) => ["grand-test-admin", id];

function useGrandTests() {
  return useQuery<GrandTest[]>({
    queryKey: QKEY,
    queryFn: async () => {
      const r = await apiFetch("/api/grand-tests/admin");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });
}

function useTestDetail(id: number | null) {
  return useQuery<GrandTest & { questions: Question[] }>({
    queryKey: Q_DETAIL_KEY(id!),
    queryFn: async () => {
      const r = await apiFetch(`/api/grand-tests/admin/${id}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: id !== null,
  });
}

const EMPTY_FORM = { title: "", subject: "", description: "", durationMinutes: "180", availableFrom: "", availableUntil: "", isPublished: false, sessionYear: "1st Year" };
const EMPTY_Q = { questionText: "", questionType: "long", maxMarks: "10", modelAnswer: "" };

export default function AdminGrandTests() {
  const qc = useQueryClient();
  const { data: tests, isLoading } = useGrandTests();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const { data: testDetail, isLoading: detailLoading } = useTestDetail(selectedTestId);

  const [addQOpen, setAddQOpen] = useState(false);
  const [qForm, setQForm] = useState({ ...EMPTY_Q });
  const [editQId, setEditQId] = useState<number | null>(null);

  const [batchFilter, setBatchFilter] = useState<"all" | "1st Year" | "2nd Year" | "3rd/4th Year" | "Final Year" | "shared">("all");
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [subTestId, setSubTestId] = useState<number | null>(null);
  const { data: submissions, isLoading: subLoading, refetch: refetchSubs } = useQuery<any[]>({
    queryKey: ["grand-test-submissions", subTestId],
    queryFn: async () => {
      const r = await apiFetch(`/api/grand-tests/${subTestId}/submissions`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: subTestId !== null && submissionsOpen,
  });
  const [expandedSub, setExpandedSub] = useState<number | null>(null);
  // Grading state: { [submissionId]: { answers: {[answerId]: {marks, feedback}}, overall } }
  const [gradeInputs, setGradeInputs] = useState<Record<number, { answers: Record<number, { marks: string; feedback: string }>; overall: string }>>({});

  const releaseAnswers = useMutation({
    mutationFn: async ({ id, release }: { id: number; release: boolean }) => {
      const r = await apiFetch(`/api/grand-tests/${id}/release-answers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ release }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: (_, { release }) => {
      toast.success(release ? "Answer key released — students can now see model answers." : "Answer key retracted.");
      qc.invalidateQueries({ queryKey: QKEY });
    },
    onError: () => toast.error("Failed to update answer key visibility."),
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, answers, overallFeedback }: { submissionId: number; answers: { answerId: number; marks: number; feedback: string }[]; overallFeedback: string }) => {
      const r = await apiFetch(`/api/grand-tests/submissions/${submissionId}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, overallFeedback }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Grades submitted! Student can now see their result.");
      qc.invalidateQueries({ queryKey: ["grand-test-submissions", subTestId] });
      qc.invalidateQueries({ queryKey: QKEY });
      refetchSubs();
    },
    onError: () => toast.error("Failed to submit grades."),
  });

  const initGrading = (sub: any) => {
    setGradeInputs(prev => {
      if (prev[sub.id]) return prev; // already initialized
      const answers: Record<number, { marks: string; feedback: string }> = {};
      (sub.answers || []).filter((a: any) => a.id).forEach((a: any) => {
        answers[a.id] = { marks: String(a.aiMarks ?? ""), feedback: a.aiFeedback ?? "" };
      });
      return { ...prev, [sub.id]: { answers, overall: sub.ai_overall_feedback ?? "" } };
    });
  };

  const submitGrades = (sub: any) => {
    const data = gradeInputs[sub.id];
    if (!data) return;
    const answers = (sub.answers || []).filter((a: any) => a.id).map((a: any) => ({
      answerId: a.id,
      marks: parseFloat(data.answers[a.id]?.marks || "0") || 0,
      feedback: data.answers[a.id]?.feedback || "",
    }));
    gradeMutation.mutate({ submissionId: sub.id, answers, overallFeedback: data.overall });
  };

  const create = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await apiFetch("/api/grand-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title, subject: data.subject, description: data.description,
          durationMinutes: parseInt(data.durationMinutes),
          availableFrom: data.availableFrom || null,
          availableUntil: data.availableUntil || null,
          sessionYear: data.sessionYear === "shared" ? null : (data.sessionYear || null),
        }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { toast.success("Grand Test created!"); qc.invalidateQueries({ queryKey: QKEY }); setCreateOpen(false); setForm({ ...EMPTY_FORM }); },
    onError: () => toast.error("Failed to create test."),
  });

  const update = useMutation({
    mutationFn: async (data: typeof editForm & { id: number }) => {
      const r = await apiFetch(`/api/grand-tests/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title, subject: data.subject, description: data.description,
          durationMinutes: parseInt(data.durationMinutes),
          availableFrom: data.availableFrom || null,
          availableUntil: data.availableUntil || null,
          isPublished: data.isPublished,
          sessionYear: data.sessionYear === "shared" ? null : (data.sessionYear || null),
        }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { toast.success("Saved!"); qc.invalidateQueries({ queryKey: QKEY }); setEditOpen(false); },
    onError: () => toast.error("Failed to save."),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const r = await apiFetch(`/api/grand-tests/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast.success("Deleted."); qc.invalidateQueries({ queryKey: QKEY }); },
    onError: () => toast.error("Failed to delete."),
  });

  const duplicate = useMutation({
    mutationFn: async (id: number) => {
      const r = await apiFetch(`/api/grand-tests/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionYear: "2026-27" }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { toast.success("Grand Test copied to 2026-27 batch!"); qc.invalidateQueries({ queryKey: QKEY }); },
    onError: () => toast.error("Failed to duplicate grand test."),
  });

  const addQuestion = useMutation({
    mutationFn: async (data: typeof qForm) => {
      const r = await apiFetch(`/api/grand-tests/${selectedTestId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText: data.questionText, questionType: data.questionType, maxMarks: parseInt(data.maxMarks), modelAnswer: data.modelAnswer || null }),
      });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Question added!");
      qc.invalidateQueries({ queryKey: Q_DETAIL_KEY(selectedTestId!) });
      qc.invalidateQueries({ queryKey: QKEY });
      setAddQOpen(false); setQForm({ ...EMPTY_Q }); setEditQId(null);
    },
    onError: () => toast.error("Failed to add question."),
  });

  const updateQuestion = useMutation({
    mutationFn: async (data: typeof qForm & { qid: number }) => {
      const r = await apiFetch(`/api/grand-tests/${selectedTestId}/questions/${data.qid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText: data.questionText, questionType: data.questionType, maxMarks: parseInt(data.maxMarks), modelAnswer: data.modelAnswer || null }),
      });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Question updated!");
      qc.invalidateQueries({ queryKey: Q_DETAIL_KEY(selectedTestId!) });
      setAddQOpen(false); setQForm({ ...EMPTY_Q }); setEditQId(null);
    },
    onError: () => toast.error("Failed."),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (qid: number) => {
      const r = await apiFetch(`/api/grand-tests/${selectedTestId}/questions/${qid}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Question removed.");
      qc.invalidateQueries({ queryKey: Q_DETAIL_KEY(selectedTestId!) });
      qc.invalidateQueries({ queryKey: QKEY });
    },
    onError: () => toast.error("Failed."),
  });

  const openEdit = (t: GrandTest) => {
    setEditId(t.id);
    setEditForm({
      title: t.title, subject: t.subject, description: t.description || "",
      durationMinutes: String(t.duration_minutes),
      availableFrom: t.available_from ? t.available_from.slice(0, 16) : "",
      availableUntil: t.available_until ? t.available_until.slice(0, 16) : "",
      isPublished: t.is_published,
      sessionYear: t.session_year ?? "shared",
    });
    setEditOpen(true);
  };

  const openQuestions = (id: number) => { setSelectedTestId(id); setQuestionsOpen(true); };
  const openSubmissions = (id: number) => { setSubTestId(id); setSubmissionsOpen(true); };

  const allTests = tests || [];
  const list = batchFilter === "all" ? allTests
    : batchFilter === "shared" ? allTests.filter(t => !t.session_year)
    : allTests.filter(t => t.session_year === batchFilter);

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy size={22} className="text-amber-400" /> Grand Test Series
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Full-length timed mock exams — AI-graded, CBME-aligned.</p>
        </div>
        <div className="flex gap-2">
          <BatchMigrateButton
            endpoint="/api/grand-tests/bulk-duplicate"
            contentLabel="grand tests"
            queryKeys={[["grand-tests-admin"]]}
          />
          <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Grand Test</Button>
        </div>
      </div>

      {/* Batch filter tabs */}
      <div className="flex gap-1.5">
        {(["all","1st Year","2nd Year","3rd/4th Year","Final Year","shared"] as const).map(f => (
          <button key={f} onClick={() => setBatchFilter(f)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${batchFilter === f ? "bg-primary/20 border-primary/40 text-primary font-medium" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
            {f === "all" ? "All" : f === "shared" ? "Shared" : f}
          </button>
        ))}
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Test Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(8).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              )) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Trophy className="h-8 w-8 opacity-30" />
                      <span>No grand tests yet. Create your first one!</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : list.map(t => (
                <TableRow key={t.id} className="border-border/40 hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Trophy size={14} />
                      </div>
                      <span className="font-medium">{t.title}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="bg-amber-500/5 border-amber-500/20 text-amber-400">{t.subject}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.duration_minutes} min</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{fmtDate(t.available_from)}</div>
                    <div>→ {fmtDate(t.available_until)}</div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openQuestions(t.id)}>
                      <BookOpen size={12} /> {t.question_count} Qs
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openSubmissions(t.id)}>
                      <Users size={12} /> {t.submission_count}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {t.is_published
                        ? <Badge className="bg-green-500/20 text-green-400 border-none hover:bg-green-500/30"><Eye size={10} className="mr-1" />Live</Badge>
                        : <Badge variant="secondary" className="bg-muted"><EyeOff size={10} className="mr-1" />Draft</Badge>}
                      {t.answers_released && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-none text-[10px]"><KeyRound size={9} className="mr-1" />Key Released</Badge>
                      )}
                      {t.session_year
                        ? <Badge variant="outline" className={`text-[10px] px-1.5 ${t.session_year === "2025-26" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : "text-purple-400 border-purple-500/30 bg-purple-500/10"}`}>{t.session_year}</Badge>
                        : <Badge variant="outline" className="text-[10px] px-1.5 text-green-400 border-green-500/30 bg-green-500/10">Shared</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openQuestions(t.id)}>
                          <BookOpen className="mr-2 h-4 w-4" /> Manage Questions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openSubmissions(t.id)}>
                          <ClipboardList className="mr-2 h-4 w-4" /> View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => releaseAnswers.mutate({ id: t.id, release: !t.answers_released })}>
                          {t.answers_released
                            ? <><Lock className="mr-2 h-4 w-4" /> Retract Answer Key</>
                            : <><KeyRound className="mr-2 h-4 w-4" /> Release Answer Key</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(t)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate.mutate(t.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Copy to 2026-27
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => remove.mutate(t.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Create Grand Test</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Anatomy Grand Test - Unit 2" className="bg-background/50" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input type="number" placeholder="180" className="bg-background/50" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief instructions for students…" className="bg-background/50 resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Available From</Label>
                <Input type="datetime-local" className="bg-background/50" value={form.availableFrom} onChange={e => setForm({ ...form, availableFrom: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Available Until</Label>
                <Input type="datetime-local" className="bg-background/50" value={form.availableUntil} onChange={e => setForm({ ...form, availableUntil: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={form.sessionYear} onValueChange={v => setForm({ ...form, sessionYear: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">All Years (shared)</SelectItem>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd/4th Year">3rd/4th Year</SelectItem>
                  <SelectItem value="Final Year">Final Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.title || !form.subject}>
              {create.isPending ? "Creating…" : "Create Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Edit Grand Test</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input className="bg-background/50" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={editForm.subject} onValueChange={v => setEditForm({ ...editForm, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input type="number" className="bg-background/50" value={editForm.durationMinutes} onChange={e => setEditForm({ ...editForm, durationMinutes: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea className="bg-background/50 resize-none" rows={2} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Available From</Label>
                <Input type="datetime-local" className="bg-background/50" value={editForm.availableFrom} onChange={e => setEditForm({ ...editForm, availableFrom: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Available Until</Label>
                <Input type="datetime-local" className="bg-background/50" value={editForm.availableUntil} onChange={e => setEditForm({ ...editForm, availableUntil: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={editForm.isPublished} onCheckedChange={v => setEditForm({ ...editForm, isPublished: v })} />
              <Label className="cursor-pointer">Published (visible to students)</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={editForm.sessionYear} onValueChange={v => setEditForm({ ...editForm, sessionYear: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">All Years (shared)</SelectItem>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd/4th Year">3rd/4th Year</SelectItem>
                  <SelectItem value="Final Year">Final Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => update.mutate({ ...editForm, id: editId! })} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Manager Dialog */}
      <Dialog open={questionsOpen} onOpenChange={v => { if (!v) { setSelectedTestId(null); setAddQOpen(false); } setQuestionsOpen(v); }}>
        <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen size={18} /> Manage Questions
              {testDetail && <span className="text-muted-foreground font-normal text-sm ml-1">— {testDetail.title}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button size="sm" onClick={() => { setEditQId(null); setQForm({ ...EMPTY_Q }); setAddQOpen(true); }}>
              <Plus size={14} className="mr-2" /> Add Question
            </Button>

            {detailLoading ? <div className="flex items-center gap-2 py-4"><Loader2 size={18} className="animate-spin" /><span className="text-sm">Loading…</span></div> : (
              <div className="space-y-2">
                {(testDetail?.questions || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No questions yet. Add your first question.</div>
                )}
                {(testDetail?.questions || []).map((q, i) => (
                  <div key={q.id} className="border border-border/40 rounded-lg p-4 bg-muted/20 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] shrink-0">Q{i + 1}</Badge>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${q.question_type === "long" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
                            {q.question_type === "long" ? "Long Answer" : "Short Answer"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{q.max_marks} marks</span>
                        </div>
                        <p className="text-sm">{q.question_text}</p>
                        {q.model_answer && <p className="text-xs text-muted-foreground mt-1 italic">Model: {q.model_answer.slice(0, 100)}{q.model_answer.length > 100 ? "…" : ""}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditQId(q.id); setQForm({ questionText: q.question_text, questionType: q.question_type, maxMarks: String(q.max_marks), modelAnswer: q.model_answer || "" }); setAddQOpen(true); }}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteQuestion.mutate(q.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {addQOpen && (
              <div className="border border-border/40 rounded-lg p-4 bg-muted/10 space-y-3">
                <h4 className="font-medium text-sm">{editQId ? "Edit Question" : "New Question"}</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">Question Text <span className="text-destructive">*</span></Label>
                  <Textarea className="bg-background/50 resize-none text-sm" rows={3} placeholder="Type the question exactly as students will see it…" value={qForm.questionText} onChange={e => setQForm({ ...qForm, questionText: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={qForm.questionType} onValueChange={v => setQForm({ ...qForm, questionType: v })}>
                      <SelectTrigger className="bg-background/50 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long Answer (LAQ)</SelectItem>
                        <SelectItem value="short">Short Answer (SAQ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Marks</Label>
                    <Input type="number" className="bg-background/50 h-8 text-xs" value={qForm.maxMarks} onChange={e => setQForm({ ...qForm, maxMarks: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model Answer / Key Points (grading reference)</Label>
                  <Textarea className="bg-background/50 resize-none text-xs" rows={3} placeholder="Key points to look for when manually grading this question…" value={qForm.modelAnswer} onChange={e => setQForm({ ...qForm, modelAnswer: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => editQId ? updateQuestion.mutate({ ...qForm, qid: editQId }) : addQuestion.mutate(qForm)} disabled={!qForm.questionText || addQuestion.isPending || updateQuestion.isPending}>
                    {addQuestion.isPending || updateQuestion.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
                    {editQId ? "Update" : "Add Question"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddQOpen(false); setEditQId(null); setQForm({ ...EMPTY_Q }); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsOpen} onOpenChange={v => { if (!v) setSubTestId(null); setSubmissionsOpen(v); }}>
        <DialogContent className="bg-card border-border/50 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardList size={18} /> Student Submissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {subLoading ? (
              <div className="flex items-center gap-2 py-4"><Loader2 size={18} className="animate-spin" /><span className="text-sm">Loading…</span></div>
            ) : !submissions || submissions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No submissions yet.</div>
            ) : submissions.map(sub => (
              <div key={sub.id} className="border border-border/40 rounded-lg overflow-hidden">
                <button className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left" onClick={() => { const opening = expandedSub !== sub.id; setExpandedSub(opening ? sub.id : null); if (opening) initGrading(sub); }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {expandedSub === sub.id ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                    <div>
                      <p className="font-medium text-sm">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {sub.status === "graded" && (
                      <span className="text-sm font-bold text-amber-400">{sub.total_marks_obtained}/{sub.total_marks_possible}</span>
                    )}
                    <Badge variant="outline" className={sub.status === "graded" ? "bg-green-500/10 border-green-500/20 text-green-400" : sub.status === "submitted" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-muted"}>
                      {sub.status}
                    </Badge>
                  </div>
                </button>
                {expandedSub === sub.id && (
                  <div className="px-4 py-3 space-y-4 border-t border-border/30">
                    {/* Already graded — read-only */}
                    {sub.status === "graded" && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded p-3 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-green-400">Graded — {sub.total_marks_obtained}/{sub.total_marks_possible} marks</p>
                          {sub.ai_overall_feedback && <p className="text-xs text-muted-foreground mt-0.5">{sub.ai_overall_feedback}</p>}
                        </div>
                      </div>
                    )}

                    {/* Answer-by-answer */}
                    <div className="space-y-3">
                      {(sub.answers || []).filter((a: any) => a.id).map((ans: any, i: number) => {
                        const inp = gradeInputs[sub.id]?.answers[ans.id];
                        return (
                          <div key={ans.id} className="border border-border/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px] shrink-0">Q{i + 1}</Badge>
                              <span className="text-xs font-medium flex-1 min-w-0">{ans.questionText}</span>
                              {sub.status === "graded" && ans.aiMarks != null && (
                                <span className="text-xs font-bold text-amber-400 shrink-0 flex items-center gap-0.5">
                                  <Star size={10} />{ans.aiMarks}/{ans.maxMarks}
                                </span>
                              )}
                            </div>
                            {/* Student's answer */}
                            {ans.answerText && (
                              <div className="bg-background/50 rounded p-2">
                                <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Student's answer</p>
                                <p className="text-xs whitespace-pre-wrap">{ans.answerText}</p>
                              </div>
                            )}
                            {ans.answerImageUrl && (
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1 font-medium">Handwritten sheet</p>
                                <img src={ans.answerImageUrl} alt="Answer sheet" className="max-h-48 rounded border border-border/40 object-contain" />
                              </div>
                            )}
                            {!ans.answerText && !ans.answerImageUrl && (
                              <p className="text-xs text-muted-foreground italic">No answer provided</p>
                            )}
                            {/* Grading inputs — only when status is submitted */}
                            {sub.status === "submitted" && inp !== undefined && (
                              <div className="flex gap-2 pt-1">
                                <div className="flex-none w-20">
                                  <Label className="text-[10px] text-muted-foreground">Marks/{ans.maxMarks}</Label>
                                  <Input
                                    type="number" min={0} max={ans.maxMarks} step={0.5}
                                    value={inp.marks}
                                    onChange={e => setGradeInputs(prev => ({
                                      ...prev,
                                      [sub.id]: { ...prev[sub.id], answers: { ...prev[sub.id].answers, [ans.id]: { ...inp, marks: e.target.value } } }
                                    }))}
                                    className="h-7 text-xs bg-background/50 mt-0.5"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-[10px] text-muted-foreground">Feedback (optional)</Label>
                                  <Input
                                    value={inp.feedback}
                                    onChange={e => setGradeInputs(prev => ({
                                      ...prev,
                                      [sub.id]: { ...prev[sub.id], answers: { ...prev[sub.id].answers, [ans.id]: { ...inp, feedback: e.target.value } } }
                                    }))}
                                    className="h-7 text-xs bg-background/50 mt-0.5"
                                    placeholder="Comment on this answer…"
                                  />
                                </div>
                              </div>
                            )}
                            {/* Read-only feedback after grading */}
                            {sub.status === "graded" && ans.aiFeedback && (
                              <p className="text-xs text-blue-300 italic">{ans.aiFeedback}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Overall feedback + submit — only for submitted */}
                    {sub.status === "submitted" && gradeInputs[sub.id] && (
                      <div className="space-y-2 pt-1 border-t border-border/20">
                        <div>
                          <Label className="text-xs">Overall Feedback (optional)</Label>
                          <Textarea
                            rows={2}
                            value={gradeInputs[sub.id].overall}
                            onChange={e => setGradeInputs(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], overall: e.target.value } }))}
                            placeholder="General comments for the student…"
                            className="bg-background/50 resize-none text-xs mt-1"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => submitGrades(sub)}
                          disabled={gradeMutation.isPending}
                          className="w-full gap-2"
                        >
                          {gradeMutation.isPending
                            ? <><Loader2 size={12} className="animate-spin" /> Submitting…</>
                            : <><CheckCircle2 size={12} /> Publish Grades</>}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
