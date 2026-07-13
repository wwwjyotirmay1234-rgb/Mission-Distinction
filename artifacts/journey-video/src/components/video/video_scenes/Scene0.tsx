import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

const RAIN_DROPS = Array.from({ length: 42 }, (_, i) => ({
  left: `${(i * 2.38 + (i % 7) * 1.4) % 100}%`,
  height: `${48 + (i % 5) * 22}px`,
  duration: 0.5 + (i % 6) * 0.11,
  delay: (i * 0.13) % 2.4,
  opacity: 0.05 + (i % 4) * 0.022,
}));

// Steam wisps rising from coffee mug position
const STEAM_WISPS = Array.from({ length: 4 }, (_, i) => ({
  xOffset: i * 5 - 7,
  duration: 2.2 + i * 0.4,
  delay: i * 0.55,
}));

export function Scene0() {
  const [phase, setPhase] = useState(0);
  const [tick, setTick] = useState(false);

  useSceneSpeech([
    { atPhase: 3, text: 'Exhaustion. Doubt. Fear.' },
    { atPhase: 4, text: 'What if I fail?' },
  ], phase);

  useEffect(() => {
    const tickInterval = setInterval(() => setTick(t => !t), 900);
    const timers = [
      setTimeout(() => setPhase(1), 800),    // scene fades in, rain starts
      setTimeout(() => setPhase(2), 2200),   // spotlight sweep over desk
      // ─── long visual breathing room ───────────────────────────
      setTimeout(() => setPhase(3), 11500),  // Exhaustion. Doubt. Fear.
      setTimeout(() => setPhase(4), 15500),  // "What if I fail?"
      setTimeout(() => setPhase(5), 19500),  // flash out
    ];
    return () => { timers.forEach(clearTimeout); clearInterval(tickInterval); };
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>

      {/* ── PIXAR ILLUSTRATION ─────────────────────── */}
      {/* Slow subtle push-in — 20s to cover full scene */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }} animate={{ scale: 1.0 }} transition={{ duration: 20, ease: 'easeOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/scene0_desk_illustration.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.88) contrast(1.06) saturate(0.92)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic bars — 16:9 letter-box feel */}
      <div className="absolute inset-x-0 top-0 h-[6%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black z-10 pointer-events-none" />

      {/* Gradient — just the bottom third for text legibility later */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.95) 0%, rgba(2,3,12,0.3) 22%, transparent 48%)' }} />

      {/* Subtle top vignette */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, transparent 60%, rgba(0,0,0,0.5) 100%)' }} />

      {/* ── ANIMATED RAIN OVERLAY ──────────────────── */}
      <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
        {RAIN_DROPS.map((drop, i) => (
          <motion.div key={i} className="absolute"
            style={{
              left: drop.left, top: 0,
              width: '1.2px', height: drop.height,
              background: 'linear-gradient(to bottom, transparent, rgba(140,190,255,0.9))',
              borderRadius: '1px', opacity: drop.opacity,
            }}
            animate={{ y: ['0vh', '108vh'] }}
            transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      {/* ── LAMP GLOW — breathing warmth ──────────── */}
      {/* Lamp is in the upper-right area of the Pixar illustration */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          right: '8%', top: '6%',
          width: '38%', height: '55%',
          background: 'radial-gradient(ellipse at 80% 12%, rgba(255,185,65,0.14) 0%, rgba(255,140,30,0.06) 40%, transparent 72%)',
        }}
        animate={{ opacity: [0.75, 1, 0.82, 1, 0.75] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── COFFEE STEAM — mug is lower-right in illustration ── */}
      {phase >= 1 && (
        <div className="absolute z-4 pointer-events-none"
          style={{ right: '15%', bottom: '28%' }}>
          {STEAM_WISPS.map((wisp, i) => (
            <motion.div key={i} className="absolute"
              style={{
                width: '2px', height: '18px',
                background: 'linear-gradient(to top, rgba(255,255,255,0.18), transparent)',
                borderRadius: '2px',
                left: `${wisp.xOffset}px`,
              }}
              animate={{
                y: [0, -28, -52],
                x: [0, wisp.xOffset * 0.6, wisp.xOffset * 0.3],
                opacity: [0, 0.28, 0],
                scaleX: [0.8, 1.4, 0.5],
              }}
              transition={{ duration: wisp.duration, delay: wisp.delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      {/* ── DESK SCAN LIGHT — sweeps across desk items at phase 2 ── */}
      {/* A very subtle horizontal shimmer that draws the eye across the scattered books */}
      {phase >= 2 && (
        <motion.div className="absolute pointer-events-none z-3"
          style={{
            bottom: '18%', left: 0,
            width: '100%', height: '28%',
            background: 'linear-gradient(to right, transparent 0%, rgba(255,200,100,0.04) 40%, rgba(255,220,130,0.07) 50%, rgba(255,200,100,0.04) 60%, transparent 100%)',
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.5, ease: 'easeInOut', delay: 0 }}
        />
      )}

      {/* ── CLOCK DIGIT PULSE — 2:17 AM already in illustration ── */}
      {/* Add a subtle red glow pulsing at the clock position (lower-left) */}
      {phase >= 1 && (
        <motion.div className="absolute pointer-events-none z-4"
          style={{
            left: '8%', bottom: '32%',
            width: '9%', height: '8%',
            background: 'radial-gradient(ellipse, rgba(255,30,10,0.18) 0%, transparent 70%)',
          }}
          animate={{ opacity: tick ? 0.9 : 0.2 }}
          transition={{ duration: 0.1 }}
        />
      )}

      {/* ── EMOTIONAL TEXT — only two punches, nothing else ────── */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-[10%] px-[10vw]">
        <div className="text-center w-full">

          {/* Three words — staggered, spaced wide apart */}
          {phase >= 3 && phase < 4 && (
            <motion.div
              className="flex items-end justify-center gap-[5vw]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              {[
                { w: 'Exhaustion.', c: 'rgba(255,255,255,0.55)' },
                { w: 'Doubt.', c: 'rgba(255,255,255,0.45)' },
                { w: 'Fear.', c: 'rgba(220,80,60,0.75)' },
              ].map(({ w, c }, i) => (
                <WordReveal key={w} text={w} startDelay={i * 0.5} wordInterval={0.1}
                  style={{
                    fontSize: '3vw', fontWeight: 300,
                    fontFamily: 'var(--font-display, serif)',
                    color: c, letterSpacing: '0.12em',
                    textShadow: '0 2px 20px rgba(0,0,0,0.9)',
                  }} />
              ))}
            </motion.div>
          )}

          {/* THE big question — fills the screen */}
          {phase >= 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
              <WordReveal text='"What if I fail?"' startDelay={0.1} wordInterval={0.22}
                style={{
                  fontSize: '8.5vw',
                  fontFamily: 'var(--font-display, serif)',
                  color: '#C8A340',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 100px rgba(200,163,64,0.55), 0 4px 40px rgba(0,0,0,0.9)',
                  lineHeight: 1,
                  display: 'block',
                }} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Flash transition */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.22 }} />
    </motion.div>
  );
}
