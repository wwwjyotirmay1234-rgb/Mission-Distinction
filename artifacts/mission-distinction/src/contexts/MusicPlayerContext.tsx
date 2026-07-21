import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";

export type YTPlaying = {
  type: "youtube";
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
};

export type NowPlaying = YTPlaying;

interface MusicPlayerCtx {
  playing: NowPlaying | null;
  play: (item: NowPlaying) => void;
  stop: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerCtx>({
  playing: null,
  play: () => {},
  stop: () => {},
});

/**
 * Web Audio API keepalive.
 *
 * An AudioContext + silent oscillator is far more reliable than an <audio>
 * element for keeping the browser's audio session alive on Android + iOS PWAs:
 *
 * - Android Chrome: with no audible audio output the tab is suspended within
 *   ~1 second of the screen locking. An AudioContext keeps the audio thread
 *   alive even at gain=0, preventing suspension.
 * - iOS Safari: same principle — the audio session must be started inside a
 *   user gesture and then kept alive with continuous output.
 *
 * gain=0.001 (not 0) ensures the oscillator is routed to the output bus so
 * Android's audio focus manager treats it as an active audio session.
 */
function startAudioKeepAlive(
  ctxRef: React.MutableRefObject<AudioContext | null>
): void {
  if (ctxRef.current && ctxRef.current.state !== "closed") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.001; // nearly inaudible but non-zero → keeps audio session
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    ctxRef.current = ctx;
  } catch {
    // AudioContext not supported — fall back to no keepalive
  }
}

function stopAudioKeepAlive(
  ctxRef: React.MutableRefObject<AudioContext | null>
): void {
  ctxRef.current?.close().catch(() => {});
  ctxRef.current = null;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState<NowPlaying | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const play = useCallback((item: NowPlaying) => {
    setPlaying(item);
    // Must be synchronous inside the user-gesture handler so iOS/Android
    // grants the audio session before the app can be backgrounded.
    startAudioKeepAlive(audioCtxRef);
  }, []);

  const stop = useCallback(() => {
    setPlaying(null);
    stopAudioKeepAlive(audioCtxRef);
  }, []);

  // When the screen wakes up / app returns to foreground, resume the
  // AudioContext if the OS suspended it (common on Android after lock).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <MusicPlayerContext.Provider value={{ playing, play, stop }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export const useMusicPlayer = () => useContext(MusicPlayerContext);
