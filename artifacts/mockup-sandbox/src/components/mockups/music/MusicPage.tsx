import { useState } from "react";
import { Music2, Youtube, ExternalLink, Volume2, Upload } from "lucide-react";

const SPOTIFY_SUGGESTIONS = [
  { label: "Lo-fi Study Beats", url: "https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4euo806" },
  { label: "Deep Focus", url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ" },
  { label: "Peaceful Piano", url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO" },
  { label: "Calming Instrumental", url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
];

const YOUTUBE_SUGGESTIONS = [
  { label: "Lo-fi Hip Hop Radio", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { label: "Study Music – 3 Hours", url: "https://www.youtube.com/watch?v=lTRiuFIWV54" },
  { label: "Relaxing Piano Music", url: "https://www.youtube.com/watch?v=77ZozI0rw7w" },
  { label: "Nature Sounds + Music", url: "https://www.youtube.com/watch?v=eKFTSSKCzWA" },
];

const DEMO_SPOTIFY = "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0";
const DEMO_YOUTUBE = "jfKfPfyJRdk";

export function MusicPage() {
  const [spotifyLoaded, setSpotifyLoaded] = useState(true);
  const [ytLoaded, setYtLoaded] = useState(false);
  const [spotifyInput, setSpotifyInput] = useState("Deep Focus playlist loaded");
  const [ytInput, setYtInput] = useState("");

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        <p className="text-[#888] text-sm mt-0.5">Listen to soothing music while you study. Paste any Spotify or YouTube link.</p>
      </div>

      {/* Spotify Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Music2 size={16} className="text-green-400" />
            <span className="font-semibold text-sm">Spotify</span>
          </div>
          <p className="text-xs text-[#888]">Paste any Spotify track, album, or playlist link. Free users get 30-sec previews — Premium gets full songs.</p>
        </div>

        <div className="flex gap-2">
          <input
            value={spotifyInput}
            onChange={e => setSpotifyInput(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-green-400/50"
          />
          <button className="px-3 h-9 rounded-lg bg-green-500 hover:bg-green-400 text-white text-xs font-medium shrink-0">
            Play
          </button>
        </div>

        {spotifyLoaded && (
          <iframe
            src={DEMO_SPOTIFY}
            width="100%"
            height="280"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl border-0"
          />
        )}

        <div className="space-y-1.5">
          <p className="text-[11px] text-[#555] font-medium">Suggested playlists</p>
          <div className="flex flex-wrap gap-1.5">
            {SPOTIFY_SUGGESTIONS.map(s => (
              <button key={s.label} className="text-[11px] px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20">
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#555] hover:text-green-400">
          <ExternalLink size={10} /> Open Spotify app
        </a>
      </div>

      {/* YouTube Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Youtube size={16} className="text-red-400" />
            <span className="font-semibold text-sm">YouTube</span>
          </div>
          <p className="text-xs text-[#888]">Paste any YouTube link — great for lo-fi livestreams and study music. Full songs, free, no account needed.</p>
        </div>

        <div className="flex gap-2">
          <input
            value={ytInput}
            onChange={e => setYtInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-red-400/50"
          />
          <button
            onClick={() => setYtLoaded(true)}
            className="px-3 h-9 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-medium shrink-0"
          >
            Play
          </button>
        </div>

        {ytLoaded && (
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${DEMO_YOUTUBE}?autoplay=0&rel=0`}
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        )}

        {!ytLoaded && (
          <div className="rounded-xl border border-dashed border-white/10 h-32 flex flex-col items-center justify-center gap-2 text-[#555]">
            <Youtube size={20} className="text-red-400/40" />
            <p className="text-xs">Paste a YouTube link and tap Play</p>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-[11px] text-[#555] font-medium">Suggested streams</p>
          <div className="flex flex-wrap gap-1.5">
            {YOUTUBE_SUGGESTIONS.map(s => (
              <button key={s.label} onClick={() => setYtLoaded(true)} className="text-[11px] px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20">
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
