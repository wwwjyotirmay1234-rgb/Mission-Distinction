import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useListBooks, useDeleteBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { Search, Plus, MoreVertical, Trash2, Edit, Book } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminBooks() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: booksData, isLoading } = useListBooks(
    { search: search || undefined },
    { query: { queryKey: getListBooksQueryKey({ search: search || undefined }) } }
  );

  const deleteBook = useDeleteBook();

  const handleDelete = (id: number) => {
    deleteBook.mutate({ id }, {
      onSuccess: () => {
        toast.success("Book deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Books</h1>
          <p className="text-muted-foreground">Manage the reference books library.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search books..." 
              className="pl-9 bg-card/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Add Book</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Book</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                     <TableCell><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-24" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !booksData?.books || booksData.books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No books found.
                  </TableCell>
                </TableRow>
              ) : (
                booksData.books.map((book) => (
                  <TableRow key={book.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 rounded bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
                          {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <Book size={16} />}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{book.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{book.author || "Unknown"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-500/5 border-purple-500/20 text-purple-500">
                        {book.subject}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{book.downloadCount || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(book.createdAt).toLocaleDateString()}
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
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(book.id)}>
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
