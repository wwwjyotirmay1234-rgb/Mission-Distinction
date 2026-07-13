import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// Odisha cities — normalized to SVG viewBox 0 0 100 100
const CITIES = [
  { id: 'rourkela',    x: 16, y: 20, delay: 1.2 },
  { id: 'sambalpur',  x: 24, y: 32, delay: 1.5 },
  { id: 'keonjhar',   x: 50, y: 17, delay: 1.8 },
  { id: 'bolangir',   x: 21, y: 50, delay: 2.1 },
  { id: 'angul',      x: 46, y: 36, delay: 2.4 },
  { id: 'kalahandi',  x: 25, y: 64, delay: 2.7 },
  { id: 'balasore',   x: 72, y: 20, delay: 3.0 },
  { id: 'dhenkanal',  x: 56, y: 32, delay: 3.3 },
  { id: 'cuttack',    x: 64, y: 38, delay: 3.6 },
  { id: 'bhubaneswar',x: 66, y: 49, delay: 3.9 },
  { id: 'koraput',    x: 32, y: 74, delay: 4.2 },
  { id: 'puri',       x: 70, y: 60, delay: 4.5 },
  { id: 'brahmapur',  x: 68, y: 71, delay: 4.8 },
];

const CONNECTIONS: [string, string, number][] = [
  ['rourkela',    'sambalpur',    2.0],
  ['sambalpur',   'angul',        2.6],
  ['sambalpur',   'bolangir',     2.8],
  ['keonjhar',    'balasore',     3.2],
  ['keonjhar',    'angul',        3.4],
  ['angul',       'dhenkanal',    3.6],
  ['dhenkanal',   'cuttack',      3.9],
  ['balasore',    'cuttack',      4.0],
  ['cuttack',     'bhubaneswar',  4.2],
  ['bhubaneswar', 'dhenkanal',    4.4],
  ['bhubaneswar', 'puri',         4.6],
  ['bolangir',    'kalahandi',    4.8],
  ['kalahandi',   'koraput',      5.0],
  ['puri',        'brahmapur',    5.2],
  ['koraput',     'brahmapur',    5.4],
];

// Floating firefly particles
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  x: 6 + (i * 2.9 + (i % 7) * 1.3) % 88,
  y: 15 + (i * 4.1) % 65,
  delay: 2.8 + i * 0.18,
  dur: 2.8 + (i % 6) * 0.5,
  size: 0.3 + (i % 4) * 0.2,
}));

// Rough Odisha state boundary (SVG polygon, 0-100 normalized)
const ODISHA_PATH =
  'M 8,22 L 14,10 L 24,5 L 40,4 L 54,8 L 64,13 L 74,18 ' +
  'L 80,28 L 81,38 L 80,48 L 77,58 L 73,66 L 68,74 ' +
  'L 60,82 L 48,86 L 36,86 L 24,83 L 14,76 L 7,66 ' +
  'L 4,53 L 4,40 L 6,30 Z';

type Phase = 'bg' | 'network' | 'title' | 'final';

export function SceneEpicFinal() {
  const [phase, setPhase] = useState<Phase>('bg');
  const builtTimers = useRef(false);

  useSceneSpeech([
    { atPhase: 0, text: 'Five students. One dream. Thousands of lives changed.' },
  ], 0);

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase('network'), 900));
    t.push(setTimeout(() => setPhase('title'), 6500));
    t.push(setTimeout(() => setPhase('final'), 8800));
    return () => t.forEach(clearTimeout);
  }, []);

  const cityMap = Object.fromEntries(CITIES.map(c => [c.id, c]));

  return (
    <motion.div className="absolute inset-0 bg-black overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}>

      {/* ── BACKGROUND: rooftop silhouette fades to dark sky ── */}
      <motion.div className="absolute inset-0 z-0"
        animate={{ opacity: phase === 'bg' ? 0.85 : 0.15 }}
        transition={{ duration: 3.0, ease: 'easeInOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/group_silhouette.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.45) saturate(0.5)' }}
          alt=""
        />
      </motion.div>

      {/* ── NIGHT SKY gradient ── */}
      <motion.div className="absolute inset-0 z-1 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'bg' ? 1 : 0 }}
        transition={{ duration: 2.2 }}
        style={{
          background:
            'radial-gradient(ellipse at 55% 35%, #0d1b3e 0%, #080d1e 50%, #020408 100%)',
        }} />

      {/* ── STAR FIELD ── */}
      {Array.from({ length: 55 }, (_, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none z-2"
          style={{
            left: `${(i * 1.82 + (i % 11) * 0.9) % 100}%`,
            top: `${(i * 2.13 + (i % 7) * 1.1) % 55}%`,
            width: `${1 + (i % 3) * 0.5}px`,
            height: `${1 + (i % 3) * 0.5}px`,
            background: 'rgba(255,255,255,0.7)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase !== 'bg' ? [0.2, 0.9, 0.4, 0.8, 0.3] : 0 }}
          transition={{ duration: 2.5 + (i % 5) * 0.6, delay: 1.2 + i * 0.04, repeat: Infinity, repeatType: 'mirror' }}
        />
      ))}

      {/* ── SVG GOLDEN NETWORK ── */}
      <motion.div className="absolute inset-0 z-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'bg' ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.4 }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>

          {/* Odisha state boundary */}
          <motion.path
            d={ODISHA_PATH}
            fill="rgba(200,163,64,0.04)"
            stroke="rgba(200,163,64,0.35)"
            strokeWidth="0.35"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, delay: 0.8, ease: 'easeInOut' }}
          />

          {/* Connection lines drawing in */}
          {CONNECTIONS.map(([fromId, toId, delay], idx) => {
            const from = cityMap[fromId];
            const to = cityMap[toId];
            if (!from || !to) return null;
            return (
              <motion.path
                key={idx}
                d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                fill="none"
                stroke="rgba(200,163,64,0.55)"
                strokeWidth="0.22"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 0.8, 0.55] }}
                transition={{ duration: 0.9, delay, ease: 'easeOut' }}
              />
            );
          })}

          {/* Pulse travel dots along key lines */}
          {CONNECTIONS.slice(0, 8).map(([fromId, toId, delay], idx) => {
            const from = cityMap[fromId];
            const to = cityMap[toId];
            if (!from || !to) return null;
            return (
              <motion.circle
                key={`pulse-${idx}`}
                r="0.6"
                fill="rgba(255,220,80,0.9)"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  cx: [from.x, to.x],
                  cy: [from.y, to.y],
                }}
                transition={{
                  duration: 1.2,
                  delay: delay + 0.9,
                  repeat: Infinity,
                  repeatDelay: 3.5 + idx * 0.4,
                  ease: 'easeInOut',
                }}
              />
            );
          })}

          {/* City nodes */}
          {CITIES.map(city => (
            <g key={city.id}>
              {/* Outer slow ripple */}
              <motion.circle
                cx={city.x} cy={city.y} r={2.5}
                fill="none"
                stroke="rgba(200,163,64,0.35)"
                strokeWidth="0.25"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 2.8, 1], opacity: [0.7, 0, 0.7] }}
                transition={{
                  duration: 2.4,
                  delay: city.delay,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                style={{ transformOrigin: `${city.x}px ${city.y}px` }}
              />
              {/* Second ripple (offset) */}
              <motion.circle
                cx={city.x} cy={city.y} r={1.8}
                fill="none"
                stroke="rgba(255,210,60,0.3)"
                strokeWidth="0.2"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{
                  duration: 2.4,
                  delay: city.delay + 0.6,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                style={{ transformOrigin: `${city.x}px ${city.y}px` }}
              />
              {/* Core glow */}
              <motion.circle
                cx={city.x} cy={city.y} r={1.2}
                fill="rgba(200,163,64,0.3)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.25, 0.5] }}
                transition={{
                  duration: 1.8,
                  delay: city.delay + 0.1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: `${city.x}px ${city.y}px` }}
              />
              {/* Core dot */}
              <motion.circle
                cx={city.x} cy={city.y} r={0.65}
                fill="rgba(255,215,80,1)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: city.delay, ease: 'backOut' }}
              />
            </g>
          ))}

          {/* Rising firefly particles */}
          {PARTICLES.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              r={p.size}
              fill="rgba(200,163,64,0.75)"
              initial={{ cy: p.y, opacity: 0 }}
              animate={{ cy: [p.y, p.y - 30], opacity: [0, 0.85, 0] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* ── AMBIENT GOLDEN HAZE over map ── */}
      <motion.div className="absolute pointer-events-none z-8"
        style={{
          left: '20%', top: '15%', width: '58%', height: '70%',
          background:
            'radial-gradient(ellipse at 55% 50%, rgba(200,163,64,0.07) 0%, transparent 68%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'bg' ? [0, 1, 0.6, 1, 0.7] : 0 }}
        transition={{ duration: 5, delay: 2.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      />

      {/* ── TITLE: MISSION DISTINCTION ── */}
      <AnimatePresence>
        {(phase === 'title' || phase === 'final') && (
          <motion.div
            key="title"
            className="absolute z-30 w-full text-center pointer-events-none"
            style={{ bottom: '26%' }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
            <p style={{
              fontFamily: 'var(--font-display, serif)',
              fontSize: 'clamp(1.6rem, 5.5vw, 4.5rem)',
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#C8A340',
              textShadow:
                '0 0 80px rgba(200,163,64,0.7), 0 0 160px rgba(200,163,64,0.3), 0 4px 48px rgba(0,0,0,0.98)',
            }}>
              MISSION DISTINCTION
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUBTITLE ── */}
      <AnimatePresence>
        {phase === 'final' && (
          <motion.div
            key="subtitle"
            className="absolute z-30 w-full text-center pointer-events-none"
            style={{ bottom: '19%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, delay: 0.5 }}>
            <p className="font-mono" style={{
              fontSize: 'clamp(0.6rem, 1.4vw, 1.1rem)',
              letterSpacing: '0.44em',
              color: 'rgba(255,255,255,0.58)',
              textTransform: 'uppercase',
              textShadow: '0 2px 20px rgba(0,0,0,0.98)',
            }}>
              By Students. For Students.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient */}
      <div className="absolute inset-0 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, transparent 42%)' }} />
    </motion.div>
  );
}
