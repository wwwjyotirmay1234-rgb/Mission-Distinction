import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/apiFetch";
import { 
  Activity, UserPlus, Brain, MessageSquare, Users, 
  BookOpen, RefreshCw, Wifi, WifiOff, Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedEvent {
  id: string;
  type: string;
  label: string;
  meta: string;
  time: string;
}

interface FeedStats {
  totalUsers: number;
  todayRegistrations: number;
  todayQuizAttempts: number;
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  quiz:       { icon: Brain,          color: "text-purple-400",  bg: "bg-purple-500/10" },
  activity:   { icon: Activity,       color: "text-blue-400",    bg: "bg-blue-500/10" },
  register:   { icon: UserPlus,       color: "text-emerald-400", bg: "bg-emerald-500/10" },
  doubt:      { icon: MessageSquare,  color: "text-amber-400",   bg: "bg-amber-500/10" },
  study_room: { icon: Users,          color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  confession: { icon: BookOpen,       color: "text-rose-400",    bg: "bg-rose-500/10" },
};

export default function ActivityFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchFeed = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/activity-feed");
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
      setStats(data.stats ?? null);
      setLastUpdated(new Date());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(fetchFeed, 8000);
    return () => clearInterval(t);
  }, [live, fetchFeed]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" /> Live Activity Feed
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time stream of platform events · Auto-refreshes every 8s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={live ? "default" : "outline"} onClick={() => setLive(!live)} className="gap-1.5 text-xs">
            {live ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {live ? "Live" : "Paused"}
          </Button>
          <Button size="sm" variant="outline" onClick={fetchFeed} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Live stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Students", value: stats?.totalUsers ?? 0, icon: Users, color: "text-purple-400" },
          { label: "Joined Today", value: stats?.todayRegistrations ?? 0, icon: UserPlus, color: "text-emerald-400" },
          { label: "Quizzes Today", value: stats?.todayQuizAttempts ?? 0, icon: Brain, color: "text-blue-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {loading ? <Skeleton className="h-6 w-10 mt-0.5" /> : (
                  <p className="text-xl font-bold">{s.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
        {live ? `Live — last updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}` : "Paused"}
      </div>

      {/* Event feed */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border/30">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No activity yet. Events will appear here as students use the platform.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {events.map((event) => {
                const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.activity;
                const Icon = cfg.icon;
                return (
                  <div key={event.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{event.label}</p>
                      {event.meta && <p className="text-xs text-muted-foreground">{event.meta}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                    </span>
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
