import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { getRankForXp } from "@/lib/ranks";

export interface XPStats {
  totalXp: number;
  currentRankLevel: number;
  currentRankName: string;
  nextRankName: string | null;
  nextRankMin: number | null;
  progressPercent: number;
  recentHistory: Array<{
    id: number;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

const XP_RANK_KEY = "md_last_rank_level";

export function useXPStats() {
  const prevLevelRef = useRef<number | null>(null);

  const query = useQuery<XPStats>({
    queryKey: ["xpStats"],
    queryFn: async () => {
      const res = await apiFetch("/api/xp/me");
      if (!res.ok) throw new Error("Failed to fetch XP stats");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!query.data) return;
    const { currentRankLevel, currentRankName, totalXp } = query.data;
    const rank = getRankForXp(totalXp);

    const stored = parseInt(localStorage.getItem(XP_RANK_KEY) ?? "1", 10);
    if (prevLevelRef.current === null) {
      prevLevelRef.current = stored;
    }

    if (currentRankLevel > (prevLevelRef.current ?? 1)) {
      toast.success(
        `🎉 Rank Up! You're now ${rank.emoji} ${currentRankName}!`,
        {
          description: `Congratulations! You've unlocked: ${rank.unlocksLabel}`,
          duration: 8000,
          className: "border border-amber-500/30 bg-amber-950/80",
        }
      );
      prevLevelRef.current = currentRankLevel;
      localStorage.setItem(XP_RANK_KEY, String(currentRankLevel));
    }
  }, [query.data]);

  return query;
}
