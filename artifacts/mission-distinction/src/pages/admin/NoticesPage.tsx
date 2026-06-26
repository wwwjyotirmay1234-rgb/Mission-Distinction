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
import { Megaphone, Plus, Trash2, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notice {
  id: number;
  message: string;
  type: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const NOTICE_TYPES: Record<string, { icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string; color?: string }>; color: string; bg: string; label: string }> = {
  info:    { icon: Info,          color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    label: "Info" },
  success: { icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Success" },
  warning: { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",  label: "Warning" },
  alert:   { icon: AlertTriangle, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",      label: "Alert" },
};

export default function NoticesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: notices, isLoading } = useQuery<Notice[]>({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/notices");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  async function handleCreate() {
    if (!message.trim()) { toast.error("Message required"); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type, expiresAt: expiresAt || null }),
      });
      if (res.ok) {
        toast.success("Notice pinned for all students!");
        queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
        queryClient.invalidateQueries({ queryKey: ["pinned-notice"] });
        setShowDialog(false);
        setMessage(""); setType("info"); setExpiresAt("");
      } else toast.error("Failed to create notice");
    } finally { setSaving(false); }
  }

  async function handleClear(id: number) {
    const res = await apiFetch(`/api/admin/notices/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Notice cleared");
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      queryClient.invalidateQueries({ queryKey: ["pinned-notice"] });
    } else toast.error("Failed to clear notice");
  }

  const activeNotice = notices?.find(n => n.isActive);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Pinned Notice Banner
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Show a dismissible banner to all students at the top of their dashboard</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Pin New Notice
        </Button>
      </div>

      {/* Active notice preview */}
      {activeNotice && (
        <div className={`rounded-xl border p-4 ${NOTICE_TYPES[activeNotice.type]?.bg ?? "bg-muted"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {React.createElement(NOTICE_TYPES[activeNotice.type]?.icon ?? Info, {
                className: `w-5 h-5 ${NOTICE_TYPES[activeNotice.type]?.color} shrink-0 mt-0.5`
              })}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Live Banner (students see this)</p>
                <p className="text-sm font-medium">{activeNotice.message}</p>
                {activeNotice.expiresAt && (
                  <p className="text-xs text-muted-foreground mt-1">Expires {formatDistanceToNow(new Date(activeNotice.expiresAt), { addSuffix: true })}</p>
                )}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleClear(activeNotice.id)} className="text-xs gap-1 text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Notice history */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base">Notice History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : !notices?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No notices created yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notices.map(notice => {
                const cfg = NOTICE_TYPES[notice.type];
                const Icon = cfg?.icon ?? Info;
                return (
                  <div key={notice.id} className="flex items-center gap-3 px-6 py-4">
                    <Icon className={`w-4 h-4 ${cfg?.color ?? "text-muted-foreground"} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{notice.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {notice.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border text-xs">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Cleared</Badge>
                      )}
                      {notice.isActive && (
                        <Button size="sm" variant="ghost" onClick={() => handleClear(notice.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Pin New Notice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info — General message</SelectItem>
                  <SelectItem value="success">✅ Success — Positive update</SelectItem>
                  <SelectItem value="warning">⚠️ Warning — Important notice</SelectItem>
                  <SelectItem value="alert">🔴 Alert — Urgent message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <Textarea placeholder="e.g. Anatomy exam tomorrow at 9 AM — best of luck! 🎯" value={message} onChange={e => setMessage(e.target.value)} className="bg-muted/30 resize-none" rows={3} maxLength={500} />
              <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/500</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Expires (optional)</label>
              <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="bg-muted/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Pinning..." : "📌 Pin for All Students"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
