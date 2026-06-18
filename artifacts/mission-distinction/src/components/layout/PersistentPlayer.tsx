import { Link, useLocation } from "wouter";
import { X, Music2, Radio, Youtube } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

/**
 * PersistentPlayer — lives in StudentLayout, never unmounts.
 *
 * When playing and NOT on /student/music:
 *  - Renders a 1×1px background iframe so audio keeps going.
 *  - Shows a compact mini-bar at the bottom so the user knows what's playing.
 *
 * When on /student/music the Music page renders its own full-size embed,
 * so this component hides itself (avoids double-iframe audio).
 */
export function PersistentPlayer() {
  const { playing, stop } = useMusicPlayer();
  const [location] = useLocation();
  const onMusicPage = location === "/student/music";

  if (!playing || onMusicPage) return null;

  /* Build the embed src for background audio */
  const iframeSrc =
    playing.type === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${playing.videoId}?autoplay=1&rel=0&modestbranding=1`
      : `https://w.soundcloud.com/player/?url=${encodeURIComponent(
          playing.permalinkUrl
        )}&auto_play=true&visual=false&color=%237c3aed&show_comments=false&hide_related=true`;

  const iframeKey =
    playing.type === "youtube" ? playing.videoId : String(playing.id);

  const title = playing.title;
  const sub =
    playing.type === "youtube" ? playing.channel : playing.artist;
  const thumb =
    playing.type === "youtube"
      ? playing.thumbnail
      : playing.artwork ?? null;

  return (
    <>
      {/* ── Background iframe: 1×1px keeps audio alive ── */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", bottom: 0, left: 0, width: 1, height: 1, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}
      >
        <iframe
          key={iframeKey}
          src={iframeSrc}
          width="1"
          height="1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="music-bg"
          style={{ border: 0 }}
        />
      </div>

      {/* ── Mini-bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:left-64"
        style={{
          background: "linear-gradient(90deg,#1a0a3a 0%,#12072b 100%)",
          borderTop: "1px solid rgba(124,58,237,0.3)",
          boxShadow: "0 -4px 24px rgba(124,58,237,0.15)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 max-w-3xl mx-auto">
          {/* Thumbnail */}
          <div className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-violet-900/40">
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 size={16} className="text-violet-400" />
              </div>
            )}
            {/* Animated equalizer overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
              <div className="flex items-end gap-0.5">
                {[40, 70, 55, 85, 60].map((h, i) => (
                  <div
                    key={i}
                    className="w-[2px] rounded-full bg-violet-400"
                    style={{
                      height: `${h}%`,
                      animation: `wf ${0.35 + i * 0.1}s ease-in-out ${i * 0.07}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate leading-tight">{title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {playing.type === "youtube" ? (
                <Youtube size={10} className="text-red-400 shrink-0" />
              ) : (
                <Radio size={10} className="text-orange-400 shrink-0" />
              )}
              <p className="text-[10px] text-white/40 truncate">{sub}</p>
              <span className="text-[9px] text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-full shrink-0">
                Playing
              </span>
            </div>
          </div>

          {/* Back to Music */}
          <Link
            href="/student/music"
            className="shrink-0 text-[11px] font-semibold text-violet-300 hover:text-white bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 px-3 py-1.5 rounded-xl transition-all"
          >
            Open Player
          </Link>

          {/* Stop */}
          <button
            onClick={stop}
            aria-label="Stop music"
            className="shrink-0 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white/50" />
          </button>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind mini-bar */}
      <div className="h-14 md:h-[52px]" aria-hidden="true" />
    </>
  );
}
