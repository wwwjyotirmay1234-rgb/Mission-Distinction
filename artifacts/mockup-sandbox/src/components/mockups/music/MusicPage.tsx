import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Play, Pause, SkipForward, SkipBack, Music2, Loader2, X, Mic } from "lucide-react";

interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string | null;
  trackTimeMillis: number;
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

const BAR_HEIGHTS = [40, 65, 85, 55, 90, 70, 45, 80, 60, 75, 50, 88, 62, 78, 48];
const BAR_DELAYS  = [0, 0.2, 0.4, 0.1, 0.5, 0.3, 0.15, 0.45, 0.25, 0.35, 0.05, 0.5, 0.2, 0.4, 0.1];

function EqualizerBars() {
  return (
    <div className="flex items-end gap-[3px] h-24 opacity-80">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="w-[6px] rounded-t-sm"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, #7c3aed, #a78bfa)`,
            animation: `eq-bounce ${0.8 + (i % 3) * 0.2}s ease-in-out ${BAR_DELAYS[i]}s infinite alternate`,
            boxShadow: "0 0 6px #7c3aed88",
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      setResults(data.results ?? []);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const skipTrack = useCallback((dir: 1 | -1) => {
    if (!audioRef.current) return;
    setCurrentTrack(prev => {
      if (!prev) return prev;
      const idx = results.findIndex(t => t.trackId === prev.trackId);
      const next = results[idx + dir];
      if (next?.previewUrl) {
        audioRef.current!.src = next.previewUrl;
        audioRef.current!.play().catch(() => {});
        setIsPlaying(true);
        setProgress(0);
        return next;
      }
      return prev;
    });
  }, [results]);

  const playTrack = (track: Track) => {
    if (!track.previewUrl || !audioRef.current) return;
    if (currentTrack?.trackId === track.trackId) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
      return;
    }
    audioRef.current.src = track.previewUrl;
    audioRef.current.play().catch(() => {});
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => { setIsPlaying(false); skipTrack(1); });
    return () => { audio.pause(); };
  }, [skipTrack]);

  const currentIdx = currentTrack ? results.findIndex(t => t.trackId === currentTrack.trackId) : -1;

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white flex flex-col pb-28">

      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden px-5 pt-6 pb-7"
        style={{
          background: "linear-gradient(135deg, #0d0f1a 0%, #1a0a3e 40%, #1e0b4a 60%, #0d0f1a 100%)",
        }}
      >
        {/* Purple glow blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-15 blur-2xl"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />

        {/* Floating music notes */}
        <div className="absolute top-3 right-14 text-violet-400 opacity-40 text-lg select-none">♪</div>
        <div className="absolute top-8 right-6 text-violet-300 opacity-30 text-sm select-none">♫</div>
        <div className="absolute bottom-10 right-20 text-violet-500 opacity-25 text-xl select-none">♩</div>

        <div className="relative flex items-start justify-between gap-4">
          {/* Left: text */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
              Study <span className="text-violet-400">Music</span> Hub
            </h1>
            <p className="text-white/80 text-[13px] font-medium mt-1.5">
              Focus deeper. Study longer. Learn smarter.
            </p>
            <p className="text-white/45 text-[12px] mt-1 leading-snug">
              Curated music and ambient sounds designed<br />for MBBS students.
            </p>
          </div>

          {/* Right: equalizer */}
          <div className="shrink-0 pr-1 pt-1">
            <EqualizerBars />
          </div>
        </div>

        {/* Search bar inside hero */}
        <div className="relative mt-5">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") search(query); }}
            placeholder="Search any song, artist, album…"
            className="w-full h-12 pl-10 pr-20 rounded-2xl text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query && (
              <button onClick={() => setQuery("")} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => search(query)}
              disabled={loading}
              className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Mic size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-4 pb-2">
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

      {/* Error */}
      {error && <p className="text-xs text-red-400 px-4 mb-2">{error}</p>}

      {/* Empty state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-14 text-white/25 gap-2">
          <Music2 size={40} className="text-violet-500/30" />
          <p className="text-sm">Search any song or tap a chip above</p>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && (
        <p className="text-center py-10 text-white/30 text-sm px-4">No results. Try a different search.</p>
      )}

      {/* Track list */}
      <div className="flex-1 px-3 space-y-0.5">
        {results.map((track, i) => {
          const isCurrent = currentTrack?.trackId === track.trackId;
          const hasPreview = !!track.previewUrl;
          return (
            <button
              key={track.trackId}
              onClick={() => playTrack(track)}
              disabled={!hasPreview}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                isCurrent ? "bg-violet-600/20 border border-violet-500/30" : "hover:bg-white/5 border border-transparent"
              } ${!hasPreview ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="w-5 shrink-0 text-center">
                {isCurrent && isPlaying ? <Pause size={13} className="text-violet-400 mx-auto" />
                  : isCurrent ? <Play size={13} className="text-violet-400 mx-auto" />
                  : <span className="text-[11px] text-white/30">{i + 1}</span>}
              </div>
              <img src={track.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrent ? "text-violet-300" : "text-white"}`}>{track.trackName}</p>
                <p className="text-xs text-white/45 truncate">{track.artistName}</p>
              </div>
              <span className="text-[11px] text-white/30 shrink-0">{track.trackTimeMillis ? fmtTime(track.trackTimeMillis) : "—"}</span>
            </button>
          );
        })}
      </div>

      {/* Mini Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#13152a] border-t border-white/10 shadow-2xl z-50">
          <div
            className="h-1 bg-white/10 cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (audioRef.current && duration) audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
            }}
          >
            <div className="h-full bg-violet-500" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <img src={currentTrack.artworkUrl100} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-violet-300">{currentTrack.trackName}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="truncate">{currentTrack.artistName}</span>
                <span>·</span>
                <span>{fmtSec(progress)} / {fmtSec(duration)}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px]">preview</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => skipTrack(-1)} disabled={currentIdx <= 0} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30">
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => { if (!audioRef.current) return; if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } else { audioRef.current.play(); setIsPlaying(true); } }}
                className="p-2.5 rounded-full bg-violet-600 hover:bg-violet-500"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={() => skipTrack(1)} disabled={currentIdx >= results.length - 1} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30">
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
