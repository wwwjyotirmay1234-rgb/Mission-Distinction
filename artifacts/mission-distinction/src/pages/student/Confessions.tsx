import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Plus, MessageCircleHeart, Smile } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

interface Confession {
  id: number; content: string; likes: number; hasLiked: boolean; createdAt: string;
}

const EMOJIS = ["😭", "💀", "😤", "🥹", "😂", "🤡", "💪", "🧠", "☕", "📚"];
function randEmoji() { return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]; }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StudentConfessions() {
  const [showPost, setShowPost] = useState(false);
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: confessions = [], isLoading } = useQuery<Confession[]>({
    queryKey: ["confessions"],
    queryFn: () => apiFetch("/api/confessions").then(r => r.json()),
  });

  const postMutation = useMutation({
    mutationFn: () => apiFetch("/api/confessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["confessions"] }); setShowPost(false); setContent(""); toast.success("Posted anonymously!"); },
    onError: () => toast.error("Failed to post. Please wait before trying again."),
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/confessions/${id}/like`, { method: "POST" }).then(r => r.json()),
    onSuccess: (data, id) => {
      queryClient.setQueryData<Confession[]>(["confessions"], prev =>
        prev?.map(c => c.id === id ? { ...c, hasLiked: data.liked, likes: c.likes + (data.liked ? 1 : -1) } : c)
      );
    },
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircleHeart size={22} className="text-primary" /> Confession Board</h1>
          <p className="text-muted-foreground text-sm mt-1">Completely anonymous. Vent, share, or just laugh together.</p>
        </div>
        <Button onClick={() => setShowPost(true)} className="gap-2 shrink-0"><Plus size={16} /> Post</Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Smile size={20} className="text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">Your identity is never stored or shown. Posts appear with a random emoji.</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : confessions.length === 0 ? (
        <div className="py-14 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
          <MessageCircleHeart size={28} className="mx-auto mb-3 opacity-30" />
          <p>No confessions yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {confessions.map(c => {
            const emoji = EMOJIS[(c.id * 7 + 3) % EMOJIS.length];
            return (
              <Card key={c.id} className="bg-card/30 border-border/40">
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0 mt-0.5">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{c.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                        <Button variant="ghost" size="sm" className={`h-7 gap-1.5 text-xs ${c.hasLiked ? "text-red-400" : "text-muted-foreground"}`}
                          onClick={() => likeMutation.mutate(c.id)}>
                          <Heart size={13} className={c.hasLiked ? "fill-red-400" : ""} /> {c.likes}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showPost} onOpenChange={setShowPost}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader><DialogTitle>Anonymous Confession</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-3">Your name, photo, and identity will never appear. Max 500 characters.</p>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="The night before anatomy practical, I was so stressed I memorised the wrong muscles... 💀"
              className="bg-background/50 border-border/50 min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1.5 text-right">{content.length}/500</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPost(false)}>Cancel</Button>
            <Button disabled={!content.trim() || postMutation.isPending} onClick={() => postMutation.mutate()}>{postMutation.isPending ? "Posting…" : "Post Anonymously"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
