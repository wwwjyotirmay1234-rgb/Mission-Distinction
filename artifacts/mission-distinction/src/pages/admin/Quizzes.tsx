import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useListQuizzes, useDeleteQuiz, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { Search, Plus, MoreVertical, Trash2, Edit, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminQuizzes() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: quizzesData, isLoading } = useListQuizzes(
    { subject: search || undefined },
    { query: { queryKey: getListQuizzesQueryKey({ subject: search || undefined }) } }
  );

  const deleteQuiz = useDeleteQuiz();

  const handleDelete = (id: number) => {
    deleteQuiz.mutate({ id }, {
      onSuccess: () => {
        toast.success("Quiz deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      }
    });
  };

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
            <Input 
              placeholder="Search by subject..." 
              className="pl-9 bg-card/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Create Quiz</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Quiz Name</TableHead>
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
                     <TableCell><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-24" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !quizzesData?.quizzes || quizzesData.quizzes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No quizzes found.
                  </TableCell>
                </TableRow>
              ) : (
                quizzesData.quizzes.map((quiz) => (
                  <TableRow key={quiz.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                          <CheckCircle size={14} />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{quiz.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{quiz.subject}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{quiz.questionCount} Questions</div>
                      <div className="text-xs">{quiz.durationMinutes || 0} mins</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${quiz.difficulty === 'easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          quiz.difficulty === 'hard' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                          'bg-orange-500/10 text-orange-500 border-orange-500/20'}
                      `}>
                        {quiz.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {quiz.isFeatured ? (
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Featured</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
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
    </div>
  );
}
