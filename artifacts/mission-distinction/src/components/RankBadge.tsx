import React from "react";
import { cn } from "@/lib/utils";
import { RANKS, getRankForXp } from "@/lib/ranks";

interface RankBadgeProps {
  level?: number;
  xp?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showName?: boolean;
  showXp?: boolean;
  className?: string;
}

export function RankBadge({ level, xp, size = "sm", showName = false, showXp = false, className }: RankBadgeProps) {
  const rank = xp !== undefined
    ? getRankForXp(xp)
    : RANKS.find(r => r.level === (level ?? 1)) ?? RANKS[0];

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const emojiSizes = {
    xs: "text-[10px]",
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold shrink-0",
        sizeClasses[size],
        rank.bgClass,
        rank.textClass,
        rank.borderClass,
        className
      )}
    >
      <span className={emojiSizes[size]}>{rank.emoji}</span>
      {showName && <span>{rank.name}</span>}
      {showXp && xp !== undefined && <span className="opacity-70">· {xp.toLocaleString()} XP</span>}
    </span>
  );
}

export function LevelBadge({ level, size = "sm" }: { level: number; size?: "xs" | "sm" | "md" }) {
  const sizeClasses = {
    xs: "text-[9px] w-4 h-4",
    sm: "text-[10px] w-5 h-5",
    md: "text-xs w-6 h-6",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0",
        sizeClasses[size]
      )}
    >
      {level}
    </span>
  );
}
