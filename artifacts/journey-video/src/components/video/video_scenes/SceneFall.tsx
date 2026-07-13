import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

// ── Frame definitions ─────────────────────────────────────────────────────────
type Frame = {
  src: string;
  dur: number;
  caption: string;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
  // Visual mood flags
  errorGlow: boolean;    // cold blue screen glow (frames 3-7)
  showRain: boolean;     // rain outside (frames 6-7 — low point)
  sunriseGlow: boolean;  // golden sunrise warmth (frame 10)
  redFlash: boolean;     // brief red error flash (frames 3, 5)
};

const FRAMES: Frame[] = [
  {
    // 1 — Momentum — five students working, hopeful
    src: 's4_shot_a_late_night_coding.png', dur: 2500,
    caption: 'Momentum.',
    initial: { scale: 1.07, y: '-1%' }, animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3.0, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: false, showRain: false, sunriseGlow: false, redFlash: false,
  },
  {
    // 2 — First public testing — peers testing on phones
    src: 'char_s2_whiteboard_team.png', dur: 2500,
    caption: 'First public testing.',
    initial: { scale: 1.05, x: '-0.5%' }, animate: { scale: 1.0, x: '0%' },
    transition: { duration: 3.0, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: false, showRain: false, sunriseGlow: false, redFlash: false,
  },
  {
    // 3 — The bug appears — error messages on screen, smile fades
    src: 's4_shot_b_error_screen.png', dur: 2800,
    caption: 'The bug appears.',
    initial: { scale: 1.10 }, animate: { scale: 1.0 },
    transition: { duration: 3.2, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', errorGlow: true, showRain: false, sunriseGlow: false, redFlash: true,
  },
  {
    // 4 — Silence — entire room frozen, staring at broken system
    src: 'char_s3_crash_devastated.png', dur: 3500,
    caption: 'Silence.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: true, showRain: false, sunriseGlow: false, redFlash: false,
  },
  {
    // 5 — Things get worse — multiple crashes, panic rising
    src: 's4_shot_c_exhausted_3am.png', dur: 2800,
    caption: 'Things get worse.',
    initial: { scale: 1.08, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: true, showRain: false, sunriseGlow: false, redFlash: true,
  },
  {
    // 6 — Exhaustion — founder alone, head on desk, rain outside
    src: 's4_shot_f_almost_giving_up.png', dur: 3500,
    caption: 'Exhaustion.',
    initial: { scale: 1.05, y: '-1%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: false, showRain: true, sunriseGlow: false, redFlash: false,
  },
  {
    // 7 — The breaking point — considering giving up, tired eyes
    src: 'char_s3_crash_devastated.png', dur: 3000,
    caption: 'The breaking point.',
    initial: { scale: 1.06, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: false, showRain: true, sunriseGlow: false, redFlash: false,
  },
  {
    // 8 — The team returns — teammates enter, silent support
    src: 's4_shot_g_remembering_why.png', dur: 3000,
    caption: 'The team returns.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: false, showRain: false, sunriseGlow: false, redFlash: false,
  },
  {
    // 9 — We continue — laptops reopen, teamwork stronger
    src: 's4_shot_h_team_still_going.png', dur: 2500,
    caption: 'We continue.',
    initial: { scale: 1.05, y: '-0.5%' }, animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: false, showRain: false, sunriseGlow: false, redFlash: false,
  },
  {
    // 10 — Sunrise — golden light, resilience, end of scene
    src: 's4_shot_d_sunrise_window.png', dur: 5000,
    caption: '',  // large text takes over
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 6.0, ease: 'easeOut' },
    cutType: 'dissolve', errorGlow: false, showRain: false, sunriseGlow: true, redFlash: false,
  },
];

// Rain drops for frames 6-7
const RAIN_DROPS = Array.from({ length: 55 }, (_, i) => ({
  left: `${(i * 1.85 + (i % 5) * 1.4) % 100}%`,
  height: `${55 + (i % 6) * 20}px`,
  width: i % 4 === 0 ? '2px' : '1.5px',
  duration: 0.30 + (i % 7) * 0.055,
  delay: (i * 0.11) % 2.0,
  opacity: 0.14 + (i % 6) * 0.07,
}));

export function SceneFall() {
  const [frameIndex, setFrameIndex]     = useState(0);
  const [flashActive, setFlashActive]   = useState(false);
  const [redActive, setRedActive]       = useState(false);
  const [showTitle, setShowTitle]       = useState(true);
  const [showFinalText, setShowFinalText] = useState(false);
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
            setShowTitle(false);
            setTimeout(() => {
              setFlashActive(false);
              setFrameIndex(i);
              setShowTitle(true);
            }, 100);
          }, t));
        } else {
          timers.push(setTimeout(() => {
            setShowTitle(false);
            setTimeout(() => {
              setFrameIndex(i);
              setShowTitle(true);
            }, 180);
          }, t));
        }
      }

      // Red error flash for frames 3 and 5
      if (frame.redFlash) {
        timers.push(setTimeout(() => {
          setRedActive(true);
          setTimeout(() => setRedActive(false), 400);
        }, t + 100));
      }

      cursor += frame.dur;
    });

    // Final text appears 1.8s into the last frame
    const lastStart = FRAMES.slice(0, FRAMES.length - 1).reduce((s, f) => s + f.dur, 0);
    timers.push(setTimeout(() => setShowFinalText(true), lastStart + 1800));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}>

      {/* ── ALL FRAMES — stacked, crossfading ── */}
      {FRAMES.map((frame, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: frameIndex === i ? 1 : 0 }}
          transition={{
            duration: frame.cutType === 'flash' ? 0.08 : 0.65,
            ease: 'easeInOut',
          }}>
          <motion.div className="absolute inset-0"
            initial={frame.initial}
            animate={frameIndex === i ? frame.animate : frame.initial}
            transition={frameIndex === i ? frame.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${frame.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: i >= 2 && i <= 6
                  ? 'brightness(0.75) contrast(1.12) saturate(0.7)'   // dark/tense frames
                  : i >= 7
                    ? 'brightness(0.88) contrast(1.05) saturate(0.9)' // recovery frames
                    : 'brightness(0.90) contrast(1.04) saturate(0.95)', // opening frames
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── ERROR SCREEN GLOW — cold blue (frames 3-7) ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(40,80,200,0.22) 0%, rgba(20,50,160,0.1) 40%, transparent 70%)',
        }}
        animate={{ opacity: current.errorGlow ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* ── RED ERROR FLASH ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[15]"
        style={{ background: 'rgba(200, 30, 30, 0.18)' }}
        animate={{ opacity: redActive ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* ── RAIN — frames 6-7 (low point) ── */}
      <motion.div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden"
        animate={{ opacity: current.showRain ? 1 : 0 }}
        transition={{ duration: 0.6 }}>
        {RAIN_DROPS.map((drop, i) => (
          <motion.div key={i} className="absolute"
            style={{
              left: drop.left, top: '-5%',
              width: drop.width, height: drop.height,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(140,180,255,0.85) 65%, rgba(180,215,255,1) 100%)',
              borderRadius: '1px',
              opacity: drop.opacity,
            }}
            animate={{ y: ['0vh', '112vh'] }}
            transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </motion.div>

      {/* ── SUNRISE GOLDEN GLOW — frame 10 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 65%, rgba(255,165,40,0.28) 0%, rgba(255,120,20,0.1) 45%, transparent 72%)',
        }}
        animate={{ opacity: current.sunriseGlow ? 1 : 0 }}
        transition={{ duration: 2.0 }}
      />
      {/* Sunrise horizon line */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{
          left: 0, right: 0, bottom: '28%', height: '2px',
          background: 'linear-gradient(to right, transparent 0%, rgba(255,190,60,0.35) 20%, rgba(255,220,80,0.6) 50%, rgba(255,190,60,0.35) 80%, transparent 100%)',
          filter: 'blur(3px)',
        }}
        animate={{ opacity: current.sunriseGlow ? 1 : 0 }}
        transition={{ duration: 2.5, delay: 0.5 }}
      />

      {/* ── CINEMATIC GRADIENT (bottom legibility) ── */}
      <div className="absolute inset-0 z-[6] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.92) 0%, rgba(2,3,12,0.18) 22%, transparent 45%)' }}
      />

      {/* ── PER-FRAME CAPTION (bottom-left, small italic) ── */}
      <AnimatePresence mode="wait">
        {showTitle && current.caption && !isLast && (
          <motion.p
            key={`caption-${frameIndex}`}
            className="absolute pointer-events-none z-[20] font-serif italic"
            style={{
              bottom: '15%',
              left: '7%',
              fontSize: 'clamp(0.85rem, 1.8vw, 1.4rem)',
              color: 'rgba(210,190,140,0.78)',
              letterSpacing: '0.04em',
              textShadow: '0 2px 24px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.9)',
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}>
            {current.caption}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── FINAL INSPIRATIONAL TEXT — frame 10 ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div
            key="final-text"
            className="absolute z-[20] w-full flex flex-col items-center justify-center pointer-events-none"
            style={{ bottom: '13%' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
            <p style={{
              fontSize: 'clamp(1.0rem, 2.8vw, 2.2rem)',
              fontFamily: 'var(--font-display, serif)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'rgba(240,210,140,0.92)',
              letterSpacing: '0.05em',
              textAlign: 'center',
              textShadow: '0 2px 40px rgba(0,0,0,0.98), 0 0 60px rgba(200,163,64,0.25)',
              lineHeight: 1.4,
            }}>
              Failure is not the end.
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 1.2 }}
              style={{
                fontSize: 'clamp(1.0rem, 2.8vw, 2.2rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'rgba(240,210,140,0.92)',
                letterSpacing: '0.05em',
                textAlign: 'center',
                textShadow: '0 2px 40px rgba(0,0,0,0.98), 0 0 60px rgba(200,163,64,0.25)',
                lineHeight: 1.4,
              }}>
              It&apos;s part of the journey.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(0,0,0,0.6) 100%)' }}
      />

      {/* ── WHITE FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-[25]"
        animate={{ opacity: flashActive ? 0.9 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
