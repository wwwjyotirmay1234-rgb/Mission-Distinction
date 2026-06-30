import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";

export type YTPlaying = {
  type: "youtube";
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
};

export type SCPlaying = {
  type: "soundcloud";
  id: number;
  title: string;
  artist: string;
  artwork: string | null;
  permalinkUrl: string;
};

export type NowPlaying = YTPlaying | SCPlaying;

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

// Minimal valid silent WAV (44-byte header, 0 samples).
// Loop=true means it restarts instantly — keeps the iOS audio session
// alive without audible sound, which allows YouTube/SoundCloud iframes
// to continue playing when the PWA goes to the background or locks screen.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

function getOrCreateSilentAudio(ref: React.MutableRefObject<HTMLAudioElement | null>): HTMLAudioElement {
  if (!ref.current) {
    const a = new Audio(SILENT_WAV);
    a.loop = true;
    a.volume = 0.001; // inaudible — just keeps the session alive
    ref.current = a;
  }
  return ref.current;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState<NowPlaying | null>(null);
  const silentRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((item: NowPlaying) => {
    setPlaying(item);
    // Must be called synchronously inside the user-gesture handler so iOS
    // grants the audio session before the app can be backgrounded.
    getOrCreateSilentAudio(silentRef).play().catch(() => {
      // Autoplay policy blocked (very rare — user pressed play so gesture exists)
    });
  }, []);

  const stop = useCallback(() => {
    setPlaying(null);
    silentRef.current?.pause();
  }, []);

  // When the screen wakes up / app comes back to foreground, resume the silent
  // audio if the OS paused it (common on iOS after a screen lock).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && silentRef.current && !silentRef.current.paused) {
        return; // already playing — nothing to do
      }
      // If music was playing but silent audio got paused by the OS, restart it
      setPlaying(prev => {
        if (prev && silentRef.current && silentRef.current.paused) {
          silentRef.current.play().catch(() => {});
        }
        return prev;
      });
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
