import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useListQuizzes, useCreateQuiz, useDeleteQuiz, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Search, Plus, MoreVertical, Trash2, CheckCircle, Pencil, ClipboardCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Medicine", "Surgery", "Mixed"];

export default function AdminQuizzes() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", subject: "", description: "", difficulty: "medium",
    durationMinutes: "", isFeatured: false, isProctored: false,
  });
  const queryClient = useQueryClient();

  const { data: quizzes, isLoading } = useListQuizzes(
    {},
    { query: { queryKey: getListQuizzesQueryKey() } }
  );

  const createQuiz = useCreateQuiz();
  const deleteQuiz = useDeleteQuiz();

  const handleAdd = () => {
    if (!form.title || !form.subject || !form.difficulty) {
      toast.error("Title, subject and difficulty are required.");
      return;
    }
    createQuiz.mutate({
      data: {
        title: form.title,
        subject: form.subject,
        description: form.description || undefined,
        difficulty: form.difficulty as "easy" | "medium" | "hard",
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
        isFeatured: form.isFeatured,
        isProctored: form.isProctored,
      }
    }, {
      onSuccess: () => {
        toast.success("Quiz created! You can now add questions from the quiz detail page.");
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        setOpen(false);
        setForm({ title: "", subject: "", description: "", difficulty: "medium", durationMinutes: "", isFeatured: false, isProctored: false });
      },
      onError: () => toast.error("Failed to create quiz."),
    });
  };

  const handleDelete = (id: number) => {
    deleteQuiz.mutate({ id }, {
      onSuccess: () => {
        toast.success("Quiz deleted.");
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      },
      onError: () => toast.error("Failed to delete quiz."),
    });
  };

  const quizList = Array.isArray(quizzes) ? quizzes : [];
  const filtered = search ? quizList.filter(q => q.title.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase())) : quizList;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Quizzes</h1>
          <p className="text-muted-foreground">Create and manage tests and question banks.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search quizzes..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/quiz-submissions")} className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            <ClipboardCheck className="mr-2 h-4 w-4" /> Submissions
          </Button>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Quiz</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Quiz Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Questions / Time</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48 mb-2" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 opacity-30" />
                      <span>No quizzes yet. Click "Create Quiz" to get started.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((quiz) => (
                  <TableRow key={quiz.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                          <CheckCircle size={14} />
                        </div>
                        <div className="font-medium text-foreground">{quiz.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/5 border-green-500/20 text-green-500">{quiz.subject}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{quiz.questionCount} Qs</div>
                      <div className="text-xs">{quiz.durationMinutes || "—"} mins</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        quiz.difficulty === "easy" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        quiz.difficulty === "hard" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      }>
                        {quiz.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {quiz.isFeatured
                        ? <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Featured</Badge>
                        : <Badge variant="secondary" className="bg-muted">Standard</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Questions
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(quiz.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Quiz Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Cardiovascular System MCQs" className="bg-background/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty <span className="text-destructive">*</span></Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
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
              <Textarea placeholder="Brief description of the quiz..." className="bg-background/50 resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input type="number" placeholder="e.g. 30" className="bg-background/50" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                  <Label className="cursor-pointer">Featured</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.isProctored} onCheckedChange={(v) => setForm({ ...form, isProctored: v })} />
                  <Label className="cursor-pointer">Proctored</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createQuiz.isPending}>
              {createQuiz.isPending ? "Creating..." : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
