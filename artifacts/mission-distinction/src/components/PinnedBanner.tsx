import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { X, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notice {
  id: number;
  message: string;
  type: string;
  isActive: boolean;
  expiresAt: string | null;
}

const NOTICE_STYLE: Record<string, { icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string; color?: string }>; bg: string; text: string; border: string }> = {
  info:    { icon: Info,          bg: "bg-blue-950/80",    text: "text-blue-200",   border: "border-blue-700/40" },
  success: { icon: CheckCircle,   bg: "bg-emerald-950/80", text: "text-emerald-200",border: "border-emerald-700/40" },
  warning: { icon: AlertTriangle, bg: "bg-amber-950/80",   text: "text-amber-200",  border: "border-amber-700/40" },
  alert:   { icon: AlertTriangle, bg: "bg-red-950/80",     text: "text-red-200",    border: "border-red-700/40" },
};

const DISMISSED_KEY = "dismissed_notices";

function getDismissed(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function dismiss(id: number) {
  const set = getDismissed(); set.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
}

export function PinnedBanner() {
  const [dismissed, setDismissed] = useState<Set<number>>(getDismissed);

  const { data: notice } = useQuery<Notice | null>({
    queryKey: ["pinned-notice"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/notices/active");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  if (!notice || dismissed.has(notice.id)) return null;

  const cfg = NOTICE_STYLE[notice.type] ?? NOTICE_STYLE.info;
  const Icon = cfg.icon;

  function handleDismiss() {
    dismiss(notice!.id);
    setDismissed(getDismissed());
  }

  return (
    <div className={cn("w-full border-b px-4 py-2.5 flex items-center gap-3", cfg.bg, cfg.border)}>
      <Icon className={cn("w-4 h-4 shrink-0", cfg.text)} />
      <p className={cn("flex-1 text-sm font-medium", cfg.text)}>{notice.message}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className={cn("h-6 w-6 p-0 rounded-full hover:bg-white/10 shrink-0", cfg.text)}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
