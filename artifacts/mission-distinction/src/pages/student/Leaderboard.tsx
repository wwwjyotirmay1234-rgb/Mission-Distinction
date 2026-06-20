import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame, Medal, Zap, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { RankBadge } from "@/components/RankBadge";
import { getRankForXp, RANKS } from "@/lib/ranks";

interface LeaderboardEntry {
  id: number;
  fullName: string;
  college: string;
  year: string;
  studyStreak: number;
  quizzesAttempted: number;
  avgScore: number;
}

interface XPLeaderboardEntry {
  id: number;
  fullName: string;
  college: string;
  year: string;
  totalXp: number;
  currentRank: number;
  rankName: string;
  studyStreak: number;
}

interface LeaderboardResponse {
  topScorers: LeaderboardEntry[];
  streakLeaders: LeaderboardEntry[];
}

async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await apiFetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

async function fetchXPLeaderboard(): Promise<XPLeaderboardEntry[]> {
  const res = await apiFetch("/api/xp/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch XP leaderboard");
  return res.json();
}

const medals = ["🥇", "🥈", "🥉"];

function PositionBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="text-xl">{medals[rank - 1]}</span>;
  }
  return (
    <span className="w-8 text-center text-sm font-bold text-muted-foreground">
      #{rank}
    </span>
  );
}

export default function StudentLeaderboard() {
  const [tab, setTab] = useState<"xp" | "score" | "streak">("xp");
  const { user } = useAuth();

  const { data, isLoading: classicLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 60_000,
  });

  const { data: xpData, isLoading: xpLoading } = useQuery({
    queryKey: ["xpLeaderboard"],
    queryFn: fetchXPLeaderboard,
    staleTime: 60_000,
  });

  const classicEntries: LeaderboardEntry[] =
    tab === "score" ? (data?.topScorers ?? []) : (data?.streakLeaders ?? []);

  const isLoading = tab === "xp" ? xpLoading : classicLoading;

  const myXpRank = (xpData ?? []).findIndex(e => e.id === user?.id) + 1;
  const myClassicRank = classicEntries.findIndex(e => e.id === user?.id) + 1;
  const myRank = tab === "xp" ? myXpRank : myClassicRank;

  const myXpEntry = xpData?.find(e => e.id === user?.id);
  const myRankInfo = myXpEntry ? getRankForXp(myXpEntry.totalXp) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} /> Leaderboard
        </h1>
        <p className="text-muted-foreground">See how you rank among your peers.</p>
      </div>

      {myRank > 0 && (
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-lg shrink-0">
              {user?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">{user?.fullName}</p>
                {myRankInfo && <RankBadge xp={myXpEntry?.totalXp} size="xs" showName />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.college}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-black text-primary">#{myRank}</p>
              <p className="text-xs text-muted-foreground">Your rank</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as "xp" | "score" | "streak")}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="xp" className="gap-1.5">
            <Zap size={13} className="text-amber-400" /> XP Rankings
          </TabsTrigger>
          <TabsTrigger value="score" className="gap-1.5">
            <Medal size={13} /> Top Scorers
          </TabsTrigger>
          <TabsTrigger value="streak" className="gap-1.5">
            <Flame size={13} /> Streak Leaders
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "xp" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {RANKS.map(rank => {
            const count = (xpData ?? []).filter(u => getRankForXp(u.totalXp).level === rank.level).length;
            return (
              <div key={rank.level} className={`rounded-xl border p-3 ${rank.bgClass} ${rank.borderClass}`}>
                <p className="text-base">{rank.emoji}</p>
                <p className={`text-xs font-semibold mt-1 ${rank.textClass}`}>{rank.name}</p>
                <p className="text-lg font-black text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground">students</p>
              </div>
            );
          })}
        </div>
      )}

      <Card className="bg-card/40 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {tab === "xp" ? "Ranked by total XP earned" : tab === "score" ? "Ranked by average quiz score" : "Ranked by study streak"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : tab === "xp" ? (
            (xpData ?? []).length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No XP data yet. Start earning XP by taking quizzes!
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {(xpData ?? []).map((entry, idx) => {
                  const pos = idx + 1;
                  const isMe = entry.id === user?.id;
                  const entryRank = getRankForXp(entry.totalXp);
                  return (
                    <div
                      key={entry.id}
                      className={`p-4 flex items-center gap-4 transition-colors ${isMe ? "bg-primary/5" : "hover:bg-muted/20"}`}
                    >
                      <div className="w-10 flex items-center justify-center shrink-0">
                        <PositionBadge rank={pos} />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                        {entry.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">
                            {entry.fullName}
                            {isMe && <span className="ml-1 text-xs text-primary">(You)</span>}
                          </p>
                          <RankBadge xp={entry.totalXp} size="xs" />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.college || "Unknown College"}{entry.year ? ` · ${entry.year}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-amber-400 flex items-center gap-1 justify-end">
                          <Zap size={13} /> {entry.totalXp.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : classicEntries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No data yet. Be the first to take a quiz!
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {classicEntries.map((entry, idx) => {
                const pos = idx + 1;
                const isMe = entry.id === user?.id;
                return (
                  <div
                    key={entry.id}
                    className={`p-4 flex items-center gap-4 transition-colors ${isMe ? "bg-primary/5" : "hover:bg-muted/20"}`}
                  >
                    <div className="w-10 flex items-center justify-center shrink-0">
                      <PositionBadge rank={pos} />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                      {entry.fullName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {entry.fullName}
                        {isMe && <span className="ml-2 text-xs text-primary">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.college || "Unknown College"}{entry.year ? ` · ${entry.year}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {tab === "score" ? (
                        <>
                          <p className="text-base font-bold text-primary">{entry.avgScore}%</p>
                          <p className="text-xs text-muted-foreground">{entry.quizzesAttempted} quizzes</p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-bold text-orange-500">{entry.studyStreak} 🔥</p>
                          <p className="text-xs text-muted-foreground">day streak</p>
                        </>
                      )}
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
