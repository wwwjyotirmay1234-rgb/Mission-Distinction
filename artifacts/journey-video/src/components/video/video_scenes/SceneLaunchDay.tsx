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
  screenBlue: boolean;
  counter: number | null;   // download counter to show
  showMessages: boolean;
  celebrate: boolean;
  isOdisha: boolean;
};

const FRAMES: Frame[] = [
  {
    // 1 — The click — LAUNCH button pressed
    src: 'char_s5_launch_moment.png', dur: 2000,
    caption: 'The click.',
    initial: { scale: 1.10 }, animate: { scale: 1.0 },
    transition: { duration: 3.0, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', screenBlue: true, counter: null, showMessages: false, celebrate: false, isOdisha: false,
  },
  {
    // 2 — The wait — five founders staring, silence
    src: 'scene5_launch_day.png', dur: 3000,
    caption: 'The wait.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: true, counter: null, showMessages: false, celebrate: false, isOdisha: false,
  },
  {
    // 3 — First download — counter: 1
    src: 'char_s5_launch_moment.png', dur: 3000,
    caption: 'The first download.',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.3%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: true, counter: 1, showMessages: false, celebrate: false, isOdisha: false,
  },
  {
    // 4 — The first smile — relief
    src: 's4_shot_g_remembering_why.png', dur: 2500,
    caption: 'The first smile.',
    initial: { scale: 1.05, x: '-0.5%' }, animate: { scale: 1.0, x: '0.3%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: false, counter: null, showMessages: false, celebrate: false, isOdisha: false,
  },
  {
    // 5 — Notifications begin — counter: 12
    src: 'scene5_launch_day.png', dur: 2500,
    caption: 'Notifications begin.',
    initial: { scale: 1.06, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: true, counter: 12, showMessages: false, celebrate: false, isOdisha: false,
  },
  {
    // 6 — Momentum — counter: 50
    src: 'char_s5_launch_moment.png', dur: 2500,
    caption: 'Momentum.',
    initial: { scale: 1.07, x: '0.5%' }, animate: { scale: 1.0, x: '-0.3%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: true, counter: 50, showMessages: false, celebrate: false, isOdisha: false,
  },
  {
    // 7 — Messages arrive
    src: 'scene5_launch_day.png', dur: 3000,
    caption: 'Messages from students.',
    initial: { scale: 1.05, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: false, counter: null, showMessages: true, celebrate: false, isOdisha: false,
  },
  {
    // 8 — 150 downloads — celebration
    src: 'group_celebration.png', dur: 3000,
    caption: '150 downloads in 24 hours!',
    initial: { scale: 1.06, y: '0.5%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'flash', screenBlue: false, counter: 150, showMessages: false, celebrate: true, isOdisha: false,
  },
  {
    // 9 — Across Odisha — students everywhere
    src: 'char_s6_odisha_students.png', dur: 3000,
    caption: '',
    initial: { scale: 1.05, x: '-0.5%' }, animate: { scale: 1.0, x: '0.5%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: false, counter: null, showMessages: false, celebrate: false, isOdisha: true,
  },
  {
    // 10 — Rooftop — city lights, final text
    src: 'group_silhouette.png', dur: 5500,
    caption: '',
    initial: { scale: 1.08, y: '0.8%' }, animate: { scale: 1.0, y: '-0.5%' },
    transition: { duration: 7.0, ease: 'easeOut' },
    cutType: 'dissolve', screenBlue: false, counter: null, showMessages: false, celebrate: false, isOdisha: false,
  },
];

const MESSAGES = [
  { text: 'Thank you so much!', time: '11:24 PM' },
  { text: 'This helps a lot.',   time: '11:25 PM' },
  { text: 'Exactly what we needed.', time: '11:26 PM' },
];

export function SceneLaunchDay() {
  const [frameIndex, setFrameIndex]       = useState(0);
  const [flashActive, setFlashActive]     = useState(false);
  const [showCaption, setShowCaption]     = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showFinalText, setShowFinalText] = useState(false);
  const [counterVal, setCounterVal]       = useState<number | null>(null);
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
            setVisibleMessages([]);
            setTimeout(() => {
              setFlashActive(false);
              setFrameIndex(i);
              setCounterVal(frame.counter);
              setTimeout(() => setShowCaption(true), 80);
            }, 110);
          }, t));
        } else {
          timers.push(setTimeout(() => {
            setShowCaption(false);
            setVisibleMessages([]);
            setTimeout(() => {
              setFrameIndex(i);
              setCounterVal(frame.counter);
              setTimeout(() => setShowCaption(true), 120);
            }, 200);
          }, t));
        }
      } else {
        setCounterVal(frame.counter);
      }

      // Stagger message reveals for frame 7 (messages)
      if (frame.showMessages) {
        MESSAGES.forEach((_, mi) => {
          timers.push(setTimeout(() => {
            setVisibleMessages(prev => [...prev, mi]);
          }, t + 400 + mi * 700));
        });
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
                filter: i <= 1
                  ? 'brightness(0.78) contrast(1.10) saturate(0.80)'   // launch tension — dark
                  : i >= 7
                    ? 'brightness(0.90) contrast(1.04) saturate(1.00)' // celebration/rooftop — warm
                    : 'brightness(0.84) contrast(1.06) saturate(0.90)',
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── SCREEN BLUE GLOW — launch tension (frames 1-3, 5-6) ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(40,90,220,0.20) 0%, rgba(20,55,180,0.08) 48%, transparent 72%)',
        }}
        animate={{ opacity: current.screenBlue ? 1 : 0 }}
        transition={{ duration: 0.7 }}
      />

      {/* ── DOWNLOAD COUNTER ── */}
      <AnimatePresence mode="wait">
        {counterVal !== null && (
          <motion.div
            key={`counter-${counterVal}`}
            className="absolute pointer-events-none z-[15]"
            style={{ top: '17%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, scale: 0.85, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <p style={{
              fontSize: 'clamp(0.5rem, 1vw, 0.75rem)',
              letterSpacing: '0.3em',
              color: 'rgba(140,170,255,0.7)',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              textShadow: '0 0 16px rgba(80,120,255,0.5)',
            }}>Downloads</p>
            <motion.p
              key={`num-${counterVal}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              style={{
                fontSize: counterVal >= 100
                  ? 'clamp(2.4rem, 7vw, 5.5rem)'
                  : 'clamp(2.8rem, 8.5vw, 6.5rem)',
                fontFamily: 'monospace',
                fontWeight: 800,
                color: counterVal >= 100 ? 'rgba(80,220,120,0.95)' : 'rgba(100,180,255,0.95)',
                lineHeight: 1,
                textShadow: counterVal >= 100
                  ? '0 0 40px rgba(60,200,100,0.6), 0 2px 30px rgba(0,0,0,0.95)'
                  : '0 0 40px rgba(60,120,255,0.6), 0 2px 30px rgba(0,0,0,0.95)',
              }}>
              {counterVal}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MESSAGE BUBBLES — frame 7 ── */}
      <AnimatePresence>
        {current.showMessages && (
          <motion.div
            key="messages"
            className="absolute pointer-events-none z-[15]"
            style={{ top: '18%', left: '6%' }}>
            {MESSAGES.map((msg, i) => (
              visibleMessages.includes(i) && (
                <motion.div
                  key={i}
                  className="mb-2"
                  initial={{ opacity: 0, x: -14, y: 4 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}>
                  <div style={{
                    background: 'rgba(20,30,60,0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(80,120,255,0.25)',
                    borderRadius: '10px 10px 10px 2px',
                    padding: 'clamp(6px,1.2vw,10px) clamp(10px,1.8vw,16px)',
                    display: 'inline-block',
                    maxWidth: 'clamp(160px, 28vw, 240px)',
                  }}>
                    <p style={{
                      fontSize: 'clamp(0.7rem, 1.3vw, 1.0rem)',
                      color: 'rgba(220,230,255,0.92)',
                      fontWeight: 400,
                      margin: 0,
                      textShadow: 'none',
                    }}>{msg.text}</p>
                    <p style={{
                      fontSize: 'clamp(0.5rem, 0.85vw, 0.65rem)',
                      color: 'rgba(140,160,210,0.65)',
                      margin: '3px 0 0',
                      textAlign: 'right',
                    }}>{msg.time}</p>
                  </div>
                </motion.div>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CELEBRATION GLOW — frame 8 ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,200,60,0.20) 0%, rgba(255,140,30,0.08) 45%, transparent 70%)',
        }}
        animate={{ opacity: current.celebrate ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* ── ACROSS ODISHA — location labels — frame 9 ── */}
      <AnimatePresence>
        {current.isOdisha && (
          <motion.div key="odisha-labels"
            className="absolute pointer-events-none z-[15]"
            style={{ bottom: '16%', left: 0, right: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(12px, 3vw, 28px)',
              flexWrap: 'wrap',
            }}>
              {['Hostels', 'Libraries', 'Buses', 'Study Rooms', 'Dormitories', 'Everywhere in Odisha'].map((label, i) => (
                <motion.span key={label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  style={{
                    fontSize: 'clamp(0.55rem, 1.0vw, 0.8rem)',
                    color: i === 5 ? 'rgba(200,163,64,0.85)' : 'rgba(180,200,240,0.70)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    textShadow: '0 0 14px rgba(0,0,0,0.95)',
                    fontWeight: i === 5 ? 700 : 400,
                  }}>
                  {label}
                </motion.span>
              ))}
            </div>
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
            key={`caption-${frameIndex}`}
            className="absolute pointer-events-none z-[20] font-serif italic"
            style={{
              bottom: '15%',
              left: '7%',
              fontSize: 'clamp(0.85rem, 1.8vw, 1.4rem)',
              color: 'rgba(220,200,150,0.82)',
              letterSpacing: '0.04em',
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

      {/* ── FINAL TEXT — frame 10 (rooftop) ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div key="final" className="absolute z-[20] pointer-events-none"
            style={{ bottom: '16%', left: '7%' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            {/* Line 1 */}
            <p style={{
              fontSize: 'clamp(0.9rem, 2.1vw, 1.7rem)',
              fontFamily: 'var(--font-display, serif)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'rgba(230,215,175,0.90)',
              lineHeight: 1.55,
              textShadow: '0 2px 36px rgba(0,0,0,0.98)',
            }}>We didn&apos;t just build an app.</p>
            {/* Line 2 — "movement" in gold */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 1.0 }}
              style={{
                fontSize: 'clamp(0.9rem, 2.1vw, 1.7rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'rgba(230,215,175,0.90)',
                lineHeight: 1.55,
                textShadow: '0 2px 36px rgba(0,0,0,0.98)',
              }}>
              We started a{' '}
              <span style={{ color: '#C8A340', fontWeight: 600, textShadow: '0 0 24px rgba(200,163,64,0.5), 0 2px 36px rgba(0,0,0,0.98)' }}>
                movement.
              </span>
            </motion.p>
            {/* Line 3 — "beginning" in blue */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 1.0 }}
              style={{
                fontSize: 'clamp(0.9rem, 2.1vw, 1.7rem)',
                fontFamily: 'var(--font-display, serif)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'rgba(230,215,175,0.90)',
                lineHeight: 1.55,
                textShadow: '0 2px 36px rgba(0,0,0,0.98)',
              }}>
              This is just the{' '}
              <span style={{ color: 'rgba(100,180,255,0.95)', fontWeight: 600, textShadow: '0 0 24px rgba(80,150,255,0.5), 0 2px 36px rgba(0,0,0,0.98)' }}>
                beginning.
              </span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MD LOGO + TAGLINE — frame 10 bottom-right ── */}
      <AnimatePresence>
        {showFinalText && (
          <motion.div key="md-logo" className="absolute z-[20] pointer-events-none"
            style={{ bottom: '16%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.4, duration: 1.2, ease: 'easeOut' }}>
            <p style={{
              fontSize: 'clamp(1.3rem, 3.0vw, 2.4rem)',
              fontFamily: 'var(--font-display, serif)',
              fontWeight: 800,
              color: 'rgba(200,163,64,0.95)',
              letterSpacing: '0.06em',
              textShadow: '0 0 30px rgba(200,163,64,0.4), 0 2px 30px rgba(0,0,0,0.95)',
              lineHeight: 1.1,
            }}>MISSION DISTINCTION</p>
            <p style={{
              fontSize: 'clamp(0.5rem, 1.0vw, 0.8rem)',
              color: 'rgba(180,200,240,0.65)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontStyle: 'italic',
              marginTop: '4px',
              textShadow: '0 2px 20px rgba(0,0,0,0.9)',
            }}>Together, we learn. Together, we rise.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(0,0,0,0.60) 100%)' }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-[25]"
        animate={{ opacity: flashActive ? 0.92 : 0 }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}
