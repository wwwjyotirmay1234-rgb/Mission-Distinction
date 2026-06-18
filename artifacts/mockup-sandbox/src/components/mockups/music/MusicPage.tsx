import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Play, Pause, SkipForward, SkipBack, Music2, Loader2, Volume2, ChevronDown, ChevronUp } from "lucide-react";

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

function fmtProgress(current: number, duration: number) {
  if (!duration) return "0:00";
  const s = Math.floor(current);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function MusicPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerExpanded, setPlayerExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLInputElement | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=20&entity=song`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const playTrack = (track: Track) => {
    if (!track.previewUrl) return;
    if (currentTrack?.trackId === track.trackId) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.previewUrl;
      audioRef.current.play();
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  };

  const skipTrack = (dir: 1 | -1) => {
    if (!currentTrack || !results.length) return;
    const idx = results.findIndex(t => t.trackId === currentTrack.trackId);
    const next = results[idx + dir];
    if (next?.previewUrl) playTrack(next);
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      skipTrack(1);
    });
    return () => { audio.pause(); };
  }, []);

  const currentIdx = currentTrack ? results.findIndex(t => t.trackId === currentTrack.trackId) : -1;

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        <p className="text-[#666] text-sm mt-0.5">Search and play songs while you study</p>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") search(query); }}
              placeholder="Search songs, artists, albums..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>
          <button
            onClick={() => search(query)}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>

        {/* Quick genre chips */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {STUDY_QUERIES.map(g => (
            <button
              key={g.label}
              onClick={() => { setQuery(g.query); search(g.query); }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors"
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4">
        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 text-[#444] gap-3">
            <Music2 size={40} className="text-violet-500/30" />
            <p className="text-sm">Search any song, artist, or album</p>
            <p className="text-xs">Tap a genre chip above for study music</p>
          </div>
        )}

        {hasSearched && !loading && results.length === 0 && (
          <div className="text-center py-10 text-[#555] text-sm">No results found. Try a different search.</div>
        )}

        <div className="space-y-1">
          {results.map((track, i) => {
            const isCurrent = currentTrack?.trackId === track.trackId;
            const hasPreview = !!track.previewUrl;
            return (
              <button
                key={track.trackId}
                onClick={() => playTrack(track)}
                disabled={!hasPreview}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                  isCurrent
                    ? "bg-violet-600/20 border border-violet-500/30"
                    : "hover:bg-white/5 border border-transparent"
                } ${!hasPreview ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {/* Number / Play indicator */}
                <div className="w-6 shrink-0 text-center">
                  {isCurrent && isPlaying ? (
                    <Pause size={14} className="text-violet-400 mx-auto" />
                  ) : isCurrent ? (
                    <Play size={14} className="text-violet-400 mx-auto" />
                  ) : (
                    <span className="text-[11px] text-[#555]">{i + 1}</span>
                  )}
                </div>

                {/* Album art */}
                <img
                  src={track.artworkUrl100.replace("100x100", "60x60")}
                  alt={track.collectionName}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isCurrent ? "text-violet-300" : "text-white"}`}>
                    {track.trackName}
                  </p>
                  <p className="text-xs text-[#666] truncate">{track.artistName}</p>
                </div>

                {/* Duration */}
                <span className="text-[11px] text-[#555] shrink-0">
                  {track.trackTimeMillis ? fmtTime(track.trackTimeMillis) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#13152a] border-t border-white/10 shadow-xl">
          {/* Progress bar */}
          <div className="relative h-1 bg-white/10 cursor-pointer" onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) audioRef.current.currentTime = pct * duration;
          }}>
            <div
              className="h-full bg-violet-500 transition-none"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <img
              src={currentTrack.artworkUrl100.replace("100x100", "50x50")}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
              alt={currentTrack.trackName}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-violet-200">{currentTrack.trackName}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#666]">
                <span className="truncate">{currentTrack.artistName}</span>
                <span>·</span>
                <span>{fmtProgress(progress, duration)} / {fmtTime(currentTrack.trackTimeMillis || duration * 1000)}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-[#777]">30s preview</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => skipTrack(-1)}
                disabled={currentIdx <= 0}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => { if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); } else { audioRef.current?.play(); setIsPlaying(true); } }}
                className="p-2.5 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => skipTrack(1)}
                disabled={currentIdx >= results.length - 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
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
