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
  Clock, BookOpen, Sparkles, AlertCircle, Upload, HelpCircle, Wand2, Loader2,
} from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Medicine", "Surgery", "Mixed"];
const OPTION_LABELS = ["A", "B", "C", "D"];

const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple Choice (MCQ)" },
  { value: "true-false", label: "True / False" },
  { value: "fill-blank", label: "Fill in the Blank" },
  { value: "name-following", label: "Name the Following" },
  { value: "one-word", label: "One Word Answer" },
  { value: "short_answer", label: "Short Answer (SAQ)" },
  { value: "long_answer", label: "Long Answer (LAQ)" },
];

const SUBJECTIVE_TYPES = ["short_answer", "long_answer"];

type Question = {
  id: number;
  quizId: number;
  text: string;
  questionType?: string | null;
  options?: string[] | null;
  correctOption?: number | null;
  correctAnswer?: string | null;
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

const emptyQForm = { text: "", questionType: "mcq", options: ["", "", "", ""], correctOption: 0, correctAnswer: "", explanation: "", maxMarks: 5, modelAnswer: "" };

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
    durationMinutes: "", isFeatured: false, isProctored: false,
  });
  const [savingMeta, setSavingMeta] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<any[] | null>(null);
  const [bulkError, setBulkError] = useState("");
  const [bulkMode, setBulkMode] = useState<"ai" | "manual">("ai");
  const [aiParsing, setAiParsing] = useState(false);

  const { data: quiz, isLoading, refetch } = useQuery<QuizDetail>({
    queryKey: ["quiz-detail", quizId],
    queryFn: () => customFetch(`/api/quizzes/${quizId}`),
    enabled: quizId !== null,
  });

  const parseBulkText = (raw: string): { parsed: any[]; error: string } => {
    const trimmed = raw.trim();
    if (!trimmed) return { parsed: [], error: "Paste is empty." };
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed);
        if (!Array.isArray(arr)) return { parsed: [], error: "JSON must be an array." };
        return { parsed: arr, error: "" };
      } catch {
        return { parsed: [], error: "Invalid JSON — check for missing quotes or commas." };
      }
    }
    const lines = trimmed.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
    const parsed: any[] = [];
    const errors: string[] = [];
    lines.forEach((line, i) => {
      const parts = line.split("|").map(p => p.trim());
      if (parts.length < 6) { errors.push(`Line ${i + 1}: needs at least 6 columns (question|A|B|C|D|correct|explanation?)`); return; }
      const [text, a, b, c, d, correctRaw, explanation] = parts;
      const correctMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, "0": 0, "1": 1, "2": 2, "3": 3 };
      const correctOption = correctMap[correctRaw.toUpperCase()];
      if (correctOption === undefined) { errors.push(`Line ${i + 1}: correct answer must be A/B/C/D or 0/1/2/3`); return; }
      parsed.push({ text, options: [a, b, c, d], correctOption, explanation: explanation || null });
    });
    if (errors.length) return { parsed, error: errors.join("\n") };
    return { parsed, error: "" };
  };

  const handleBulkPreview = () => {
    setBulkError("");
    const { parsed, error } = parseBulkText(bulkText);
    if (error && parsed.length === 0) { setBulkError(error); setBulkPreview(null); return; }
    if (error) setBulkError(error);
    setBulkPreview(parsed);
  };

  const handleAIParse = async () => {
    if (!bulkText.trim()) return;
    setAiParsing(true);
    setBulkError("");
    setBulkPreview(null);
    try {
      const data = await customFetch<{ questions: any[] }>("/api/quizzes/ai-parse", {
        method: "POST",
        body: JSON.stringify({ rawText: bulkText }),
      });
      if (!data.questions || data.questions.length === 0) {
        setBulkError("AI found no questions in the pasted text. Try adding more structure (e.g. label the correct answer).");
      } else {
        setBulkPreview(data.questions);
        toast.success(`AI parsed ${data.questions.length} question${data.questions.length !== 1 ? "s" : ""}!`);
      }
    } catch (err: any) {
      setBulkError(err?.message || "AI parsing failed. Please try again or use Manual Format.");
    } finally {
      setAiParsing(false);
    }
  };

  const handleBulkImport = async () => {
    if (!quizId || !bulkPreview || bulkPreview.length === 0) return;
    setBulkImporting(true);
    try {
      const data = await customFetch<{ imported?: number }>(`/api/quizzes/${quizId}/questions/bulk`, {
        method: "POST",
        body: JSON.stringify({ questions: bulkPreview }),
      });
      toast.success(`Imported ${data.imported ?? bulkPreview.length} question${(data.imported ?? bulkPreview.length) !== 1 ? "s" : ""}!`);
      queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      refetch();
      setBulkOpen(false);
      setBulkText("");
      setBulkPreview(null);
      setBulkError("");
    } catch {
      toast.error("Import failed. Please check the format and try again.");
    } finally {
      setBulkImporting(false);
    }
  };

  const openAddQuestion = () => {
    setEditQ(null);
    setQForm(emptyQForm);
    setQOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditQ(q);
    const opts = q.options ?? ["", "", "", ""];
    setQForm({
      text: q.text,
      questionType: q.questionType || "mcq",
      options: opts.length === 4 ? [...opts] : [...opts, ...Array(4 - opts.length).fill("")],
      correctOption: q.correctOption ?? 0,
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "",
      maxMarks: (q as any).maxMarks ?? 5,
      modelAnswer: (q as any).modelAnswer || "",
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
      isProctored: (quiz as any).isProctored ?? false,
    });
    setMetaOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!quizId) return;
    if (!qForm.text.trim()) { toast.error("Question text is required."); return; }
    const isSubjective = SUBJECTIVE_TYPES.includes(qForm.questionType);
    const isWriteIn = !["mcq", "true-false"].includes(qForm.questionType) && !isSubjective;
    if (isWriteIn && !qForm.correctAnswer.trim()) { toast.error("Correct answer is required for this question type."); return; }
    if (!isWriteIn && !isSubjective && qForm.options.some(o => !o.trim())) { toast.error("All options must be filled in."); return; }

    let payload: Record<string, any>;
    if (isSubjective) {
      payload = {
        text: qForm.text.trim(),
        questionType: qForm.questionType,
        explanation: qForm.explanation.trim() || null,
        maxMarks: qForm.maxMarks,
        modelAnswer: qForm.modelAnswer.trim() || null,
      };
    } else if (isWriteIn) {
      payload = { text: qForm.text.trim(), questionType: qForm.questionType, correctAnswer: qForm.correctAnswer.trim(), explanation: qForm.explanation.trim() || null };
    } else {
      payload = { text: qForm.text.trim(), questionType: qForm.questionType, options: qForm.options.map(o => o.trim()), correctOption: qForm.correctOption, explanation: qForm.explanation.trim() || null };
    }

    setSaving(true);
    try {
      if (editQ) {
        await customFetch(`/api/quizzes/${quizId}/questions/${editQ.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Question updated!");
      } else {
        await customFetch(`/api/quizzes/${quizId}/questions`, { method: "POST", body: JSON.stringify(payload) });
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
          isProctored: metaForm.isProctored,
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setBulkText(""); setBulkPreview(null); setBulkError(""); setBulkOpen(true); }}>
            <Upload className="mr-2 h-3.5 w-3.5" /> Bulk Import
          </Button>
          <Button onClick={openAddQuestion}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>
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
                {SUBJECTIVE_TYPES.includes(q.questionType || "mcq") && (
                  <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {q.questionType === "short_answer" ? "SAQ" : "LAQ"} — {(q as any).maxMarks ?? 5} marks
                    </span>
                    {(q as any).modelAnswer && (
                      <span className="text-green-400">✓ Model answer set</span>
                    )}
                  </div>
                )}
                {!SUBJECTIVE_TYPES.includes(q.questionType || "mcq") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {(q.options || []).map((opt, i) => (
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
                )}
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
              <Label>Question Type <span className="text-destructive">*</span></Label>
              <Select value={qForm.questionType} onValueChange={(v) => setQForm({ ...qForm, questionType: v, correctAnswer: "", options: ["", "", "", ""], correctOption: 0, maxMarks: 5, modelAnswer: "" })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Question Text <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder={
                  qForm.questionType === "fill-blank" ? "e.g. The main nerve of the posterior compartment of the thigh is ___ nerve."
                  : qForm.questionType === "true-false" ? "e.g. The femoral nerve arises from L2, L3, L4 nerve roots."
                  : qForm.questionType === "name-following" ? "e.g. Name the muscle that is attached to the lesser trochanter of the femur."
                  : qForm.questionType === "one-word" ? "e.g. What is the primary metabolic fuel for the brain?"
                  : "e.g. Which nerve is responsible for the sensation of the anterior thigh?"
                }
                className="bg-background/50 resize-none min-h-[80px]"
                value={qForm.text}
                onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
              />
              {qForm.questionType === "fill-blank" && (
                <p className="text-xs text-muted-foreground">Use <span className="font-mono text-primary">___</span> (three underscores) to mark the blank in the question.</p>
              )}
            </div>

            {(qForm.questionType === "mcq" || qForm.questionType === "true-false") && (
              <div className="space-y-3">
                <Label>Options <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">(select the correct one)</span></Label>
                {qForm.questionType === "true-false" ? (
                  <RadioGroup
                    value={qForm.correctOption.toString()}
                    onValueChange={(v) => setQForm({ ...qForm, correctOption: parseInt(v), options: ["True", "False"] })}
                    className="flex gap-4"
                  >
                    {["True", "False"].map((opt, i) => (
                      <div key={i} className={`flex items-center gap-2 px-5 py-3 rounded-lg border flex-1 justify-center cursor-pointer transition-colors ${
                        qForm.correctOption === i ? "border-green-500/40 bg-green-500/5" : "border-border/30 bg-background/30"
                      }`} onClick={() => setQForm({ ...qForm, correctOption: i, options: ["True", "False"] })}>
                        <RadioGroupItem value={i.toString()} id={`tf-${i}`} />
                        <Label htmlFor={`tf-${i}`} className="cursor-pointer font-medium">{opt}</Label>
                        {qForm.correctOption === i && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <RadioGroup
                    value={qForm.correctOption.toString()}
                    onValueChange={(v) => setQForm({ ...qForm, correctOption: parseInt(v) })}
                    className="space-y-2"
                  >
                    {qForm.options.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        qForm.correctOption === i ? "border-green-500/40 bg-green-500/5" : "border-border/30 bg-background/30"
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
                        {qForm.correctOption === i && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                      </div>
                    ))}
                  </RadioGroup>
                )}
                <p className="text-xs text-muted-foreground">Click the radio button next to the correct answer.</p>
              </div>
            )}

            {!["mcq", "true-false"].includes(qForm.questionType) && !SUBJECTIVE_TYPES.includes(qForm.questionType) && (
              <div className="space-y-1.5">
                <Label>Correct Answer <span className="text-destructive">*</span></Label>
                <Input
                  placeholder={
                    qForm.questionType === "one-word" ? "e.g. Glucose"
                    : qForm.questionType === "fill-blank" ? "e.g. Sciatic"
                    : "e.g. Iliopsoas muscle"
                  }
                  className="bg-background/50"
                  value={qForm.correctAnswer}
                  onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Answers are matched case-insensitively after normalizing punctuation/spaces.</p>
              </div>
            )}

            {SUBJECTIVE_TYPES.includes(qForm.questionType) && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Maximum Marks <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={qForm.maxMarks}
                    onChange={(e) => setQForm({ ...qForm, maxMarks: Math.max(1, Math.min(20, parseInt(e.target.value) || 5)) })}
                    className="bg-background/50 w-28"
                    placeholder="e.g. 5"
                  />
                  <p className="text-xs text-muted-foreground">How many marks is this question worth? (1–20)</p>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Model Answer <span className="text-xs font-normal text-muted-foreground">(used for AI grading — not shown to students)</span>
                  </Label>
                  <Textarea
                    placeholder={
                      qForm.questionType === "short_answer"
                        ? "e.g. The femoral nerve (L2-L4) supplies the quadriceps femoris, sartorius, and pectineus muscles..."
                        : "Write the ideal answer with all key points that should be covered..."
                    }
                    className="bg-background/50 resize-none"
                    rows={4}
                    value={qForm.modelAnswer}
                    onChange={(e) => setQForm({ ...qForm, modelAnswer: e.target.value })}
                  />
                </div>
              </div>
            )}

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
            <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
              <Switch checked={metaForm.isProctored} onCheckedChange={(v) => setMetaForm({ ...metaForm, isProctored: v })} />
              <div>
                <Label className="text-red-300">Proctored Exam</Label>
                <p className="text-xs text-muted-foreground mt-0.5">AI webcam monitoring, tab detection, fullscreen enforcement, copy/paste blocked</p>
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

      <Dialog open={bulkOpen} onOpenChange={(o) => { if (!o) { setBulkOpen(false); setBulkPreview(null); setBulkError(""); } }}>
        <DialogContent className="bg-card border-border/50 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Bulk Import Questions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/30 w-fit">
              <button
                onClick={() => { setBulkMode("ai"); setBulkPreview(null); setBulkError(""); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${bulkMode === "ai" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Wand2 className="h-3.5 w-3.5" /> AI Parse
              </button>
              <button
                onClick={() => { setBulkMode("manual"); setBulkPreview(null); setBulkError(""); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${bulkMode === "manual" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                <HelpCircle className="h-3.5 w-3.5" /> Manual Format
              </button>
            </div>

            {/* AI mode */}
            {bulkMode === "ai" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
                  <p className="text-sm font-medium text-primary flex items-center gap-2 mb-1">
                    <Wand2 className="h-4 w-4 shrink-0" /> Paste questions in any format
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    MCQs, SAQs, fill-in-the-blank, true/false, name-the-following — any format works.
                    AI will identify the question type, options, correct answer, and explanation automatically.
                    Questions remain yours; AI only structures them.
                  </p>
                </div>
                <Textarea
                  className="bg-background/50 resize-none min-h-[200px] text-sm"
                  placeholder={`Paste your questions here. Examples:

1. Which nerve supplies the skin of the anterior thigh?
a) Femoral nerve  b) Obturator nerve  c) Sciatic nerve  d) Lateral cutaneous nerve
Answer: a) Femoral nerve
Explanation: The femoral nerve (L2-L4) provides cutaneous supply to the anterior thigh.

2. The femoral nerve arises from L2, L3, L4 nerve roots. True or False?
Answer: True

3. Fill in the blank: The main arterial supply of the femoral head is the ___ artery.
Answer: medial circumflex femoral`}
                  value={bulkText}
                  onChange={(e) => { setBulkText(e.target.value); setBulkPreview(null); setBulkError(""); }}
                />
                {!bulkPreview && (
                  <Button
                    className="w-full gap-2"
                    onClick={handleAIParse}
                    disabled={!bulkText.trim() || aiParsing}
                  >
                    {aiParsing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Parsing with AI…</>
                    ) : (
                      <><Wand2 className="h-4 w-4" /> Parse with AI</>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Manual mode */}
            {bulkMode === "manual" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-300 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0" /> Accepted formats
                  </p>
                  <div className="space-y-2 text-xs text-blue-200/70">
                    <p className="font-semibold text-blue-300/80">① Pipe-separated (one question per line):</p>
                    <code className="block bg-background/40 rounded p-2 font-mono leading-relaxed whitespace-pre">
{`Question text | Option A | Option B | Option C | Option D | A | Explanation (optional)
Which nerve supplies the skin of the anterior thigh? | Femoral | Obturator | Sciatic | Lateral cutaneous | A | Femoral nerve (L2-L4)`}
                    </code>
                    <p className="font-semibold text-blue-300/80 pt-1">② JSON array:</p>
                    <code className="block bg-background/40 rounded p-2 font-mono leading-relaxed whitespace-pre">
{`[{"text":"Question?","options":["A","B","C","D"],"correctOption":0,"explanation":"..."}]`}
                    </code>
                    <p className="text-blue-200/50">For correct answer: use A/B/C/D or 0/1/2/3. Lines starting with # are ignored.</p>
                  </div>
                </div>
                <Textarea
                  className="bg-background/50 font-mono text-xs resize-none min-h-[160px]"
                  placeholder={"Which nerve supplies the skin of the anterior thigh? | Femoral | Obturator | Sciatic | Lateral cutaneous | A | Femoral nerve (L2–L4)"}
                  value={bulkText}
                  onChange={(e) => { setBulkText(e.target.value); setBulkPreview(null); setBulkError(""); }}
                />
                {!bulkPreview && (
                  <Button onClick={handleBulkPreview} disabled={!bulkText.trim()}>
                    Preview Questions
                  </Button>
                )}
              </div>
            )}

            {/* Error */}
            {bulkError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive whitespace-pre-wrap">
                {bulkError}
              </div>
            )}

            {/* Preview */}
            {bulkPreview && bulkPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-400">
                    ✓ {bulkPreview.length} question{bulkPreview.length !== 1 ? "s" : ""} ready to import
                  </p>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => { setBulkPreview(null); setBulkError(""); }}
                  >
                    ← Edit text
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {bulkPreview.map((q, i) => (
                    <div key={i} className="rounded-lg border border-border/30 bg-muted/10 p-3 text-sm">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-bold text-primary shrink-0 mt-0.5">{i + 1}.</span>
                        <p className="font-medium leading-snug flex-1">{q.text}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground shrink-0 font-mono">
                          {q.questionType || "mcq"}
                        </span>
                      </div>
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 pl-5">
                          {q.options.map((opt: string, j: number) => (
                            <span key={j} className={`text-xs px-2 py-0.5 rounded ${j === q.correctOption ? "bg-green-500/15 text-green-400" : "text-muted-foreground"}`}>
                              {OPTION_LABELS[j] ?? j}. {opt} {j === q.correctOption ? "✓" : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {q.correctAnswer && (
                        <p className="text-xs text-green-400 pl-5 mt-1">✓ {q.correctAnswer}</p>
                      )}
                      {q.explanation && (
                        <p className="text-xs text-blue-300/70 pl-5 mt-1 italic">{q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setBulkOpen(false); setBulkPreview(null); setBulkError(""); }}>
              Cancel
            </Button>
            {bulkPreview && bulkPreview.length > 0 && (
              <Button onClick={handleBulkImport} disabled={bulkImporting}>
                {bulkImporting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…</>
                ) : (
                  `Import ${bulkPreview.length} Question${bulkPreview.length !== 1 ? "s" : ""}`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
