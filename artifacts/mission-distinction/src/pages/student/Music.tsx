import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Play, Pause, SkipForward, SkipBack, Music2, Loader2 } from "lucide-react";

interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string | null;
  trackTimeMillis: number;
  primaryGenreName: string;
}

const STUDY_QUERIES = [
  { label: "Lo-fi beats", query: "lofi hip hop" },
  { label: "Classical piano", query: "classical piano study" },
  { label: "Ambient chill", query: "ambient chill music" },
  { label: "Instrumental jazz", query: "instrumental jazz" },
  { label: "Nature sounds", query: "nature sounds relaxing" },
  { label: "Focus music", query: "focus concentration music" },
];

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtSec(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export default function StudentMusic() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
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

  // Keep skipTrack stable — define after results is set
  const skipTrack = useCallback((dir: 1 | -1) => {
    setCurrentTrack(prev => {
      if (!prev) return prev;
      setResults(r => {
        const idx = r.findIndex(t => t.trackId === prev.trackId);
        const next = r[idx + dir];
        if (next?.previewUrl) {
          if (audioRef.current) {
            audioRef.current.src = next.previewUrl;
            audioRef.current.play().catch(() => {});
          }
          setIsPlaying(true);
          setProgress(0);
          return r; // no change to results
        }
        return r;
      });
      return prev;
    });
  }, []);

  const playTrack = useCallback((track: Track) => {
    if (!track.previewUrl) return;
    if (!audioRef.current) return;

    if (currentTrack?.trackId === track.trackId) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    audioRef.current.src = track.previewUrl;
    audioRef.current.play().catch(() => {});
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => {
      setIsPlaying(false);
      skipTrack(1);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [skipTrack]);

  const currentIdx = currentTrack
    ? results.findIndex(t => t.trackId === currentTrack.trackId)
    : -1;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seekTo = (pct: number) => {
    if (!audioRef.current || !duration) return;
    audioRef.current.currentTime = pct * duration;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-28">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Search and play songs while you study
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") search(query); }}
              placeholder="Search songs, artists, albums…"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-card/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={() => search(query)}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <Search size={14} />}
            Search
          </button>
        </div>

        {/* Genre chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {STUDY_QUERIES.map(g => (
            <button
              key={g.label}
              onClick={() => { setQuery(g.query); search(g.query); }}
              className="text-xs px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {/* Empty state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Music2 size={44} className="text-primary/20" />
          <p className="text-sm">Search any song, artist, or album</p>
          <p className="text-xs opacity-60">Tap a chip above for study-friendly music</p>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No results found. Try a different search.
        </div>
      )}

      {/* Track list */}
      <div className="space-y-0.5">
        {results.map((track, i) => {
          const isCurrent = currentTrack?.trackId === track.trackId;
          const hasPreview = !!track.previewUrl;
          return (
            <button
              key={track.trackId}
              onClick={() => playTrack(track)}
              disabled={!hasPreview}
              title={hasPreview ? undefined : "No preview available"}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                isCurrent
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-card/60 border border-transparent"
              } ${!hasPreview ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Index / icon */}
              <div className="w-5 shrink-0 text-center">
                {isCurrent && isPlaying ? (
                  <Pause size={13} className="text-primary mx-auto" />
                ) : isCurrent ? (
                  <Play size={13} className="text-primary mx-auto" />
                ) : (
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                )}
              </div>

              {/* Art */}
              <img
                src={track.artworkUrl100.replace("100x100bb", "60x60bb")}
                alt={track.collectionName}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                  {track.trackName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
              </div>

              {/* Duration */}
              <span className="text-xs text-muted-foreground shrink-0">
                {track.trackTimeMillis ? fmtTime(track.trackTimeMillis) : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mini Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border shadow-2xl">
          {/* Seek bar */}
          <div
            className="h-1 bg-border cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="h-full bg-primary transition-none"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <img
              src={currentTrack.artworkUrl100.replace("100x100bb", "50x50bb")}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
              alt={currentTrack.trackName}
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-primary">
                {currentTrack.trackName}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate">{currentTrack.artistName}</span>
                <span>·</span>
                <span>{fmtSec(progress)} / {fmtSec(duration)}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                  preview
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => skipTrack(-1)}
                disabled={currentIdx <= 0}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => skipTrack(1)}
                disabled={currentIdx >= results.length - 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
