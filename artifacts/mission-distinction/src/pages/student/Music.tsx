import { useState, useCallback } from "react";
import { Search, Music2, Loader2, X, Youtube, Plus, Trash2, ListMusic, CheckCircle2 } from "lucide-react";

interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  trackTimeMillis: number;
}

interface PlaylistItem {
  id: number;
  trackName: string;
  artistName: string;
  artwork: string;
  addedAt: number;
}

const STUDY_QUERIES = [
  { label: "Lo-fi beats", query: "lofi hip hop study" },
  { label: "Classical piano", query: "classical piano study music" },
  { label: "Ambient chill", query: "ambient chill music focus" },
  { label: "Instrumental jazz", query: "instrumental jazz relaxing" },
  { label: "Nature sounds", query: "nature sounds relaxing study" },
  { label: "Focus music", query: "focus concentration music" },
];

const SPOTIFY_SUGGESTIONS = [
  { label: "Lo-fi Hip Hop", url: "https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4euo806" },
  { label: "Deep Focus", url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ" },
  { label: "Peaceful Piano", url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO" },
  { label: "Instrumental Study", url: "https://open.spotify.com/playlist/37i9dQZF1DX9sIqqvKsjEL" },
  { label: "Brain Food", url: "https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7" },
  { label: "Calming Acoustic", url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
];

function extractSpotifyEmbed(input: string): string | null {
  const m = input.match(/spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/);
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
  return null;
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const BAR_HEIGHTS = [40, 65, 85, 55, 90, 70, 45, 80, 60, 75, 50, 88, 62, 78, 48];
const BAR_DELAYS  = [0, 0.2, 0.4, 0.1, 0.5, 0.3, 0.15, 0.45, 0.25, 0.35, 0.05, 0.5, 0.2, 0.4, 0.1];

function EqualizerBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-24 opacity-80">
      {BAR_HEIGHTS.map((h, i) => (
        <div key={i} className="w-[6px] rounded-t-sm" style={{
          height: `${h}%`,
          background: "linear-gradient(to top, #7c3aed, #a78bfa)",
          animation: active ? `eq-bounce ${0.8 + (i % 3) * 0.2}s ease-in-out ${BAR_DELAYS[i]}s infinite alternate` : "none",
          transform: active ? undefined : "scaleY(0.35)",
          transformOrigin: "bottom",
          boxShadow: active ? "0 0 6px #7c3aed88" : "none",
        }} />
      ))}
      <style>{`@keyframes eq-bounce { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}

const PLAYLIST_KEY = "md_music_playlist_v1";

function loadPlaylist(): PlaylistItem[] {
  try { return JSON.parse(localStorage.getItem(PLAYLIST_KEY) ?? "[]"); } catch { return []; }
}
function savePlaylist(items: PlaylistItem[]) {
  localStorage.setItem(PLAYLIST_KEY, JSON.stringify(items));
}

type Tab = "search" | "playlist" | "spotify";

export default function StudentMusic() {
  const [tab, setTab] = useState<Tab>("search");

  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytKey, setYtKey] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Playlist
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(loadPlaylist);
  const [plYtQuery, setPlYtQuery] = useState("");
  const [plYtKey, setPlYtKey] = useState(0);

  // Spotify
  const [spotifyInput, setSpotifyInput] = useState("");
  const [spotifyEmbed, setSpotifyEmbed] = useState<string | null>(null);
  const [spotifyError, setSpotifyError] = useState("");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(""); setHasSearched(true);
    setYtQuery(q); setYtKey(k => k + 1);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=25&entity=song`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch { setError("Search failed. Please check your connection and try again."); }
    finally { setLoading(false); }
  }, []);

  const addToPlaylist = (track: Track) => {
    if (addedIds.has(track.trackId)) return;
    const item: PlaylistItem = {
      id: track.trackId, trackName: track.trackName,
      artistName: track.artistName, artwork: track.artworkUrl100, addedAt: Date.now(),
    };
    const updated = [item, ...playlist.filter(p => p.id !== track.trackId)];
    setPlaylist(updated); savePlaylist(updated);
    setAddedIds(prev => new Set(prev).add(track.trackId));
  };

  const removeFromPlaylist = (id: number) => {
    const updated = playlist.filter(p => p.id !== id);
    setPlaylist(updated); savePlaylist(updated);
    setAddedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const playFromPlaylist = (item: PlaylistItem) => {
    const q = `${item.trackName} ${item.artistName} full song`;
    setPlYtQuery(q); setPlYtKey(k => k + 1);
    document.getElementById("pl-yt-player")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadSpotify = (url: string) => {
    setSpotifyError("");
    const embed = extractSpotifyEmbed(url);
    if (!embed) { setSpotifyError("Paste a valid Spotify track, album, or playlist link."); return; }
    setSpotifyEmbed(embed);
    setSpotifyInput(url);
  };

  const eqActive = hasSearched || !!spotifyEmbed || !!plYtQuery;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "search",   label: "Search",     icon: <Search size={13} /> },
    { id: "playlist", label: playlist.length ? `My Playlist (${playlist.length})` : "My Playlist", icon: <ListMusic size={13} /> },
    { id: "spotify",  label: "Spotify",    icon: <Music2 size={13} /> },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-6 -mx-4 -mt-4">

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-6 pb-7"
        style={{ background: "linear-gradient(135deg, #0d0f1a 0%, #1a0a3e 40%, #1e0b4a 60%, #0d0f1a 100%)" }}>
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute bottom-0 left-1/3 w-36 h-36 rounded-full opacity-15 blur-2xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
        <span className="absolute top-3 right-16 text-violet-400 opacity-40 text-lg select-none pointer-events-none">♪</span>
        <span className="absolute top-8 right-7 text-violet-300 opacity-30 text-sm select-none pointer-events-none">♫</span>
        <span className="absolute bottom-12 right-24 text-violet-500 opacity-25 text-xl select-none pointer-events-none">♩</span>

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-white">
              Study <span className="text-violet-400">Music</span> Hub
            </h1>
            <p className="text-white/80 text-[13px] font-medium mt-1.5">Focus deeper. Study longer. Learn smarter.</p>
            <p className="text-white/45 text-[12px] mt-1 leading-snug">
              Curated music and ambient sounds designed<br />for MBBS students.
            </p>
          </div>
          <div className="shrink-0 pr-1 pt-1"><EqualizerBars active={eqActive} /></div>
        </div>

        {tab === "search" && (
          <div className="relative mt-5">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSearch(query); }}
              placeholder="Search any song, artist, album…"
              className="w-full h-12 pl-10 pr-24 rounded-2xl text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button onClick={() => setQuery("")} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
              <button onClick={() => doSearch(query)} disabled={loading || !query.trim()}
                className="h-8 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-40 flex items-center gap-1 transition-colors">
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                <span>Go</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex-1 justify-center ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-card/40 text-muted-foreground hover:bg-card/80 hover:text-foreground"
            }`}>
            {t.icon} <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── SEARCH TAB ── */}
      {tab === "search" && (
        <div className="px-4 pt-2 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {STUDY_QUERIES.map(g => (
              <button key={g.label} onClick={() => { setQuery(g.query); doSearch(g.query); }}
                className="text-xs px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {g.label}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Music2 size={44} className="text-primary/20" />
              <p className="text-sm">Search any song to hear it in full</p>
              <p className="text-xs opacity-60">Or tap a chip above for study music</p>
            </div>
          )}

          {hasSearched && (
            <>
              <div className="rounded-2xl overflow-hidden border border-border/60">
                <div className="flex items-center gap-2 px-3 py-2 bg-card/60 border-b border-border/40">
                  <Youtube size={14} className="text-red-400" />
                  <span className="text-xs font-medium text-foreground/70">Full Song Player</span>
                  <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[160px]">{ytQuery}</span>
                </div>
                {ytKey > 0 && (
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe key={ytKey}
                      src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(ytQuery)}&autoplay=1&rel=0`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen" allowFullScreen title="YouTube Music Player" />
                  </div>
                )}
              </div>

              {results.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground px-1 mb-1.5">
                    Tap <Youtube size={10} className="inline text-red-400" /> to play · <Plus size={10} className="inline text-primary" /> to save to playlist
                  </p>
                  {results.map((track, i) => {
                    const added = addedIds.has(track.trackId);
                    return (
                      <div key={track.trackId}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card/60 border border-transparent hover:border-border/40 transition-colors">
                        <span className="w-5 text-center text-xs text-muted-foreground shrink-0">{i + 1}</span>
                        <img src={track.artworkUrl100} alt={track.collectionName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{track.trackName}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {track.trackTimeMillis ? fmtTime(track.trackTimeMillis) : "—"}
                          </span>
                          <button
                            onClick={() => { setYtQuery(`${track.trackName} ${track.artistName} full song`); setYtKey(k => k + 1); document.getElementById("yt-player")?.scrollIntoView({ behavior: "smooth" }); }}
                            className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20 hover:bg-red-500/30 transition-colors"
                            title="Play on YouTube">
                            <Youtube size={12} className="text-red-400" />
                          </button>
                          <button
                            onClick={() => addToPlaylist(track)}
                            className={`p-1.5 rounded-lg border transition-colors ${added ? "bg-primary/20 border-primary/40" : "bg-card/40 border-border/40 hover:bg-primary/15 hover:border-primary/30"}`}
                            title={added ? "Added to playlist" : "Add to My Playlist"}>
                            {added ? <CheckCircle2 size={12} className="text-primary" /> : <Plus size={12} className="text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && results.length === 0 && (
                <p className="text-center py-6 text-muted-foreground text-sm">No results. Try a different search.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MY PLAYLIST TAB ── */}
      {tab === "playlist" && (
        <div className="px-4 pt-3 space-y-4">
          {playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <ListMusic size={44} className="text-primary/20" />
              <p className="text-sm font-medium">Your playlist is empty</p>
              <p className="text-xs text-center opacity-60">
                Go to Search and tap <Plus size={10} className="inline" /> on any song to add it here
              </p>
            </div>
          ) : (
            <>
              {plYtQuery && (
                <div id="pl-yt-player" className="rounded-2xl overflow-hidden border border-border/60">
                  <div className="flex items-center gap-2 px-3 py-2 bg-card/60 border-b border-border/40">
                    <Youtube size={14} className="text-red-400" />
                    <span className="text-xs font-medium text-foreground/70">Now Playing</span>
                    <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[180px]">
                      {plYtQuery.replace(" full song", "")}
                    </span>
                  </div>
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe key={plYtKey}
                      src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(plYtQuery)}&autoplay=1&rel=0`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen" allowFullScreen title="YouTube Music Player" />
                  </div>
                </div>
              )}

              <div className="space-y-0.5">
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <p className="text-xs text-muted-foreground">
                    {playlist.length} song{playlist.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => { setPlaylist([]); savePlaylist([]); setAddedIds(new Set()); setPlYtQuery(""); }}
                    className="text-xs text-destructive/60 hover:text-destructive transition-colors">
                    Clear all
                  </button>
                </div>
                {playlist.map((item, i) => (
                  <div key={item.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card/60 border border-transparent hover:border-border/40 transition-colors">
                    <span className="w-5 text-center text-xs text-muted-foreground shrink-0">{i + 1}</span>
                    <img src={item.artwork} alt={item.trackName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{item.trackName}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.artistName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => playFromPlaylist(item)}
                        className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20 hover:bg-red-500/30 transition-colors" title="Play">
                        <Youtube size={12} className="text-red-400" />
                      </button>
                      <button onClick={() => removeFromPlaylist(item.id)}
                        className="p-1.5 rounded-lg bg-card/40 border border-border/40 hover:bg-destructive/15 hover:border-destructive/20 transition-colors" title="Remove">
                        <Trash2 size={12} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SPOTIFY TAB ── */}
      {tab === "spotify" && (
        <div className="px-4 pt-3 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Paste any Spotify track, album, or playlist link
            </p>
            <div className="flex gap-2">
              <input
                value={spotifyInput}
                onChange={e => setSpotifyInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") loadSpotify(spotifyInput); }}
                placeholder="https://open.spotify.com/playlist/..."
                className="flex-1 h-10 rounded-xl bg-card/40 border border-border/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button onClick={() => loadSpotify(spotifyInput)}
                className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-medium shrink-0 transition-colors">
                Load
              </button>
            </div>
            {spotifyError && <p className="text-xs text-destructive mt-1.5">{spotifyError}</p>}
          </div>

          {spotifyEmbed && (
            <iframe src={spotifyEmbed} width="100%" height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" className="rounded-2xl border-0" title="Spotify Player" />
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Study playlists</p>
            <div className="grid grid-cols-2 gap-2">
              {SPOTIFY_SUGGESTIONS.map(s => (
                <button key={s.label} onClick={() => loadSpotify(s.url)}
                  className="text-xs px-3 py-2.5 rounded-xl border border-green-500/20 bg-green-500/8 text-green-400 hover:bg-green-500/15 transition-colors text-left font-medium">
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Free Spotify users hear 30-sec previews · Premium plays full songs
          </p>
        </div>
      )}
    </div>
  );
}
