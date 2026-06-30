import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  GraduationCap, FileText, BookOpen, ClipboardList,
  CheckCircle2, XCircle, Clock, ExternalLink, Loader2, User,
} from "lucide-react";

const TYPE_META = {
  note:  { label: "Note",  icon: FileText,      color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/30" },
  book:  { label: "Book",  icon: BookOpen,      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  pyq:   { label: "PYQ",  icon: ClipboardList, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
} as const;

const STATUS_META = {
  pending:  { label: "Pending",  icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  rejected: { label: "Rejected", icon: XCircle,      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
};

type SubType = "note" | "book" | "pyq";
type StatusType = "pending" | "approved" | "rejected";

type Submission = {
  id: number;
  user_id: number;
  user_name: string;
  user_college: string | null;
  type: SubType;
  title: string;
  subject: string;
  year: string | null;
  url: string;
  description: string | null;
  status: StatusType;
  reviewed_by_name: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

function SubmissionCard({
  sub,
  onApprove,
  onReject,
  approving,
}: {
  sub: Submission;
  onApprove: (id: number) => void;
  onReject: (sub: Submission) => void;
  approving: number | null;
}) {
  const tm = TYPE_META[sub.type];
  const sm = STATUS_META[sub.status];
  const Icon = tm.icon;
  const SIcon = sm.icon;
  const isPending = sub.status === "pending";

  return (
    <Card className="bg-card/60 border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left: type icon */}
          <div className={`p-2.5 rounded-xl border ${tm.bg} shrink-0 self-start`}>
            <Icon size={18} className={tm.color} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-snug">{sub.title}</h3>
              <Badge variant="outline" className={`text-[10px] shrink-0 px-2 py-0.5 border ${sm.bg} ${sm.color}`}>
                <SIcon size={10} className="mr-1" />{sm.label}
              </Badge>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge variant="outline" className={`text-[10px] px-2 border ${tm.bg} ${tm.color}`}>{tm.label}</Badge>
              <Badge variant="outline" className="text-[10px] px-2 border-border/50 text-muted-foreground">{sub.subject}</Badge>
              {sub.year && <Badge variant="outline" className="text-[10px] px-2 border-border/50 text-muted-foreground">{sub.year}</Badge>}
            </div>

            {/* Description */}
            {sub.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{sub.description}</p>
            )}

            {/* Rejection reason */}
            {sub.status === "rejected" && sub.rejection_reason && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 mb-2">
                Rejection reason: {sub.rejection_reason}
              </p>
            )}
            {sub.status === "approved" && (
              <p className="text-xs text-emerald-400 mb-2">
                ✓ Added to {TYPE_META[sub.type].label} library by {sub.reviewed_by_name}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User size={11} />
                <span className="font-medium text-foreground/80">{sub.user_name}</span>
                {sub.user_college && <span>· {sub.user_college}</span>}
                <span>·</span>
                <span>{new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={sub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink size={11} />View
                </a>
                {isPending && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => onReject(sub)}
                    >
                      <XCircle size={12} className="mr-1" />Reject
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => onApprove(sub.id)}
                      disabled={approving === sub.id}
                    >
                      {approving === sub.id
                        ? <Loader2 size={12} className="animate-spin mr-1" />
                        : <CheckCircle2 size={12} className="mr-1" />}
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminScholarHub() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [rejectTarget, setRejectTarget] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const { data: submissions, isLoading } = useQuery<Submission[]>({
    queryKey: ["admin-submissions", tab],
    queryFn: () =>
      customFetch<Submission[]>(tab === "pending"
        ? "/api/admin/submissions?status=pending"
        : "/api/admin/submissions"),
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      customFetch(`/api/admin/submissions/${id}/approve`, { method: "PATCH" }),
    onMutate: (id) => setApprovingId(id),
    onSuccess: () => {
      toast.success("Submission approved and added to library!");
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to approve"),
    onSettled: () => setApprovingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      customFetch(`/api/admin/submissions/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      toast.success("Submission rejected.");
      setRejectTarget(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to reject"),
  });

  const pending = submissions?.filter(s => s.status === "pending").length ?? 0;
  const approved = submissions?.filter(s => s.status === "approved").length ?? 0;
  const rejected = submissions?.filter(s => s.status === "rejected").length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
          <GraduationCap size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Scholar Hub</h1>
          <p className="text-sm text-muted-foreground">Review student resource submissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending Review", value: pending, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Approved",       value: approved, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Rejected",       value: rejected, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        ].map(stat => (
          <Card key={stat.label} className={`border ${stat.bg}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{isLoading ? "—" : stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-lg w-fit">
        {(["pending", "all"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "pending" ? "Pending Review" : "All Submissions"}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : !submissions?.length ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
          <GraduationCap size={32} className="mx-auto mb-2 opacity-30" />
          {tab === "pending" ? "No pending submissions — all caught up!" : "No submissions yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              onApprove={id => approveMutation.mutate(id)}
              onReject={sub => { setRejectTarget(sub); setRejectReason(""); }}
              approving={approvingId}
            />
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {rejectTarget && (
              <p className="text-sm text-muted-foreground">
                Rejecting <span className="font-medium text-foreground">"{rejectTarget.title}"</span> by {rejectTarget.user_name}.
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Reason <span className="text-xs text-muted-foreground">(optional — student will see this)</span></Label>
              <Textarea
                placeholder="e.g. Duplicate content, low quality scan, wrong subject…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                className="resize-none bg-background/50"
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
