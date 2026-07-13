import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useId } from 'react';

// ─────────────────────────── STAR FIELD ──────────────────────────────
export function StarField({ count = 90, show = true }: { count?: number; show?: boolean }) {
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 85,
      r: Math.random() * 1.6 + 0.4,
      delay: Math.random() * 5, dur: Math.random() * 3 + 2,
    })), [count]);
  return (
    <motion.div className="absolute inset-0 pointer-events-none"
      animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1.5 }}>
      <svg width="100%" height="100%">
        {stars.map(s => (
          <motion.circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0.3, 0.85] }}
            transition={{ delay: s.delay, duration: s.dur, repeat: Infinity, repeatType: 'mirror' }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ─────────────────────────── SPEED LINES ─────────────────────────────
export function SpeedLines({ active, color = 'rgba(255,215,0,0.75)', count = 28, cx = 50, cy = 50 }:
  { active: boolean; color?: string; count?: number; cx?: number; cy?: number }) {
  const id = useId();
  const lines = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = ((360 / count) * i + (Math.random() * 8 - 4)) * (Math.PI / 180);
    const len = 30 + Math.random() * 40;
    return { id: i, x2: cx + Math.cos(angle) * len, y2: cy + Math.sin(angle) * len, op: 0.5 + Math.random() * 0.5 };
  }), [count, cx, cy]);
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-[14]"
      initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.08 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map(l => (
          <motion.line key={`${id}-${l.id}`}
            x1={cx} y1={cy} x2={l.x2} y2={l.y2}
            stroke={color} strokeWidth="0.45" opacity={l.op}
            initial={{ pathLength: 0 }} animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ──────────────────── FLOATING PARTICLES ─────────────────────────────
export function FloatingParticles({ count = 18, color = '#ffd700', active = true }:
  { count?: number; color?: string; active?: boolean }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 90 + 5, size: Math.random() * 5 + 3,
    delay: Math.random() * 4, dur: Math.random() * 5 + 5,
    dx: (Math.random() - 0.5) * 80,
  })), [count]);
  return (
    <AnimatePresence>
      {active && particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size, left: `${p.x}%`, bottom: '-8px',
            background: color, boxShadow: `0 0 ${p.size * 2.5}px ${color}88`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, -600], opacity: [0, 0.9, 0.9, 0], x: [0, p.dx] }}
          transition={{ delay: p.delay, duration: p.dur, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </AnimatePresence>
  );
}

// ─────────────────────────── CITY LIGHTS ─────────────────────────────
export function CityLights({ count = 70, opacity = 0.75, color = '#ffaa30' }:
  { count?: number; opacity?: number; color?: string }) {
  const lights = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: (i / count) * 102 - 1 + (Math.random() - 0.5) * 2.5,
    y: 88 + Math.random() * 10, r: Math.random() * 2.5 + 0.8,
    flicker: Math.random() > 0.72, delay: Math.random() * 6,
  })), [count]);
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg width="100%" height="100%">
        <defs>
          <filter id="lightBlur"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>
        {lights.map(l => (
          <motion.circle key={l.id} cx={`${l.x}%`} cy={`${l.y}%`} r={l.r}
            fill={color} filter="url(#lightBlur)"
            animate={l.flicker ? { opacity: [opacity, opacity * 0.35, opacity] } : { opacity }}
            transition={l.flicker ? { delay: l.delay, duration: 1.4 + Math.random(), repeat: Infinity } : {}}
          />
        ))}
      </svg>
    </div>
  );
}

// ────────────────────────────── RAIN ─────────────────────────────────
export function Rain({ intensity = 45, show = true }: { intensity?: number; show?: boolean }) {
  const drops = useMemo(() => Array.from({ length: intensity }, (_, i) => ({
    id: i, x: Math.random() * 110 - 5, delay: Math.random() * 1.5,
    dur: Math.random() * 0.5 + 0.4, len: Math.random() * 14 + 8,
  })), [intensity]);
  return (
    <motion.div className="absolute inset-0 pointer-events-none overflow-hidden"
      animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.6 }}>
      <svg width="100%" height="100%">
        {drops.map(d => (
          <motion.line key={d.id}
            x1={`${d.x}%`} y1="-5%" x2={`${d.x - 1.5}%`} y2={`${d.len - 5}%`}
            stroke="rgba(120,170,220,0.38)" strokeWidth="0.7"
            initial={{ y: '-100%' }}
            animate={{ y: '120%' }}
            transition={{ delay: d.delay, duration: d.dur, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ──────────────────────── LIGHTNING FLASH ────────────────────────────
export function Lightning({ flash }: { flash: boolean }) {
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-[18]"
      animate={{ opacity: flash ? 1 : 0 }} transition={{ duration: 0.06 }}
      style={{ background: 'rgba(170,100,255,0.30)' }}
    />
  );
}

// ──────────────────────── HUMAN SILHOUETTE ───────────────────────────
const SILHOUETTE_PATHS = {
  standing: 'M0,-36 a8,10 0 1,1 0.01,0 M-12,-18 Q0,-15 12,-18 L14,12 Q0,16 -14,12 Z M-12,-13 L-23,11 L-17,11 L-9,-7 Z M12,-13 L23,11 L17,11 L9,-7 Z M-8,12 L-10,40 L-4,40 L-2,12 Z M8,12 L10,40 L4,40 L2,12 Z',
  sitting:  'M0,-34 a8,10 0 1,1 0.01,0 M-12,-16 Q0,-13 12,-16 L13,10 Q0,14 -13,10 Z M-12,-12 L-22,7 L-16,8 L-8,-5 Z M12,-12 L22,7 L16,8 L8,-5 Z M-8,10 L-20,22 L-20,29 L-1,29 Z M8,10 L20,22 L20,29 L1,29 Z',
  hunched:  'M-3,-33 a8,10 0 1,1 0.01,0 M-14,-12 Q-2,-7 10,-15 L8,10 Q-4,14 -16,8 Z M-14,-10 L-22,6 L-16,7 L-8,-5 Z M10,-12 L22,6 L16,7 L8,-4 Z M-9,10 L-11,35 L-5,35 L-3,10 Z M7,10 L9,35 L3,35 L1,10 Z',
  walking:  'M2,-36 a8,10 0 1,1 0.01,0 M-11,-18 Q1,-15 13,-18 L14,10 Q0,14 -13,10 Z M-11,-14 L-21,9 L-15,10 L-7,-7 Z M13,-14 L25,8 L19,9 L9,-7 Z M-8,10 L-14,39 L-8,39 L-3,10 Z M8,10 L15,39 L9,39 L3,10 Z',
  doctor:   'M0,-36 a8,10 0 1,1 0.01,0 M-14,-18 Q0,-15 14,-18 L18,14 Q0,18 -18,14 Z M-14,-12 L-26,12 L-20,12 L-10,-6 Z M14,-12 L26,12 L20,12 L10,-6 Z M-9,14 L-11,42 L-5,42 L-2,14 Z M9,14 L11,42 L5,42 L2,14 Z',
};

export type SilhouetteVariant = keyof typeof SILHOUETTE_PATHS;

export function Silhouette({ x, y, scale = 1, fill = '#050510', variant = 'standing', show = true, delay = 0 }:
  { x: number; y: number; scale?: number; fill?: string; variant?: SilhouetteVariant; show?: boolean; delay?: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.svg
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', overflow: 'visible', zIndex: 8 }}
          width={60 * scale} height={85 * scale} viewBox="-32 -60 64 90"
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
          <path d={SILHOUETTE_PATHS[variant]} fill={fill} />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────── ANIME TEXT REVEAL ───────────────────────────
export function AnimeText({ lines, show, accent = '#ffd700', sub = false, right = false, bottom = '14%', left }: {
  lines: string[]; show: boolean; accent?: string; sub?: boolean; right?: boolean; bottom?: string; left?: string;
}) {
  const posStyle: React.CSSProperties = right
    ? { position: 'absolute', bottom, right: '7%', textAlign: 'right', zIndex: 22, pointerEvents: 'none' }
    : { position: 'absolute', bottom, left: left ?? '50%', transform: left ? 'none' : 'translateX(-50%)', textAlign: left ? 'left' : 'center', zIndex: 22, pointerEvents: 'none', width: '90%' };
  return (
    <AnimatePresence>
      {show && (
        <motion.div style={posStyle}
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
          {lines.map((line, i) => (
            <motion.p key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.42, duration: 0.65 }}
              style={{
                fontSize: i === 0 && !sub
                  ? 'clamp(1.6rem,3.8vw,3.2rem)'
                  : 'clamp(0.95rem,2.0vw,1.65rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: i === 0 && !sub ? 900 : 300,
                fontStyle: i > 0 || sub ? 'italic' : 'normal',
                color: i === 0 && !sub ? accent : 'rgba(230,210,170,0.88)',
                letterSpacing: i === 0 ? '0.06em' : '0.03em',
                lineHeight: 1.3,
                marginBottom: i < lines.length - 1 ? '6px' : 0,
                textShadow: `0 0 40px ${accent}44, 0 2px 32px rgba(0,0,0,0.98)`,
              }}>
              {line}
            </motion.p>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────── RISING SUN ──────────────────────────────────
export function RisingSun({ phase }: { phase: 0 | 1 | 2 | 3 }) {
  const sizes = [0, 8, 22, 40];
  const colors = ['transparent', '#c84000', '#ff7200', '#ffb700'];
  return (
    <motion.div className="absolute pointer-events-none z-[4]"
      style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
      <motion.div
        animate={{ width: `${sizes[phase]}vw`, height: `${sizes[phase] / 2}vw`, background: colors[phase] }}
        transition={{ duration: 2.0, ease: 'easeInOut' }}
        style={{ borderRadius: '50% 50% 0 0', boxShadow: phase > 0 ? `0 0 ${sizes[phase] * 4}px ${colors[phase]}88` : 'none' }}
      />
    </motion.div>
  );
}

// ─────────────────── NETWORK NODE MAP ────────────────────────────────
const MAP_NODES = [
  { x: 50, y: 48 }, { x: 28, y: 32 }, { x: 70, y: 30 }, { x: 35, y: 62 },
  { x: 65, y: 68 }, { x: 18, y: 50 }, { x: 80, y: 52 }, { x: 50, y: 22 },
  { x: 42, y: 75 }, { x: 72, y: 18 }, { x: 22, y: 70 }, { x: 58, y: 82 },
];
const EDGES = MAP_NODES.flatMap((a, i) =>
  MAP_NODES.slice(i + 1).filter(b => Math.hypot(a.x - b.x, a.y - b.y) < 30).map(b => ({ a, b, i }))
);
export function NodeMap({ show, phaseCount }: { show: boolean; phaseCount: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute inset-0 pointer-events-none z-[6]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {EDGES.map((e, idx) => (
              <motion.line key={idx}
                x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
                stroke="rgba(255,180,0,0.35)" strokeWidth="0.3"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: idx * 0.06, duration: 0.9 }}
              />
            ))}
            {MAP_NODES.slice(0, phaseCount).map((n, i) => (
              <motion.circle key={i} cx={n.x} cy={n.y} r="1.6" fill="#ffd700"
                initial={{ r: 0, opacity: 0 }} animate={{ r: 1.6, opacity: 1 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                style={{ filter: 'drop-shadow(0 0 3px #ffd700)' }}
              />
            ))}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ───────────────────── VIGNETTE (reusable) ───────────────────────────
export function Vignette({ strength = 0.65 }: { strength?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[5]"
      style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,${strength}) 100%)` }}
    />
  );
}

// ───────────────── BOTTOM GRADIENT ───────────────────────────────────
export function BottomGrad({ color = '2,3,14', strength = 0.92 }: { color?: string; strength?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[6]"
      style={{ background: `linear-gradient(to top, rgba(${color},${strength}) 0%, rgba(${color},0.12) 24%, transparent 46%)` }}
    />
  );
}
