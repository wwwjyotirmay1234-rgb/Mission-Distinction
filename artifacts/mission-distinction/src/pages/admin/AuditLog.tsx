import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Shield, Trash2, AlertTriangle, Megaphone, User, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  dismissed_report:    { icon: Shield,       color: "text-emerald-400", label: "Dismissed Report" },
  removed_confession:  { icon: Trash2,       color: "text-red-400",     label: "Removed Confession" },
  removed_doubt:       { icon: Trash2,       color: "text-red-400",     label: "Removed Doubt" },
  removed_mnemonic:    { icon: Trash2,       color: "text-red-400",     label: "Removed Mnemonic" },
  issued_warning:      { icon: AlertTriangle,color: "text-amber-400",   label: "Issued Warning" },
  pinned_notice:       { icon: Megaphone,    color: "text-blue-400",    label: "Pinned Notice" },
  cleared_notice:      { icon: Megaphone,    color: "text-muted-foreground", label: "Cleared Notice" },
  promoted_admin:      { icon: User,         color: "text-purple-400",  label: "Promoted to Admin" },
  demoted_admin:       { icon: User,         color: "text-orange-400",  label: "Demoted from Admin" },
  banned_user:         { icon: User,         color: "text-red-400",     label: "Banned User" },
  unbanned_user:       { icon: User,         color: "text-emerald-400", label: "Unbanned User" },
  force_logout:        { icon: Shield,       color: "text-amber-400",   label: "Force Logged Out" },
};

export default function AuditLog() {
  const [days, setDays] = useState("7");

  const { data: logs, isLoading } = useQuery<AuditEntry[]>({
    queryKey: ["audit-logs", days],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/audit-logs?days=${days}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Audit Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Complete record of every admin action on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36 bg-card/50 border-border/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border/30">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : !logs?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No admin actions recorded in the last {days} day{Number(days) > 1 ? "s" : ""}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {logs.map(entry => {
                const cfg = ACTION_CONFIG[entry.action];
                const Icon = cfg?.icon ?? ClipboardList;
                return (
                  <div key={entry.id} className="flex items-start gap-3 px-6 py-4 hover:bg-muted/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${cfg?.color ?? "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{cfg?.label ?? entry.action}</span>
                        {entry.entityType && entry.entityId && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {entry.entityType} #{entry.entityId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by <span className="text-foreground">{entry.adminName}</span>
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <span className="ml-2 text-muted-foreground">
                            · {Object.entries(entry.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
