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
  sunriseWarm: boolean;   // golden warm overlay (frames 1-6)
  screenGreen: boolean;   // green success glow (frame 3)
  screenBlue: boolean;    // countdown/button blue glow (frames 8-9)
  screenGlow: boolean;    // laptop screen glow in dark (frame 10)
};

// ── Scene 6 — The Comeback (10 frames) ───────────────────────────────────────
const FRAMES: Frame[] = [
  {
    // 1 — New morning — sunrise after sleepless night, renewed determination
    src: 'char_s3_sunrise_determined.png', dur: 3000,
    caption: 'New morning. New determination.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: true, screenGreen: false, screenBlue: false, screenGlow: false,
  },
  {
    // 2 — Fixing problems — debugging, correcting resources together
    src: 's4_shot_h_team_still_going.png', dur: 2500,
    caption: 'Fixing problems. Finding solutions.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: true, screenGreen: false, screenBlue: false, screenGlow: false,
  },
  {
    // 3 — Progress returns — success notifications, smiles return
    src: 's4_shot_a_late_night_coding.png', dur: 2500,
    caption: 'Progress returns.',
    initial: { scale: 1.05, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: false, screenGreen: true, screenBlue: false, screenGlow: false,
  },
  {
    // 4 — Mission Distinction reborn — app loads smoothly, emotional breakthrough
    src: 'char_s5_launch_moment.png', dur: 3000,
    caption: 'Mission Distinction reborn.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: true, screenGreen: false, screenBlue: false, screenGlow: false,
  },
  {
    // 5 — First successful test — students testing on phones, excitement
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'First successful test.',
    initial: { scale: 1.05, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: true, screenGreen: false, screenBlue: false, screenGlow: false,
  },
  {
    // 6 — Positive feedback — thumbs up, founders relieved
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'Positive feedback. Priceless moment.',
    initial: { scale: 1.04, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: true, screenGreen: false, screenBlue: false, screenGlow: false,
  },
  {
    // 7 — Final preparations — launch plan, announcements, intense focus
    src: 's3_shot_f_whiteboard.png', dur: 2800,
    caption: 'Final preparations.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: false, screenGreen: false, screenBlue: false, screenGlow: false,
  },
  {
    // 8 — Countdown — timer, silence, tension + excitement
    src: 'scene5_launch_day.png', dur: 3000,
    caption: 'The countdown begins.',
    initial: { scale: 1.05, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: false, screenGreen: false, screenBlue: true, screenGlow: false,
  },
  {
    // 9 — Finger over LAUNCH button — extreme close-up, suspense
    src: 'char_s5_launch_moment.png', dur: 2800,
    caption: 'One click away.',
    initial: { scale: 1.10 }, animate: { scale: 1.0 },
    transition: { duration: 3.5, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', sunriseWarm: false, screenGreen: false, screenBlue: true, screenGlow: false,
  },
  {
    // 10 — Moments before launch — team at screen, "One second. A dream. A revolution."
    src: 'scene5_launch_day.png', dur: 5000,
    caption: '',  // final text card takes over
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 6.0, ease: 'easeOut' },
    cutType: 'dissolve', sunriseWarm: false, screenGreen: false, screenBlue: false, screenGlow: true,
  },
];

export function SceneComeback() {
  const [frameIndex, setFrameIndex]       = useState(0);
  const [flashActive, setFlashActive]     = useState(false);
  const [showCaption, setShowCaption]     = useState(true);
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
            setShowCaption(false);
            setTimeout(() => {
              setFlashActive(false);
              setFrameIndex(i);
              setShowCaption(true);
            }, 110);
          }, t));
        } else {
          timers.push(setTimeout(() => {
            setShowCaption(false);
            setTimeout(() => {
              setFrameIndex(i);
              setShowCaption(true);
            }, 200);
          }, t));
        }
      }
      cursor += frame.dur;
    });

    // Final text 1.8s into last frame
    const lastStart = FRAMES.slice(0, FRAMES.length - 1).reduce((s, f) => s + f.dur, 0);
    timers.push(setTimeout(() => setShowFinalText(true), lastStart + 1800));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}>

      {/* ── ALL FRAMES ── */}
      {FRAMES.map((frame, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: frameIndex === i ? 1 : 0 }}
          transition={{ duration: frame.cutType === 'flash' ? 0.08 : 0.65, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={frame.initial}
            animate={frameIndex === i ? frame.animate : frame.initial}
            transition={frameIndex === i ? frame.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${frame.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: i <= 5
                  ? 'brightness(0.92) contrast(1.04) saturate(1.05)'   // warm comeback frames
                  : i === 9
                    ? 'brightness(0.80) contrast(1.08) saturate(0.85)' // dark dramatic finale
                    : 'brightness(0.86) contrast(1.06) saturate(0.95)', // prep/countdown frames
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── SUNRISE GOLDEN OVERLAY — frames 1-6 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 60% 30%, rgba(255,165,40,0.18) 0%, rgba(255,120,20,0.07) 45%, transparent 70%)',
        }}
        animate={{ opacity: current.sunriseWarm ? 1 : 0 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── GREEN SUCCESS GLOW — frame 3 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(30,180,80,0.15) 0%, rgba(20,140,60,0.06) 45%, transparent 70%)',
        }}
        animate={{ opacity: current.screenGreen ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />
      {/* Green success tick pulse */}
      <AnimatePresence>
        {current.screenGreen && (
          <motion.div key="green-tick"
            className="absolute pointer-events-none z-[10]"
            style={{ right: '18%', top: '32%' }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 0.7, 1, 0], scale: [0.7, 1.1, 1.0, 1.05, 0.9] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, times: [0, 0.2, 0.4, 0.7, 1.0] }}>
            <span style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
              color: 'rgba(50,220,100,0.9)',
              textShadow: '0 0 20px rgba(50,220,100,0.7)',
              fontWeight: 700,
            }}>✓ All Systems Operational</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BLUE LAUNCH/COUNTDOWN GLOW — frames 8-9 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(40,100,255,0.18) 0%, rgba(20,60,200,0.08) 50%, transparent 75%)',
        }}
        animate={{ opacity: current.screenBlue ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* ── SCREEN GLOW — frame 10 (dark room + laptop light) ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 62%, rgba(60,100,200,0.22) 0%, rgba(40,70,160,0.1) 40%, transparent 68%)',
        }}
        animate={{ opacity: current.screenGlow ? 1 : 0 }}
        transition={{ duration: 1.0 }}
      />

      {/* ── CINEMATIC GRADIENT ── */}
      <div className="absolute inset-0 z-[6] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.90) 0%, rgba(2,3,12,0.14) 22%, transparent 44%)' }}
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
              fontSize: 'clamp(0.85rem, 1.8vw, 1.4rem)',
              color: 'rgba(220,200,150,0.82)',
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

      {/* ── FINAL TEXT — frame 10 ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div
            key="final-text"
            className="absolute z-[20] pointer-events-none"
            style={{ bottom: '14%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            {['One second.', 'A dream.', 'A revolution.'].map((line, i) => (
              <motion.p key={line}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.45, duration: 0.9, ease: 'easeOut' }}
                style={{
                  fontSize: 'clamp(1.1rem, 2.6vw, 2.1rem)',
                  fontFamily: 'var(--font-display, serif)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'rgba(240,215,150,0.92)',
                  letterSpacing: '0.04em',
                  lineHeight: 1.5,
                  textShadow: '0 2px 36px rgba(0,0,0,0.98), 0 0 50px rgba(0,0,0,0.9)',
                }}>
                {line}
              </motion.p>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 1.0, ease: 'easeOut' }}
              style={{
                marginTop: '0.3em',
                fontSize: 'clamp(1.1rem, 2.6vw, 2.1rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 600,
                color: 'rgba(100,180,255,0.95)',
                letterSpacing: '0.06em',
                lineHeight: 1.5,
                textShadow: '0 0 30px rgba(80,150,255,0.6), 0 2px 36px rgba(0,0,0,0.98)',
              }}>
              We are ready.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(0,0,0,0.58) 100%)' }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-[25]"
        animate={{ opacity: flashActive ? 0.88 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
