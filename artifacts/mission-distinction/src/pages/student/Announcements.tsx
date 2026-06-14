import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListAnnouncements, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { Bell, Megaphone, Newspaper, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "announcement" | "news" | "event";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  announcement: { label: "Announcement", color: "border-primary/40 text-primary bg-primary/10", icon: Megaphone },
  news: { label: "News", color: "border-blue-500/40 text-blue-400 bg-blue-500/10", icon: Newspaper },
  event: { label: "Event", color: "border-green-500/40 text-green-400 bg-green-500/10", icon: CalendarDays },
};

const TABS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "announcement", label: "Announcements" },
  { key: "news", label: "News" },
  { key: "event", label: "Events" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentAnnouncements() {
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: announcements, isLoading } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey() } }
  );

  const filtered = !announcements
    ? []
    : filter === "all"
    ? announcements
    : announcements.filter((a) => a.type === filter);

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> News & Announcements
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with the latest news, events, and announcements from Mission Distinction.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
              filter === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
            {!isLoading && announcements && tab.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({announcements.filter((a) => a.type === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="bg-card/40 border-border/40">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="h-12 w-12 opacity-20 mb-4" />
            <p className="text-base font-medium">No {filter === "all" ? "" : filter + "s"} yet</p>
            <p className="text-sm mt-1">Check back soon — the admin will post updates here.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement;
            const Icon = cfg.icon;
            return (
              <Card
                key={item.id}
                className="bg-card/40 border-border/40 hover:border-border/70 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                        cfg.color
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3 className="font-semibold text-foreground leading-tight">{item.title}</h3>
                        <Badge
                          variant="outline"
                          className={cn("uppercase text-[10px] tracking-wider shrink-0", cfg.color)}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.content}</p>
                      <p className="text-xs text-muted-foreground/60 mt-3">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
