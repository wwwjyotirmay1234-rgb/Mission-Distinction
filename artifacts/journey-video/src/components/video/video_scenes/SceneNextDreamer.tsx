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
  showTimestamp: boolean;  // "2:17 AM" mirroring scene 0
  showRain: boolean;
  discoveryGlow: boolean;  // golden phone glow
  isSplit: boolean;        // final split-screen frame
};

const FRAMES: Frame[] = [
  {
    // 1 — Late night again — 2:17 AM mirror of Scene 0
    src: 'char_s0_desk_alone.png', dur: 3000,
    caption: 'Another student. Another night.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: true, showRain: true, discoveryGlow: false, isSplit: false,
  },
  {
    // 2 — Same fear — anatomy notes, overwhelmed
    src: 's0_shot_d_face_down.png', dur: 2500,
    caption: 'Same fear. Same doubts.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: true, discoveryGlow: false, isSplit: false,
  },
  {
    // 3 — Searching for help — phone, frustration
    src: 's0_shot_h_slumped.png', dur: 2500,
    caption: 'Searching for a way out.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: true, discoveryGlow: false, isSplit: false,
  },
  {
    // 4 — Discovery — MD app glows golden
    src: 'char_s5_launch_moment.png', dur: 3000,
    caption: 'A discovery.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: false, discoveryGlow: true, isSplit: false,
  },
  {
    // 5 — Exploring resources — notes, PDFs, quizzes
    src: 'char_s5_launch_moment.png', dur: 2500,
    caption: 'Everything in one place.',
    initial: { scale: 1.05, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: false, discoveryGlow: false, isSplit: false,
  },
  {
    // 6 — Confidence returns — organized, determined
    src: 's1_shot_g_determination.png', dur: 2500,
    caption: 'Confidence returns.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: false, discoveryGlow: false, isSplit: false,
  },
  {
    // 7 — Exam hall — calm, ready
    src: 's1_shot_f_lecture_hall_wide.png', dur: 2500,
    caption: 'The test of preparation.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: false, discoveryGlow: false, isSplit: false,
  },
  {
    // 8 — Success — relief, pride
    src: 'group_celebration.png', dur: 2500,
    caption: 'Success feels different.',
    initial: { scale: 1.07, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'flash', showTimestamp: false, showRain: false, discoveryGlow: false, isSplit: false,
  },
  {
    // 9 — Full circle — founder passes the student, unaware
    src: 'char_s3_sunrise_determined.png', dur: 3000,
    caption: 'One year ago, it was him. Today, it\'s someone else.',
    initial: { scale: 1.07, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: false, discoveryGlow: false, isSplit: false,
  },
  {
    // 10 — FINAL LEGACY SHOT — split-screen Then vs Now
    src: 'char_s0_desk_alone.png', dur: 5500,
    caption: '',
    initial: { scale: 1.04 }, animate: { scale: 1.0 },
    transition: { duration: 6.0, ease: 'easeOut' },
    cutType: 'dissolve', showTimestamp: false, showRain: false, discoveryGlow: false, isSplit: true,
  },
];

// Rain drops
const RAIN_DROPS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 2.5 + Math.sin(i * 1.3) * 5) % 100,
  delay: (i * 0.07) % 1.2,
  dur: 0.55 + (i % 5) * 0.08,
  opacity: 0.15 + (i % 4) * 0.05,
}));

export function SceneNextDreamer() {
  const [frameIndex, setFrameIndex]       = useState(0);
  const [flashActive, setFlashActive]     = useState(false);
  const [showCaption, setShowCaption]     = useState(true);
  const [showFinalText, setShowFinalText] = useState(false);
  const [showGoldenWave, setShowGoldenWave] = useState(false);
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
            setTimeout(() => {
              setFlashActive(false);
              setFrameIndex(i);
              setTimeout(() => setShowCaption(true), 80);
            }, 120);
          }, t));
        } else {
          timers.push(setTimeout(() => {
            setShowCaption(false);
            setTimeout(() => {
              setFrameIndex(i);
              setTimeout(() => setShowCaption(true), 120);
            }, 200);
          }, t));
        }
      }

      cursor += frame.dur;
    });

    const lastStart = FRAMES.slice(0, FRAMES.length - 1).reduce((s, f) => s + f.dur, 0);
    timers.push(setTimeout(() => setShowFinalText(true), lastStart + 1800));
    timers.push(setTimeout(() => setShowGoldenWave(true), lastStart + 800));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* ── BASE IMAGE — left side on split, full on others ── */}
      {FRAMES.map((frame, i) => (
        <motion.div key={i}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: frameIndex === i ? 1 : 0 }}
          transition={{ duration: frame.cutType === 'flash' ? 0.08 : 0.70, ease: 'easeInOut' }}>
          <motion.div
            className="absolute inset-0"
            style={frame.isSplit ? { right: '50%' } : {}}
            initial={frame.initial}
            animate={frameIndex === i ? frame.animate : frame.initial}
            transition={frameIndex === i ? frame.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${frame.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: frame.isSplit
                  ? 'brightness(0.72) contrast(1.08) saturate(0.60) sepia(0.25)'
                  : i <= 2
                    ? 'brightness(0.76) contrast(1.10) saturate(0.72)'
                    : i === 9
                      ? 'brightness(0.82) contrast(1.05) saturate(0.85)'
                      : 'brightness(0.86) contrast(1.05) saturate(0.95)',
              }}
              alt=""
            />
          </motion.div>

          {/* ── RIGHT PANEL — split frame 10 ── */}
          {frame.isSplit && (
            <motion.div
              className="absolute inset-0"
              style={{ left: '50%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: frameIndex === i ? 1 : 0 }}
              transition={{ duration: 0.70, ease: 'easeInOut' }}>
              <img
                src={`${import.meta.env.BASE_URL}images/char_s6_odisha_students.png?v=2`}
                className="w-full h-full object-cover object-center"
                style={{ filter: 'brightness(0.90) contrast(1.04) saturate(1.05)' }}
                alt=""
              />
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* ── SPLIT DIVIDER LINE ── */}
      <AnimatePresence>
        {isLast && (
          <motion.div key="divider"
            className="absolute inset-y-0 z-[14] pointer-events-none"
            style={{ left: '50%', width: '2px',
              background: 'linear-gradient(to bottom, transparent 10%, rgba(200,163,64,0.60) 30%, rgba(200,163,64,0.80) 50%, rgba(200,163,64,0.60) 70%, transparent 90%)' }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── SPLIT LABELS — "Then" / "Now" ── */}
      <AnimatePresence>
        {isLast && (
          <>
            <motion.div key="then"
              className="absolute z-[18] pointer-events-none"
              style={{ bottom: '20%', left: '4%' }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}>
              <p style={{
                fontSize: 'clamp(0.8rem, 1.6vw, 1.3rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(200,180,130,0.70)',
                letterSpacing: '0.06em',
                textShadow: '0 2px 20px rgba(0,0,0,0.95)',
              }}>Then</p>
              <p style={{
                fontSize: 'clamp(0.65rem, 1.2vw, 1.0rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(180,160,110,0.55)',
                textShadow: '0 2px 20px rgba(0,0,0,0.95)',
              }}>He was lost.</p>
            </motion.div>
            <motion.div key="now"
              className="absolute z-[18] pointer-events-none"
              style={{ bottom: '20%', left: '54%' }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}>
              <p style={{
                fontSize: 'clamp(0.8rem, 1.6vw, 1.3rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(200,163,64,0.85)',
                letterSpacing: '0.06em',
                textShadow: '0 2px 20px rgba(0,0,0,0.95)',
              }}>Now</p>
              <p style={{
                fontSize: 'clamp(0.65rem, 1.2vw, 1.0rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(180,155,80,0.65)',
                textShadow: '0 2px 20px rgba(0,0,0,0.95)',
              }}>He found his way.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── GOLDEN WAVE — connecting the two halves ── */}
      <AnimatePresence>
        {isLast && showGoldenWave && (
          <motion.svg key="wave"
            className="absolute inset-0 z-[16] pointer-events-none w-full h-full"
            viewBox="0 0 100 100" preserveAspectRatio="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}>
            <defs>
              <filter id="glow-wave">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <motion.path
              d="M 30,55 Q 40,40 50,50 Q 60,60 70,45"
              fill="none"
              stroke="rgba(200,163,64,0.75)"
              strokeWidth="0.5"
              filter="url(#glow-wave)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.circle cx="50" cy="50" r="1.2"
              fill="rgba(200,163,64,0.90)"
              style={{ filter: 'drop-shadow(0 0 3px rgba(200,163,64,0.90))' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.7, 1], scale: [0, 1.4, 1] }}
              transition={{ delay: 1.0, duration: 0.8 }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* ── 2:17 AM TIMESTAMP — frame 1 ── */}
      <AnimatePresence>
        {current.showTimestamp && (
          <motion.div key="timestamp"
            className="absolute pointer-events-none z-[18]"
            style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.9 }}>
            <p style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
              fontFamily: 'monospace',
              fontWeight: 300,
              color: 'rgba(160,180,220,0.65)',
              letterSpacing: '0.16em',
              textShadow: '0 0 30px rgba(100,140,220,0.30), 0 2px 30px rgba(0,0,0,0.95)',
            }}>2:17 <span style={{ fontSize: '0.5em', letterSpacing: '0.3em' }}>AM</span></p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RAIN — frames 1-3 ── */}
      <AnimatePresence>
        {current.showRain && (
          <motion.div key="rain"
            className="absolute inset-0 pointer-events-none z-[7]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {RAIN_DROPS.map((d, i) => (
                <motion.line key={i}
                  x1={d.x} y1="-2" x2={d.x - 0.5} y2="4"
                  stroke={`rgba(140,165,230,${d.opacity})`}
                  strokeWidth="0.18"
                  animate={{ y: [0, 105], opacity: [0, d.opacity, d.opacity, 0] }}
                  transition={{ delay: d.delay, duration: d.dur, repeat: Infinity, ease: 'linear' }}
                />
              ))}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DISCOVERY GLOW — frame 4 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(200,163,64,0.22) 0%, rgba(180,130,30,0.09) 45%, transparent 70%)',
        }}
        animate={{ opacity: current.discoveryGlow ? 1 : 0 }}
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
            key={`cap-${frameIndex}`}
            className="absolute pointer-events-none z-[20] font-serif italic"
            style={{
              bottom: '15%', left: '7%', maxWidth: '60%',
              fontSize: 'clamp(0.82rem, 1.7vw, 1.35rem)',
              color: 'rgba(220,200,150,0.82)',
              letterSpacing: '0.04em', lineHeight: 1.5,
              textShadow: '0 2px 24px rgba(0,0,0,0.95)',
            }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}>
            {current.caption}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── FINAL TEXT — frame 10 right side ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div key="final"
            className="absolute z-[22] pointer-events-none"
            style={{ bottom: '28%', right: '4%', textAlign: 'right', maxWidth: '44%' }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0, duration: 1.1 }}
              style={{
                fontSize: 'clamp(0.78rem, 1.7vw, 1.35rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(230,210,160,0.88)',
                lineHeight: 1.6,
                textShadow: '0 2px 30px rgba(0,0,0,0.98)',
              }}>
              The greatest success<br />isn&apos;t what you build.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 1.1 }}
              style={{
                fontSize: 'clamp(0.78rem, 1.7vw, 1.35rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(230,210,160,0.88)',
                lineHeight: 1.6,
                textShadow: '0 2px 30px rgba(0,0,0,0.98)',
              }}>
              It&apos;s who you help<br />become successful.
            </motion.p>
            {/* gold divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '1px',
                background: 'linear-gradient(to left, rgba(200,163,64,0.55), transparent)',
                margin: 'clamp(5px,0.9vw,9px) 0 clamp(5px,0.9vw,9px) auto',
                transformOrigin: 'right center',
                width: 'clamp(60px,14vw,120px)',
              }}
            />
            {/* MD wordmark */}
            <motion.p
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 'clamp(1.1rem, 2.6vw, 2.1rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: '#C8A340',
                textShadow: '0 0 35px rgba(200,163,64,0.38), 0 2px 36px rgba(0,0,0,0.98)',
                lineHeight: 1.15,
              }}>
              MISSION DISTINCTION
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 2.1, duration: 1.0 }}
              style={{
                fontSize: 'clamp(0.52rem, 1.0vw, 0.80rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(190,200,230,0.60)',
                letterSpacing: '0.18em',
                textShadow: '0 2px 20px rgba(0,0,0,0.95)',
              }}>
              Together, we learn. Together, we rise.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)' }}
      />

      {/* ── FLASH ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-[25]"
        animate={{ opacity: flashActive ? 0.88 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
