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
  showGrowth: boolean;
  showVision: boolean;
  isMidnight: boolean;
};

const FRAMES: Frame[] = [
  {
    // 1 — Unexpected growth — analytics spiking
    src: 'char_s5_launch_moment.png', dur: 2500,
    caption: 'Unexpected growth.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: true, showVision: false, isMidnight: false,
  },
  {
    // 2 — Messages everywhere
    src: 'scene5_launch_day.png', dur: 2500,
    caption: 'Messages everywhere. Students depending on them.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: false,
  },
  {
    // 3 — Weight of trust
    src: 'char_s3_sunrise_determined.png', dur: 3000,
    caption: 'The weight of trust.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: false,
  },
  {
    // 4 — Emergency meeting — late night
    src: 's4_shot_h_team_still_going.png', dur: 3000,
    caption: 'Late-night meeting. A bigger challenge begins.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: false,
  },
  {
    // 5 — Bigger dreams — whiteboard
    src: 's3_shot_f_whiteboard.png', dur: 2500,
    caption: 'Ideas today. Revolution tomorrow.',
    initial: { scale: 1.07, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: true, isMidnight: false,
  },
  {
    // 6 — Students helping students
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'Students helping students.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: false,
  },
  {
    // 7 — Beyond one college
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'A movement across every medical college in Odisha.',
    initial: { scale: 1.05, x: '-0.5%' }, animate: { scale: 1.0, x: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: false,
  },
  {
    // 8 — Midnight reflection
    src: 'group_silhouette.png', dur: 3500,
    caption: 'Midnight. City below. Future ahead.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: true,
  },
  {
    // 9 — The next goal
    src: 'char_s5_launch_moment.png', dur: 2500,
    caption: 'Not 500. Not 5,000. The goal is every student.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: false,
  },
  {
    // 10 — CLIFFHANGER — sunrise silhouette, walking toward light
    src: 'group_silhouette.png', dur: 6000,
    caption: '',
    initial: { scale: 1.14, y: '1.2%' }, animate: { scale: 1.0, y: '-1.0%' },
    transition: { duration: 8.0, ease: 'easeOut' },
    cutType: 'dissolve', showGrowth: false, showVision: false, isMidnight: false,
  },
];

const VISION_ITEMS = [
  'AI Viva Examiner', 'Practical Hub', 'Discussion Forums',
  'Better Resources', 'More Colleges', 'Personalized Learning',
];

export function SceneResponsibility() {
  const [frameIndex, setFrameIndex]         = useState(0);
  const [flashActive, setFlashActive]       = useState(false);
  const [showCaption, setShowCaption]       = useState(true);
  const [showFinalText, setShowFinalText]   = useState(false);
  const [visionCount, setVisionCount]       = useState(0);
  const [growthNum, setGrowthNum]           = useState(500);
  const builtTimers = useRef(false);

  const current = FRAMES[frameIndex];
  const isLast  = frameIndex === FRAMES.length - 1;

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;

    let cursor = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Growth counter animation during frame 1
    const growthSteps = [500, 892, 1440, 2100, 3250, 5180, 8400, 12600, 18900, 25368];
    growthSteps.forEach((val, i) => {
      timers.push(setTimeout(() => setGrowthNum(val), i * 210));
    });

    FRAMES.forEach((frame, i) => {
      const t = cursor;

      if (i > 0) {
        if (frame.cutType === 'flash') {
          timers.push(setTimeout(() => {
            setFlashActive(true);
            setShowCaption(false);
            setVisionCount(0);
            setTimeout(() => {
              setFlashActive(false);
              setFrameIndex(i);
              setTimeout(() => setShowCaption(true), 80);
            }, 130);
          }, t));
        } else {
          timers.push(setTimeout(() => {
            setShowCaption(false);
            setVisionCount(0);
            setTimeout(() => {
              setFrameIndex(i);
              setTimeout(() => setShowCaption(true), 120);
            }, 200);
          }, t));
        }
      }

      if (frame.showVision) {
        VISION_ITEMS.forEach((_, vi) => {
          timers.push(setTimeout(() => setVisionCount(vi + 1), t + 350 + vi * 300));
        });
      }

      cursor += frame.dur;
    });

    const lastStart = FRAMES.slice(0, FRAMES.length - 1).reduce((s, f) => s + f.dur, 0);
    timers.push(setTimeout(() => setShowFinalText(true), lastStart + 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* ── ALL FRAMES ── */}
      {FRAMES.map((frame, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: frameIndex === i ? 1 : 0 }}
          transition={{ duration: 0.72, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={frame.initial}
            animate={frameIndex === i ? frame.animate : frame.initial}
            transition={frameIndex === i ? frame.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${frame.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: frame.isMidnight
                  ? 'brightness(0.65) contrast(1.12) saturate(0.70)'
                  : i === 9
                    ? 'brightness(0.76) contrast(1.12) saturate(1.10)'
                    : 'brightness(0.84) contrast(1.06) saturate(0.92)',
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── GROWTH COUNTER — frame 1 ── */}
      <AnimatePresence>
        {current.showGrowth && (
          <motion.div key="growth"
            className="absolute pointer-events-none z-[18]"
            style={{ top: '16%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, y: -12, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <p style={{
              fontSize: 'clamp(0.42rem, 0.78vw, 0.60rem)',
              letterSpacing: '0.28em', color: 'rgba(140,165,255,0.62)',
              textTransform: 'uppercase', fontFamily: 'monospace',
            }}>Total Students</p>
            <motion.p
              key={growthNum}
              initial={{ opacity: 0.6, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                fontSize: 'clamp(2.4rem, 7.5vw, 6.0rem)',
                fontFamily: 'monospace', fontWeight: 900,
                color: 'rgba(80,220,130,0.97)', lineHeight: 0.95,
                textShadow: '0 0 50px rgba(60,200,100,0.55), 0 2px 30px rgba(0,0,0,0.98)',
              }}>
              {growthNum.toLocaleString()}
            </motion.p>
            <p style={{
              fontSize: 'clamp(0.42rem, 0.78vw, 0.58rem)',
              color: 'rgba(80,200,120,0.50)', fontFamily: 'monospace',
              letterSpacing: '0.18em', marginTop: '2px',
            }}>▲ AND GROWING</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VISION BOARD — frame 5 ── */}
      <AnimatePresence>
        {current.showVision && visionCount > 0 && (
          <motion.div key="vision"
            className="absolute pointer-events-none z-[18]"
            style={{ top: '16%', left: '5%' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <p style={{
              fontSize: 'clamp(0.62rem, 1.18vw, 0.95rem)',
              fontFamily: 'monospace', fontWeight: 800,
              color: 'rgba(200,163,64,0.80)', letterSpacing: '0.28em',
              textTransform: 'uppercase',
              textShadow: '0 0 14px rgba(200,163,64,0.35)', marginBottom: '8px',
            }}>NEXT PHASE</p>
            {VISION_ITEMS.slice(0, visionCount).map((item) => (
              <motion.p key={item}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: 'clamp(0.60rem, 1.08vw, 0.85rem)',
                  color: 'rgba(200,215,255,0.78)', fontFamily: 'monospace',
                  lineHeight: 1.85, textShadow: '0 2px 16px rgba(0,0,0,0.95)',
                }}>
                → {item}
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MIDNIGHT BLUE OVERLAY — frame 8 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(20,40,140,0.22) 0%, rgba(10,20,100,0.10) 55%, transparent 80%)',
        }}
        animate={{ opacity: current.isMidnight ? 1 : 0 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── SUNRISE RADIAL — frame 10 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 85%, rgba(255,145,20,0.34) 0%, rgba(255,90,10,0.14) 40%, transparent 65%)',
        }}
        animate={{ opacity: isLast ? 1 : 0 }}
        transition={{ duration: 2.2 }}
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

      {/* ── CLIFFHANGER FINAL TEXT — frame 10 ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div key="final"
            className="absolute z-[22] pointer-events-none"
            style={{ bottom: '18%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
            {/* Line 1 */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0, duration: 1.1 }}
              style={{
                fontSize: 'clamp(0.88rem, 2.1vw, 1.65rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(235,215,165,0.90)',
                lineHeight: 1.55,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              500 Downloads Was Never
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.1 }}
              style={{
                fontSize: 'clamp(0.88rem, 2.1vw, 1.65rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(235,215,165,0.90)',
                lineHeight: 1.55,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              The Destination.
            </motion.p>
            {/* Gold divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '1px',
                background: 'linear-gradient(to left, rgba(200,163,64,0.60), transparent)',
                margin: 'clamp(6px,1vw,10px) 0 clamp(6px,1vw,10px) auto',
                transformOrigin: 'right center',
                width: 'clamp(80px,18vw,160px)',
              }}
            />
            {/* Line 2 — gold emphasis */}
            <motion.p
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 'clamp(1.3rem, 3.2vw, 2.6rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 700, fontStyle: 'italic',
                color: '#C8A340',
                lineHeight: 1.2,
                textShadow: '0 0 35px rgba(200,163,64,0.42), 0 2px 40px rgba(0,0,0,0.98)',
              }}>
              It Was The Beginning.
            </motion.p>
            {/* Season 2 tease */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1.0 }}
              style={{
                fontSize: 'clamp(0.5rem, 0.9vw, 0.72rem)',
                fontFamily: 'monospace',
                color: 'rgba(160,175,220,0.50)',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                marginTop: '8px',
                textShadow: '0 2px 20px rgba(0,0,0,0.95)',
              }}>
              The story continues.
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
