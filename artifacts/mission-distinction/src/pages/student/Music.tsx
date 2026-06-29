import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search, Music2, Loader2, X, Volume2, Play,
  Youtube, Sparkles
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

/* ─── Types ──────────────────────────────────────────── */
type Tab = "youtube" | "spotify";
type NoiseType = "white" | "pink" | "brown";
interface SoundNode { source: AudioBufferSourceNode; gain: GainNode; }
interface YTResult {
  videoId: string; title: string; thumbnail: string;
  channel: string; duration: string; views: string;
}
/* ─── Constants ──────────────────────────────────────── */
const YT_CHIPS = ["Lofi hip hop study","Classical piano focus","Alpha waves study","Rain jazz café","Hans Zimmer ambient","Peaceful piano","Deep focus beats","Nature sounds study"];
const SPOTIFY_SUGGESTIONS = [
  { label:"Lo-fi Hip Hop",      url:"https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4euo806" },
  { label:"Deep Focus",         url:"https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ" },
  { label:"Peaceful Piano",     url:"https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO" },
  { label:"Instrumental Study", url:"https://open.spotify.com/playlist/37i9dQZF1DX9sIqqvKsjEL" },
  { label:"Brain Food",         url:"https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7" },
  { label:"Calming Acoustic",   url:"https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
];
const AMBIENT = [
  { id:"rain",      label:"Rain",        icon:"🌧", noise:"pink",  filter:{type:"bandpass" as BiquadFilterType,freq:800, q:0.8}, color:"#3b82f6" },
  { id:"fireplace", label:"Fireplace",   icon:"🔥", noise:"brown", filter:{type:"lowpass"  as BiquadFilterType,freq:350, q:0.5}, color:"#f97316" },
  { id:"ocean",     label:"Ocean",       icon:"🌊", noise:"pink",  filter:{type:"lowpass"  as BiquadFilterType,freq:600, q:0.6}, color:"#06b6d4" },
  { id:"forest",    label:"Forest",      icon:"🍃", noise:"pink",  filter:{type:"bandpass" as BiquadFilterType,freq:2000,q:1.2}, color:"#22c55e" },
  { id:"thunder",   label:"Thunderstorm",icon:"⚡", noise:"white", filter:{type:"highpass" as BiquadFilterType,freq:120, q:0.5}, color:"#a855f7" },
  { id:"cafe",      label:"Café",        icon:"☕", noise:"brown", filter:{type:"bandpass" as BiquadFilterType,freq:1500,q:1.5}, color:"#d97706" },
];
const BAR_HEIGHTS=[38,62,82,52,90,68,44,78,58,72,48,85,60,76,46];
const BAR_DELAYS=[0,.2,.4,.1,.5,.3,.15,.45,.25,.35,.05,.5,.2,.4,.1];
const PARTICLES=Array.from({length:18},(_,i)=>({id:i,x:5+Math.floor(i*5.4)%90,y:5+Math.floor(i*7.3)%85,size:2+Math.floor(i%3)*1.5,delay:+(i*0.22).toFixed(2),dur:3+Math.floor(i%4)}));

/* ─── Utils ──────────────────────────────────────────── */
function extractSpotifyEmbed(input: string): string | null {
  const m = input.match(/spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/);
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
  return null;
}

/* ─── Noise Synth ────────────────────────────────────── */
function buildNoiseBuffer(ctx: AudioContext, type: NoiseType) {
  const size=ctx.sampleRate*3,buf=ctx.createBuffer(1,size,ctx.sampleRate),d=buf.getChannelData(0);
  if(type==="white"){for(let i=0;i<size;i++)d[i]=Math.random()*2-1;}
  else if(type==="brown"){let last=0;for(let i=0;i<size;i++){const w=Math.random()*2-1;d[i]=(last+0.02*w)/1.02;last=d[i];d[i]*=3.5;}}
  else{let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(let i=0;i<size;i++){const w=Math.random()*2-1;b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.969*b2+w*0.153852;b3=0.8665*b3+w*0.3104856;b4=0.55*b4+w*0.5329522;b5=-0.7616*b5-w*0.016898;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;b6=w*0.115926;}}
  return buf;
}

/* ─── Hero ───────────────────────────────────────────── */
function HeroSection({active,query,setQuery,onSearch,tab}:{active:boolean;query:string;setQuery:(q:string)=>void;onSearch:(q:string)=>void;tab:Tab;}){
  const placeholder=tab==="spotify"?"Paste Spotify link…":"Search YouTube…";
  return(
    <div className="relative overflow-hidden px-5 pt-7 pb-8" style={{background:"linear-gradient(135deg,#0a0c18 0%,#150a32 35%,#1e0d4a 55%,#0d0f1a 100%)"}}>
      {PARTICLES.map(p=><div key={p.id} className="absolute rounded-full pointer-events-none" style={{left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,background:"rgba(167,139,250,0.2)",boxShadow:`0 0 ${p.size*2}px rgba(124,58,237,0.35)`,animation:`pf-${p.id%5} ${p.dur}s ease-in-out ${p.delay}s infinite alternate`}}/>)}
      <style>{`@keyframes pf-0{from{transform:translate(0,0) scale(1);opacity:.4}to{transform:translate(8px,-12px) scale(1.3);opacity:.1}}@keyframes pf-1{from{transform:translate(0,0) scale(1);opacity:.3}to{transform:translate(-10px,-8px) scale(.8);opacity:.6}}@keyframes pf-2{from{transform:translate(0,0) scale(1);opacity:.5}to{transform:translate(6px,10px) scale(1.2);opacity:.15}}@keyframes pf-3{from{transform:translate(0,0) scale(1);opacity:.25}to{transform:translate(-7px,-14px) scale(.9);opacity:.5}}@keyframes pf-4{from{transform:translate(0,0) scale(1);opacity:.4}to{transform:translate(12px,-6px) scale(1.1);opacity:.15}}@keyframes eq-b{from{transform:scaleY(.3)}to{transform:scaleY(1)}}@keyframes nf{0%,100%{transform:translateY(0) rotate(-5deg);opacity:.45}50%{transform:translateY(-14px) rotate(8deg);opacity:.15}}@keyframes wf{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}@keyframes gp{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
      <div className="absolute -top-10 right-0 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none" style={{background:"radial-gradient(circle,#7c3aed 0%,transparent 70%)"}}/>
      {[{t:"♪",r:"15%",top:"12%"},{t:"♫",r:"6%",top:"32%"},{t:"♩",r:"22%",top:"65%"},{t:"♬",r:"2%",top:"55%"}].map((n,i)=><span key={i} className="absolute text-violet-300 select-none pointer-events-none" style={{right:n.r,top:n.top,fontSize:14+i*2,opacity:.35,animation:`nf ${2.5+i*.7}s ease-in-out ${i*.4}s infinite`}}>{n.t}</span>)}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1"><div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"><Music2 size={14} className="text-violet-400"/></div><span className="text-[10px] font-semibold text-violet-400/70 tracking-widest uppercase">Study Music Hub</span></div>
          <h1 className="text-[30px] font-black leading-none tracking-tight text-white mt-2">Study <span style={{background:"linear-gradient(90deg,#a78bfa,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Music</span> Hub</h1>
          <p className="text-white/75 text-[13px] font-semibold mt-2">Focus deeper. Study longer. Learn smarter.</p>
          <p className="text-white/40 text-[11px] mt-1.5 leading-relaxed">Search YouTube for study music and focus playlists<br/>designed for MBBS students.</p>
        </div>
        <div className="shrink-0 pt-2"><div className="flex items-end gap-[3px] h-20">{BAR_HEIGHTS.map((h,i)=><div key={i} className="w-[5px] rounded-t-full" style={{height:`${h}%`,background:"linear-gradient(to top,#6d28d9,#a78bfa,#c4b5fd)",animation:active?`eq-b ${.7+(i%3)*.2}s ease-in-out ${BAR_DELAYS[i]}s infinite alternate`:"none",transform:active?undefined:"scaleY(0.3)",transformOrigin:"bottom"}}/>)}</div></div>
      </div>
      <div className="relative mt-5">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 z-10"/>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")onSearch(query);}} placeholder={placeholder} className="w-full h-12 pl-10 pr-28 rounded-2xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(8px)"}}/>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query&&<button onClick={()=>setQuery("")} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"><X size={13}/></button>}
          <button onClick={()=>onSearch(query)} disabled={!query.trim()} className="h-8 px-3 rounded-xl text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 transition-all hover:scale-105" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",boxShadow:"0 2px 12px #7c3aed55"}}><Sparkles size={12}/> Search</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Ambient Sounds ─────────────────────────────────── */
function AmbientSounds(){
  const ctxRef=useRef<AudioContext|null>(null),nodesRef=useRef<Map<string,SoundNode>>(new Map());
  const [active,setActive]=useState<Record<string,boolean>>({}), [volumes,setVolumes]=useState<Record<string,number>>(Object.fromEntries(AMBIENT.map(a=>[a.id,60])));
  const getCtx=()=>{if(!ctxRef.current||ctxRef.current.state==="closed")ctxRef.current=new(window.AudioContext||(window as any).webkitAudioContext)();if(ctxRef.current.state==="suspended")ctxRef.current.resume();return ctxRef.current;};
  const toggle=(sound:typeof AMBIENT[0])=>{
    const isOn=active[sound.id];
    if(isOn){
      try {
        const node=nodesRef.current.get(sound.id);
        if(node){
          const t=ctxRef.current?.currentTime??0;
          node.gain.gain.setTargetAtTime(0,t,0.3);
          setTimeout(()=>{try{node.source.stop();}catch{}nodesRef.current.delete(sound.id);},400);
        }
      } catch {}
      setActive(a=>({...a,[sound.id]:false}));
    } else {
      try {
        const ctx=getCtx();
        const buf=buildNoiseBuffer(ctx,sound.noise as NoiseType);
        const source=ctx.createBufferSource();
        source.buffer=buf;source.loop=true;
        const filter=ctx.createBiquadFilter();
        filter.type=sound.filter.type;filter.frequency.value=sound.filter.freq;filter.Q.value=sound.filter.q;
        const gain=ctx.createGain();
        gain.gain.value=0;
        source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
        source.start();
        gain.gain.setTargetAtTime((volumes[sound.id]/100)*0.7,ctx.currentTime,0.3);
        nodesRef.current.set(sound.id,{source,gain});
        setActive(a=>({...a,[sound.id]:true}));
      } catch {}
    }
  };
  const setVol=(id:string,val:number)=>{setVolumes(v=>({...v,[id]:val}));const node=nodesRef.current.get(id);if(node&&ctxRef.current)node.gain.gain.setTargetAtTime((val/100)*0.7,ctxRef.current.currentTime,0.05);};
  useEffect(()=>()=>{nodesRef.current.forEach(n=>{try{n.source.stop();}catch{}});ctxRef.current?.close();},[]);
  return(
    <div className="px-4 py-4 bg-background">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={13} className="text-violet-400"/>
        <span className="text-xs font-bold text-foreground/80 tracking-wide uppercase">Ambient Sounds</span>
        <span className="text-[10px] text-muted-foreground ml-1">Mix simultaneously</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {AMBIENT.map(s=>{
          const on=!!active[s.id];
          return(
            <div key={s.id} className="rounded-2xl border transition-all duration-300 overflow-hidden bg-card border-border"
              style={on?{background:`${s.color}18`,borderColor:`${s.color}55`,boxShadow:`0 0 16px ${s.color}33`}:{}}>
              <button aria-pressed={on} className="w-full p-3 flex flex-col items-center gap-1.5" onClick={()=>toggle(s)}>
                <div className="relative text-2xl">{s.icon}
                  {on&&<div className="absolute -inset-1 rounded-full opacity-40 blur-sm pointer-events-none" style={{background:s.color,animation:"gp 1.5s ease-in-out infinite"}}/>}
                </div>
                <span className="text-[11px] font-semibold text-foreground/70">{s.label}</span>
                {on&&<div className="flex items-end gap-0.5 h-3.5">{[...Array(5)].map((_,i)=><div key={i} className="w-[3px] rounded-full" style={{background:s.color,height:"50%",animation:`wf ${.4+i*.12}s ease-in-out ${i*.08}s infinite`}}/>)}</div>}
              </button>
              {on&&<div className="px-3 pb-3"><input type="range" min={0} max={100} value={volumes[s.id]} onChange={e=>setVol(s.id,+e.target.value)} className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{accentColor:s.color}}/></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── YouTube Tab ─────────────────────────────────────
   Key fix: NO `key` prop on this component from the parent.
   externalSearch triggers search via useEffect without unmounting.
   Audio-Only: single iframe shrunk to 1×1px (not 0×0) so
   browsers don't suspend it.
   ─────────────────────────────────────────────────── */
function YouTubeTab({ externalSearch }: { externalSearch: string }) {
  const { play: ctxPlay, stop: ctxStop, playing: ctxPlaying } = useMusicPlayer();
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<YTResult[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(""); setSearched(true); ctxStop();
    try {
      const res = await apiFetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error((err as any).error ?? "Search failed");
      }
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (e: any) {
      setError(e?.message ?? "YouTube search failed. Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (externalSearch) { setQuery(externalSearch); search(externalSearch); }
  }, [externalSearch]);

  return (
    <div className="px-4 pt-3 space-y-3 bg-background">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")search(query);}} placeholder="Search YouTube…" className="w-full h-10 pl-9 pr-3 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/40 bg-muted/50 border border-border"/>
        </div>
        <button onClick={()=>search(query)} disabled={loading||!query.trim()} className="h-10 px-4 rounded-xl text-white text-xs font-bold shrink-0 disabled:opacity-40 transition-all hover:scale-105" style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)",boxShadow:"0 2px 10px #dc262644"}}>{loading?<Loader2 size={14} className="animate-spin"/>:<Youtube size={14}/>}</button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {YT_CHIPS.map(c=><button key={c} onClick={()=>{setQuery(c);search(c);}} className="text-[11px] px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors whitespace-nowrap">{c}</button>)}
      </div>

      {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-xl p-2">{error}</p>}

      {ctxPlaying?.type === "youtube" && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 flex items-center gap-3 px-3 py-2.5">
          <img src={ctxPlaying.thumbnail} alt="" className="w-14 h-10 rounded-xl object-cover shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground/90 truncate">{ctxPlaying.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{ctxPlaying.channel}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-end gap-0.5 h-3">{[...Array(4)].map((_,i)=><div key={i} className="w-[2px] rounded-full bg-red-400" style={{height:"60%",animation:`wf ${.3+i*.1}s ease-in-out ${i*.05}s infinite`}}/>)}</div>
              <p className="text-[10px] text-violet-500">Playing in player below ↓</p>
            </div>
          </div>
          <button onClick={ctxStop} className="p-1.5 rounded-lg hover:bg-muted shrink-0"><X size={12} className="text-muted-foreground"/></button>
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground"><Loader2 size={18} className="animate-spin text-red-400"/><span className="text-sm">Searching YouTube…</span></div>}
      {!loading && !searched && (
        <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
          <Youtube size={36} className="text-red-500/30"/>
          <p className="text-sm">Search or tap a chip above</p>
          <p className="text-xs opacity-60">Full videos — free, no login</p>
        </div>
      )}
      {!loading && results.length > 0 && (
        <div className="space-y-1.5">
          {results.map(v=>{
            const isNow=ctxPlaying?.type==="youtube"&&ctxPlaying.videoId===v.videoId;
            return(
              <button key={v.videoId} onClick={()=>ctxPlay({type:"youtube",videoId:v.videoId,title:v.title,channel:v.channel,thumbnail:v.thumbnail})}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all hover:scale-[1.005] group ${isNow?"border-red-500/35 bg-red-500/8":"border-border bg-card hover:bg-muted/40"}`}
                style={isNow?{boxShadow:"0 0 14px rgba(220,38,38,.08)"}:{}}>
                <div className="relative shrink-0 w-[72px] h-[54px] rounded-xl overflow-hidden bg-muted">
                  <img src={v.thumbnail} alt="" className="w-full h-full object-cover"/>
                  {isNow
                    ?<div className="absolute inset-0 bg-red-500/30 flex items-center justify-center"><div className="flex items-end gap-0.5 h-4">{[...Array(4)].map((_,i)=><div key={i} className="w-[3px] rounded-full bg-white" style={{height:"60%",animation:`wf ${.3+i*.1}s ease-in-out ${i*.05}s infinite`}}/>)}</div></div>
                    :<div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={18} className="text-white" fill="white"/></div>
                  }
                  {v.duration&&<span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-black/70 px-1 rounded">{v.duration}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isNow?"text-red-500":"text-foreground/85"}`}>{v.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">{v.channel}</p>
                  {v.views&&<p className="text-[9px] text-muted-foreground/60 mt-0.5">{v.views}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {!loading&&searched&&results.length===0&&<p className="text-center py-6 text-muted-foreground text-sm">No results. Try a different search.</p>}
    </div>
  );
}

/* ─── Spotify Tab ────────────────────────────────────── */
function SpotifyTab() {
  const [input,setInput]=useState(""),[embed,setEmbed]=useState<string|null>(null),[error,setError]=useState("");
  const load=(url:string)=>{setError("");const e=extractSpotifyEmbed(url);if(!e){setError("Paste a valid Spotify link.");return;}setEmbed(e);setInput(url);};
  return(
    <div className="px-4 pt-3 space-y-4 bg-background">
      <div className="p-3 rounded-2xl border border-green-500/20 bg-green-500/5 flex items-start gap-2">
        <Music2 size={14} className="text-green-500 mt-0.5 shrink-0"/>
        <p className="text-[11px] text-foreground/60 leading-relaxed">Paste any Spotify link. <span className="text-foreground/80 font-semibold">Spotify Premium</span> → full songs. Free Spotify → 30-sec previews + shuffle radio.</p>
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")load(input);}} placeholder="https://open.spotify.com/playlist/…" className="flex-1 h-10 rounded-xl px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 bg-muted/50 border border-border"/>
        <button onClick={()=>load(input)} className="h-10 px-4 rounded-xl text-white text-xs font-semibold shrink-0 hover:scale-105 transition-all" style={{background:"linear-gradient(135deg,#16a34a,#15803d)",boxShadow:"0 2px 10px #16a34a44"}}>Load</button>
      </div>
      {error&&<p className="text-xs text-red-500">{error}</p>}
      {embed&&(
        <div className="space-y-2">
          <iframe src={embed} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" className="rounded-2xl border-0" title="Spotify"/>
          <button onClick={()=>{setEmbed(null);setInput("");}} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">✕ Close</button>
        </div>
      )}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Study playlists</p>
        <div className="grid grid-cols-2 gap-2">
          {SPOTIFY_SUGGESTIONS.map(s=><button key={s.label} onClick={()=>load(s.url)} className="text-[11px] px-3 py-2.5 rounded-xl border border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400 hover:bg-green-500/15 transition-all hover:scale-[1.02] text-left font-semibold">{s.label}</button>)}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function StudentMusic() {
  const { playing: ctxPlaying } = useMusicPlayer();
  const [tab,  setTab]  = useState<Tab>("youtube");
  const [query, setQuery] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const bottomPad = ctxPlaying ? 315 + 48 + 16 : 16;

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    /* Append a tiny unique suffix so the effect fires even when
       the same query is searched twice in a row */
    setPendingSearch(q + "\x00" + Date.now());
  };

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id:"youtube", label:"YouTube", color:"#dc2626" },
    { id:"spotify", label:"Spotify", color:"#16a34a" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] -mx-4 -mt-4" style={{paddingBottom:bottomPad}}>
      <HeroSection active={true} query={query} setQuery={setQuery} onSearch={handleSearch} tab={tab}/>
      <AmbientSounds/>
      <div className="mx-4 my-1 h-px bg-border/50"/>

      <div className="flex gap-1.5 px-4 pt-3 pb-1 bg-background">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={tab===t.id
              ? "flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center"
              : "flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }
            style={tab===t.id
              ? {background:`${t.color}cc`,boxShadow:`0 2px 12px ${t.color}55`,color:"white"}
              : undefined
            }>
            {t.label}
          </button>
        ))}
      </div>

      {/* NO key prop — tabs never remount on search, so playing video/track
          continues even when the user searches again from the hero bar */}
      {tab==="youtube" && <YouTubeTab externalSearch={tab==="youtube" ? pendingSearch : ""} />}
      {tab==="spotify" && <SpotifyTab/>}
    </div>
  );
}
