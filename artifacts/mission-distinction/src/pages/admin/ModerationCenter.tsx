import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, CheckCircle, Trash2, Flag, AlertTriangle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Report {
  id: number;
  contentType: string;
  contentId: number;
  contentPreview: string;
  reason: string;
  status: string;
  reporterName: string;
  reviewedAt: string | null;
  createdAt: string;
}

async function fetchReports(status: string): Promise<{ reports: Report[]; pendingCount: number }> {
  const res = await apiFetch(`/api/admin/moderation/reports?status=${status}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  confession: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  doubt: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  mnemonic: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  community: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function ModerationCenter() {
  const [tab, setTab] = useState("pending");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["moderation-reports", tab],
    queryFn: () => fetchReports(tab),
    refetchInterval: 30000,
  });

  const reports = data?.reports ?? [];
  const pendingCount = data?.pendingCount ?? 0;

  async function dismiss(id: number) {
    const res = await apiFetch(`/api/admin/moderation/reports/${id}/dismiss`, { method: "PATCH" });
    if (res.ok) {
      toast.success("Report dismissed");
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
    } else toast.error("Failed to dismiss");
  }

  async function removeContent(id: number) {
    const res = await apiFetch(`/api/admin/moderation/reports/${id}/remove`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Content removed");
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
    } else toast.error("Failed to remove");
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Moderation Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Review and action student-reported content</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1 animate-pulse">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card/50 border border-border/50">
          <TabsTrigger value="pending" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Pending
            {pendingCount > 0 && <Badge className="h-4 px-1.5 text-[10px] bg-destructive">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Dismissed
          </TabsTrigger>
          <TabsTrigger value="removed" className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Removed
          </TabsTrigger>
        </TabsList>

        {["pending", "dismissed", "removed"].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div>
            ) : reports.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Flag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No {status} reports</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map(report => (
                  <Card key={report.id} className="bg-card/50 border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-xs border ${CONTENT_TYPE_COLORS[report.contentType] ?? "bg-muted text-muted-foreground"}`}>
                              {report.contentType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Reported {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                            </span>
                            {report.reporterName && (
                              <span className="text-xs text-muted-foreground">by {report.reporterName}</span>
                            )}
                          </div>
                          {report.contentPreview && (
                            <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
                              <p className="text-sm text-muted-foreground italic">"{report.contentPreview}"</p>
                            </div>
                          )}
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-sm"><span className="font-medium text-amber-400">Reason: </span>{report.reason}</p>
                          </div>
                        </div>
                        {status === "pending" && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => dismiss(report.id)} className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                              <CheckCircle className="w-3.5 h-3.5" /> Dismiss
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => removeContent(report.id)} className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
