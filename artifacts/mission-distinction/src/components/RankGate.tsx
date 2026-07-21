import React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { RANKS } from "@/lib/ranks";
import { RankBadge } from "./RankBadge";

interface RankGateProps {
  requiredLevel: number;
  currentLevel: number;
  children: React.ReactNode;
}

export function RankGate({ requiredLevel, currentLevel, children }: RankGateProps) {
  if (currentLevel >= requiredLevel) return <>{children}</>;

  const requiredRank = RANKS.find(r => r.level === requiredLevel) ?? RANKS[requiredLevel - 1];
  const currentRank = RANKS.find(r => r.level === currentLevel) ?? RANKS[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
      <div className="w-20 h-20 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center">
        <Lock size={36} className="text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Feature Locked</h2>
        <p className="text-muted-foreground max-w-sm">
          This feature unlocks at <strong className="text-foreground">{requiredRank.emoji} {requiredRank.name}</strong>.
          Keep earning XP to level up!
        </p>
      </div>
      <div className="bg-card/50 border border-border/40 rounded-2xl p-6 space-y-4 max-w-sm w-full">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Your rank</div>
          <RankBadge level={currentLevel} showName size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Required rank</div>
          <RankBadge level={requiredLevel} showName size="sm" />
        </div>
        <div className="h-px bg-border/50" />
        <p className="text-xs text-muted-foreground">
          Earn XP by completing quizzes, reading notes, downloading PDFs, and participating in the community.
        </p>
      </div>
      <Link href="/student/leaderboard">
        <Button variant="outline" className="gap-2">
          View Leaderboard & Rankings
        </Button>
      </Link>
    </div>
  );
}
