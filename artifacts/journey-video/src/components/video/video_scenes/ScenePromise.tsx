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
  morningWarm: boolean;
  showMessage: boolean;
  showFuture: boolean;
  isMap: boolean;
};

const FRAMES: Frame[] = [
  {
    // 1 — Quiet morning — the room where it all began
    src: 's4_shot_d_sunrise_window.png', dur: 3000,
    caption: 'The room where it all began.',
    initial: { scale: 1.08, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: true, showMessage: false, showFuture: false, isMap: false,
  },
  {
    // 2 — Looking back — old photos
    src: 'group_portrait.png', dur: 2500,
    caption: 'Not just memories. Our foundation.',
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: true, showMessage: false, showFuture: false, isMap: false,
  },
  {
    // 3 — Remembering the struggle — montage memories
    src: 's4_shot_c_exhausted_3am.png', dur: 2500,
    caption: 'Sleepless nights. Failed attempts. Never giving up.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: false, showMessage: false, showFuture: false, isMap: false,
  },
  {
    // 4 — New message arrives
    src: 'char_s5_launch_moment.png', dur: 3000,
    caption: 'Messages like this. That\'s the real reward.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: false, showMessage: true, showFuture: false, isMap: false,
  },
  {
    // 5 — Silent smile
    src: 'char_s3_sunrise_determined.png', dur: 3000,
    caption: 'A small message. A lifetime of meaning.',
    initial: { scale: 1.06, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: true, showMessage: false, showFuture: false, isMap: false,
  },
  {
    // 6 — Team reunion
    src: 's3_shot_e_brainstorm.png', dur: 2500,
    caption: 'Different days. Same bond. One mission.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: true, showMessage: false, showFuture: false, isMap: false,
  },
  {
    // 7 — Bigger vision — whiteboard: THE FUTURE
    src: 's3_shot_f_whiteboard.png', dur: 2500,
    caption: 'Ideas today. Impact tomorrow.',
    initial: { scale: 1.07, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: false, showMessage: false, showFuture: true, isMap: false,
  },
  {
    // 8 — Looking ahead — rooftop sunset silhouette
    src: 'group_silhouette.png', dur: 3000,
    caption: 'We built the beginning. Now we build the future.',
    initial: { scale: 1.08, y: '-0.6%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: false, showMessage: false, showFuture: false, isMap: false,
  },
  {
    // 9 — Endless journey — golden Odisha map
    src: 'scene6_ripple_odisha.png', dur: 3000,
    caption: 'From every hostel. From every heart. Connected.',
    initial: { scale: 1.10, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 5.5, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: false, showMessage: false, showFuture: false, isMap: true,
  },
  {
    // 10 — FINAL FRAME — epic sunrise, silhouettes
    src: 'group_silhouette.png', dur: 6000,
    caption: '',
    initial: { scale: 1.14, y: '1.2%' }, animate: { scale: 1.0, y: '-1.0%' },
    transition: { duration: 8.0, ease: 'easeOut' },
    cutType: 'dissolve', morningWarm: false, showMessage: false, showFuture: false, isMap: false,
  },
];

const CITY_NODES = [
  { x: 70, y: 60 }, { x: 72, y: 50 }, { x: 30, y: 35 },
  { x: 68, y: 78 }, { x: 20, y: 18 }, { x: 38, y: 52 },
  { x: 48, y: 82 }, { x: 22, y: 28 }, { x: 38, y: 32 }, { x: 80, y: 20 },
];

const FUTURE_BULLETS = [
  'AI Doubt Solver', 'Do Anatomy', 'Practical Hub',
  'Community Growth', 'Personalized Learning', 'More Colleges', 'More Impact',
];

export function ScenePromise() {
  const [frameIndex, setFrameIndex]       = useState(0);
  const [flashActive, setFlashActive]     = useState(false);
  const [showCaption, setShowCaption]     = useState(true);
  const [showFinalText, setShowFinalText] = useState(false);
  const [nodePulse, setNodePulse]         = useState(false);
  const [bulletCount, setBulletCount]     = useState(0);
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
            setBulletCount(0);
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
            setBulletCount(0);
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

      if (frame.showFuture) {
        FUTURE_BULLETS.forEach((_, bi) => {
          timers.push(setTimeout(() => setBulletCount(bi + 1), t + 400 + bi * 280));
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
                filter: i === 9
                  ? 'brightness(0.76) contrast(1.12) saturate(1.12)'   // golden sunrise
                  : i === 2
                    ? 'brightness(0.74) contrast(1.10) saturate(0.72) sepia(0.18)' // dark struggle
                    : frame.morningWarm
                      ? 'brightness(0.88) contrast(1.04) saturate(1.05)'
                      : 'brightness(0.84) contrast(1.06) saturate(0.92)',
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── MORNING WARM OVERLAY — frames 1,2,5,6 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 55% 30%, rgba(255,175,55,0.18) 0%, rgba(255,120,25,0.07) 48%, transparent 72%)',
        }}
        animate={{ opacity: current.morningWarm ? 1 : 0 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── MESSAGE BUBBLE — frame 4 ── */}
      <AnimatePresence>
        {current.showMessage && (
          <motion.div key="msg-bubble"
            className="absolute pointer-events-none z-[18]"
            style={{ top: '16%', left: '6%' }}
            initial={{ opacity: 0, x: -16, y: 4 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{
              background: 'rgba(18,28,58,0.90)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(100,140,255,0.22)',
              borderRadius: '12px 12px 12px 3px',
              padding: 'clamp(8px,1.4vw,14px) clamp(12px,2vw,20px)',
              maxWidth: 'clamp(180px,30vw,270px)',
            }}>
              <p style={{
                fontSize: 'clamp(0.48rem, 0.85vw, 0.68rem)',
                color: 'rgba(140,165,255,0.65)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                marginBottom: '6px',
              }}>An MBBS Student</p>
              <p style={{
                fontSize: 'clamp(0.68rem, 1.25vw, 1.0rem)',
                color: 'rgba(215,225,255,0.90)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}>
                "Bhaiya, I just wanted to say thank you. Because of Mission Distinction, I was
                able to clear my doubts and score better in my exams. It really helped me when
                I felt like giving up. You all are doing something truly amazing.{' '}
                <span style={{ color: 'rgba(200,163,64,0.9)' }}>❤️</span>"
              </p>
              <p style={{
                fontSize: 'clamp(0.42rem, 0.72vw, 0.56rem)',
                color: 'rgba(120,140,200,0.50)',
                textAlign: 'right',
                marginTop: '6px',
                fontFamily: 'monospace',
              }}>11:47 PM</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FUTURE BOARD — frame 7 ── */}
      <AnimatePresence>
        {current.showFuture && bulletCount > 0 && (
          <motion.div key="future"
            className="absolute pointer-events-none z-[18]"
            style={{ top: '16%', left: '5%' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <p style={{
              fontSize: 'clamp(0.6rem, 1.2vw, 0.95rem)',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: 'rgba(200,163,64,0.80)',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              textShadow: '0 0 14px rgba(200,163,64,0.35)',
              marginBottom: '8px',
            }}>THE FUTURE</p>
            {FUTURE_BULLETS.slice(0, bulletCount).map((b, i) => (
              <motion.p key={b}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: 'clamp(0.58rem, 1.05vw, 0.82rem)',
                  color: 'rgba(200,215,255,0.75)',
                  fontFamily: 'monospace',
                  lineHeight: 1.8,
                  textShadow: '0 2px 16px rgba(0,0,0,0.95)',
                }}>
                · {b}
              </motion.p>
            ))}
            {bulletCount >= FUTURE_BULLETS.length && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{
                  marginTop: '8px',
                  fontSize: 'clamp(0.55rem, 1.0vw, 0.80rem)',
                  color: 'rgba(200,163,64,0.65)',
                  fontFamily: 'var(--font-display, serif)',
                  fontStyle: 'italic',
                  letterSpacing: '0.06em',
                  textShadow: '0 0 14px rgba(200,163,64,0.30)',
                }}>
                Mission Distinction 2.0
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUNRISE RADIAL — frame 10 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 82%, rgba(255,155,30,0.32) 0%, rgba(255,100,20,0.14) 38%, transparent 65%)',
        }}
        animate={{ opacity: isLast ? 1 : 0 }}
        transition={{ duration: 2.0 }}
      />

      {/* ── ODISHA MAP — frame 9 ── */}
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
                      transition={{ delay: fi * 0.08 + ti * 0.05, duration: 0.9 }}
                    />
                  );
                })
              )}
              {CITY_NODES.map((node, i) => (
                <motion.circle key={i}
                  cx={node.x} cy={node.y} r="1.2"
                  fill="rgba(200,163,64,0.90)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.8, 1], opacity: 1 }}
                  transition={{ delay: i * 0.09, duration: 0.65 }}
                  style={{ filter: 'drop-shadow(0 0 2.5px rgba(200,163,64,0.85))' }}
                />
              ))}
            </svg>
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
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0, duration: 1.1 }}
              style={{
                fontSize: 'clamp(0.88rem, 2.0vw, 1.6rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(235,215,165,0.90)',
                lineHeight: 1.55,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              Every student deserves a chance.
            </motion.p>
            {/* Line 2 */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 1.1 }}
              style={{
                fontSize: 'clamp(0.88rem, 2.0vw, 1.6rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(235,215,165,0.90)',
                lineHeight: 1.55,
                textShadow: '0 2px 40px rgba(0,0,0,0.98)',
              }}>
              Every dream deserves support.
            </motion.p>
            {/* Gold divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.9, ease: 'easeOut' }}
              style={{
                height: '1px',
                background: 'linear-gradient(to left, rgba(200,163,64,0.60), transparent)',
                margin: 'clamp(6px,1vw,10px) 0 clamp(6px,1vw,10px) auto',
                transformOrigin: 'right center',
                width: 'clamp(80px,18vw,160px)',
              }}
            />
            {/* MISSION DISTINCTION — largest gold */}
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 'clamp(1.5rem, 3.8vw, 3.0rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: '#C8A340',
                lineHeight: 1.1,
                textShadow: '0 0 45px rgba(200,163,64,0.45), 0 0 22px rgba(200,163,64,0.22), 0 2px 40px rgba(0,0,0,0.98)',
              }}>
              MISSION DISTINCTION.
            </motion.p>
            {/* The Mission Continues */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 1.2 }}
              style={{
                fontSize: 'clamp(0.78rem, 1.7vw, 1.35rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(215,225,255,0.78)',
                letterSpacing: '0.08em',
                marginTop: '4px',
                textShadow: '0 2px 30px rgba(0,0,0,0.95)',
              }}>
              The Mission Continues.
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
