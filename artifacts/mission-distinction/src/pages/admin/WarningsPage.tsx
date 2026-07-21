import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Plus, User, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WarningSummary {
  userId: number;
  userName: string;
  userEmail: string;
  total: number;
  unseen: number;
  lastWarning: string;
}

interface Warning {
  id: number;
  reason: string;
  severity: string;
  issuedByName: string;
  seenAt: string | null;
  createdAt: string;
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  warning: { label: "Warning", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  strike:  { label: "Strike",  color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  final:   { label: "Final",   color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function WarningsPage() {
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("warning");
  const [issuing, setIssuing] = useState(false);
  const [userWarnings, setUserWarnings] = useState<Record<number, Warning[]>>({});
  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useQuery<WarningSummary[]>({
    queryKey: ["warnings-summary"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/warnings/summary");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  async function loadUserWarnings(uid: number) {
    if (userWarnings[uid]) { setExpandedUser(expandedUser === uid ? null : uid); return; }
    const res = await apiFetch(`/api/admin/warnings/user/${uid}`);
    if (res.ok) {
      const data = await res.json();
      setUserWarnings(prev => ({ ...prev, [uid]: data }));
    }
    setExpandedUser(expandedUser === uid ? null : uid);
  }

  async function handleIssue() {
    if (!userId.trim() || !reason.trim()) { toast.error("User ID and reason required"); return; }
    setIssuing(true);
    try {
      const res = await apiFetch("/api/admin/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(userId), reason, severity }),
      });
      if (res.ok) {
        toast.success("Warning issued successfully");
        queryClient.invalidateQueries({ queryKey: ["warnings-summary"] });
        setShowIssueDialog(false);
        setUserId(""); setReason(""); setSeverity("warning");
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Failed to issue warning");
      }
    } finally { setIssuing(false); }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" /> Student Warning System
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Issue formal warnings to students for violations</p>
        </div>
        <Button onClick={() => setShowIssueDialog(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Issue Warning
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : !summary?.length ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No warnings issued yet</p>
            </CardContent>
          </Card>
        ) : (
          summary.map(s => (
            <Card key={s.userId} className={`bg-card/50 border-border/50 ${Number(s.total) >= 3 ? "border-destructive/40" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{s.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${Number(s.total) >= 3 ? "text-destructive" : "text-amber-400"}`}>{s.total}</p>
                      <p className="text-xs text-muted-foreground">warnings</p>
                    </div>
                    {Number(s.unseen) > 0 && (
                      <Badge variant="destructive" className="text-xs">{s.unseen} unseen</Badge>
                    )}
                    {Number(s.total) >= 3 && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs border">🚨 Flagged</Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => loadUserWarnings(s.userId)} className="gap-1 text-xs">
                      {expandedUser === s.userId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      History
                    </Button>
                  </div>
                </div>

                {expandedUser === s.userId && userWarnings[s.userId] && (
                  <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                    {userWarnings[s.userId].map(w => (
                      <div key={w.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <Badge className={`text-[10px] border shrink-0 ${SEVERITY_CONFIG[w.severity]?.color ?? ""}`}>
                          {SEVERITY_CONFIG[w.severity]?.label ?? w.severity}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{w.reason}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            By {w.issuedByName} · {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}
                            {!w.seenAt && <span className="ml-2 text-amber-400">· Unseen</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Issue Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Student User ID</label>
              <Input placeholder="Enter user ID (e.g. 42)" value={userId} onChange={e => setUserId(e.target.value)} className="bg-muted/30" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Severity</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">⚠️ Warning — First notice</SelectItem>
                  <SelectItem value="strike">🟠 Strike — Serious violation</SelectItem>
                  <SelectItem value="final">🔴 Final — Last chance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reason</label>
              <Textarea placeholder="Describe the violation clearly..." value={reason} onChange={e => setReason(e.target.value)} className="bg-muted/30 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>Cancel</Button>
            <Button onClick={handleIssue} disabled={issuing} className="bg-amber-500 hover:bg-amber-600 text-white">
              {issuing ? "Issuing..." : "Issue Warning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
