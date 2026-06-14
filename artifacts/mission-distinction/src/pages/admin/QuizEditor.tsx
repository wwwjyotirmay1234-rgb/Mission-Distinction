import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { customFetch, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Pencil, Trash2, CheckCircle2, Brain,
  Clock, BookOpen, Sparkles, AlertCircle,
} from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Medicine", "Surgery", "Mixed"];
const OPTION_LABELS = ["A", "B", "C", "D"];

type Question = {
  id: number;
  quizId: number;
  text: string;
  options: string[];
  correctOption: number;
  explanation?: string | null;
};

type QuizDetail = {
  id: number;
  title: string;
  subject: string;
  description?: string | null;
  difficulty: string;
  durationMinutes?: number | null;
  isFeatured: boolean;
  questionCount: number;
  createdAt: string;
  questions: Question[];
};

const emptyQForm = { text: "", options: ["", "", "", ""], correctOption: 0, explanation: "" };

export default function QuizEditor() {
  const [, params] = useRoute("/admin/quizzes/:id/edit");
  const [, navigate] = useLocation();
  const quizId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();

  const [qOpen, setQOpen] = useState(false);
  const [qForm, setQForm] = useState(emptyQForm);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [deleteQId, setDeleteQId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [metaOpen, setMetaOpen] = useState(false);
  const [metaForm, setMetaForm] = useState({
    title: "", subject: "", description: "", difficulty: "medium",
    durationMinutes: "", isFeatured: false,
  });
  const [savingMeta, setSavingMeta] = useState(false);

  const { data: quiz, isLoading, refetch } = useQuery<QuizDetail>({
    queryKey: ["quiz-detail", quizId],
    queryFn: () => customFetch(`/api/quizzes/${quizId}`),
    enabled: quizId !== null,
  });

  const openAddQuestion = () => {
    setEditQ(null);
    setQForm(emptyQForm);
    setQOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditQ(q);
    setQForm({
      text: q.text,
      options: q.options.length === 4 ? [...q.options] : [...q.options, ...Array(4 - q.options.length).fill("")],
      correctOption: q.correctOption,
      explanation: q.explanation || "",
    });
    setQOpen(true);
  };

  const openMeta = () => {
    if (!quiz) return;
    setMetaForm({
      title: quiz.title,
      subject: quiz.subject,
      description: quiz.description || "",
      difficulty: quiz.difficulty,
      durationMinutes: quiz.durationMinutes?.toString() || "",
      isFeatured: quiz.isFeatured,
    });
    setMetaOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!quizId) return;
    if (!qForm.text.trim()) { toast.error("Question text is required."); return; }
    if (qForm.options.some(o => !o.trim())) { toast.error("All 4 options must be filled in."); return; }

    setSaving(true);
    try {
      if (editQ) {
        await customFetch(`/api/quizzes/${quizId}/questions/${editQ.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            text: qForm.text.trim(),
            options: qForm.options.map(o => o.trim()),
            correctOption: qForm.correctOption,
            explanation: qForm.explanation.trim() || null,
          }),
        });
        toast.success("Question updated!");
      } else {
        await customFetch(`/api/quizzes/${quizId}/questions`, {
          method: "POST",
          body: JSON.stringify({
            text: qForm.text.trim(),
            options: qForm.options.map(o => o.trim()),
            correctOption: qForm.correctOption,
            explanation: qForm.explanation.trim() || null,
          }),
        });
        toast.success("Question added!");
      }
      queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      refetch();
      setQOpen(false);
    } catch {
      toast.error("Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!quizId || deleteQId === null) return;
    try {
      await customFetch(`/api/quizzes/${quizId}/questions/${deleteQId}`, { method: "DELETE" });
      toast.success("Question deleted.");
      queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      refetch();
    } catch {
      toast.error("Failed to delete question.");
    } finally {
      setDeleteQId(null);
    }
  };

  const handleSaveMeta = async () => {
    if (!quizId || !metaForm.title || !metaForm.subject || !metaForm.difficulty) {
      toast.error("Title, subject and difficulty are required.");
      return;
    }
    setSavingMeta(true);
    try {
      await customFetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: metaForm.title,
          subject: metaForm.subject,
          description: metaForm.description || null,
          difficulty: metaForm.difficulty,
          durationMinutes: metaForm.durationMinutes ? parseInt(metaForm.durationMinutes) : null,
          isFeatured: metaForm.isFeatured,
        }),
      });
      toast.success("Quiz details updated!");
      queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      refetch();
      setMetaOpen(false);
    } catch {
      toast.error("Failed to update quiz details.");
    } finally {
      setSavingMeta(false);
    }
  };

  const difficultyColor = (d: string) =>
    d === "easy" ? "bg-green-500/10 text-green-400 border-green-500/20"
    : d === "hard" ? "bg-red-500/10 text-red-400 border-red-500/20"
    : "bg-orange-500/10 text-orange-400 border-orange-500/20";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <AlertCircle className="h-8 w-8" />
        <p>Quiz not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin/quizzes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/quizzes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{quiz.title}</h1>
          <p className="text-muted-foreground text-sm">Quiz Editor — add, edit, and reorder questions</p>
        </div>
        <Button variant="outline" size="sm" onClick={openMeta}>
          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Details
        </Button>
      </div>

      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-medium">{quiz.subject}</span>
            </div>
            <Badge variant="outline" className={difficultyColor(quiz.difficulty)}>
              {quiz.difficulty}
            </Badge>
            {quiz.durationMinutes && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {quiz.durationMinutes} mins
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Brain className="h-3.5 w-3.5" /> {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
            </div>
            {quiz.isFeatured && (
              <Badge className="bg-primary/20 text-primary border-none">
                <Sparkles className="h-3 w-3 mr-1" /> Featured
              </Badge>
            )}
            {quiz.description && (
              <p className="w-full text-sm text-muted-foreground mt-1">{quiz.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Questions <span className="text-muted-foreground font-normal text-sm ml-1">({quiz.questions.length})</span>
        </h2>
        <Button onClick={openAddQuestion}>
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </div>

      {quiz.questions.length === 0 ? (
        <Card className="bg-card/40 border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <Brain className="h-10 w-10 opacity-30" />
            <div className="text-center">
              <p className="font-medium">No questions yet</p>
              <p className="text-sm mt-1">Click "Add Question" to start building this quiz.</p>
            </div>
            <Button onClick={openAddQuestion}><Plus className="mr-2 h-4 w-4" /> Add First Question</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quiz.questions.map((q, idx) => (
            <Card key={q.id} className="bg-card/40 border-border/40 hover:border-border/60 transition-colors">
              <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between gap-3">
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium leading-snug">{q.text}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditQuestion(q)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteQId(q.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 pl-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      i === q.correctOption
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-muted/20 border-border/30 text-muted-foreground"
                    }`}>
                      <span className={`font-bold text-xs w-4 shrink-0 ${i === q.correctOption ? "text-green-400" : "text-muted-foreground"}`}>
                        {OPTION_LABELS[i]}
                      </span>
                      {i === q.correctOption && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">{opt}</span>
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="flex gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
                    <span className="font-semibold shrink-0">Explanation:</span>
                    <span className="text-blue-200/80">{q.explanation}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={qOpen} onOpenChange={setQOpen}>
        <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editQ ? "Edit Question" : "Add New Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label>Question Text <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="e.g. Which nerve is responsible for the sensation of the anterior thigh?"
                className="bg-background/50 resize-none min-h-[80px]"
                value={qForm.text}
                onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Options <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">(select the correct one)</span></Label>
              <RadioGroup
                value={qForm.correctOption.toString()}
                onValueChange={(v) => setQForm({ ...qForm, correctOption: parseInt(v) })}
                className="space-y-2"
              >
                {qForm.options.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    qForm.correctOption === i
                      ? "border-green-500/40 bg-green-500/5"
                      : "border-border/30 bg-background/30"
                  }`}>
                    <RadioGroupItem value={i.toString()} id={`opt-${i}`} className="shrink-0" />
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{OPTION_LABELS[i]}</span>
                    <Input
                      placeholder={`Option ${OPTION_LABELS[i]}`}
                      className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-sm flex-1"
                      value={opt}
                      onChange={(e) => {
                        const opts = [...qForm.options];
                        opts[i] = e.target.value;
                        setQForm({ ...qForm, options: opts });
                      }}
                    />
                    {qForm.correctOption === i && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">Click the radio button next to the correct answer.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Explanation <span className="text-xs font-normal text-muted-foreground">(shown after attempt)</span></Label>
              <Textarea
                placeholder="e.g. The femoral nerve (L2-L4) provides sensation to the anterior thigh..."
                className="bg-background/50 resize-none"
                rows={3}
                value={qForm.explanation}
                onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} disabled={saving}>
              {saving ? "Saving..." : editQ ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Quiz Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Quiz Title <span className="text-destructive">*</span></Label>
              <Input className="bg-background/50" value={metaForm.title} onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={metaForm.subject} onValueChange={(v) => setMetaForm({ ...metaForm, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty <span className="text-destructive">*</span></Label>
                <Select value={metaForm.difficulty} onValueChange={(v) => setMetaForm({ ...metaForm, difficulty: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea className="bg-background/50 resize-none" rows={2} value={metaForm.description} onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input type="number" placeholder="e.g. 30" className="bg-background/50" value={metaForm.durationMinutes} onChange={(e) => setMetaForm({ ...metaForm, durationMinutes: e.target.value })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={metaForm.isFeatured} onCheckedChange={(v) => setMetaForm({ ...metaForm, isFeatured: v })} />
                <Label>Mark as Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetaOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMeta} disabled={savingMeta}>
              {savingMeta ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteQId !== null} onOpenChange={(o) => !o && setDeleteQId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. The question will be permanently removed from the quiz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteQuestion}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
