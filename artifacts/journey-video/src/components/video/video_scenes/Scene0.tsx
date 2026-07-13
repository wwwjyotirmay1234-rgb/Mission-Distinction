import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

type Shot = {
  src: string;
  dur: number;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
  showRain: boolean;
  showPhone: boolean;
};

// ── Your original 3-shot Scene 0 ─────────────────────────────────────────────
const SHOTS: Shot[] = [
  {
    // Shot 1 — Extreme close-up clock 2:17 AM. Slow cinematic zoom. Rain sounds.
    src: 's0_shot_a_clock.png', dur: 5000,
    initial: { scale: 1.10, x: '1%', y: '-1%' },
    animate: { scale: 1.0, x: '0%', y: '0%' },
    transition: { duration: 5.5, ease: 'easeOut' },
    cutType: 'flash', showRain: true, showPhone: false,
  },
  {
    // Shot 2 — MBBS student alone surrounded by books. Exhausted. Camera orbit.
    src: 'char_s0_desk_alone.png', dur: 5000,
    initial: { scale: 1.06, y: '-1.5%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 5.5, ease: 'easeOut' },
    cutType: 'dissolve', showRain: true, showPhone: false,
  },
  {
    // Shot 3 — Student opens phone, searches for study material, finds nothing.
    src: 'char_s0_phone_frustrated.png', dur: 5000,
    initial: { scale: 1.05, y: '-1%' },
    animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 5.5, ease: 'easeOut' },
    cutType: 'dissolve', showRain: false, showPhone: true,
  },
];

// Heavy rain — 70 drops, fast, clearly visible
const RAIN_DROPS = Array.from({ length: 70 }, (_, i) => ({
  left: `${(i * 1.44 + (i % 7) * 1.2) % 100}%`,
  height: `${60 + (i % 7) * 22}px`,
  width: i % 5 === 0 ? '2px' : '1.5px',
  duration: 0.32 + (i % 8) * 0.06,
  delay: (i * 0.09) % 1.8,
  opacity: 0.18 + (i % 5) * 0.09,
  blur: i % 6 === 0 ? 'blur(0.5px)' : 'none',
}));

export function Scene0() {
  const [shotIndex, setShotIndex] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const [tick, setTick] = useState(false);
  const builtTimers = useRef(false);

  const currentShot = SHOTS[shotIndex];

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;

    const tickInterval = setInterval(() => setTick(t => !t), 900);

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

    return () => { timers.forEach(clearTimeout); clearInterval(tickInterval); };
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}>

      {/* ── ALL SHOTS — stacked, crossfading ── */}
      {SHOTS.map((shot, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: shotIndex === i ? 1 : 0 }}
          transition={{ duration: shot.cutType === 'flash' ? 0.08 : 0.55, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={shot.initial}
            animate={shotIndex === i ? shot.animate : shot.initial}
            transition={shotIndex === i ? shot.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${shot.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.88) contrast(1.05) saturate(0.93)' }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── SHOT 1 — red clock glow pulse ── */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{
          left: '30%', bottom: '20%', width: '20%', height: '22%',
          background: 'radial-gradient(ellipse, rgba(255,20,0,0.22) 0%, transparent 70%)',
        }}
        animate={{ opacity: shotIndex === 0 ? (tick ? 0.9 : 0.3) : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* ── SHOT 3 — phone screen glow ── */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{
          left: '30%', top: '38%', width: '40%', height: '38%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(80,130,230,0.18) 0%, rgba(60,100,200,0.07) 55%, transparent 80%)',
          borderRadius: '8%',
        }}
        animate={{ opacity: currentShot.showPhone ? [0, 1, 0.7, 1, 0.6, 0] : 0 }}
        transition={currentShot.showPhone
          ? { duration: 4.0, times: [0, 0.15, 0.4, 0.65, 0.85, 1.0], ease: 'easeInOut' }
          : { duration: 0.3 }}
      />
      {/* "no useful resources found" on phone screen */}
      <AnimatePresence>
        {currentShot.showPhone && (
          <motion.p key="phone-text"
            className="absolute pointer-events-none z-[5] text-center font-mono"
            style={{
              left: '0', right: '0', top: '49%',
              fontSize: 'clamp(0.45rem, 0.9vw, 0.7rem)',
              letterSpacing: '0.3em',
              color: 'rgba(140,170,255,0.65)',
              textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(100,140,255,0.5)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4.0, times: [0, 0.25, 0.4, 0.75, 1.0] }}>
            no useful resources found
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── RAIN — shots 1 & 2 (window visible) ── */}
      <motion.div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden"
        animate={{ opacity: currentShot.showRain ? 1 : 0 }}
        transition={{ duration: 0.4 }}>
        {RAIN_DROPS.map((drop, i) => (
          <motion.div key={i} className="absolute"
            style={{
              left: drop.left, top: '-5%',
              width: drop.width, height: drop.height,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(160,200,255,0.9) 60%, rgba(200,230,255,1) 100%)',
              borderRadius: '1px',
              opacity: drop.opacity,
              filter: drop.blur,
            }}
            animate={{ y: ['0vh', '110vh'] }}
            transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </motion.div>

      {/* ── ESTABLISHING CAPTION — shot 1 (clock) only ── */}
      <motion.p className="absolute font-mono z-[20] pointer-events-none w-full text-center"
        style={{
          top: '15%',
          fontSize: 'clamp(0.5rem, 0.9vw, 0.75rem)',
          letterSpacing: '0.55em',
          color: 'rgba(200,163,64,0.65)',
          fontWeight: 700,
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(200,163,64,0.3)',
        }}
        animate={{ opacity: shotIndex === 0 ? 1 : 0 }}
        transition={{ duration: 1.6, delay: shotIndex === 0 ? 1.0 : 0 }}>
        Odisha · MBBS First Year · 2026
      </motion.p>

      {/* ── CINEMATIC VIGNETTE ── */}
      <div className="absolute inset-0 z-[6] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)' }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-[20]"
        animate={{ opacity: flashActive ? 0.85 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
