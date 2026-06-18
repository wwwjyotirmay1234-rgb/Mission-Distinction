import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music2, Youtube, ExternalLink } from "lucide-react";

function extractSpotifyId(input: string): { type: string; id: string } | null {
  const patterns = [
    /spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/,
    /spotify:([a-z]+):([A-Za-z0-9]+)/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return { type: m[1], id: m[2] };
  }
  return null;
}

function extractYouTubeId(input: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

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

function SpotifyPlayer() {
  const [input, setInput] = useState("");
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = (url: string) => {
    setError("");
    const parsed = extractSpotifyId(url);
    if (!parsed) {
      setError("Paste a valid Spotify track, album, or playlist link.");
      return;
    }
    setEmbedSrc(`https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`);
    setInput(url);
  };

  return (
    <Card className="bg-card/40 border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music2 size={18} className="text-green-400" /> Spotify
        </CardTitle>
        <CardDescription>
          Paste any Spotify track, album, or playlist link. Free users get 30-sec previews — Premium gets full songs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://open.spotify.com/playlist/..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") load(input); }}
            className="bg-background/50 text-sm"
          />
          <Button onClick={() => load(input)} size="sm" className="shrink-0 bg-green-500 hover:bg-green-600 text-white">
            Play
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {embedSrc && (
          <iframe
            src={embedSrc}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl border-0"
          />
        )}

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Suggested playlists</p>
          <div className="flex flex-wrap gap-2">
            {SPOTIFY_SUGGESTIONS.map(s => (
              <button
                key={s.label}
                onClick={() => load(s.url)}
                className="text-xs px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-green-400 transition-colors"
        >
          <ExternalLink size={11} /> Open Spotify app
        </a>
      </CardContent>
    </Card>
  );
}

function YouTubePlayer() {
  const [input, setInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = (url: string) => {
    setError("");
    const id = extractYouTubeId(url);
    if (!id) {
      setError("Paste a valid YouTube video or livestream link.");
      return;
    }
    setVideoId(id);
    setInput(url);
  };

  return (
    <Card className="bg-card/40 border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Youtube size={18} className="text-red-400" /> YouTube
        </CardTitle>
        <CardDescription>
          Paste any YouTube link — great for lo-fi livestreams and study music. Full songs, free, no account needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") load(input); }}
            className="bg-background/50 text-sm"
          />
          <Button onClick={() => load(input)} size="sm" className="shrink-0 bg-red-500 hover:bg-red-600 text-white">
            Play
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {videoId && (
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Suggested streams</p>
          <div className="flex flex-wrap gap-2">
            {YOUTUBE_SUGGESTIONS.map(s => (
              <button
                key={s.label}
                onClick={() => load(s.url)}
                className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentMusic() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        <p className="text-muted-foreground">Listen to soothing music while you study. Paste any Spotify or YouTube link.</p>
      </div>
      <SpotifyPlayer />
      <YouTubePlayer />
    </div>
  );
}
