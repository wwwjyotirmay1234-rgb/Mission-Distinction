import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { Plus, MoreVertical, Trash2, Bell, Megaphone, Users, Clock, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const SUBJECTS = ["All Students", "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology"];

export default function AdminAnnouncements() {
  const [open, setOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "announcement",
    targetAudience: "all",
    scheduledFor: "",
  });
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey() } }
  );

  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleAdd = () => {
    if (!form.title || !form.content || !form.type) {
      toast.error("Title and message are required.");
      return;
    }
    createAnnouncement.mutate({
      data: {
        title: form.title,
        content: form.content,
        type: form.type,
      }
    }, {
      onSuccess: () => {
        toast.success("Announcement published!");
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setOpen(false);
        setForm({ title: "", content: "", type: "announcement", targetAudience: "all", scheduledFor: "" });
        setPreviewMode(false);
      },
      onError: () => toast.error("Failed to publish announcement."),
    });
  };

  const handleDelete = (id: number) => {
    deleteAnnouncement.mutate({ id }, {
      onSuccess: () => {
        toast.success("Announcement deleted.");
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
      },
      onError: () => toast.error("Failed to delete."),
    });
  };

  const typeStyle: Record<string, string> = {
    announcement: "border-primary/30 text-primary bg-primary/5",
    news: "border-blue-500/30 text-blue-400 bg-blue-500/5",
    event: "border-green-500/30 text-green-400 bg-green-500/5",
  };

  const typeIcon: Record<string, React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string; color?: string }>> = {
    announcement: Megaphone,
    news: Bell,
    event: Clock,
  };

  const charCount = form.content.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Broadcast messages and news to students.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Announcement</Button>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-full max-w-md" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !announcements || announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone className="h-8 w-8 opacity-30" />
                      <span>No announcements yet. Click "New Announcement" to publish one.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((a) => {
                  const Icon = typeIcon[a.type] ?? Bell;
                  return (
                    <TableRow key={a.id} className="border-border/40 hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Icon size={14} />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{a.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-lg">{a.content}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${typeStyle[a.type] || typeStyle.announcement}`}>
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(a as any).targetAudience === "all" || !(a as any).targetAudience ? "All students" : (a as any).targetAudience}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(a.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setPreviewMode(false); }}>
        <DialogContent className="bg-card border-border/50 max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Compose Announcement
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)} className="gap-1.5 text-xs">
                <Eye className="w-3.5 h-3.5" /> {previewMode ? "Edit" : "Preview"}
              </Button>
            </div>
          </DialogHeader>

          {previewMode ? (
            <div className="py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Preview — as seen by students</p>
              <div className="rounded-xl border border-border/50 bg-muted/30 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{form.title || "Announcement Title"}</span>
                      <Badge variant="outline" className={`text-[10px] ${typeStyle[form.type]}`}>{form.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{form.content || "Your message will appear here..."}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {form.targetAudience === "all" ? "All students" : form.targetAudience}</span>
                      {form.scheduledFor && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type <span className="text-destructive">*</span></Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">📢 Announcement</SelectItem>
                      <SelectItem value="news">📰 News</SelectItem>
                      <SelectItem value="event">🗓 Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <Select value={form.targetAudience} onValueChange={(v) => setForm({ ...form, targetAudience: v })}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => (
                        <SelectItem key={s} value={s === "All Students" ? "all" : s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Anatomy exam tomorrow at 9 AM" className="bg-background/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Message <span className="text-destructive">*</span></Label>
                  <span className={`text-xs ${charCount > 900 ? "text-destructive" : "text-muted-foreground"}`}>{charCount}/1000</span>
                </div>
                <Textarea
                  placeholder="Write your announcement here..."
                  className="bg-background/50 min-h-[120px] resize-none"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value.slice(0, 1000) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Schedule (optional)</Label>
                <Input type="datetime-local" className="bg-background/50" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
                <p className="text-xs text-muted-foreground">Leave empty to publish immediately</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {!previewMode && (
              <Button variant="outline" onClick={() => setPreviewMode(true)} className="gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
            )}
            <Button onClick={handleAdd} disabled={createAnnouncement.isPending}>
              {createAnnouncement.isPending ? "Publishing..." : form.scheduledFor ? "Schedule 🗓" : "Publish Now 📢"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
