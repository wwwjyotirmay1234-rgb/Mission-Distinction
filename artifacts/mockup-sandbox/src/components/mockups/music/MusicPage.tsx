import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search, Music2, Loader2, X, Plus, Trash2,
  ListMusic, CheckCircle2, Heart, Volume2, Play, Pause,
  SkipForward, SkipBack, Sparkles
} from "lucide-react";

interface Track {
  trackId: number; trackName: string; artistName: string;
  collectionName: string; artworkUrl100: string;
  trackTimeMillis: number; previewUrl: string;
}
interface PlaylistItem {
  id: number; trackName: string; artistName: string;
  artwork: string; previewUrl: string; addedAt: number;
}
type Tab = "search" | "playlist" | "spotify";
type NoiseType = "white" | "pink" | "brown";
interface SoundNode { source: AudioBufferSourceNode; gain: GainNode; }

const STUDY_QUERIES = [
  { label: "Lo-fi beats",     query: "lofi hip hop study" },
  { label: "Classical piano", query: "classical piano study music" },
  { label: "Ambient chill",   query: "ambient chill music focus" },
  { label: "Instrumental",    query: "instrumental jazz relaxing" },
  { label: "Nature sounds",   query: "nature sounds relaxing study" },
  { label: "Focus music",     query: "focus concentration music" },
];
const SPOTIFY_SUGGESTIONS = [
  { label: "Lo-fi Hip Hop",       url: "https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4euo806" },
  { label: "Deep Focus",          url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ" },
  { label: "Peaceful Piano",      url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO" },
  { label: "Instrumental Study",  url: "https://open.spotify.com/playlist/37i9dQZF1DX9sIqqvKsjEL" },
  { label: "Brain Food",          url: "https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7" },
  { label: "Calming Acoustic",    url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
];
const RECOMMENDATIONS = [
  { query: "Bach Cello Suite Study",  label: "Bach Cello Suites" },
  { query: "Chopin Nocturne piano",   label: "Chopin Nocturnes" },
  { query: "lofi hip hop 1 hour",     label: "Lo-fi Hour Mix" },
  { query: "alpha waves study music", label: "Alpha Waves" },
  { query: "rain jazz piano cafe",    label: "Rainy Day Jazz" },
  { query: "Hans Zimmer study music", label: "Hans Zimmer" },
];
const AMBIENT = [
  { id:"rain",      label:"Rain",        icon:"🌧", noise:"pink",  filter:{ type:"bandpass" as BiquadFilterType, freq:800,  q:0.8 }, color:"#3b82f6" },
  { id:"fireplace", label:"Fireplace",   icon:"🔥", noise:"brown", filter:{ type:"lowpass"  as BiquadFilterType, freq:350,  q:0.5 }, color:"#f97316" },
  { id:"ocean",     label:"Ocean",       icon:"🌊", noise:"pink",  filter:{ type:"lowpass"  as BiquadFilterType, freq:600,  q:0.6 }, color:"#06b6d4" },
  { id:"forest",    label:"Forest",      icon:"🍃", noise:"pink",  filter:{ type:"bandpass" as BiquadFilterType, freq:2000, q:1.2 }, color:"#22c55e" },
  { id:"thunder",   label:"Thunderstorm",icon:"⚡", noise:"white", filter:{ type:"highpass" as BiquadFilterType, freq:120,  q:0.5 }, color:"#a855f7" },
  { id:"cafe",      label:"Café",        icon:"☕", noise:"brown", filter:{ type:"bandpass" as BiquadFilterType, freq:1500, q:1.5 }, color:"#d97706" },
];
const BAR_HEIGHTS = [38,62,82,52,90,68,44,78,58,72,48,85,60,76,46];
const BAR_DELAYS  = [0,.2,.4,.1,.5,.3,.15,.45,.25,.35,.05,.5,.2,.4,.1];
const PARTICLES   = Array.from({length:18},(_,i)=>({
  id:i, x:5+Math.floor(i*5.4)%90, y:5+Math.floor(i*7.3)%85,
  size:2+Math.floor(i%3)*1.5, delay:+(i*0.22).toFixed(2), dur:3+Math.floor(i%4),
}));
const PLAYLIST_KEY = "md_music_playlist_v2";
const FAVS_KEY = "md_music_favs_v1";

function fmtTime(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
}
function fmtMs(ms: number) {
  const s = Math.floor(ms/1000);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
}
function extractSpotifyEmbed(input: string): string | null {
  const m = input.match(/spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/);
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
  return null;
}
function loadLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}

function buildNoiseBuffer(ctx: AudioContext, type: NoiseType) {
  const size = ctx.sampleRate * 3;
  const buf  = ctx.createBuffer(1, size, ctx.sampleRate);
  const d    = buf.getChannelData(0);
  if (type === "white") {
    for (let i=0;i<size;i++) d[i] = Math.random()*2-1;
  } else if (type === "brown") {
    let last=0;
    for (let i=0;i<size;i++) { const w=Math.random()*2-1; d[i]=(last+0.02*w)/1.02; last=d[i]; d[i]*=3.5; }
  } else {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<size;i++) {
      const w=Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.969*b2+w*0.153852;
      b3=0.8665*b3+w*0.3104856; b4=0.55*b4+w*0.5329522; b5=-0.7616*b5-w*0.016898;
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
    }
  }
  return buf;
}

function HeroSection({ active, query, setQuery, onSearch, loading }: {
  active: boolean; query: string; setQuery:(q:string)=>void;
  onSearch:(q:string)=>void; loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden px-5 pt-7 pb-8"
      style={{background:"linear-gradient(135deg,#0a0c18 0%,#150a32 35%,#1e0d4a 55%,#0d0f1a 100%)"}}>
      {PARTICLES.map(p=>(
        <div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size,
            background:`rgba(167,139,250,0.2)`, boxShadow:`0 0 ${p.size*2}px rgba(124,58,237,0.35)`,
            animation:`pf-${p.id%5} ${p.dur}s ease-in-out ${p.delay}s infinite alternate` }} />
      ))}
      <style>{`
        @keyframes pf-0{from{transform:translate(0,0) scale(1);opacity:.4}to{transform:translate(8px,-12px) scale(1.3);opacity:.1}}
        @keyframes pf-1{from{transform:translate(0,0) scale(1);opacity:.3}to{transform:translate(-10px,-8px) scale(.8);opacity:.6}}
        @keyframes pf-2{from{transform:translate(0,0) scale(1);opacity:.5}to{transform:translate(6px,10px) scale(1.2);opacity:.15}}
        @keyframes pf-3{from{transform:translate(0,0) scale(1);opacity:.25}to{transform:translate(-7px,-14px) scale(.9);opacity:.5}}
        @keyframes pf-4{from{transform:translate(0,0) scale(1);opacity:.4}to{transform:translate(12px,-6px) scale(1.1);opacity:.15}}
        @keyframes eq-b{from{transform:scaleY(.3)}to{transform:scaleY(1)}}
        @keyframes nf{0%,100%{transform:translateY(0) rotate(-5deg);opacity:.45}50%{transform:translateY(-14px) rotate(8deg);opacity:.15}}
        @keyframes wf{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
        @keyframes gp{0%,100%{opacity:.4}50%{opacity:.9}}
      `}</style>
      <div className="absolute -top-10 right-0 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{background:"radial-gradient(circle,#7c3aed 0%,transparent 70%)"}} />
      {[{t:"♪",r:"15%",top:"12%"},{t:"♫",r:"6%",top:"32%"},{t:"♩",r:"22%",top:"65%"},{t:"♬",r:"2%",top:"55%"}].map((n,i)=>(
        <span key={i} className="absolute text-violet-300 select-none pointer-events-none"
          style={{right:n.r,top:n.top,fontSize:14+i*2,opacity:.35,animation:`nf ${2.5+i*.7}s ease-in-out ${i*.4}s infinite`}}>{n.t}</span>
      ))}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"><Music2 size={14} className="text-violet-400"/></div>
            <span className="text-[10px] font-semibold text-violet-400/70 tracking-widest uppercase">Study Music Hub</span>
          </div>
          <h1 className="text-[30px] font-black leading-none tracking-tight text-white mt-2">
            Study <span style={{background:"linear-gradient(90deg,#a78bfa,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Music</span> Hub
          </h1>
          <p className="text-white/75 text-[13px] font-semibold mt-2">Focus deeper. Study longer. Learn smarter.</p>
          <p className="text-white/40 text-[11px] mt-1.5 leading-relaxed">Curated music and ambient sounds<br/>designed for MBBS students.</p>
        </div>
        <div className="shrink-0 pt-2">
          <div className="flex items-end gap-[3px] h-20">
            {BAR_HEIGHTS.map((h,i)=>(
              <div key={i} className="w-[5px] rounded-t-full"
                style={{ height:`${h}%`, background:"linear-gradient(to top,#6d28d9,#a78bfa,#c4b5fd)",
                  animation:active?`eq-b ${.7+(i%3)*.2}s ease-in-out ${BAR_DELAYS[i]}s infinite alternate`:"none",
                  transform:active?undefined:"scaleY(0.3)", transformOrigin:"bottom",
                  boxShadow:active?"0 0 8px #7c3aed, 0 0 18px #7c3aed44":"none", transition:"box-shadow .4s" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="relative mt-5">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 z-10" />
        <input value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter") onSearch(query);}}
          placeholder="Search any song, artist, album…"
          className="w-full h-12 pl-10 pr-28 rounded-2xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(8px)"}} />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query&&<button onClick={()=>setQuery("")} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"><X size={13}/></button>}
          <button onClick={()=>onSearch(query)} disabled={loading||!query.trim()}
            className="h-8 px-3 rounded-xl text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 transition-all hover:scale-105"
            style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",boxShadow:"0 2px 12px #7c3aed55"}}>
            {loading?<Loader2 size={12} className="animate-spin"/>:<Sparkles size={12}/>} Search
          </button>
        </div>
      </div>
    </div>
  );
}

function AmbientSounds() {
  const ctxRef = useRef<AudioContext|null>(null);
  const nodesRef = useRef<Map<string,SoundNode>>(new Map());
  const [active,  setActive]  = useState<Record<string,boolean>>({});
  const [volumes, setVolumes] = useState<Record<string,number>>(Object.fromEntries(AMBIENT.map(a=>[a.id,60])));
  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state==="closed")
      ctxRef.current = new (window.AudioContext||(window as any).webkitAudioContext)();
    if (ctxRef.current.state==="suspended") ctxRef.current.resume();
    return ctxRef.current;
  };
  const toggle = (sound: typeof AMBIENT[0]) => {
    const isOn = active[sound.id];
    if (isOn) {
      const node = nodesRef.current.get(sound.id);
      if (node) { node.gain.gain.setTargetAtTime(0, getCtx().currentTime, 0.3); setTimeout(()=>{ try{node.source.stop();}catch{} nodesRef.current.delete(sound.id); }, 400); }
      setActive(a=>({...a,[sound.id]:false}));
    } else {
      const ctx = getCtx();
      const buf = buildNoiseBuffer(ctx, sound.noise as NoiseType);
      const source = ctx.createBufferSource(); source.buffer=buf; source.loop=true;
      const filter = ctx.createBiquadFilter(); filter.type=sound.filter.type; filter.frequency.value=sound.filter.freq; filter.Q.value=sound.filter.q;
      const gain = ctx.createGain(); gain.gain.value=0;
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      source.start();
      gain.gain.setTargetAtTime((volumes[sound.id]/100)*0.7, ctx.currentTime, 0.3);
      nodesRef.current.set(sound.id,{source,gain});
      setActive(a=>({...a,[sound.id]:true}));
    }
  };
  const setVol = (id: string, val: number) => {
    setVolumes(v=>({...v,[id]:val}));
    const node=nodesRef.current.get(id);
    if(node&&ctxRef.current) node.gain.gain.setTargetAtTime((val/100)*0.7, ctxRef.current.currentTime, 0.05);
  };
  useEffect(()=>()=>{ nodesRef.current.forEach(n=>{ try{n.source.stop();}catch{} }); ctxRef.current?.close(); },[]);
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={13} className="text-violet-400"/>
        <span className="text-xs font-bold text-white/80 tracking-wide uppercase">Ambient Sounds</span>
        <span className="text-[10px] text-white/30 ml-1">Mix simultaneously</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {AMBIENT.map(s=>{ const on=!!active[s.id]; return (
          <div key={s.id} className="rounded-2xl border transition-all duration-300 overflow-hidden"
            style={{ background:on?`${s.color}18`:"rgba(255,255,255,0.04)", borderColor:on?`${s.color}55`:"rgba(255,255,255,0.07)", boxShadow:on?`0 0 16px ${s.color}33`:"none" }}>
            <button className="w-full p-3 flex flex-col items-center gap-1.5" onClick={()=>toggle(s)}>
              <div className="relative text-2xl">{s.icon}{on&&<div className="absolute -inset-1 rounded-full opacity-40 blur-sm pointer-events-none" style={{background:s.color,animation:"gp 1.5s ease-in-out infinite"}}/>}</div>
              <span className="text-[11px] font-semibold text-white/70">{s.label}</span>
              {on&&<div className="flex items-end gap-0.5 h-3.5">{[...Array(5)].map((_,i)=><div key={i} className="w-[3px] rounded-full" style={{background:s.color,height:"50%",animation:`wf ${.4+i*.12}s ease-in-out ${i*.08}s infinite`}}/>)}</div>}
            </button>
            {on&&<div className="px-3 pb-3"><input type="range" min={0} max={100} value={volumes[s.id]} onChange={e=>setVol(s.id,+e.target.value)} className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{accentColor:s.color}}/></div>}
          </div>
        );})}
      </div>
    </div>
  );
}

function FloatingPlayer({ previewUrl, trackName, artistName, artwork, onSkipPrev, onSkipNext, canPrev, canNext, onClose }:{
  previewUrl:string; trackName:string; artistName:string; artwork:string;
  onSkipPrev:()=>void; onSkipNext:()=>void; canPrev:boolean; canNext:boolean; onClose:()=>void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [currentT,  setCurrentT]  = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [buffering, setBuffering] = useState(false);
  useEffect(()=>{
    if (!audioRef.current || !previewUrl) return;
    audioRef.current.src = previewUrl;
    audioRef.current.load();
    setProgress(0); setCurrentT(0); setDuration(0); setBuffering(true);
    audioRef.current.play().then(()=>{ setPlaying(true); setBuffering(false); }).catch(()=>setBuffering(false));
  },[previewUrl]);
  useEffect(()=>()=>{ audioRef.current?.pause(); },[]);
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50"
      style={{background:"rgba(13,15,26,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 -8px 32px rgba(0,0,0,0.6)"}}>
      <audio ref={audioRef}
        onTimeUpdate={()=>{ if(!audioRef.current) return; const d=audioRef.current.duration||0,c=audioRef.current.currentTime; setCurrentT(c); setDuration(d); setProgress(d?c/d:0); }}
        onEnded={()=>{ setPlaying(false); setProgress(1); }}
        onWaiting={()=>setBuffering(true)}
        onCanPlay={()=>setBuffering(false)}
        onError={()=>{ setPlaying(false); setBuffering(false); }}
        crossOrigin="anonymous" />
      <div className="w-full h-1 bg-white/10 cursor-pointer" onClick={seek}>
        <div className="h-full rounded-full" style={{width:`${progress*100}%`,background:"linear-gradient(90deg,#6d28d9,#a78bfa)"}}/>
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative shrink-0">
          <img src={artwork} alt="" className="w-10 h-10 rounded-xl object-cover" style={{boxShadow:"0 0 12px rgba(124,58,237,.45)"}}/>
          <div className="absolute -inset-0.5 rounded-xl border border-violet-500/35 pointer-events-none"/>
          {playing&&<div className="absolute inset-0 rounded-xl flex items-end justify-center pb-1 gap-0.5 bg-black/40">{[...Array(4)].map((_,i)=><div key={i} className="w-[2px] rounded-full bg-violet-400" style={{height:"55%",animation:`wf ${.3+i*.1}s ease-in-out ${i*.05}s infinite`}}/>)}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{background:"linear-gradient(90deg,#c4b5fd,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{trackName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-white/40 truncate">{artistName}</p>
            <span className="text-[10px] text-white/25 shrink-0">{fmtTime(currentT)} / {fmtTime(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onSkipPrev} disabled={!canPrev} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-25 transition-colors"><SkipBack size={14} className="text-white/70"/></button>
          <button onClick={togglePlay} className="p-2.5 rounded-full text-white transition-all hover:scale-110" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",boxShadow:"0 2px 12px #7c3aed66"}}>
            {buffering?<Loader2 size={14} className="animate-spin"/>:playing?<Pause size={14}/>:<Play size={14}/>}
          </button>
          <button onClick={onSkipNext} disabled={!canNext} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-25 transition-colors"><SkipForward size={14} className="text-white/70"/></button>
          <button onClick={()=>{ audioRef.current?.pause(); onClose(); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1"><X size={13} className="text-white/40"/></button>
        </div>
      </div>
    </div>
  );
}

export function MusicPage() {
  const [tab, setTab] = useState<Tab>("search");
  const [query,setQuery]=useState(""); const [results,setResults]=useState<Track[]>([]);
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const [hasSearched,setHasSearched]=useState(false); const [addedIds,setAddedIds]=useState<Set<number>>(new Set());
  const [nowPlaying,setNowPlaying]=useState<Track|null>(null); const [nowIdx,setNowIdx]=useState(-1);
  const [favIds,setFavIds]=useState<Set<number>>(()=>new Set(loadLS<number[]>(FAVS_KEY,[])));
  const toggleFav=(id:number)=>{ setFavIds(prev=>{ const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); localStorage.setItem(FAVS_KEY,JSON.stringify([...s])); return s; }); };
  const playTrack=(track:Track,idx:number)=>{ setNowPlaying(track); setNowIdx(idx); };
  const skipTrack=(dir:1|-1)=>{ const next=results[nowIdx+dir]; if(next) playTrack(next,nowIdx+dir); };
  const [playlist,setPlaylist]=useState<PlaylistItem[]>(()=>loadLS(PLAYLIST_KEY,[]));
  const [plNowPlaying,setPlNowPlaying]=useState<PlaylistItem|null>(null); const [plNowIdx,setPlNowIdx]=useState(-1);
  const savePlaylist=(items:PlaylistItem[])=>{ setPlaylist(items); localStorage.setItem(PLAYLIST_KEY,JSON.stringify(items)); };
  const addToPlaylist=(track:Track)=>{ if(addedIds.has(track.trackId)) return; savePlaylist([{id:track.trackId,trackName:track.trackName,artistName:track.artistName,artwork:track.artworkUrl100,previewUrl:track.previewUrl,addedAt:Date.now()},...playlist.filter(p=>p.id!==track.trackId)]); setAddedIds(prev=>new Set(prev).add(track.trackId)); };
  const removeFromPlaylist=(id:number)=>{ savePlaylist(playlist.filter(p=>p.id!==id)); setAddedIds(prev=>{const s=new Set(prev);s.delete(id);return s;}); };
  const playFromPlaylist=(item:PlaylistItem,idx:number)=>{ setPlNowPlaying(item); setPlNowIdx(idx); };
  const [spotifyInput,setSpotifyInput]=useState(""); const [spotifyEmbed,setSpotifyEmbed]=useState<string|null>(null); const [spotifyError,setSpotifyError]=useState("");
  const loadSpotify=(url:string)=>{ setSpotifyError(""); const embed=extractSpotifyEmbed(url); if(!embed){setSpotifyError("Paste a valid Spotify link.");return;} setSpotifyEmbed(embed); setSpotifyInput(url); };
  const doSearch=useCallback(async(q:string)=>{ if(!q.trim()) return; setLoading(true); setError(""); setHasSearched(true); setNowPlaying(null); try{ const res=await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=25&entity=song`); const data=await res.json(); setResults(data.results??[]); }catch{ setError("Search failed."); }finally{ setLoading(false); } },[]);
  const eqActive=hasSearched||!!spotifyEmbed||!!plNowPlaying;
  const tabs=[{id:"search" as Tab,label:"Search",icon:<Search size={12}/>},{id:"playlist" as Tab,label:playlist.length?`My Playlist (${playlist.length})`:"My Playlist",icon:<ListMusic size={12}/>},{id:"spotify" as Tab,label:"Spotify",icon:<Music2 size={12}/>}];
  const activeFP=tab==="search"&&!!nowPlaying; const activePlFP=tab==="playlist"&&!!plNowPlaying;
  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white flex flex-col" style={{paddingBottom:(activeFP||activePlFP)?"84px":"16px"}}>
      <HeroSection active={eqActive} query={query} setQuery={setQuery} onSearch={q=>{setTab("search");doSearch(q);}} loading={loading}/>
      <AmbientSounds/>
      <div className="mx-4 my-1 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(124,58,237,.25),transparent)"}}/>
      <div className="flex gap-1 px-4 pt-3 pb-1">
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center" style={tab===t.id?{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",boxShadow:"0 2px 12px #7c3aed44",color:"white"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,.4)"}}>{t.icon} <span>{t.label}</span></button>)}
      </div>
      {tab==="search"&&(
        <div className="px-4 pt-3 space-y-4">
          <div className="flex flex-wrap gap-1.5">{STUDY_QUERIES.map(g=><button key={g.label} onClick={()=>{setQuery(g.query);doSearch(g.query);}} className="text-xs px-3 py-1 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors">{g.label}</button>)}</div>
          {error&&<p className="text-xs text-red-400">{error}</p>}
          {!hasSearched&&(<><div><p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Recommended for study</p><div className="grid grid-cols-2 gap-2">{RECOMMENDATIONS.map(r=><button key={r.label} onClick={()=>{setQuery(r.query);doSearch(r.query);}} className="flex items-center gap-2 p-2.5 rounded-xl text-left hover:scale-[1.02] transition-all" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}><div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0"><Music2 size={12} className="text-violet-400"/></div><span className="text-[11px] font-medium text-white/70 leading-tight">{r.label}</span></button>)}</div></div><div className="flex flex-col items-center py-8 gap-2 text-white/20"><Search size={32} className="text-violet-500/20"/><p className="text-sm">Search any song to hear a preview</p><p className="text-xs opacity-60">30-second previews via iTunes</p></div></>)}
          {hasSearched&&<div className="space-y-1.5">{loading&&<div className="flex items-center justify-center py-10 gap-2 text-white/30"><Loader2 size={18} className="animate-spin text-violet-400"/><span className="text-sm">Searching…</span></div>}{!loading&&results.map((track,i)=>{ const added=addedIds.has(track.trackId),faved=favIds.has(track.trackId),isNow=nowPlaying?.trackId===track.trackId,hasPreview=!!track.previewUrl; return <div key={track.trackId} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all duration-200 group hover:scale-[1.005] ${hasPreview?"cursor-pointer":"cursor-default opacity-60"}`} style={{background:isNow?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.02)",borderColor:isNow?"rgba(124,58,237,0.35)":"rgba(255,255,255,0.05)",boxShadow:isNow?"0 0 16px rgba(124,58,237,.12)":"none"}} onClick={()=>{if(hasPreview)playTrack(track,i);}}><div className="w-5 shrink-0 text-center">{isNow?<div className="flex items-end gap-0.5 h-4 mx-auto w-fit">{[...Array(3)].map((_,j)=><div key={j} className="w-[3px] rounded-full bg-violet-400" style={{height:"60%",animation:`wf ${.35+j*.1}s ease-in-out ${j*.08}s infinite`}}/>)}</div>:<span className="text-xs text-white/25">{i+1}</span>}</div><div className="relative shrink-0"><img src={track.artworkUrl100} alt="" className="w-11 h-11 rounded-xl object-cover" style={{boxShadow:isNow?"0 0 10px rgba(124,58,237,.4)":"none"}}/>{isNow&&<div className="absolute inset-0 rounded-xl border border-violet-400/35"/>}{!hasPreview&&<div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center"><span className="text-[9px] text-white/50">No preview</span></div>}</div><div className="flex-1 min-w-0"><p className={`text-sm font-semibold truncate ${isNow?"text-violet-300":"text-white"}`}>{track.trackName}</p><p className="text-[11px] text-white/40 truncate">{track.artistName}</p></div><div className="flex items-center gap-1.5 shrink-0"><span className="text-xs text-white/25">{track.trackTimeMillis?fmtMs(track.trackTimeMillis):"—"}</span><button onClick={e=>{e.stopPropagation();toggleFav(track.trackId);}} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"><Heart size={12} fill={faved?"#f472b6":"none"} className={faved?"text-pink-400":"text-white/40"}/></button><button onClick={e=>{e.stopPropagation();if(hasPreview)addToPlaylist(track);}} disabled={!hasPreview} className={`p-1.5 rounded-lg border transition-colors opacity-0 group-hover:opacity-100 ${added?"bg-violet-500/15 border-violet-500/30":"bg-white/5 border-white/10 hover:bg-violet-500/15"}`}>{added?<CheckCircle2 size={12} className="text-violet-400"/>:<Plus size={12} className="text-white/40"/>}</button></div></div>; })}{!loading&&results.length===0&&<p className="text-center py-6 text-white/30 text-sm">No results. Try a different search.</p>}</div>}
        </div>
      )}
      {tab==="playlist"&&(
        <div className="px-4 pt-3 space-y-4">
          {playlist.length===0?<div className="flex flex-col items-center justify-center py-16 text-white/20 gap-3"><ListMusic size={44} className="text-violet-500/15"/><p className="text-sm font-medium">Your playlist is empty</p><p className="text-xs text-center opacity-60">Search songs and tap + to add them here</p></div>:(<><div className="flex items-center justify-between"><p className="text-xs text-white/40">{playlist.length} track{playlist.length!==1?"s":""}</p><button onClick={()=>{savePlaylist([]);setAddedIds(new Set());setPlNowPlaying(null);}} className="text-xs text-red-400/50 hover:text-red-400 transition-colors">Clear all</button></div><div className="space-y-1.5">{playlist.map((item,i)=>{ const isNow=plNowPlaying?.id===item.id; return <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:scale-[1.005]" style={{background:isNow?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.02)",borderColor:isNow?"rgba(124,58,237,0.35)":"rgba(255,255,255,0.05)"}} onClick={()=>playFromPlaylist(item,i)}><div className="w-5 shrink-0 text-center">{isNow?<div className="flex items-end gap-0.5 h-4 mx-auto w-fit">{[...Array(3)].map((_,j)=><div key={j} className="w-[3px] rounded-full bg-violet-400" style={{height:"60%",animation:`wf ${.35+j*.1}s ease-in-out ${j*.08}s infinite`}}/>)}</div>:<span className="text-xs text-white/25">{i+1}</span>}</div><img src={item.artwork} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0"/><div className="flex-1 min-w-0"><p className={`text-sm font-semibold truncate ${isNow?"text-violet-300":"text-white"}`}>{item.trackName}</p><p className="text-[11px] text-white/40 truncate">{item.artistName}</p></div><button onClick={e=>{e.stopPropagation();removeFromPlaylist(item.id);}} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 transition-all"><Trash2 size={12} className="text-white/40"/></button></div>; })}</div></>)}
        </div>
      )}
      {tab==="spotify"&&(
        <div className="px-4 pt-3 space-y-4">
          <p className="text-xs text-white/40">Paste any Spotify track, album, or playlist link</p>
          <div className="flex gap-2"><input value={spotifyInput} onChange={e=>setSpotifyInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")loadSpotify(spotifyInput);}} placeholder="https://open.spotify.com/playlist/…" className="flex-1 h-10 rounded-xl px-3 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-green-500/40" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}/><button onClick={()=>loadSpotify(spotifyInput)} className="h-10 px-4 rounded-xl text-white text-xs font-semibold shrink-0 transition-all hover:scale-105" style={{background:"linear-gradient(135deg,#16a34a,#15803d)",boxShadow:"0 2px 10px #16a34a44"}}>Load</button></div>
          {spotifyError&&<p className="text-xs text-red-400">{spotifyError}</p>}
          {spotifyEmbed&&<iframe src={spotifyEmbed} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-2xl border-0" title="Spotify Player"/>}
          <div><p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-2">Study playlists</p><div className="grid grid-cols-2 gap-2">{SPOTIFY_SUGGESTIONS.map(s=><button key={s.label} onClick={()=>loadSpotify(s.url)} className="text-[11px] px-3 py-2.5 rounded-xl border border-green-500/15 bg-green-500/8 text-green-400 hover:bg-green-500/15 transition-all hover:scale-[1.02] text-left font-semibold">{s.label}</button>)}</div></div>
          <p className="text-[10px] text-white/20 text-center">Free Spotify: 30-sec previews · Premium: full songs</p>
        </div>
      )}
      {activeFP&&nowPlaying&&<FloatingPlayer previewUrl={nowPlaying.previewUrl} trackName={nowPlaying.trackName} artistName={nowPlaying.artistName} artwork={nowPlaying.artworkUrl100} onSkipPrev={()=>skipTrack(-1)} onSkipNext={()=>skipTrack(1)} canPrev={nowIdx>0} canNext={nowIdx<results.length-1} onClose={()=>setNowPlaying(null)}/>}
      {activePlFP&&plNowPlaying&&<FloatingPlayer previewUrl={plNowPlaying.previewUrl} trackName={plNowPlaying.trackName} artistName={plNowPlaying.artistName} artwork={plNowPlaying.artwork} onSkipPrev={()=>{const item=playlist[plNowIdx-1];if(item)playFromPlaylist(item,plNowIdx-1);}} onSkipNext={()=>{const item=playlist[plNowIdx+1];if(item)playFromPlaylist(item,plNowIdx+1);}} canPrev={plNowIdx>0} canNext={plNowIdx<playlist.length-1} onClose={()=>setPlNowPlaying(null)}/>}
    </div>
  );
}
