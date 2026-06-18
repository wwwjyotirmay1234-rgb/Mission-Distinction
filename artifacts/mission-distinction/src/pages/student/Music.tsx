import { useState, useCallback } from "react";
import { Search, Music2, Loader2, X, Youtube } from "lucide-react";

interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  trackTimeMillis: number;
  primaryGenreName: string;
}

const STUDY_QUERIES = [
  { label: "Lo-fi beats", query: "lofi hip hop study" },
  { label: "Classical piano", query: "classical piano study music" },
  { label: "Ambient chill", query: "ambient chill music focus" },
  { label: "Instrumental jazz", query: "instrumental jazz relaxing" },
  { label: "Nature sounds", query: "nature sounds relaxing study" },
  { label: "Focus music", query: "focus concentration music" },
];

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const BAR_HEIGHTS = [40, 65, 85, 55, 90, 70, 45, 80, 60, 75, 50, 88, 62, 78, 48];
const BAR_DELAYS  = [0, 0.2, 0.4, 0.1, 0.5, 0.3, 0.15, 0.45, 0.25, 0.35, 0.05, 0.5, 0.2, 0.4, 0.1];

function EqualizerBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-24 opacity-80">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="w-[6px] rounded-t-sm"
          style={{
            height: `${h}%`,
            background: "linear-gradient(to top, #7c3aed, #a78bfa)",
            animation: active
              ? `eq-bounce ${0.8 + (i % 3) * 0.2}s ease-in-out ${BAR_DELAYS[i]}s infinite alternate`
              : "none",
            transform: active ? undefined : "scaleY(0.35)",
            transformOrigin: "bottom",
            boxShadow: active ? "0 0 6px #7c3aed88" : "none",
            transition: "box-shadow 0.3s",
          }}
        />
      ))}
      <style>{`
        @keyframes eq-bounce {
          from { transform: scaleY(0.35); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

export default function StudentMusic() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytKey, setYtKey] = useState(0);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
    setYtQuery(q);
    setYtKey(k => k + 1);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=25&entity=song`
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setError("Search failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const playOnYouTube = (track: Track) => {
    const q = `${track.trackName} ${track.artistName} full song`;
    setYtQuery(q);
    setYtKey(k => k + 1);
    // Scroll to the player
    document.getElementById("yt-player")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const ytEmbedUrl = ytQuery
    ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(ytQuery)}&autoplay=1&rel=0`
    : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-6 -mx-4 -mt-4">

      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden px-5 pt-6 pb-7"
        style={{ background: "linear-gradient(135deg, #0d0f1a 0%, #1a0a3e 40%, #1e0b4a 60%, #0d0f1a 100%)" }}
      >
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute bottom-0 left-1/3 w-36 h-36 rounded-full opacity-15 blur-2xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />

        <span className="absolute top-3 right-16 text-violet-400 opacity-40 text-lg select-none pointer-events-none">♪</span>
        <span className="absolute top-8 right-7 text-violet-300 opacity-30 text-sm select-none pointer-events-none">♫</span>
        <span className="absolute bottom-12 right-24 text-violet-500 opacity-25 text-xl select-none pointer-events-none">♩</span>

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-white">
              Study <span className="text-violet-400">Music</span> Hub
            </h1>
            <p className="text-white/80 text-[13px] font-medium mt-1.5">
              Focus deeper. Study longer. Learn smarter.
            </p>
            <p className="text-white/45 text-[12px] mt-1 leading-snug">
              Curated music and ambient sounds designed<br />for MBBS students.
            </p>
          </div>
          <div className="shrink-0 pr-1 pt-1">
            <EqualizerBars active={hasSearched} />
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mt-5">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") doSearch(query); }}
            placeholder="Search any song, artist, album…"
            className="w-full h-12 pl-10 pr-24 rounded-2xl text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => doSearch(query)}
              disabled={loading || !query.trim()}
              className="h-8 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              <span>Go</span>
            </button>
          </div>
        </div>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-1.5 px-5 pt-4 pb-3">
        {STUDY_QUERIES.map(g => (
          <button
            key={g.label}
            onClick={() => { setQuery(g.query); doSearch(g.query); }}
            className="text-xs px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {g.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-destructive px-5 mb-2">{error}</p>}

      {/* Empty state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Music2 size={44} className="text-primary/20" />
          <p className="text-sm">Search any song to hear it in full</p>
          <p className="text-xs opacity-60">Tap a chip above for study-friendly music</p>
        </div>
      )}

      {hasSearched && (
        <div className="px-4 space-y-5">

          {/* YouTube full-song player */}
          <div id="yt-player" className="rounded-2xl overflow-hidden border border-border/60">
            <div className="flex items-center gap-2 px-3 py-2 bg-card/60 border-b border-border/40">
              <Youtube size={14} className="text-red-400" />
              <span className="text-xs font-medium text-foreground/70">Full Song Player</span>
              <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[200px]">{ytQuery}</span>
            </div>
            {ytEmbedUrl && (
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  key={ytKey}
                  src={ytEmbedUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title="YouTube Music Player"
                />
              </div>
            )}
          </div>

          {/* iTunes track list */}
          {results.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 px-1">
                Tap any track below to play it in full ↑
              </p>
              <div className="space-y-0.5">
                {results.map((track, i) => (
                  <button
                    key={track.trackId}
                    onClick={() => playOnYouTube(track)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-card/60 border border-transparent hover:border-border/40 transition-colors cursor-pointer"
                  >
                    <span className="w-5 text-center text-xs text-muted-foreground shrink-0">{i + 1}</span>
                    <img
                      src={track.artworkUrl100}
                      alt={track.collectionName}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{track.trackName}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {track.trackTimeMillis ? fmtTime(track.trackTimeMillis) : "—"}
                      </span>
                      <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20">
                        <Youtube size={11} className="text-red-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="text-center py-6 text-muted-foreground text-sm">
              No results found. Try a different search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
