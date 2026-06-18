import { createContext, useContext, useState, ReactNode } from "react";

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

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState<NowPlaying | null>(null);
  return (
    <MusicPlayerContext.Provider
      value={{ playing, play: setPlaying, stop: () => setPlaying(null) }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export const useMusicPlayer = () => useContext(MusicPlayerContext);
