import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { customFetch } from "@workspace/api-client-react";
import { MessageSquare, Star, MoreVertical, Trash2, CheckCircle2, Eye, Reply, SendHorizonal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type FeedbackItem = {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  adminReply: string | null;
  adminReplyAt: string | null;
  createdAt: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  bug: "border-red-500/30 text-red-400 bg-red-500/5",
  suggestion: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
  general: "border-primary/30 text-primary bg-primary/5",
  content: "border-blue-500/30 text-blue-400 bg-blue-500/5",
};

const STATUS_COLORS: Record<string, string> = {
  new: "border-orange-500/30 text-orange-400 bg-orange-500/5",
  read: "border-blue-500/30 text-blue-400 bg-blue-500/5",
  resolved: "border-green-500/30 text-green-400 bg-green-500/5",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function fetchFeedback(): Promise<FeedbackItem[]> {
  return customFetch<FeedbackItem[]>("/api/feedback");
}

function ReplyBox({ item, onDone }: { item: FeedbackItem; onDone: () => void }) {
  const [text, setText] = useState(item.adminReply ?? "");
  const [saving, setSaving] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await customFetch(`/api/feedback/${item.id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text }),
      });
      toast.success("Reply sent!");
      onDone();
    } catch {
      toast.error("Failed to send reply.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        className="bg-background/50 min-h-[80px] resize-none text-sm"
        placeholder="Write your reply to the student…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{text.length}/2000</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onDone}>Cancel</Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSend} disabled={saving || !text.trim()}>
            <SendHorizonal size={12} /> {saving ? "Sending…" : "Send Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFeedback() {
  const [filter, setFilter] = useState<"all" | "new" | "read" | "resolved">("all");
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: fetchFeedback,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return customFetch(`/api/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
    },
    onError: () => toast.error("Failed to update status."),
  });

  const deleteFeedback = useMutation({
    mutationFn: async (id: number) => {
      await customFetch(`/api/feedback/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Feedback deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
    },
    onError: () => toast.error("Failed to delete."),
  });

  const filtered = !feedback
    ? []
    : filter === "all"
    ? feedback
    : feedback.filter((f) => f.status === filter);

  const counts = {
    all: feedback?.length ?? 0,
    new: feedback?.filter((f) => f.status === "new").length ?? 0,
    read: feedback?.filter((f) => f.status === "read").length ?? 0,
    resolved: feedback?.filter((f) => f.status === "resolved").length ?? 0,
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-secondary" /> Student Feedback
        </h1>
        <p className="text-muted-foreground">Review and reply to feedback submitted by students.</p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["all", "new", "read", "resolved"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "p-3 rounded-xl border text-left transition-colors",
              filter === s
                ? "border-secondary bg-secondary/10"
                : "border-border/40 bg-card/40 hover:bg-muted/20"
            )}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider capitalize">{s}</p>
            <p className="text-2xl font-bold mt-0.5">{isLoading ? "—" : counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-card/40 border-border/40">
              <CardContent className="p-5 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border/40 rounded-xl">
            <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
            <p className="font-medium">No {filter === "all" ? "" : filter + " "}feedback yet</p>
            <p className="text-sm mt-1">Students can submit feedback from their Settings page.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "bg-card/40 border-border/40 transition-colors",
                item.status === "new" && "border-l-2 border-l-orange-400"
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                    {(item.userName?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{item.userName || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">{item.userEmail || "—"} · {timeAgo(item.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general)}>
                          {item.category}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", STATUS_COLORS[item.status] || STATUS_COLORS.new)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="font-medium text-foreground mt-2">{item.subject}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.message}</p>

                    {item.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < item.rating! ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{item.rating}/5</span>
                      </div>
                    )}

                    {/* Existing admin reply */}
                    {item.adminReply && replyingId !== item.id && (
                      <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                        <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                          <Reply size={11} /> Admin Reply · {item.adminReplyAt ? timeAgo(item.adminReplyAt) : ""}
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{item.adminReply}</p>
                      </div>
                    )}

                    {/* Reply box */}
                    {replyingId === item.id && (
                      <ReplyBox
                        item={item}
                        onDone={() => {
                          setReplyingId(null);
                          queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
                        }}
                      />
                    )}

                    {/* Reply button (when not editing) */}
                    {replyingId !== item.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
                        onClick={() => setReplyingId(item.id)}
                      >
                        {item.adminReply ? <><Pencil size={11} /> Edit Reply</> : <><Reply size={11} /> Reply</>}
                      </Button>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.status === "new" && (
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: item.id, status: "read" })}>
                          <Eye className="mr-2 h-4 w-4" /> Mark as Read
                        </DropdownMenuItem>
                      )}
                      {item.status !== "resolved" && (
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: item.id, status: "resolved" })}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" /> Mark Resolved
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10"
                        onClick={() => deleteFeedback.mutate(item.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
