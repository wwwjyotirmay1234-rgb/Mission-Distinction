import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, ShieldAlert, ShieldCheck, Camera, Eye, Copy,
  Monitor, AlertTriangle, CheckCircle, Info, Flag,
} from "lucide-react";

function customFetch(url: string, opts?: RequestInit) {
  const token = localStorage.getItem("mission_token");
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  });
}

const EVENT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  session_started: { label: "Session Started", icon: <CheckCircle size={14} />, color: "text-green-400 bg-green-500/10 border-green-500/20" },
  tab_switch: { label: "Tab Switch", icon: <Monitor size={14} />, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  fullscreen_exit: { label: "Exited Fullscreen", icon: <Eye size={14} />, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  copy_paste: { label: "Copy/Paste", icon: <Copy size={14} />, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  right_click: { label: "Right Click", icon: <AlertTriangle size={14} />, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ai_flag: { label: "AI Flag", icon: <Camera size={14} />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  auto_submitted: { label: "Auto-Submitted", icon: <ShieldAlert size={14} />, color: "text-red-400 bg-red-500/15 border-red-500/30" },
  camera_error: { label: "Camera Error", icon: <Camera size={14} />, color: "text-muted-foreground bg-muted/20 border-border/30" },
};

function EventBadge({ type }: { type: string }) {
  const m = EVENT_META[type] ?? { label: type, icon: <Info size={14} />, color: "text-muted-foreground bg-muted/20 border-border/20" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" });
}

export default function ProctoringReport() {
  const [, params] = useRoute("/admin/proctoring/:attemptId");
  const [, navigate] = useLocation();
  const attemptId = params?.attemptId ? parseInt(params.attemptId) : null;
  const qc = useQueryClient();
  const [flagging, setFlagging] = useState(false);

  const { data, isLoading, error } = useQuery<{ attempt: any; logs: any[] }>({
    queryKey: ["proctoring-report", attemptId],
    queryFn: () => customFetch(`/api/proctoring/attempts/${attemptId}/report`),
    enabled: !!attemptId,
  });

  const flagMutation = useMutation({
    mutationFn: (isFlagged: boolean) =>
      customFetch(`/api/proctoring/attempts/${attemptId}/flag`, {
        method: "PATCH",
        body: JSON.stringify({ isFlagged }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proctoring-report", attemptId] });
      toast.success("Attempt flag updated.");
      setFlagging(false);
    },
    onError: () => toast.error("Failed to update flag."),
  });

  if (!attemptId) return null;

  const attempt = data?.attempt;
  const logs = data?.logs ?? [];

  const seriousLogs = logs.filter(l => !["session_started", "camera_error"].includes(l.eventType));
  const violationCount = attempt?.violationCount ?? 0;
  const isFlagged = attempt?.isFlagged ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/quiz-submissions")} className="gap-2 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Submissions
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {isFlagged
              ? <ShieldAlert size={22} className="text-red-400" />
              : <ShieldCheck size={22} className="text-green-400" />}
            Proctoring Report
          </h1>
          {attempt && (
            <p className="text-muted-foreground text-sm mt-1">
              Attempt #{attempt.id} · {attempt.quizTitle} · {attempt.subject}
            </p>
          )}
        </div>
        {attempt && (
          <Button
            variant={isFlagged ? "outline" : "destructive"}
            size="sm"
            className={isFlagged ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : ""}
            disabled={flagMutation.isPending}
            onClick={() => flagMutation.mutate(!isFlagged)}
          >
            <Flag size={14} className="mr-2" />
            {isFlagged ? "Remove Flag" : "Flag Attempt"}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-6 text-center text-red-400">Failed to load report.</CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Events", value: logs.length, color: "text-foreground" },
              { label: "Violations", value: violationCount, color: violationCount === 0 ? "text-green-400" : violationCount < 3 ? "text-amber-400" : "text-red-400" },
              { label: "Score", value: `${attempt?.percentage ?? 0}%`, color: "text-primary" },
              { label: "Status", value: isFlagged ? "FLAGGED" : "Clean", color: isFlagged ? "text-red-400" : "text-green-400" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="bg-card/40 border-border/40">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Event Timeline ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No proctoring events recorded.</p>
              )}
              {logs.map((log: any, i: number) => (
                <div key={log.id ?? i} className={`flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-xl border ${
                  log.eventType === "auto_submitted" ? "border-red-500/30 bg-red-500/5" :
                  ["tab_switch", "copy_paste", "ai_flag"].includes(log.eventType) ? "border-orange-500/20 bg-orange-500/5" :
                  "border-border/20 bg-muted/10"
                }`}>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono w-6 text-right">{i + 1}</span>
                    <EventBadge type={log.eventType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatTs(log.createdAt)}</span>
                    </div>
                    {log.aiAnalysis && (
                      <p className="text-xs text-muted-foreground mt-1 italic">AI: {log.aiAnalysis}</p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
