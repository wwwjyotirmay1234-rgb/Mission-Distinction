import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useId, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════
//  MISSION DISTINCTION — Cinematic Anime Primitives v2
//  Every element is production-quality SVG/CSS art, no placeholder blobs
// ═══════════════════════════════════════════════════════════════════════

// ─── FILM GRAIN (canvas animated noise — the cinematic texture) ───────
export function FilmGrain({ opacity = 0.38 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf: number;
    const draw = () => {
      const d = ctx.createImageData(c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = (Math.random() * 60) | 0;
      }
      ctx.putImageData(d, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={ref} width={320} height={180}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 88, mixBlendMode: 'overlay', opacity }} />
  );
}

// ─── CINEMATIC BARS (2.39:1 letterbox) ────────────────────────────────
export function CinemaBars() {
  // 2.39:1 ≈ 16:6.69. In a 16:9 container, bars are (9-6.69)/2/9 ≈ 12.8% each
  const h = '13%';
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h,
        background: '#000', zIndex: 100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h,
        background: '#000', zIndex: 100, pointerEvents: 'none' }} />
    </>
  );
}

// ─── BOKEH (depth-of-field circles) ───────────────────────────────────
export function Bokeh({ count = 14, active = true }: { count?: number; active?: boolean }) {
  const circles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 30 + Math.random() * 120,
    color: Math.random() > 0.5 ? 'rgba(255,180,60,' : 'rgba(60,100,220,',
    opacity: 0.03 + Math.random() * 0.07,
    delay: Math.random() * 4, dur: 5 + Math.random() * 8,
  })), [count]);
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none z-[2]">
          {circles.map(c => (
            <motion.div key={c.id}
              style={{ position: 'absolute', left: `${c.x}%`, top: `${c.y}%`,
                width: c.size, height: c.size, borderRadius: '50%',
                transform: 'translate(-50%,-50%)',
                background: `${c.color}${c.opacity})`,
                filter: 'blur(18px)' }}
              animate={{ scale: [1, 1.15, 0.9, 1], opacity: [c.opacity, c.opacity * 1.4, c.opacity] }}
              transition={{ delay: c.delay, duration: c.dur, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── VOLUMETRIC LIGHT (SVG cone + glow — real cinematography) ─────────
export function VolumetricLight({ x = 50, y = 0, angle = 40, length = 65,
  color = 'rgba(255,200,80,0.18)', show = true }:
  { x?: number; y?: number; angle?: number; length?: number; color?: string; show?: boolean }) {
  const half = angle / 2;
  const rad = (a: number) => (a * Math.PI) / 180;
  const x2l = x - length * Math.sin(rad(half));
  const x2r = x + length * Math.sin(rad(half));
  const y2 = y + length;
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-[7]"
      animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1.8 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
          <filter id="lightBlur"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {/* Hard cone */}
        <polygon points={`${x},${y} ${x2l},${y2} ${x2r},${y2}`}
          fill="url(#lightGrad)" opacity="0.6"/>
        {/* Soft outer glow */}
        <polygon points={`${x},${y} ${x2l - 5},${y2} ${x2r + 5},${y2}`}
          fill="url(#lightGrad)" filter="url(#lightBlur)" opacity="0.8"/>
        {/* Core bright center */}
        <polygon points={`${x},${y} ${x + (x2l - x) * 0.3},${y2 * 0.6} ${x + (x2r - x) * 0.3},${y2 * 0.6}`}
          fill="rgba(255,230,150,0.22)" filter="url(#lightBlur)"/>
      </svg>
    </motion.div>
  );
}

// ─── DUST MOTES (tiny particles floating in light) ────────────────────
export function DustMotes({ active = true, cx = 50, width = 18 }:
  { active?: boolean; cx?: number; width?: number }) {
  const motes = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i, x: cx - width/2 + Math.random() * width,
    startY: 40 + Math.random() * 45,
    endY: 15 + Math.random() * 30,
    size: 0.8 + Math.random() * 1.4,
    delay: Math.random() * 8, dur: 8 + Math.random() * 14,
    dx: (Math.random() - 0.5) * 6,
  })), [cx, width]);
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none z-[9]">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {motes.map(m => (
              <motion.circle key={m.id} r={m.size * 0.3} fill="rgba(255,230,180,0.75)"
                initial={{ cx: m.x, cy: m.startY, opacity: 0 }}
                animate={{ cx: m.x + m.dx, cy: m.endY, opacity: [0, 0.8, 0.8, 0] }}
                transition={{ delay: m.delay, duration: m.dur, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </svg>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── STAR FIELD ────────────────────────────────────────────────────────
export function StarField({ count = 90, show = true }: { count?: number; show?: boolean }) {
  const stars = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    r: Math.random() * 1.2 + 0.3,
    delay: Math.random() * 6, dur: Math.random() * 4 + 2,
    bright: Math.random() > 0.85,
  })), [count]);
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-[1]"
      animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1.5 }}>
      <svg width="100%" height="100%">
        <defs>
          <filter id="starGlow"><feGaussianBlur stdDeviation="0.8"/></filter>
        </defs>
        {stars.map(s => (
          <g key={s.id}>
            <motion.circle cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white"
              animate={{ opacity: [0.2, 0.9, 0.2] }}
              transition={{ delay: s.delay, duration: s.dur, repeat: Infinity, repeatType: 'mirror' }}
            />
            {s.bright && (
              <motion.circle cx={`${s.x}%`} cy={`${s.y}%`} r={s.r * 2.5}
                fill="rgba(200,220,255,0.25)" filter="url(#starGlow)"
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ delay: s.delay, duration: s.dur, repeat: Infinity, repeatType: 'mirror' }}
              />
            )}
          </g>
        ))}
      </svg>
    </motion.div>
  );
}

// ─── SPEED LINES ───────────────────────────────────────────────────────
export function SpeedLines({ active, color = 'rgba(255,215,0,0.75)', count = 28, cx = 50, cy = 50 }:
  { active: boolean; color?: string; count?: number; cx?: number; cy?: number }) {
  const id = useId();
  const lines = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = ((360 / count) * i + (Math.random() * 8 - 4)) * (Math.PI / 180);
    const len = 32 + Math.random() * 45;
    return { id: i, x2: cx + Math.cos(angle) * len, y2: cy + Math.sin(angle) * len, op: 0.5 + Math.random() * 0.5 };
  }), [count, cx, cy]);
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-[14]"
      initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.10 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map(l => (
          <motion.line key={`${id}-${l.id}`} x1={cx} y1={cy} x2={l.x2} y2={l.y2}
            stroke={color} strokeWidth="0.45" opacity={l.op}
            initial={{ pathLength: 0 }} animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }} />
        ))}
      </svg>
    </motion.div>
  );
}

// ─── FLOATING PARTICLES ────────────────────────────────────────────────
export function FloatingParticles({ count = 18, color = '#ffd700', active = true }:
  { count?: number; color?: string; active?: boolean }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 90 + 5, size: Math.random() * 5 + 3,
    delay: Math.random() * 4, dur: Math.random() * 5 + 5, dx: (Math.random() - 0.5) * 80,
  })), [count]);
  return (
    <AnimatePresence>
      {active && particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, bottom: '-8px',
            background: color, boxShadow: `0 0 ${p.size * 2.5}px ${color}88` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, -600], opacity: [0, 0.9, 0.9, 0], x: [0, p.dx] }}
          transition={{ delay: p.delay, duration: p.dur, repeat: Infinity, ease: 'easeOut' }} />
      ))}
    </AnimatePresence>
  );
}

// ─── CITY LIGHTS ───────────────────────────────────────────────────────
export function CityLights({ count = 70, opacity = 0.75, color = '#ffaa30' }:
  { count?: number; opacity?: number; color?: string }) {
  const lights = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: (i / count) * 102 - 1 + (Math.random() - 0.5) * 2.5,
    y: 87 + Math.random() * 10, r: Math.random() * 2.5 + 0.8,
    flicker: Math.random() > 0.72, delay: Math.random() * 6,
  })), [count]);
  return (
    <div className="absolute inset-0 pointer-events-none z-[3]">
      <svg width="100%" height="100%">
        <defs><filter id="cityBlur"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
        {lights.map(l => (
          <motion.circle key={l.id} cx={`${l.x}%`} cy={`${l.y}%`} r={l.r}
            fill={color} filter="url(#cityBlur)"
            animate={l.flicker ? { opacity: [opacity, opacity * 0.35, opacity] } : { opacity }}
            transition={l.flicker ? { delay: l.delay, duration: 1.4 + Math.random(), repeat: Infinity } : {}} />
        ))}
      </svg>
    </div>
  );
}

// ─── RAIN ──────────────────────────────────────────────────────────────
export function Rain({ intensity = 45, show = true }: { intensity?: number; show?: boolean }) {
  const drops = useMemo(() => Array.from({ length: intensity }, (_, i) => ({
    id: i, x: Math.random() * 110 - 5, delay: Math.random() * 1.5,
    dur: Math.random() * 0.5 + 0.35, len: Math.random() * 18 + 10,
    op: 0.25 + Math.random() * 0.28,
  })), [intensity]);
  return (
    <motion.div className="absolute inset-0 pointer-events-none overflow-hidden z-[8]"
      animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.6 }}>
      <svg width="100%" height="100%">
        {drops.map(d => (
          <motion.line key={d.id} x1={`${d.x}%`} y1="-5%" x2={`${d.x - 2}%`} y2={`${d.len - 5}%`}
            stroke="rgba(140,180,220,0.45)" strokeWidth="0.7" opacity={d.op}
            initial={{ y: '-100%' }} animate={{ y: '120%' }}
            transition={{ delay: d.delay, duration: d.dur, repeat: Infinity, ease: 'linear' }} />
        ))}
      </svg>
    </motion.div>
  );
}

// ─── LIGHTNING ─────────────────────────────────────────────────────────
export function Lightning({ flash }: { flash: boolean }) {
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-[18]"
      animate={{ opacity: flash ? 1 : 0 }} transition={{ duration: 0.06 }}
      style={{ background: 'rgba(180,120,255,0.28)' }} />
  );
}

// ─── SILHOUETTE — detailed anatomical paths ────────────────────────────
// All paths in a -40,-70 → 40,45 coordinate space
const SIL: Record<string, string> = {
  standing: `
    M0,-60 C-10,-60 -13,-50 -13,-44 C-13,-37 -9,-30 0,-29 C9,-30 13,-37 13,-44 C13,-50 10,-60 0,-60 Z
    M-14,-28 C-22,-24 -24,-14 -22,-4 L-20,14 C-16,18 0,20 20,14 L22,-4 C24,-14 22,-24 14,-28 Z
    M-20,14 L-24,44 L-14,44 L-10,14 Z
    M20,14 L24,44 L14,44 L10,14 Z
    M-22,-4 L-36,18 L-28,22 L-16,0 Z
    M22,-4 L36,18 L28,22 L16,0 Z`,
  hunched: `
    M-4,-58 C-14,-58 -17,-48 -16,-42 C-15,-36 -10,-30 -2,-29 C7,-29 14,-35 14,-42 C14,-49 10,-58 -4,-58 Z
    M-15,-28 C-24,-20 -26,-8 -22,2 L-20,16 C-14,22 4,22 22,14 L24,-2 C26,-14 20,-24 12,-28 Z
    M-20,16 L-22,44 L-12,44 L-8,16 Z
    M20,14 L22,44 L12,44 L10,14 Z
    M-22,2 L-38,16 L-42,28 L-32,28 L-18,10 Z
    M24,-2 L38,12 L42,24 L32,24 L18,6 Z`,
  sitting: `
    M0,-58 C-10,-58 -13,-48 -13,-42 C-13,-35 -9,-28 0,-27 C9,-28 13,-35 13,-42 C13,-48 10,-58 0,-58 Z
    M-13,-26 C-21,-22 -22,-12 -20,-2 L-18,12 C-12,16 12,16 18,12 L20,-2 C22,-12 21,-22 13,-26 Z
    M-18,12 L-30,28 L-30,38 L-12,38 L-10,12 Z
    M18,12 L30,28 L30,38 L12,38 L10,12 Z
    M-20,-2 L-36,12 L-28,16 L-14,4 Z
    M20,-2 L36,12 L28,16 L14,4 Z`,
  walking: `
    M0,-62 C-10,-62 -13,-52 -13,-46 C-13,-39 -9,-32 0,-31 C9,-32 13,-39 13,-46 C13,-52 10,-62 0,-62 Z
    M-13,-30 C-21,-26 -24,-16 -22,-6 L-20,12 C-14,18 14,18 20,12 L22,-6 C24,-16 21,-26 13,-30 Z
    M-20,12 L-28,44 L-16,44 L-8,12 Z
    M20,12 L14,44 L26,44 L28,12 Z
    M-22,-6 L-38,14 L-30,20 L-16,-2 Z
    M22,-6 L38,14 L30,20 L16,-2 Z`,
  doctor: `
    M0,-62 C-11,-62 -15,-51 -15,-45 C-15,-37 -10,-30 0,-29 C10,-30 15,-37 15,-45 C15,-51 11,-62 0,-62 Z
    M-16,-28 C-26,-22 -28,-10 -26,2 L-24,18 C-16,24 16,24 24,18 L26,2 C28,-10 26,-22 16,-28 Z
    M-24,18 L-26,46 L-14,46 L-12,18 Z
    M24,18 L26,46 L14,46 L12,18 Z
    M-26,2 L-40,20 L-32,26 L-18,6 Z
    M26,2 L40,20 L32,26 L18,6 Z`,
};
export type SilhouetteVariant = keyof typeof SIL;

export function Silhouette({ x, y, scale = 1, fill = '#050510', variant = 'standing', show = true, delay = 0 }:
  { x: number; y: number; scale?: number; fill?: string; variant?: SilhouetteVariant; show?: boolean; delay?: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.svg
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%,-50%)', overflow: 'visible', zIndex: 10 }}
          width={80 * scale} height={110 * scale} viewBox="-45 -75 90 130"
          initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
          <path d={SIL[variant]} fill={fill} />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}

// ─── ANIME TEXT REVEAL ─────────────────────────────────────────────────
export function AnimeText({ lines, show, accent = '#ffd700', sub = false, right = false, bottom = '16%', left }: {
  lines: string[]; show: boolean; accent?: string; sub?: boolean; right?: boolean; bottom?: string; left?: string;
}) {
  const posStyle: React.CSSProperties = right
    ? { position: 'absolute', bottom, right: '7%', textAlign: 'right', zIndex: 85, pointerEvents: 'none' }
    : { position: 'absolute', bottom, left: left ?? '50%', transform: left ? 'none' : 'translateX(-50%)',
        textAlign: left ? 'left' : 'center', zIndex: 85, pointerEvents: 'none', width: '88%' };
  return (
    <AnimatePresence>
      {show && (
        <motion.div style={posStyle}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.80, ease: [0.16, 1, 0.3, 1] }}>
          {/* Accent line */}
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ height: '2px', width: 'clamp(36px,6vw,58px)',
              background: accent, marginBottom: '8px',
              ...(right ? { marginLeft: 'auto' } : { margin: '0 auto 8px' }) }} />
          {lines.map((line, i) => (
            <motion.p key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.40, duration: 0.70 }}
              style={{
                fontSize: i === 0 && !sub ? 'clamp(1.45rem,3.5vw,3.0rem)' : 'clamp(0.80rem,1.75vw,1.45rem)',
                fontFamily: 'var(--font-display, Georgia, serif)',
                fontWeight: i === 0 && !sub ? 900 : 300,
                fontStyle: i > 0 || sub ? 'italic' : 'normal',
                color: i === 0 && !sub ? accent : 'rgba(230,215,185,0.90)',
                letterSpacing: i === 0 ? '0.07em' : '0.04em',
                lineHeight: 1.25,
                marginBottom: i < lines.length - 1 ? '5px' : 0,
                textShadow: `0 0 50px ${accent}55, 0 2px 28px rgba(0,0,0,1)`,
              }}>
              {line}
            </motion.p>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── CHAPTER TITLE (cinematic lower-third style) ───────────────────────
export function ChapterTitle({ chapter, title, show }: { chapter: string; title: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div style={{ position: 'absolute', bottom: '18%', left: '7%', zIndex: 85, pointerEvents: 'none' }}
          initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }}
            style={{ fontSize: 'clamp(0.45rem,0.85vw,0.68rem)', letterSpacing: '0.30em',
              color: 'rgba(200,163,64,0.65)', fontFamily: 'monospace', textTransform: 'uppercase',
              marginBottom: '4px' }}>{chapter}</motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ height: '1px', width: 'clamp(60px,10vw,100px)',
              background: 'linear-gradient(to right,rgba(200,163,64,0.70),transparent)', marginBottom: '6px' }} />
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: 'clamp(1.55rem,3.5vw,2.8rem)',
              fontFamily: 'var(--font-display, Georgia, serif)', fontWeight: 900, fontStyle: 'italic',
              color: '#e8d8b0', lineHeight: 1.1,
              textShadow: '0 0 40px rgba(200,163,64,0.40), 0 2px 30px rgba(0,0,0,1)' }}>
            {title}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── RISING SUN ────────────────────────────────────────────────────────
export function RisingSun({ phase }: { phase: 0 | 1 | 2 | 3 }) {
  const sizes = [0, 10, 26, 48];
  const colors = ['transparent', '#c84000', '#ff7a00', '#ffbb00'];
  return (
    <motion.div className="absolute pointer-events-none z-[4]"
      style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
      <motion.div
        animate={{ width: `${sizes[phase]}vw`, height: `${sizes[phase] * 0.6}vw`, background: colors[phase] }}
        transition={{ duration: 2.2, ease: 'easeInOut' }}
        style={{ borderRadius: '50% 50% 0 0',
          boxShadow: phase > 0 ? `0 0 ${sizes[phase] * 5}px ${colors[phase]}99` : 'none' }} />
    </motion.div>
  );
}

// ─── NODE MAP ──────────────────────────────────────────────────────────
const MAP_NODES = [
  { x: 50, y: 48 }, { x: 28, y: 32 }, { x: 70, y: 30 }, { x: 35, y: 62 },
  { x: 65, y: 68 }, { x: 18, y: 50 }, { x: 80, y: 52 }, { x: 50, y: 22 },
  { x: 42, y: 75 }, { x: 72, y: 18 }, { x: 22, y: 70 }, { x: 58, y: 82 },
];
const EDGES = MAP_NODES.flatMap((a, i) =>
  MAP_NODES.slice(i + 1).filter(b => Math.hypot(a.x - b.x, a.y - b.y) < 30).map(b => ({ a, b }))
);
export function NodeMap({ show, phaseCount }: { show: boolean; phaseCount: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute inset-0 pointer-events-none z-[6]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.0 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {EDGES.map((e, idx) => (
              <motion.line key={idx} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
                stroke="rgba(255,180,0,0.38)" strokeWidth="0.32"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: idx * 0.07, duration: 1.0 }} />
            ))}
            {MAP_NODES.slice(0, phaseCount).map((n, i) => (
              <motion.circle key={i} cx={n.x} cy={n.y} r="1.8" fill="#ffd700"
                initial={{ r: 0, opacity: 0 }} animate={{ r: 1.8, opacity: 1 }}
                transition={{ delay: i * 0.14, duration: 0.55 }}
                style={{ filter: 'drop-shadow(0 0 3px #ffd700)' }} />
            ))}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── CINEMATIC CAMERA (Ken Burns / dolly zoom — the Hollywood move) ───
// Wraps any scene in a slow pan + zoom, making static SVG feel like film
export function CinematicCamera({
  children,
  zoom = [1.04, 1.0] as [number, number],
  panX = ['0%', '0%'] as [string, string],
  panY = ['0%', '0%'] as [string, string],
  origin = '50% 55%',
  duration = 15,
  ease = 'linear' as string,
}: {
  children: React.ReactNode;
  zoom?: [number, number];
  panX?: [string, string];
  panY?: [string, string];
  origin?: string;
  duration?: number;
  ease?: string;
}) {
  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, transformOrigin: origin, overflow: 'hidden' }}
      initial={{ scale: zoom[0], x: panX[0], y: panY[0] }}
      animate={{ scale: zoom[1], x: panX[1], y: panY[1] }}
      transition={{ duration, ease }}>
      {children}
    </motion.div>
  );
}

// ─── RAIN DEPTH (3-layer parallax rain — far/mid/near) ─────────────────
export function RainDepth({ show = true }: { show?: boolean }) {
  const far  = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i, x: Math.random() * 112 - 6, delay: Math.random() * 1.6,
    dur: 1.4 + Math.random() * 0.5, len: 5 + Math.random() * 4, op: 0.11 + Math.random() * 0.09,
  })), []);
  const mid  = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 112 - 6, delay: Math.random() * 1.2,
    dur: 0.75 + Math.random() * 0.3, len: 12 + Math.random() * 8, op: 0.22 + Math.random() * 0.12,
  })), []);
  const near = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i, x: Math.random() * 112 - 6, delay: Math.random() * 0.8,
    dur: 0.35 + Math.random() * 0.15, len: 24 + Math.random() * 14, op: 0.38 + Math.random() * 0.18,
  })), []);
  if (!show) return null;
  const renderLayer = (drops: typeof far, blur: string, width: string, offset: number) => (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {drops.map(d => (
        <motion.line key={d.id} x1={`${d.x}%`} y1="-4%" x2={`${d.x - offset}%`} y2={`${d.len - 4}%`}
          stroke="rgba(160,200,240,0.50)" strokeWidth={width} opacity={d.op}
          initial={{ y: '-100%' }} animate={{ y: '120%' }}
          transition={{ delay: d.delay, duration: d.dur, repeat: Infinity, ease: 'linear' }} />
      ))}
    </svg>
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[8]">
      {/* Far — tiny, slow, faint */}
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(0.6px)' }}>
        {renderLayer(far, '0.35', '0.35', 0.8)}
      </div>
      {/* Mid */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {renderLayer(mid, '0.60', '0.60', 1.4)}
      </div>
      {/* Near — large, fast, opaque */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {renderLayer(near, '0.95', '0.95', 2.0)}
      </div>
    </div>
  );
}

// ─── LAMP FLICKER (realistic light flicker animation) ──────────────────
export function LampFlicker({ show = true, children }: { show?: boolean; children: React.ReactNode }) {
  return (
    <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      animate={show ? {
        opacity: [1, 0.88, 1, 0.94, 0.82, 1, 0.96, 1],
      } : { opacity: 0 }}
      transition={show ? {
        duration: 8, times: [0, 0.05, 0.12, 0.30, 0.38, 0.42, 0.72, 1],
        repeat: Infinity, repeatDelay: 6, ease: 'easeInOut',
      } : { duration: 1.8 }}>
      {children}
    </motion.div>
  );
}

// ─── VIGNETTE ──────────────────────────────────────────────────────────
export function Vignette({ strength = 0.72 }: { strength?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[80]"
      style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,${strength}) 100%)` }} />
  );
}

// ─── BOTTOM GRADIENT ───────────────────────────────────────────────────
export function BottomGrad({ color = '2,3,14', strength = 0.95 }: { color?: string; strength?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[81]"
      style={{ background: `linear-gradient(to top, rgba(${color},${strength}) 0%, rgba(${color},0.08) 22%, transparent 42%)` }} />
  );
}
