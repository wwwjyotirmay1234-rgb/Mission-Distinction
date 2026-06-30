import { Link, useLocation } from "wouter";
import { useEffect, useRef, useCallback } from "react";
import { X, Music2, Youtube, Maximize2 } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import type { NowPlaying } from "@/contexts/MusicPlayerContext";

/**
 * PersistentPlayer — lives in StudentLayout, never unmounts.
 *
 * Single iframe strategy:
 *   The iframe is rendered inside ONE container div that never changes its
 *   position in the React tree. Only CSS changes when navigating between
 *   the music page and other pages. Because the iframe's `key` stays the
 *   same for the same track, React never remounts it → audio never stops.
 *
 * On /student/music  → iframe is visible + full-size + header shown.
 * Elsewhere          → container is 1×1px hidden, mini-bar shown instead.
 *
 * The header wrapper div always exists (height collapses to 0 when hidden)
 * so the iframe is ALWAYS at child position 1 — preventing React from
 * misidentifying it during reconciliation when the header appears/disappears.
 */
export function PersistentPlayer() {
  const { playing, stop } = useMusicPlayer();
  const [location] = useLocation();
  const onMusicPage = location === "/student/music";
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Keep a ref to playing so the visibilitychange closure always sees current value
  const playingRef = useRef<NowPlaying | null>(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  // ── Fullscreen handler ───────────────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const el = iframeRef.current as any;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  }, []);

  // ── Auto-resume YouTube on screen unlock ────────────────────────────────
  // When the phone is locked the OS suspends the tab and the YouTube
  // iframe pauses itself. On unlock we send a postMessage to resume.
  // Requires enablejsapi=1 in the embed URL (added below).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const p = playingRef.current;
      if (!p || p.type !== "youtube") return;
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      // Small delay so the iframe has a chance to resume its own context first
      setTimeout(() => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
      }, 600);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // ── MediaSession API — lock-screen controls ─────────────────────────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!playing) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }

    const title = playing.title;
    const artist = playing.channel;
    const artwork = playing.thumbnail;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "Mission Distinction",
      artwork: artwork
        ? [{ src: artwork, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.playbackState = "playing";

    navigator.mediaSession.setActionHandler("stop", stop);
    navigator.mediaSession.setActionHandler("pause", stop);
    navigator.mediaSession.setActionHandler("play", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
    navigator.mediaSession.setActionHandler("previoustrack", null);

    return () => {
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, [playing, stop]);

  if (!playing) return null;

  const iframeSrc = `https://www.youtube-nocookie.com/embed/${playing.videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;

  const iframeKey = playing.videoId;

  const title = playing.title;
  const sub = playing.channel;
  const thumb = playing.thumbnail;

  const embedH = 315;
  const headerH = 48;

  return (
    <>
      {/* ── Single iframe container ─────────────────────────────────────────
          CSS-only changes when onMusicPage toggles. The iframe key never
          changes for the same track → React reuses the DOM node → audio lives.
          ─────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={onMusicPage ? "fixed bottom-0 left-0 right-0 md:left-64 z-40" : ""}
        style={
          onMusicPage
            ? { borderTop: "1px solid rgba(124,58,237,0.3)" }
            : {
                position: "fixed",
                bottom: 0,
                left: 0,
                width: 1,
                height: 1,
                overflow: "hidden",
                zIndex: 0,
                pointerEvents: "none",
              }
        }
      >
        {/* Header wrapper — always rendered, height collapses to 0 when off page.
            This keeps the iframe at child-index 1 regardless of onMusicPage state. */}
        <div
          style={{
            height: onMusicPage ? headerH : 0,
            overflow: "hidden",
            flexShrink: 0,
            background: "linear-gradient(90deg,#1a0a3a,#12072b)",
            borderBottom: onMusicPage
              ? "1px solid rgba(124,58,237,0.15)"
              : "none",
          }}
        >
          <div
            className="flex items-center gap-3 px-4"
            style={{ height: headerH }}
          >
            {thumb && (
              <img
                src={thumb}
                alt=""
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/90 truncate">
                {title}
              </p>
              <p className="text-[10px] text-white/40 truncate">{sub}</p>
            </div>

            {/* Fullscreen button — only for YouTube on the music page */}
            {playing.type === "youtube" && (
              <button
                onClick={requestFullscreen}
                aria-label="Fullscreen"
                title="Fullscreen"
                className="w-8 h-8 rounded-xl bg-violet-500/20 hover:bg-violet-500/40 border border-violet-500/30 flex items-center justify-center transition-colors"
              >
                <Maximize2 size={13} className="text-violet-300" />
              </button>
            )}

            <button
              onClick={stop}
              aria-label="Stop music"
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <X size={13} className="text-white/50" />
            </button>
          </div>
        </div>

        {/* The one-and-only iframe. key=iframeKey never changes for the same
            track → React reuses the DOM node → audio keeps playing. */}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={iframeSrc}
          width="100%"
          height={onMusicPage ? embedH : 1}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title="music-player"
          style={{ border: 0, display: "block" }}
        />
      </div>

      {/* ── Mini-bar (only when NOT on music page) ─── */}
      {!onMusicPage && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 md:left-64"
          style={{
            background: "linear-gradient(90deg,#1a0a3a 0%,#12072b 100%)",
            borderTop: "1px solid rgba(124,58,237,0.3)",
            boxShadow: "0 -4px 24px rgba(124,58,237,0.15)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 max-w-3xl mx-auto">
            <div className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-violet-900/40">
              {thumb ? (
                <img src={thumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={16} className="text-violet-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
                <div className="flex items-end gap-0.5">
                  {[40, 70, 55, 85, 60].map((h, i) => (
                    <div
                      key={i}
                      className="w-[2px] rounded-full bg-violet-400"
                      style={{
                        height: `${h}%`,
                        animation: `wf ${0.35 + i * 0.1}s ease-in-out ${
                          i * 0.07
                        }s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                {title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Youtube size={10} className="text-red-400 shrink-0" />
                <p className="text-[10px] text-white/40 truncate">{sub}</p>
                <span className="text-[9px] text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-full shrink-0">
                  Playing
                </span>
              </div>
            </div>

            <Link
              href="/student/music"
              className="shrink-0 text-[11px] font-semibold text-violet-300 hover:text-white bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 px-3 py-1.5 rounded-xl transition-all"
            >
              Open Player
            </Link>

            <button
              onClick={stop}
              aria-label="Stop music"
              className="shrink-0 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white/50" />
            </button>
          </div>
        </div>
      )}

      {/* ── Spacer so page content isn't hidden behind the player ── */}
      <div
        aria-hidden="true"
        style={{ height: onMusicPage ? embedH + headerH : 52 }}
      />
    </>
  );
}
