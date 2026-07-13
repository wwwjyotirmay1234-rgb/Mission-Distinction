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
  showStats: boolean;     // year-later analytics card
  nostalgicWarm: boolean; // sepia/amber tone for empty room
  isMap: boolean;         // Odisha light map
};

const FRAMES: Frame[] = [
  {
    // 1 — One year later — analytics 25,368 students
    src: 'char_s5_launch_moment.png', dur: 2500,
    caption: 'One year later.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showStats: true, nostalgicWarm: false, isMap: false,
  },
  {
    // 2 — New students arrive at medical college
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'New dreams. New journeys.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: false, isMap: false,
  },
  {
    // 3 — Discovery — juniors find the app
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'They discover something special.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: false, isMap: false,
  },
  {
    // 4 — The chain continues — seniors mentoring juniors
    src: 's4_shot_h_team_still_going.png', dur: 2500,
    caption: 'The chain continues. Knowledge passed. Growth multiplies.',
    initial: { scale: 1.06, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: false, isMap: false,
  },
  {
    // 5 — Exam season — confidence replacing anxiety
    src: 's1_shot_g_determination.png', dur: 2500,
    caption: 'Different places. Same mission. Exams don\'t scare them anymore.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: false, isMap: false,
  },
  {
    // 6 — Success stories — results, celebrations
    src: 'group_celebration.png', dur: 3000,
    caption: 'Hard work. Right guidance. Real results. Dreams turning into achievements.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: false, isMap: false,
  },
  {
    // 7 — Founders revisit hostel corridor
    src: 's4_shot_a_late_night_coding.png', dur: 3000,
    caption: 'Back to where it all began. The memories remain.',
    initial: { scale: 1.07, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: true, isMap: false,
  },
  {
    // 8 — Empty room — original whiteboard, sunset
    src: 's3_shot_f_whiteboard.png', dur: 3000,
    caption: 'Every great dream starts in a small place.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: true, isMap: false,
  },
  {
    // 9 — The impact — thousands of lights across Odisha
    src: 'scene6_ripple_odisha.png', dur: 3000,
    caption: 'Thousands of students. One mission. One Odisha. One family.',
    initial: { scale: 1.10, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: false, isMap: true,
  },
  {
    // 10 — FINAL ENDING SHOT — rooftop sunrise, golden Odisha
    src: 'group_silhouette.png', dur: 5500,
    caption: '',
    initial: { scale: 1.12, y: '1.0%' }, animate: { scale: 1.0, y: '-0.8%' },
    transition: { duration: 7.5, ease: 'easeOut' },
    cutType: 'dissolve', showStats: false, nostalgicWarm: false, isMap: false,
  },
];

// Odisha city nodes — reused from SceneMovement
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

export function SceneLegacy() {
  const [frameIndex, setFrameIndex]       = useState(0);
  const [flashActive, setFlashActive]     = useState(false);
  const [showCaption, setShowCaption]     = useState(true);
  const [showFinalText, setShowFinalText] = useState(false);
  const [nodePulse, setNodePulse]         = useState(false);
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

      if (frame.isMap) {
        timers.push(setTimeout(() => setNodePulse(true), t + 700));
      }

      cursor += frame.dur;
    });

    // Final text 2.2s into last frame
    const lastStart = FRAMES.slice(0, FRAMES.length - 1).reduce((s, f) => s + f.dur, 0);
    timers.push(setTimeout(() => setShowFinalText(true), lastStart + 2200));

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
          transition={{ duration: 0.70, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={frame.initial}
            animate={frameIndex === i ? frame.animate : frame.initial}
            transition={frameIndex === i ? frame.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${frame.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: frame.nostalgicWarm
                  ? 'brightness(0.82) contrast(1.06) saturate(0.78) sepia(0.22)'
                  : i === 9
                    ? 'brightness(0.80) contrast(1.08) saturate(0.85)'
                    : 'brightness(0.86) contrast(1.05) saturate(0.95)',
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── ANALYTICS CARD — frame 1 ── */}
      <AnimatePresence>
        {current.showStats && (
          <motion.div key="stats-card"
            className="absolute pointer-events-none z-[18]"
            style={{ top: '16%', right: '6%', textAlign: 'right' }}
            initial={{ opacity: 0, y: -16, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}>
            <p style={{
              fontSize: 'clamp(0.45rem, 0.85vw, 0.65rem)',
              letterSpacing: '0.28em',
              color: 'rgba(140,165,255,0.65)',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              textShadow: '0 0 12px rgba(80,120,255,0.4)',
            }}>Total Students</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              style={{
                fontSize: 'clamp(2.4rem, 7.5vw, 6.0rem)',
                fontFamily: 'monospace',
                fontWeight: 900,
                color: 'rgba(80,220,130,0.97)',
                lineHeight: 0.95,
                textShadow: '0 0 50px rgba(60,200,100,0.55), 0 0 25px rgba(60,200,100,0.28), 0 2px 30px rgba(0,0,0,0.98)',
              }}>25,368</motion.p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{
                fontSize: 'clamp(0.45rem, 0.8vw, 0.62rem)',
                color: 'rgba(80,200,120,0.50)',
                fontFamily: 'monospace',
                letterSpacing: '0.16em',
                marginTop: '2px',
              }}>▲ ONE YEAR</motion.p>
            {/* mini stat row */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              style={{ display: 'flex', gap: 'clamp(8px,1.4vw,14px)', justifyContent: 'flex-end', marginTop: '6px' }}>
              {[['1,248', 'Study Notes'], ['3,76,982', 'Questions'], ['32', 'Colleges']].map(([val, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: 'clamp(0.55rem, 1.1vw, 0.85rem)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'rgba(140,180,255,0.80)',
                    textShadow: '0 0 14px rgba(80,120,255,0.35)',
                    margin: 0,
                  }}>{val}</p>
                  <p style={{
                    fontSize: 'clamp(0.38rem, 0.68vw, 0.52rem)',
                    color: 'rgba(140,160,200,0.50)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    margin: 0,
                  }}>{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOSTALGIC AMBER VEIL — frames 7-8 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(200,140,50,0.14) 0%, rgba(180,100,30,0.06) 55%, transparent 78%)',
        }}
        animate={{ opacity: current.nostalgicWarm ? 1 : 0 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── ODISHA MAP OVERLAY — frame 9 ── */}
      <AnimatePresence>
        {current.isMap && nodePulse && (
          <motion.div key="map"
            className="absolute inset-0 pointer-events-none z-[12]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {CITY_NODES.map((from, fi) =>
                CITY_NODES.slice(fi + 1).map((to, ti) => {
                  if (Math.hypot(from.x - to.x, from.y - to.y) > 38) return null;
                  return (
                    <motion.line key={`${fi}-${ti}`}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="rgba(200,163,64,0.32)" strokeWidth="0.28"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: fi * 0.07 + ti * 0.04, duration: 0.9 }}
                    />
                  );
                })
              )}
              {CITY_NODES.map((node, i) => (
                <motion.circle key={node.city}
                  cx={node.x} cy={node.y} r="1.2"
                  fill="rgba(200,163,64,0.90)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.8, 1], opacity: 1 }}
                  transition={{ delay: i * 0.09, duration: 0.65 }}
                  style={{ filter: 'drop-shadow(0 0 2.5px rgba(200,163,64,0.85))' }}
                />
              ))}
            </svg>
            {CITY_NODES.map((node, i) => (
              <motion.span key={node.city}
                className="absolute"
                style={{
                  left: `${node.x + 1.6}%`, top: `${node.y - 2.6}%`,
                  fontSize: 'clamp(0.33rem, 0.62vw, 0.52rem)',
                  color: 'rgba(200,163,64,0.72)',
                  letterSpacing: '0.14em',
                  fontFamily: 'monospace', fontWeight: 700,
                  textShadow: '0 0 8px rgba(0,0,0,0.95)',
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.07, duration: 0.5 }}>
                {node.city}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
              bottom: '15%', left: '7%', maxWidth: '58%',
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

      {/* ── FINAL TEXT — frame 10 ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div key="final"
            className="absolute z-[22] pointer-events-none"
            style={{ bottom: '16%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
            {/* Line 1 */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0, duration: 1.0 }}
              style={{
                fontSize: 'clamp(1.0rem, 2.5vw, 2.0rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(235,215,165,0.90)',
                lineHeight: 1.5,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              Every distinction begins with a decision.
            </motion.p>
            {/* Gold divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '1px',
                background: 'rgba(200,163,64,0.45)',
                margin: 'clamp(5px,0.8vw,9px) 0 clamp(5px,0.8vw,9px) auto',
                transformOrigin: 'right center',
                width: 'clamp(60px,12vw,110px)',
              }}
            />
            {/* Line 2 — gold bold */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1.1 }}
              style={{
                fontSize: 'clamp(1.3rem, 3.2vw, 2.6rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 800,
                color: '#C8A340',
                lineHeight: 1.2,
                letterSpacing: '0.04em',
                textShadow: '0 0 35px rgba(200,163,64,0.42), 0 2px 40px rgba(0,0,0,0.98)',
              }}>
              Mission Distinction.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(0,0,0,0.62) 100%)' }}
      />

      {/* ── FLASH ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-[25]"
        animate={{ opacity: flashActive ? 0.88 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
