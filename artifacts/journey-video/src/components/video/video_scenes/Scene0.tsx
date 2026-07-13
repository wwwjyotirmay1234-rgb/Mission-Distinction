import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

type Shot = {
  src: string;
  dur: number;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
};

// ── 8 cinematic shots — clock → wide → writing → face → notebook → window → eye → slumped ──
const SHOTS: Shot[] = [
  {
    src: 's0_shot_a_clock.png',
    dur: 2200,
    initial: { scale: 1.08, x: '1%', y: '-1%' },
    animate: { scale: 1.0, x: '0%', y: '0%' },
    transition: { duration: 2.5, ease: 'easeOut' },
    cutType: 'flash',
  },
  {
    src: 's0_shot_b_wide.png',
    dur: 2600,
    initial: { scale: 1.06, y: '-1.5%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3, ease: 'easeOut' },
    cutType: 'dissolve',
  },
  {
    src: 's0_shot_c_writing.png',
    dur: 2000,
    initial: { scale: 1.05, x: '-1.5%' },
    animate: { scale: 1.02, x: '1.5%' },
    transition: { duration: 2.2, ease: 'linear' },
    cutType: 'dissolve',
  },
  {
    src: 's0_shot_d_face_down.png',
    dur: 2500,
    initial: { scale: 1.0, y: '1%' },
    animate: { scale: 1.06, y: '0%' },
    transition: { duration: 2.8, ease: 'easeIn' },
    cutType: 'dissolve',
  },
  {
    src: 's0_shot_e_notebook.png',
    dur: 2000,
    initial: { scale: 1.04, x: '1%', y: '1%' },
    animate: { scale: 1.0, x: '-1%', y: '0%' },
    transition: { duration: 2.2, ease: 'linear' },
    cutType: 'dissolve',
  },
  {
    src: 's0_shot_f_window.png',
    dur: 2500,
    initial: { scale: 1.03, x: '0.5%' },
    animate: { scale: 1.0, x: '0%' },
    transition: { duration: 2.8, ease: 'easeOut' },
    cutType: 'dissolve',
  },
  {
    src: 's0_shot_g_eye.png',
    dur: 2000,
    initial: { scale: 1.14 },
    animate: { scale: 1.0 },
    transition: { duration: 2.2, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash',
  },
  {
    src: 's0_shot_h_slumped.png',
    dur: 2500,
    initial: { scale: 1.04, y: '-1%' },
    animate: { scale: 1.0, y: '1%' },
    transition: { duration: 2.8, ease: 'easeIn' },
    cutType: 'dissolve',
  },
];

const RAIN_DROPS = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 2.78 + (i % 5) * 1.6) % 100}%`,
  height: `${44 + (i % 5) * 20}px`,
  duration: 0.48 + (i % 6) * 0.1,
  delay: (i * 0.15) % 2.2,
  opacity: 0.04 + (i % 4) * 0.02,
}));

export function Scene0() {
  const [shotIndex, setShotIndex] = useState(0);
  const [phase, setPhase] = useState<'shots' | 'emotion' | 'question' | 'out'>('shots');
  const [flashActive, setFlashActive] = useState(false);
  const [tick, setTick] = useState(false);
  const builtTimers = useRef(false);

  useSceneSpeech([
    { atPhase: 8, text: 'Exhaustion. Doubt. Fear.' },
    { atPhase: 9, text: 'What if I fail?' },
  ], shotIndex);

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;

    const tickInterval = setInterval(() => setTick(t => !t), 900);

    // Build shot schedule from SHOTS durations
    let cursor = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    SHOTS.forEach((shot, i) => {
      const t = cursor;
      if (i > 0) {
        if (shot.cutType === 'flash') {
          timers.push(setTimeout(() => {
            setFlashActive(true);
            setTimeout(() => { setFlashActive(false); setShotIndex(i); }, 90);
          }, t));
        } else {
          timers.push(setTimeout(() => setShotIndex(i), t));
        }
      }
      cursor += shot.dur;
    });

    // After all shots: emotional punches
    timers.push(setTimeout(() => setPhase('emotion'), cursor));           // ~20.3s
    timers.push(setTimeout(() => setPhase('question'), cursor + 3500));   // ~23.8s
    timers.push(setTimeout(() => setPhase('out'), cursor + 7000));        // ~27.3s

    return () => { timers.forEach(clearTimeout); clearInterval(tickInterval); };
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}>

      {/* ── ALL SHOTS — stacked, crossfading ─────────────────── */}
      {SHOTS.map((shot, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: shotIndex === i ? 1 : 0 }}
          transition={{ duration: shot.cutType === 'flash' ? 0.08 : 0.5, ease: 'easeInOut' }}>
          {/* Ken Burns per-shot motion */}
          <motion.div className="absolute inset-0"
            initial={shot.initial}
            animate={shotIndex === i ? shot.animate : shot.initial}
            transition={shotIndex === i ? shot.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${shot.src}`}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.9) contrast(1.04) saturate(0.95)' }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── SHOT-SPECIFIC OVERLAYS ────────────────────────────── */}

      {/* Shot A — red clock glow pulse */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '30%', bottom: '20%', width: '20%', height: '22%',
          background: 'radial-gradient(ellipse, rgba(255,20,0,0.22) 0%, transparent 70%)',
        }}
        animate={{ opacity: shotIndex === 0 ? (tick ? 0.9 : 0.35) : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Shot D / G — amber lamp glow on face */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '5%', top: '5%', width: '42%', height: '50%',
          background: 'radial-gradient(ellipse at 15% 12%, rgba(255,180,60,0.1) 0%, transparent 65%)',
        }}
        animate={{ opacity: (shotIndex === 3 || shotIndex === 6) ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* ── RAIN — overlaid on every shot (intensifies from shot 5 onward) ── */}
      <div className="absolute inset-0 z-4 pointer-events-none overflow-hidden">
        {RAIN_DROPS.map((drop, i) => (
          <motion.div key={i} className="absolute"
            style={{
              left: drop.left, top: 0,
              width: '1px', height: drop.height,
              background: 'linear-gradient(to bottom, transparent, rgba(120,170,255,0.8))',
              borderRadius: '1px',
            }}
            animate={{
              y: ['0vh', '108vh'],
              opacity: drop.opacity * (shotIndex >= 5 ? 2 : 1),
            }}
            transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      {/* ── CINEMATIC BARS ────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0 h-[6%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black z-10 pointer-events-none" />

      {/* Bottom gradient — only needed during text phases */}
      <motion.div className="absolute inset-0 z-5 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.97) 0%, rgba(2,3,12,0.3) 22%, transparent 50%)' }}
        animate={{ opacity: phase === 'shots' ? 0.3 : 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* ── FLASH FRAME (between shots) ───────────────────────── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-20"
        animate={{ opacity: flashActive ? 0.85 : 0 }}
        transition={{ duration: 0.05 }}
      />

      {/* ── EMOTIONAL TEXT OVERLAYS ───────────────────────────── */}
      <div className="absolute inset-0 z-15 flex flex-col items-center justify-end pb-[10%] px-[10vw]">
        <div className="text-center w-full">

          {/* "Exhaustion.  Doubt.  Fear." */}
          <AnimatePresence>
            {phase === 'emotion' && (
              <motion.div
                key="emotion"
                className="flex items-end justify-center gap-[5vw]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
                {[
                  { w: 'Exhaustion.', c: 'rgba(255,255,255,0.55)' },
                  { w: 'Doubt.', c: 'rgba(255,255,255,0.45)' },
                  { w: 'Fear.', c: 'rgba(220,70,50,0.8)' },
                ].map(({ w, c }, i) => (
                  <WordReveal key={w} text={w} startDelay={i * 0.5} wordInterval={0.1}
                    style={{
                      fontSize: '3vw', fontWeight: 300,
                      fontFamily: 'var(--font-display, serif)',
                      color: c, letterSpacing: '0.12em',
                      textShadow: '0 2px 24px rgba(0,0,0,0.95)',
                    }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* "What if I fail?" */}
          <AnimatePresence>
            {(phase === 'question' || phase === 'out') && (
              <motion.div
                key="question"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
                <WordReveal text='"What if I fail?"' startDelay={0.1} wordInterval={0.22}
                  style={{
                    fontSize: '8.5vw',
                    fontFamily: 'var(--font-display, serif)',
                    color: '#C8A340',
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 100px rgba(200,163,64,0.55), 0 4px 40px rgba(0,0,0,0.95)',
                    lineHeight: 1,
                    display: 'block',
                  }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scene fade-out */}
      <motion.div className="absolute inset-0 bg-black pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase === 'out' ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: phase === 'out' ? 1.5 : 0 }}
      />
    </motion.div>
  );
}
