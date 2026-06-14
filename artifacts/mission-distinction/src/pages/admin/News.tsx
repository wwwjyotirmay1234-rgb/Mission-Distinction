import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  getListAnnouncementsQueryKey,
} from "@workspace/api-client-react";
import { Plus, Newspaper, MoreVertical, Trash2, Microscope, Dna, Atom } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORY_ICONS = [Newspaper, Microscope, Dna, Atom];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminNews() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const queryClient = useQueryClient();

  const { data: allAnnouncements, isLoading } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey() } }
  );

  const newsItems = allAnnouncements?.filter((a) => a.type === "news") ?? [];

  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleAdd = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    createAnnouncement.mutate(
      { data: { title: form.title, content: form.content, type: "news" } },
      {
        onSuccess: () => {
          toast.success("News post published!");
          queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
          setOpen(false);
          setForm({ title: "", content: "" });
        },
        onError: () => toast.error("Failed to publish news."),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteAnnouncement.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("News post deleted.");
          queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        },
        onError: () => toast.error("Failed to delete."),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">News & Discoveries</h1>
          <p className="text-muted-foreground">Share the latest medical research and discoveries with students.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Post News
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Posts</p>
            <p className="text-2xl font-bold mt-1">{isLoading ? "—" : newsItems.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-2xl font-bold mt-1">
              {isLoading
                ? "—"
                : newsItems.filter((n) => {
                    const d = new Date(n.createdAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Latest Post</p>
            <p className="text-sm font-medium mt-1 truncate">
              {isLoading ? "—" : newsItems[0]?.title ?? "No posts yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* News grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="bg-card/40 border-border/40">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-1/3" />
                </CardContent>
              </Card>
            ))}
        </div>
      ) : newsItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border/40 rounded-xl">
          <Newspaper className="h-12 w-12 opacity-20 mb-4" />
          <p className="font-medium">No news posts yet</p>
          <p className="text-sm mt-1">Click "Post News" to share a discovery with students.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {newsItems.map((item, idx) => {
            const Icon = CATEGORY_ICONS[idx % CATEGORY_ICONS.length];
            return (
              <Card
                key={item.id}
                className="bg-card/40 border-border/40 hover:border-border/70 transition-colors group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground leading-snug">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                          {item.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider border-blue-500/30 text-blue-400 bg-blue-500/5"
                          >
                            News
                          </Badge>
                          <span className="text-xs text-muted-foreground/60">{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add News Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-400" /> Post News & Discovery
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Headline <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. New breakthrough in anatomical imaging"
                className="bg-background/50"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Share the details of this discovery or medical news..."
                className="bg-background/50 min-h-[140px] resize-none"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createAnnouncement.isPending}>
              {createAnnouncement.isPending ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
