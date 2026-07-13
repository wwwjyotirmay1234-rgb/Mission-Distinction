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
  showRain: boolean;     // rain only where window is visible
  showSyllabus: boolean; // "So much syllabus..." during reading shots
  showPhone: boolean;    // phone screen glow + "no resources found"
};

const SHOTS: Shot[] = [
  {
    src: 's0_shot_a_clock.png', dur: 2200,
    initial: { scale: 1.08, x: '1%', y: '-1%' },
    animate: { scale: 1.0, x: '0%', y: '0%' },
    transition: { duration: 2.5, ease: 'easeOut' },
    cutType: 'flash', showRain: true, showSyllabus: false, showPhone: false,
  },
  {
    src: 's0_shot_b_wide.png', dur: 2600,
    initial: { scale: 1.06, y: '-1.5%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3, ease: 'easeOut' },
    cutType: 'dissolve', showRain: true, showSyllabus: false, showPhone: false,
  },
  {
    // Shot 3 — student searches phone for study material, finds nothing
    src: 'student_desk_overhead.png', dur: 3500,
    initial: { scale: 1.05, y: '-1%' },
    animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 4, ease: 'easeOut' },
    cutType: 'dissolve', showRain: false, showSyllabus: false, showPhone: true,
  },
  {
    // writing hand — "So much syllabus to cover..." starts here
    src: 's0_shot_c_writing.png', dur: 2200,
    initial: { scale: 1.05, x: '-1.5%' },
    animate: { scale: 1.02, x: '1.5%' },
    transition: { duration: 2.4, ease: 'linear' },
    cutType: 'dissolve', showRain: false, showSyllabus: true, showPhone: false,
  },
  {
    // exhausted face close-up
    src: 's0_shot_d_face_down.png', dur: 2500,
    initial: { scale: 1.0, y: '1%' },
    animate: { scale: 1.06, y: '0%' },
    transition: { duration: 2.8, ease: 'easeIn' },
    cutType: 'dissolve', showRain: false, showSyllabus: true, showPhone: false,
  },
  {
    // anatomy notebook
    src: 's0_shot_e_notebook.png', dur: 2000,
    initial: { scale: 1.04, x: '1%', y: '1%' },
    animate: { scale: 1.0, x: '-1%', y: '0%' },
    transition: { duration: 2.2, ease: 'linear' },
    cutType: 'dissolve', showRain: false, showSyllabus: true, showPhone: false,
  },
  {
    // rainy window profile — rain overlay active
    src: 's0_shot_f_window.png', dur: 2500,
    initial: { scale: 1.03, x: '0.5%' },
    animate: { scale: 1.0, x: '0%' },
    transition: { duration: 2.8, ease: 'easeOut' },
    cutType: 'dissolve', showRain: true, showSyllabus: false, showPhone: false,
  },
  {
    // extreme eye close-up — flash cut
    src: 's0_shot_g_eye.png', dur: 2000,
    initial: { scale: 1.14 },
    animate: { scale: 1.0 },
    transition: { duration: 2.2, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', showRain: false, showSyllabus: false, showPhone: false,
  },
  {
    // exhausted face, awake — "Will I fail?" appears here (index 8)
    src: 'student_darknight.png', dur: 4000,
    initial: { scale: 1.04, y: '-1%' },
    animate: { scale: 1.0, y: '1%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showRain: false, showSyllabus: false, showPhone: false,
  },
];

// Heavy rain — 70 drops, clearly visible, varied weight
const RAIN_DROPS = Array.from({ length: 70 }, (_, i) => ({
  left: `${(i * 1.44 + (i % 7) * 1.2) % 100}%`,
  height: `${60 + (i % 7) * 22}px`,
  width: i % 5 === 0 ? '2px' : '1.5px',       // occasional thick drop
  duration: 0.32 + (i % 8) * 0.06,             // fast falling rain
  delay: (i * 0.09) % 1.8,
  opacity: 0.18 + (i % 5) * 0.09,              // 0.18–0.54 — clearly visible
  blur: i % 6 === 0 ? 'blur(0.5px)' : 'none',  // depth variation
}));

export function Scene0() {
  const [shotIndex, setShotIndex] = useState(0);
  const [phase, setPhase] = useState<'shots' | 'question' | 'out'>('shots');
  const [flashActive, setFlashActive] = useState(false);
  const [tick, setTick] = useState(false);
  const builtTimers = useRef(false);

  const currentShot = SHOTS[shotIndex];

  useSceneSpeech([
    { atPhase: 8, text: 'Will I fail?' },
  ], shotIndex);

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

    // "Will I fail in exam?" fades in 1.5s after slump shot starts (student_darknight, index 8)
    const slumpStart = SHOTS.slice(0, 8).reduce((s, sh) => s + sh.dur, 0);
    timers.push(setTimeout(() => setPhase('question'), slumpStart + 1500));
    // 'out' removed — AnimatePresence handles scene exit; question stays visible until scene ends

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
          transition={{ duration: shot.cutType === 'flash' ? 0.08 : 0.5, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={shot.initial}
            animate={shotIndex === i ? shot.animate : shot.initial}
            transition={shotIndex === i ? shot.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${shot.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.9) contrast(1.04) saturate(0.95)' }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── SHOT-SPECIFIC OVERLAYS ── */}

      {/* Shot A — red clock glow pulse */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '30%', bottom: '20%', width: '20%', height: '22%',
          background: 'radial-gradient(ellipse, rgba(255,20,0,0.22) 0%, transparent 70%)',
        }}
        animate={{ opacity: shotIndex === 0 ? (tick ? 0.9 : 0.3) : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Shots D / G — warm amber lamp glow on face */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '5%', top: '5%', width: '42%', height: '50%',
          background: 'radial-gradient(ellipse at 15% 12%, rgba(255,180,60,0.1) 0%, transparent 65%)',
        }}
        animate={{ opacity: (shotIndex === 4 || shotIndex === 7) ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Shots C / D / E — pulsing amber book glow */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '0%', bottom: '12%', width: '100%', height: '50%',
          background: 'radial-gradient(ellipse at 50% 85%, rgba(200,163,64,0.35) 0%, rgba(200,130,30,0.16) 38%, transparent 72%)',
        }}
        animate={currentShot.showSyllabus
          ? { opacity: [0, 1, 0.65, 1, 0.7, 1], scale: [0.96, 1, 1.02, 1, 1.01, 1] }
          : { opacity: 0, scale: 1 }}
        transition={currentShot.showSyllabus
          ? { duration: 3.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }
          : { duration: 0.5 }}
      />
      {/* Secondary sharper highlight on book spine area */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '15%', bottom: '14%', width: '70%', height: '28%',
          background: 'radial-gradient(ellipse at 50% 90%, rgba(255,200,80,0.18) 0%, transparent 65%)',
        }}
        animate={currentShot.showSyllabus
          ? { opacity: [0, 0.8, 0.4, 0.9, 0.5, 0.8] }
          : { opacity: 0 }}
        transition={currentShot.showSyllabus
          ? { duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror', delay: 0.4 }
          : { duration: 0.4 }}
      />

      {/* ── PHONE FRUSTRATION OVERLAY — Shot 3 (index 2) ── */}
      {/* Blue phone-screen glow suggesting student scrolling for study material */}
      <motion.div className="absolute pointer-events-none z-4"
        style={{
          left: '30%', top: '38%', width: '40%', height: '38%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(80,130,230,0.18) 0%, rgba(60,100,200,0.07) 55%, transparent 80%)',
          borderRadius: '8%',
        }}
        animate={{ opacity: currentShot.showPhone ? [0, 1, 0.7, 1, 0.6, 0] : 0 }}
        transition={currentShot.showPhone
          ? { duration: 3.2, times: [0, 0.15, 0.4, 0.65, 0.85, 1.0], ease: 'easeInOut' }
          : { duration: 0.3 }}
      />
      {/* "No useful resources found" — phone screen text */}
      <AnimatePresence>
        {currentShot.showPhone && (
          <motion.p key="phone-text"
            className="absolute pointer-events-none z-5 text-center font-mono"
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
            transition={{ duration: 3.0, times: [0, 0.25, 0.4, 0.75, 1.0] }}>
            no useful resources found
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── RAIN — only on shots where window is visible ── */}
      <motion.div className="absolute inset-0 z-4 pointer-events-none overflow-hidden"
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


      {/* Syllabus caption — shots C, D, E (showSyllabus: true) — bottom subtitle position */}
      <motion.p
        className="absolute z-15 w-full text-center pointer-events-none font-mono"
        style={{
          bottom: '16%',
          fontSize: 'clamp(0.7rem, 1.4vw, 1.1rem)',
          letterSpacing: '0.26em',
          color: 'rgba(200,163,64,0.72)',
          fontStyle: 'italic',
          textShadow: '0 2px 28px rgba(0,0,0,0.98), 0 0 40px rgba(200,163,64,0.3)',
        }}
        animate={{ opacity: currentShot.showSyllabus ? 1 : 0 }}
        transition={{ duration: 0.9 }}
      >
        So much syllabus to cover.
      </motion.p>

      {/* Gradient for text legibility during question phase */}
      <motion.div className="absolute inset-0 z-5 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.96) 0%, rgba(2,3,12,0.2) 25%, transparent 55%)' }}
        animate={{ opacity: phase === 'shots' ? 0.25 : 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-20"
        animate={{ opacity: flashActive ? 0.85 : 0 }}
        transition={{ duration: 0.05 }}
      />

      {/* ── TEXT OVERLAYS ── */}

      {/* "Will I fail?" — the BIG question, appears while head slumps on desk */}
      <AnimatePresence>
        {(phase === 'question' || phase === 'out') && (
          <motion.div
            key="question"
            className="absolute z-15 w-full flex justify-center"
            style={{ bottom: '14%' }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            <WordReveal
              text='"Will I fail?"'
              startDelay={0.1}
              wordInterval={0.28}
              style={{
                fontSize: 'clamp(1.8rem, 8.5vw, 7rem)',
                fontFamily: 'var(--font-display, serif)',
                color: '#C8A340',
                letterSpacing: '-0.02em',
                textShadow: '0 0 100px rgba(200,163,64,0.5), 0 4px 40px rgba(0,0,0,0.95)',
                lineHeight: 1.1,
                display: 'block',
                textAlign: 'center',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene fade-out */}
      <motion.div className="absolute inset-0 bg-black pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase === 'out' ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, delay: phase === 'out' ? 1.2 : 0 }}
      />
    </motion.div>
  );
}
