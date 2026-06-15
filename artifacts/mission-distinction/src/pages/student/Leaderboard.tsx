import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame, Medal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

interface LeaderboardEntry {
  id: number;
  fullName: string;
  college: string;
  year: string;
  studyStreak: number;
  quizzesAttempted: number;
  avgScore: number;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await apiFetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

const medals = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }: { rank: number }) {
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
  const [tab, setTab] = useState<"score" | "streak">("score");
  const { user } = useAuth();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 60_000,
  });

  const sorted =
    tab === "score"
      ? [...entries].sort((a, b) => b.avgScore - a.avgScore || b.quizzesAttempted - a.quizzesAttempted)
      : [...entries].sort((a, b) => b.studyStreak - a.studyStreak);

  const myRank = sorted.findIndex((e) => e.id === user?.id) + 1;

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
              <p className="font-semibold truncate">{user?.fullName} <span className="text-xs text-muted-foreground">(You)</span></p>
              <p className="text-xs text-muted-foreground truncate">{user?.college}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-black text-primary">#{myRank}</p>
              <p className="text-xs text-muted-foreground">Your rank</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="score" className="gap-2">
            <Medal size={14} /> Top Scorers
          </TabsTrigger>
          <TabsTrigger value="streak" className="gap-2">
            <Flame size={14} /> Streak Leaders
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="bg-card/40 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {tab === "score" ? "Ranked by average quiz score" : "Ranked by study streak"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No data yet. Be the first to take a quiz!
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {sorted.map((entry, idx) => {
                const rank = idx + 1;
                const isMe = entry.id === user?.id;
                return (
                  <div
                    key={entry.id}
                    className={`p-4 flex items-center gap-4 transition-colors ${isMe ? "bg-primary/5" : "hover:bg-muted/20"}`}
                  >
                    <div className="w-10 flex items-center justify-center shrink-0">
                      <RankBadge rank={rank} />
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
