import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

type Frame = {
  src: string;
  dur: number;
  caption: string;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
  show500: boolean;         // "500 Downloads" card
  celebrationGlow: boolean; // warm gold overlay
  isMap: boolean;           // Odisha connected frame
  isFuture: boolean;        // app expanding frame
};

const FRAMES: Frame[] = [
  {
    // 1 — Three weeks later — founder sees 500
    src: 'char_s5_launch_moment.png', dur: 2500,
    caption: 'Three weeks later.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', show500: true, celebrationGlow: false, isMap: false, isFuture: false,
  },
  {
    // 2 — Team reaction — stunned silence
    src: 'group_celebration.png', dur: 3000,
    caption: '500 downloads.',
    initial: { scale: 1.07, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: false, isFuture: false,
  },
  {
    // 3 — Celebration — hugs, laughter
    src: 'group_celebration.png', dur: 3000,
    caption: 'The celebration we dreamed of.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'flash', show500: false, celebrationGlow: true, isMap: false, isFuture: false,
  },
  {
    // 4 — Across Odisha — students everywhere
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'Across Odisha. One mission.',
    initial: { scale: 1.05, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: false, isFuture: false,
  },
  {
    // 5 — Student success — exam hall
    src: 's1_shot_g_determination.png', dur: 3000,
    caption: 'From confusion to confidence.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: false, isFuture: false,
  },
  {
    // 6 — Ripple effect — students helping each other
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'Students helping students. A community growing stronger.',
    initial: { scale: 1.05, x: '-0.5%' }, animate: { scale: 1.0, x: '0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: false, isFuture: false,
  },
  {
    // 7 — Odisha connected — aerial map, golden lines
    src: 'scene6_ripple_odisha.png', dur: 3500,
    caption: 'Odisha connected. Knowledge without boundaries.',
    initial: { scale: 1.10, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: true, isFuture: false,
  },
  {
    // 8 — Founders reflect — rooftop sunset
    src: 'group_silhouette.png', dur: 3000,
    caption: 'They came this far. But the journey has just begun.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: false, isFuture: false,
  },
  {
    // 9 — The future — app expanding
    src: 'scene5_launch_day.png', dur: 2500,
    caption: 'More features. More students. More impact. The future is limitless.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: false, isFuture: true,
  },
  {
    // 10 — FINAL OSCAR SHOT — rooftop, city of lights, text
    src: 'group_silhouette.png', dur: 5000,
    caption: '',
    initial: { scale: 1.10, y: '1.0%' }, animate: { scale: 1.0, y: '-0.8%' },
    transition: { duration: 7.0, ease: 'easeOut' },
    cutType: 'dissolve', show500: false, celebrationGlow: false, isMap: false, isFuture: false,
  },
];

// Odisha city nodes for the map frame
const CITY_NODES = [
  { city: 'BHUBANESWAR', x: 70, y: 60 },
  { city: 'CUTTACK',     x: 72, y: 50 },
  { city: 'SAMBALPUR',   x: 30, y: 35 },
  { city: 'BERHAMPUR',   x: 68, y: 78 },
  { city: 'ROURKELA',    x: 20, y: 18 },
  { city: 'BALANGIR',    x: 38, y: 52 },
  { city: 'KORAPUT',     x: 48, y: 82 },
  { city: 'SUNDARGARH',  x: 22, y: 28 },
  { city: 'DEOGARH',     x: 38, y: 32 },
  { city: 'BARIPADA',    x: 80, y: 20 },
];

export function SceneMovement() {
  const [frameIndex, setFrameIndex]     = useState(0);
  const [flashActive, setFlashActive]   = useState(false);
  const [showCaption, setShowCaption]   = useState(true);
  const [showFinalText, setShowFinalText] = useState(false);
  const [nodePulse, setNodePulse]       = useState(false);
  const builtTimers = useRef(false);

  const current = FRAMES[frameIndex];
  const isLast  = frameIndex === FRAMES.length - 1;

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;

    let cursor = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    FRAMES.forEach((frame, i) => {
      const t = cursor;

      if (i > 0) {
        if (frame.cutType === 'flash') {
          timers.push(setTimeout(() => {
            setFlashActive(true);
            setShowCaption(false);
            setNodePulse(false);
            setTimeout(() => {
              setFlashActive(false);
              setFrameIndex(i);
              setTimeout(() => setShowCaption(true), 80);
            }, 120);
          }, t));
        } else {
          timers.push(setTimeout(() => {
            setShowCaption(false);
            setNodePulse(false);
            setTimeout(() => {
              setFrameIndex(i);
              setTimeout(() => setShowCaption(true), 120);
            }, 200);
          }, t));
        }
      }

      // trigger map node pulse when map frame starts
      if (frame.isMap) {
        timers.push(setTimeout(() => setNodePulse(true), t + 600));
      }

      cursor += frame.dur;
    });

    // Final text 2s into last frame
    const lastStart = FRAMES.slice(0, FRAMES.length - 1).reduce((s, f) => s + f.dur, 0);
    timers.push(setTimeout(() => setShowFinalText(true), lastStart + 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}>

      {/* ── ALL FRAMES ── */}
      {FRAMES.map((frame, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: frameIndex === i ? 1 : 0 }}
          transition={{ duration: frame.cutType === 'flash' ? 0.08 : 0.70, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={frame.initial}
            animate={frameIndex === i ? frame.animate : frame.initial}
            transition={frameIndex === i ? frame.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${frame.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: i === 9
                  ? 'brightness(0.78) contrast(1.10) saturate(0.90)'   // dark final rooftop
                  : i === 2
                    ? 'brightness(0.95) contrast(1.02) saturate(1.10)' // bright celebration
                    : 'brightness(0.86) contrast(1.05) saturate(0.95)',
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── 500 DOWNLOADS CARD — frame 1 ── */}
      <AnimatePresence>
        {current.show500 && (
          <motion.div key="500-card"
            className="absolute pointer-events-none z-[18]"
            style={{ top: '17%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, scale: 0.80, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <p style={{
              fontSize: 'clamp(0.5rem, 0.9vw, 0.7rem)',
              letterSpacing: '0.28em',
              color: 'rgba(140,170,255,0.65)',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              textShadow: '0 0 14px rgba(80,120,255,0.4)',
            }}>Downloads</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              style={{
                fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                fontFamily: 'monospace',
                fontWeight: 900,
                color: 'rgba(80,220,130,0.96)',
                lineHeight: 0.95,
                textShadow: '0 0 60px rgba(60,200,100,0.65), 0 0 30px rgba(60,200,100,0.35), 0 2px 30px rgba(0,0,0,0.98)',
              }}>500</motion.p>
            {/* tiny graph tick */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              style={{
                fontSize: 'clamp(0.5rem, 0.85vw, 0.65rem)',
                color: 'rgba(80,200,120,0.55)',
                fontFamily: 'monospace',
                letterSpacing: '0.18em',
              }}>▲ ALL TIME</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CELEBRATION GOLD OVERLAY — frame 3 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,190,50,0.20) 0%, rgba(255,140,30,0.08) 48%, transparent 72%)',
        }}
        animate={{ opacity: current.celebrationGlow ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* ── ODISHA MAP OVERLAY — frame 7 ── */}
      <AnimatePresence>
        {current.isMap && nodePulse && (
          <motion.div key="odisha-map"
            className="absolute inset-0 pointer-events-none z-[12]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* connection lines between nodes */}
              {CITY_NODES.map((from, fi) =>
                CITY_NODES.slice(fi + 1).map((to, ti) => {
                  const dist = Math.hypot(from.x - to.x, from.y - to.y);
                  if (dist > 38) return null;
                  return (
                    <motion.line key={`${fi}-${ti}`}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="rgba(200,163,64,0.35)"
                      strokeWidth="0.3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: fi * 0.08 + ti * 0.05, duration: 0.8 }}
                    />
                  );
                })
              )}
              {/* city dot nodes */}
              {CITY_NODES.map((node, i) => (
                <motion.circle key={node.city}
                  cx={node.x} cy={node.y} r="1.1"
                  fill="rgba(200,163,64,0.90)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.6, 1], opacity: 1 }}
                  transition={{ delay: i * 0.10, duration: 0.6 }}
                  style={{ filter: 'drop-shadow(0 0 2px rgba(200,163,64,0.8))' }}
                />
              ))}
            </svg>
            {/* city labels */}
            {CITY_NODES.map((node, i) => (
              <motion.span key={node.city}
                className="absolute"
                style={{
                  left: `${node.x + 1.5}%`,
                  top: `${node.y - 2.5}%`,
                  fontSize: 'clamp(0.35rem, 0.65vw, 0.55rem)',
                  color: 'rgba(200,163,64,0.75)',
                  letterSpacing: '0.14em',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  textShadow: '0 0 8px rgba(0,0,0,0.9)',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}>
                {node.city}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FUTURE GLOW — frame 9 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(80,140,255,0.16) 0%, rgba(40,80,200,0.06) 50%, transparent 75%)',
        }}
        animate={{ opacity: current.isFuture ? 1 : 0 }}
        transition={{ duration: 1.0 }}
      />

      {/* ── CINEMATIC GRADIENT ── */}
      <div className="absolute inset-0 z-[6] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.92) 0%, rgba(2,3,12,0.14) 22%, transparent 44%)' }}
      />

      {/* ── PER-FRAME CAPTION ── */}
      <AnimatePresence mode="wait">
        {showCaption && current.caption && !isLast && (
          <motion.p
            key={`caption-${frameIndex}`}
            className="absolute pointer-events-none z-[20] font-serif italic"
            style={{
              bottom: '15%',
              left: '7%',
              maxWidth: '55%',
              fontSize: 'clamp(0.82rem, 1.7vw, 1.35rem)',
              color: 'rgba(220,200,150,0.82)',
              letterSpacing: '0.04em',
              lineHeight: 1.5,
              textShadow: '0 2px 24px rgba(0,0,0,0.95)',
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}>
            {current.caption}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── FINAL TEXT — frame 10 ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div key="final"
            className="absolute z-[22] pointer-events-none"
            style={{ bottom: '16%', left: '7%' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
            {/* Line 1 */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0, duration: 1.0 }}
              style={{
                fontSize: 'clamp(1.1rem, 2.8vw, 2.2rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'rgba(240,215,155,0.92)',
                lineHeight: 1.45,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              From Five Students.
            </motion.p>
            {/* Line 2 — gold accent */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.0 }}
              style={{
                fontSize: 'clamp(1.1rem, 2.8vw, 2.2rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#C8A340',
                lineHeight: 1.45,
                textShadow: '0 0 30px rgba(200,163,64,0.45), 0 2px 40px rgba(0,0,0,0.98)',
                letterSpacing: '0.02em',
              }}>
              To Hundreds More.
            </motion.p>
            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.7, ease: 'easeOut' }}
              style={{
                height: '1px',
                background: 'rgba(200,163,64,0.4)',
                margin: 'clamp(6px,1vw,10px) 0',
                transformOrigin: 'left center',
                width: 'clamp(80px,14vw,130px)',
              }}
            />
            {/* Line 3 */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 1.0 }}
              style={{
                fontSize: 'clamp(1.0rem, 2.6vw, 2.0rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'rgba(240,215,155,0.88)',
                lineHeight: 1.45,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              This Is Only
            </motion.p>
            {/* Line 4 — bright blue */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 1.1 }}
              style={{
                fontSize: 'clamp(1.0rem, 2.6vw, 2.0rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 700,
                fontStyle: 'italic',
                color: 'rgba(110,185,255,0.96)',
                lineHeight: 1.45,
                textShadow: '0 0 28px rgba(80,150,255,0.45), 0 2px 40px rgba(0,0,0,0.98)',
              }}>
              The Beginning.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(0,0,0,0.60) 100%)' }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-[25]"
        animate={{ opacity: flashActive ? 0.90 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
