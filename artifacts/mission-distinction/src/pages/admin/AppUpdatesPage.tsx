import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AppUpdate {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export default function AppUpdatesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: updates, isLoading } = useQuery<AppUpdate[]>({
    queryKey: ["admin-app-updates"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/app-updates");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  async function handleCreate() {
    if (!title.trim() || !description.trim()) { toast.error("Title and description required"); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/app-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        toast.success("Update published! Meddy will explain it to students on their next visit.");
        queryClient.invalidateQueries({ queryKey: ["admin-app-updates"] });
        setShowDialog(false);
        setTitle(""); setDescription("");
      } else toast.error("Failed to publish update");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const res = await apiFetch(`/api/admin/app-updates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Update removed");
      queryClient.invalidateQueries({ queryKey: ["admin-app-updates"] });
    } else toast.error("Failed to remove update");
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> What's New (Meddy Announcements)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log any change you ship to the student portal here. Meddy will proactively explain it to
            each student in chat the next time they open the app — no repeats once seen.
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Log New Update
        </Button>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base">Update History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : !updates?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No updates logged yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {updates.map(update => (
                <div key={update.id} className="flex items-start gap-3 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{update.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{update.description}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(update.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this update?</AlertDialogTitle>
            <AlertDialogDescription>Students who haven't seen it yet will no longer be told about it by Meddy.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => { if (confirmDeleteId) handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
            >Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Log New Update</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input placeholder="e.g. Full Question Paper Upload" value={title} onChange={e => setTitle(e.target.value)} className="bg-muted/30" maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">What changed (Meddy will explain this in student's own words)</label>
              <Textarea
                placeholder="e.g. You can now upload a full scanned question paper and I'll solve every question in it, numbered, with a summary at the end."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-muted/30 resize-none"
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{description.length}/2000</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Publishing..." : "✨ Publish Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
