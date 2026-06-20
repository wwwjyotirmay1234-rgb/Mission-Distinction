import React from "react";
import { cn } from "@/lib/utils";
import { getRankForXp, getNextRank, getProgressToNext } from "@/lib/ranks";
import { Zap } from "lucide-react";

interface XPProgressBarProps {
  xp: number;
  className?: string;
  compact?: boolean;
}

export function XPProgressBar({ xp, className, compact = false }: XPProgressBarProps) {
  const currentRank = getRankForXp(xp);
  const nextRank = getNextRank(xp);
  const progress = getProgressToNext(xp);

  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-semibold flex items-center gap-1", currentRank.textClass)}>
            <span>{currentRank.emoji}</span> {currentRank.name}
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Zap size={10} className="text-amber-400" /> {xp.toLocaleString()} XP
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: currentRank.color }}
          />
        </div>
        {nextRank && (
          <p className="text-[10px] text-muted-foreground text-right">
            {(nextRank.min - xp).toLocaleString()} XP to {nextRank.emoji} {nextRank.name}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentRank.emoji}</span>
          <div>
            <p className={cn("font-bold text-sm", currentRank.textClass)}>{currentRank.name}</p>
            <p className="text-xs text-muted-foreground">Level {currentRank.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-foreground flex items-center gap-1 justify-end">
            <Zap size={16} className="text-amber-400" />
            {xp.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currentRank.min.toLocaleString()} XP</span>
          <span className="font-medium">{progress}%</span>
          <span>{nextRank ? nextRank.min.toLocaleString() + " XP" : "MAX"}</span>
        </div>
        <div className="h-3 rounded-full bg-muted/50 overflow-hidden border border-border/30">
          <div
            className="h-full rounded-full transition-all duration-700 relative"
            style={{ width: `${progress}%`, backgroundColor: currentRank.color }}
          >
            <div className="absolute inset-0 rounded-full opacity-50 animate-pulse" style={{ backgroundColor: currentRank.color }} />
          </div>
        </div>
        {nextRank ? (
          <p className="text-xs text-center text-muted-foreground">
            <span className="font-medium text-foreground">{(nextRank.min - xp).toLocaleString()} XP</span> until {nextRank.emoji} {nextRank.name}
          </p>
        ) : (
          <p className="text-xs text-center font-medium" style={{ color: currentRank.color }}>
            👑 Maximum rank achieved — you're a Legend!
          </p>
        )}
      </div>
    </div>
  );
}
