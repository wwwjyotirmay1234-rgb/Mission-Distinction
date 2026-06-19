import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Warning {
  id: number;
  reason: string;
  severity: string;
  issuedByName: string;
  seenAt: string | null;
  createdAt: string;
}

const SEVERITY_LABEL: Record<string, string> = {
  warning: "⚠️ Warning",
  strike: "🟠 Strike",
  final: "🔴 Final Warning",
};
const SEVERITY_COLOR: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  strike: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  final: "bg-destructive/10 text-destructive border-destructive/20",
};

export function WarningBanner() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const queryClient = useQueryClient();

  const { data: warnings } = useQuery<Warning[]>({
    queryKey: ["my-warnings"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/warnings/my");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    onSuccess: (data) => {
      if (data?.some(w => !w.seenAt)) setOpen(true);
    },
  } as any);

  const unseen = warnings?.filter(w => !w.seenAt) ?? [];

  async function markSeen(id: number) {
    await apiFetch(`/api/admin/warnings/${id}/seen`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["my-warnings"] });
  }

  async function handleAcknowledge() {
    if (unseen[currentIdx]) await markSeen(unseen[currentIdx].id);
    if (currentIdx < unseen.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setOpen(false);
      setCurrentIdx(0);
    }
  }

  if (!unseen.length) return null;
  const w = unseen[currentIdx];
  if (!w) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-amber-500/30 [&>button:first-of-type]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" /> Official Warning
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs border ${SEVERITY_COLOR[w.severity] ?? ""}`}>
              {SEVERITY_LABEL[w.severity] ?? w.severity}
            </Badge>
            {unseen.length > 1 && (
              <span className="text-xs text-muted-foreground">{currentIdx + 1} of {unseen.length}</span>
            )}
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-sm">{w.reason}</p>
          </div>
          <p className="text-xs text-muted-foreground">Issued by {w.issuedByName}</p>
          {(warnings?.filter(x => !x.seenAt).length ?? 0) + (warnings?.filter(x => x.seenAt).length ?? 0) >= 3 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive font-medium">⚠️ You have 3 or more warnings on record. Further violations may result in account suspension.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAcknowledge} className="w-full">
            I Understand & Acknowledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
