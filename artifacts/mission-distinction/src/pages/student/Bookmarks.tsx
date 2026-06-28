import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListBookmarks, useDeleteBookmark, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { BookMarked, Trash2, FileText, File, Book, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function StudentBookmarks() {
  const queryClient = useQueryClient();
  const { data: bookmarksData, isLoading } = useListBookmarks(
    { query: { queryKey: getListBookmarksQueryKey() } }
  );

  const deleteBookmark = useDeleteBookmark();

  const handleRemove = (id: number) => {
    deleteBookmark.mutate({ id }, {
      onSuccess: () => {
        toast.success("Bookmark removed");
        queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText size={18} className="text-blue-500" />;
      case 'pdf': return <File size={18} className="text-orange-500" />;
      case 'book': return <Book size={18} className="text-purple-500" />;
      case 'quiz': return <CheckCircle size={18} className="text-green-500" />;
      default: return <BookMarked size={18} className="text-primary" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Bookmarks</h1>
        <p className="text-sm text-muted-foreground">Quick access to your saved content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : !bookmarksData || bookmarksData.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground flex flex-col items-center">
            <BookMarked className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p>No bookmarks yet.</p>
            <p className="text-sm">Save notes, PDFs, or quizzes to find them easily here.</p>
          </div>
        ) : (
          bookmarksData.map((bookmark) => (
            <Card key={bookmark.id} className="bg-card/40 border-border/40 flex flex-col relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(bookmark.id)}
                  disabled={deleteBookmark.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {getIcon(bookmark.resourceType)}
                  </div>
                  <div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize bg-background/50">
                      {bookmark.resourceType}
                    </Badge>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{bookmark.resourceTitle}</h3>
                <p className="text-xs text-muted-foreground mb-4">{bookmark.subject}</p>
                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Added {new Date(bookmark.createdAt).toLocaleDateString()}</span>
                  <Button variant="link" className="h-auto p-0 text-primary">Open</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
