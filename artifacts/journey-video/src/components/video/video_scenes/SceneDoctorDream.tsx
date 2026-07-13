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
  yearTicker: boolean;     // animated year counter
  goldGlow: boolean;       // graduation warm glow
  isMap: boolean;          // doctor silhouette map
  doctorBlue: boolean;     // hospital cool blue overlay
};

const FRAMES: Frame[] = [
  {
    // 1 — Years pass — calendar pages, books closing
    src: 's4_shot_e_months_later.png', dur: 2500,
    caption: 'Years pass. Dreams stay.',
    initial: { scale: 1.10, y: '0.8%' }, animate: { scale: 1.0, y: '-0.8%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: true, goldGlow: false, isMap: false, doctorBlue: false,
  },
  {
    // 2 — Final MBBS exam — older, confident, focused
    src: 's1_shot_f_lecture_hall_wide.png', dur: 2500,
    caption: 'The final step. The biggest test.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: false, doctorBlue: false,
  },
  {
    // 3 — Results day — anxiety → overwhelming joy
    src: 'group_celebration.png', dur: 2500,
    caption: 'Anxiety turns into joy.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: false, doctorBlue: false,
  },
  {
    // 4 — Graduation — white coats, certificates, golden sunset
    src: 'group_celebration.png', dur: 3000,
    caption: 'The reward of every sleepless night.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'flash', yearTicker: false, goldGlow: true, isMap: false, doctorBlue: false,
  },
  {
    // 5 — First day as doctors — stethoscopes, hospital entrance
    src: 'group_silhouette.png', dur: 3000,
    caption: 'First day. New role. New responsibility.',
    initial: { scale: 1.07, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: false, doctorBlue: true,
  },
  {
    // 6 — Saving lives — treating patients with compassion
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'From knowledge to care. From students to healers.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: false, doctorBlue: true,
  },
  {
    // 7 — Ripple effect — doctors across Odisha
    src: 'char_s6_odisha_students.png', dur: 2500,
    caption: 'Many places. Many lives. One mission.',
    initial: { scale: 1.05, x: '-0.5%' }, animate: { scale: 1.0, x: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: false, doctorBlue: false,
  },
  {
    // 8 — Founder reflection — hospital corridor, quiet pride
    src: 'char_s3_sunrise_determined.png', dur: 3000,
    caption: 'Seeing the dream come alive.',
    initial: { scale: 1.07, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: false, doctorBlue: false,
  },
  {
    // 9 — Real achievement — lights → doctor silhouettes across Odisha
    src: 'scene6_ripple_odisha.png', dur: 3000,
    caption: 'Thousands of dreams. One impact.',
    initial: { scale: 1.10, y: '0.6%' }, animate: { scale: 1.0, y: '-0.6%' },
    transition: { duration: 5.5, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: true, doctorBlue: false,
  },
  {
    // 10 — ULTIMATE FINAL — sunrise hilltop, white coats in the wind
    src: 'group_silhouette.png', dur: 6000,
    caption: '',
    initial: { scale: 1.14, y: '1.2%' }, animate: { scale: 1.0, y: '-1.0%' },
    transition: { duration: 8.0, ease: 'easeOut' },
    cutType: 'dissolve', yearTicker: false, goldGlow: false, isMap: false, doctorBlue: false,
  },
];

const YEARS = ['2025', '2026', '2027', '2028', '2029'];

const CITY_NODES = [
  { x: 70, y: 60 }, { x: 72, y: 50 }, { x: 30, y: 35 },
  { x: 68, y: 78 }, { x: 20, y: 18 }, { x: 38, y: 52 },
  { x: 48, y: 82 }, { x: 22, y: 28 }, { x: 38, y: 32 }, { x: 80, y: 20 },
];

export function SceneDoctorDream() {
  const [frameIndex, setFrameIndex]       = useState(0);
  const [flashActive, setFlashActive]     = useState(false);
  const [showCaption, setShowCaption]     = useState(true);
  const [showFinalText, setShowFinalText] = useState(false);
  const [yearIdx, setYearIdx]             = useState(0);
  const [nodePulse, setNodePulse]         = useState(false);
  const builtTimers = useRef(false);

  const current = FRAMES[frameIndex];
  const isLast  = frameIndex === FRAMES.length - 1;

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;

    let cursor = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // year ticker ticks during frame 1
    YEARS.forEach((_, yi) => {
      timers.push(setTimeout(() => setYearIdx(yi), yi * 420));
    });

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
            }, 130);
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

    const lastStart = FRAMES.slice(0, FRAMES.length - 1).reduce((s, f) => s + f.dur, 0);
    timers.push(setTimeout(() => setShowFinalText(true), lastStart + 2200));

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
          transition={{ duration: frame.cutType === 'flash' ? 0.08 : 0.75, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={frame.initial}
            animate={frameIndex === i ? frame.animate : frame.initial}
            transition={frameIndex === i ? frame.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${frame.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: i === 9
                  ? 'brightness(0.76) contrast(1.12) saturate(1.10)'   // sunrise gold, warm
                  : frame.doctorBlue
                    ? 'brightness(0.80) contrast(1.08) saturate(0.80)' // hospital cool
                    : i === 0
                      ? 'brightness(0.82) contrast(1.05) saturate(0.80) sepia(0.18)' // nostalgic
                      : 'brightness(0.86) contrast(1.05) saturate(0.95)',
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── YEAR TICKER — frame 1 ── */}
      <AnimatePresence>
        {current.yearTicker && (
          <motion.div key="year-ticker"
            className="absolute pointer-events-none z-[18]"
            style={{ top: '17%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <p style={{
              fontSize: 'clamp(0.42rem, 0.78vw, 0.60rem)',
              letterSpacing: '0.32em',
              color: 'rgba(200,163,64,0.55)',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              textShadow: '0 0 10px rgba(0,0,0,0.9)',
            }}>Year</p>
            <AnimatePresence mode="wait">
              <motion.p key={yearIdx}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 1.05 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                style={{
                  fontSize: 'clamp(2.8rem, 8vw, 6.5rem)',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  color: 'rgba(200,163,64,0.90)',
                  lineHeight: 0.95,
                  textShadow: '0 0 50px rgba(200,163,64,0.40), 0 2px 30px rgba(0,0,0,0.98)',
                }}>
                {YEARS[yearIdx]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GRADUATION GOLD GLOW — frame 4 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 38%, rgba(255,195,60,0.22) 0%, rgba(255,140,30,0.09) 48%, transparent 72%)',
        }}
        animate={{ opacity: current.goldGlow ? 1 : 0 }}
        transition={{ duration: 0.9 }}
      />

      {/* ── HOSPITAL BLUE OVERLAY — frames 5-6 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(20,70,200,0.14) 0%, rgba(10,40,160,0.06) 55%, transparent 78%)',
        }}
        animate={{ opacity: current.doctorBlue ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* ── DOCTOR ICON MAP — frame 9 ── */}
      <AnimatePresence>
        {current.isMap && nodePulse && (
          <motion.div key="doctor-map"
            className="absolute inset-0 pointer-events-none z-[12]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* connection lines */}
              {CITY_NODES.map((from, fi) =>
                CITY_NODES.slice(fi + 1).map((to, ti) => {
                  if (Math.hypot(from.x - to.x, from.y - to.y) > 38) return null;
                  return (
                    <motion.line key={`l-${fi}-${ti}`}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="rgba(200,163,64,0.28)" strokeWidth="0.25"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: fi * 0.07 + ti * 0.04, duration: 1.0 }}
                    />
                  );
                })
              )}
              {/* doctor silhouette icons — stylised person symbol */}
              {CITY_NODES.map((node, i) => (
                <motion.g key={`doc-${i}`}
                  transform={`translate(${node.x},${node.y})`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}>
                  {/* head */}
                  <circle cx="0" cy="-2.8" r="1.0"
                    fill="rgba(200,163,64,0.88)"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(200,163,64,0.80))' }}
                  />
                  {/* body */}
                  <rect x="-0.9" y="-1.7" width="1.8" height="2.4" rx="0.4"
                    fill="rgba(200,163,64,0.88)" />
                  {/* stethoscope arc hint */}
                  <path d="M -0.6,-1.0 Q 0,-0.2 0.6,-1.0"
                    stroke="rgba(255,255,255,0.55)" strokeWidth="0.22" fill="none" />
                </motion.g>
              ))}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUNRISE WARM OVERLAY — frame 10 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(255,160,30,0.30) 0%, rgba(255,100,20,0.14) 40%, transparent 68%)',
        }}
        animate={{ opacity: isLast ? 1 : 0 }}
        transition={{ duration: 2.0 }}
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

      {/* ── ULTIMATE FINAL TEXT — frame 10 ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div key="final"
            className="absolute z-[22] pointer-events-none"
            style={{ bottom: '16%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
            {/* Line 1 */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0, duration: 1.2 }}
              style={{
                fontSize: 'clamp(0.88rem, 2.0vw, 1.6rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(235,215,165,0.88)',
                lineHeight: 1.5,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              Every Doctor Was Once
            </motion.p>
            {/* Line 2 */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 1.2 }}
              style={{
                fontSize: 'clamp(0.88rem, 2.0vw, 1.6rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(235,215,165,0.88)',
                lineHeight: 1.5,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              A Student Searching For A Way Forward.
            </motion.p>
            {/* Gold divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.9, ease: 'easeOut' }}
              style={{
                height: '1px',
                background: 'linear-gradient(to left, rgba(200,163,64,0.55), transparent)',
                margin: 'clamp(6px,1vw,10px) 0 clamp(6px,1vw,10px) auto',
                transformOrigin: 'right center',
                width: 'clamp(80px,18vw,160px)',
              }}
            />
            {/* MISSION DISTINCTION — large gold */}
            <motion.p
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: '#C8A340',
                lineHeight: 1.1,
                textShadow: '0 0 40px rgba(200,163,64,0.40), 0 0 20px rgba(200,163,64,0.20), 0 2px 40px rgba(0,0,0,0.98)',
              }}>
              MISSION DISTINCTION.
            </motion.p>
            {/* The Journey Continues */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 2.1, duration: 1.1 }}
              style={{
                fontSize: 'clamp(0.70rem, 1.5vw, 1.2rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(210,220,240,0.72)',
                letterSpacing: '0.12em',
                marginTop: '4px',
                textShadow: '0 2px 30px rgba(0,0,0,0.95)',
              }}>
              The Journey Continues.
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
        animate={{ opacity: flashActive ? 0.92 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
