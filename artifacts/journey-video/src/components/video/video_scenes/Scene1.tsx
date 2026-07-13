import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// Expression arc: Exhausted → Frustrated → Curious → Observing → Realization → Empathy → Determination
type Shot = {
  src: string;
  dur: number;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
  showDust: boolean;       // floating dust motes (indoor corridor / hall)
  showSunrise: boolean;    // warm golden lens shimmer (outdoor sunrise shots)
  emotion?: string;        // Hollywood-style single-word overlay
};

const SHOTS: Shot[] = [
  {
    // A — rear tracking shot leaving hostel at sunrise  [Exhausted]
    src: 's1_shot_a_hostel.png', dur: 2500,
    initial: { scale: 1.06, y: '1.5%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3, ease: 'easeOut' },
    cutType: 'flash', showDust: false, showSunrise: true, emotion: 'EXHAUSTED',
  },
  {
    // B — close-up tired face, sunrise hitting cheek  [Frustrated]
    src: 's1_shot_b_face_walking.png', dur: 2200,
    initial: { scale: 1.0, x: '-0.8%' },
    animate: { scale: 1.05, x: '0%' },
    transition: { duration: 2.5, ease: 'easeIn' },
    cutType: 'dissolve', showDust: false, showSunrise: true, emotion: 'DESPERATE',
  },
  {
    // C — corridor, anatomy hall sign, dozens studying on floor  [Curious]
    src: 's1_shot_c_corridor.png', dur: 2800,
    initial: { scale: 1.07, y: '-1%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3.2, ease: 'easeOut' },
    cutType: 'dissolve', showDust: true, showSunrise: false,
  },
  {
    // D — two students panicking over anatomy books  [Observing]
    src: 's1_shot_d_students_struggling.png', dur: 2200,
    initial: { scale: 1.04, x: '1%' },
    animate: { scale: 1.0, x: '0%' },
    transition: { duration: 2.4, ease: 'linear' },
    cutType: 'dissolve', showDust: false, showSunrise: false, emotion: 'NOT ALONE',
  },
  {
    // E — FLASH CUT to wide realization eyes  [Realization]
    src: 's1_shot_e_realization_eyes.png', dur: 1800,
    initial: { scale: 1.12 },
    animate: { scale: 1.0 },
    transition: { duration: 2.0, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', showDust: false, showSunrise: false, emotion: 'WAIT —',
  },
  {
    // F — aerial lecture hall, lone figure in center  [Empathy] — THE hero shot
    src: 's1_shot_f_lecture_hall_wide.png', dur: 3500,
    initial: { scale: 1.08, y: '-2%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showDust: true, showSunrise: false,
  },
  {
    // G — sitting in hall, golden light, quiet determination  [Determination]
    src: 's1_shot_g_determination.png', dur: 4000,
    initial: { scale: 1.0, y: '0.5%' },
    animate: { scale: 1.06, y: '-0.5%' },
    transition: { duration: 4.5, ease: 'easeIn' },
    cutType: 'dissolve', showDust: true, showSunrise: true,
  },
];

// Dust motes for indoor corridor/hall shots
const DUST = Array.from({ length: 18 }, (_, i) => ({
  left: `${10 + (i * 5.1) % 80}%`,
  top: `${8 + (i * 6.3) % 65}%`,
  dur: 3.2 + (i % 5) * 0.7,
  delay: i * 0.32,
}));

export function Scene1() {
  const [shotIndex, setShotIndex] = useState(0);
  const [phase, setPhase] = useState<'shots' | 'realization' | 'payoff' | 'out'>('shots');
  const [flashActive, setFlashActive] = useState(false);
  const builtTimers = useRef(false);

  const currentShot = SHOTS[shotIndex];

  useSceneSpeech([
    { atPhase: 5, text: 'All of them.' },
    { atPhase: 6, text: 'Same battle. Same dream.' },
  ], shotIndex);

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;

    let cursor = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    SHOTS.forEach((shot, i) => {
      if (i > 0) {
        const t = cursor;
        if (shot.cutType === 'flash') {
          timers.push(setTimeout(() => {
            setFlashActive(true);
            setTimeout(() => { setFlashActive(false); setShotIndex(i); }, 80);
          }, t));
        } else {
          timers.push(setTimeout(() => setShotIndex(i), t));
        }
      }
      cursor += shot.dur;
    });

    // Shot F = index 5 starts at cursor - shot_g.dur - shot_f.dur
    const shotFStart = SHOTS.slice(0, 5).reduce((s, sh) => s + sh.dur, 0);
    const shotGStart = shotFStart + SHOTS[5].dur;

    // "I am not the only one." fades in 1.2s into the aerial lecture hall shot
    timers.push(setTimeout(() => setPhase('realization'), shotFStart + 1200));
    // "Same battle. Same dream." on shot G
    timers.push(setTimeout(() => setPhase('payoff'), shotGStart + 1000));
    timers.push(setTimeout(() => setPhase('out'), shotGStart + SHOTS[6].dur - 400));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}>

      {/* ── ALL SHOTS stacked, crossfading ── */}
      {SHOTS.map((shot, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: shotIndex === i ? 1 : 0 }}
          transition={{ duration: shot.cutType === 'flash' ? 0.07 : 0.55, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={shot.initial}
            animate={shotIndex === i ? shot.animate : shot.initial}
            transition={shotIndex === i ? shot.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${shot.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.88) contrast(1.05) saturate(0.96)' }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── GOLDEN SUNRISE LENS SHIMMER — outdoor shots A, B, G ── */}
      <motion.div className="absolute pointer-events-none z-3 inset-0"
        style={{
          background: 'radial-gradient(ellipse at 15% 85%, rgba(255,160,30,0.18) 0%, rgba(255,120,0,0.06) 35%, transparent 60%)',
        }}
        animate={{ opacity: currentShot.showSunrise ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* ── DUST MOTES — indoor corridor & hall shots C, F, G ── */}
      <motion.div className="absolute inset-0 z-3 pointer-events-none"
        animate={{ opacity: currentShot.showDust ? 1 : 0 }}
        transition={{ duration: 0.8 }}>
        {DUST.map((d, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ left: d.left, top: d.top, width: 2, height: 2, background: 'rgba(255,220,140,0.45)' }}
            animate={{ y: [0, -22, 0], opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* ── EMOTION FLASH — Hollywood-style single word per shot ── */}
      <AnimatePresence>
        {currentShot.emotion && (
          <motion.p
            key={`emotion-${shotIndex}`}
            className="absolute z-15 pointer-events-none"
            style={{
              top: '14%', left: '7vw',
              fontFamily: 'var(--font-display, serif)',
              fontSize: 'clamp(0.65rem, 1.8vw, 1.35rem)',
              letterSpacing: '0.38em',
              fontWeight: 200,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.5)',
              textShadow: '0 1px 24px rgba(0,0,0,0.95)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: [0, 0.6, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, times: [0, 0.15, 0.65, 1.0], ease: 'easeInOut' }}>
            {currentShot.emotion}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Bottom gradient for text */}
      <motion.div className="absolute inset-0 z-5 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(4,5,18,0.97) 0%, rgba(4,5,18,0.25) 28%, transparent 55%)' }}
        animate={{ opacity: phase === 'shots' ? 0.2 : 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-20"
        animate={{ opacity: flashActive ? 0.9 : 0 }}
        transition={{ duration: 0.05 }}
      />

      {/* ── TEXT OVERLAYS ── */}
      <div className="absolute inset-0 z-15 flex flex-col items-center justify-end pb-[14%] px-[8vw]">
        <div className="text-center w-full">

          {/* Shot F — aerial hall — two words that the visual alone cannot say */}
          <AnimatePresence>
            {phase === 'realization' && (
              <motion.div key="realization"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
                <p style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: 'clamp(2.2rem, 9vw, 7.5rem)',
                  color: 'rgba(255,255,255,0.92)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.0,
                  textShadow: '0 4px 60px rgba(0,0,0,0.98)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                }}>
                  All of them.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot G — determination — "Same battle. Same dream." */}
          <AnimatePresence>
            {(phase === 'payoff' || phase === 'out') && (
              <motion.div key="payoff"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}>
                <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.0 }}>
                  <WordReveal text="Same battle." startDelay={0} wordInterval={0.28}
                    style={{ display: 'block', fontSize: 'clamp(2rem, 8vw, 6.5rem)', color: '#fff', letterSpacing: '-0.015em' }} />
                  <WordReveal text="Same dream." startDelay={0.6} wordInterval={0.28}
                    style={{ display: 'block', fontSize: 'clamp(2rem, 8vw, 6.5rem)', color: '#C8A340', letterSpacing: '-0.015em' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scene fade-out */}
      <motion.div className="absolute inset-0 bg-black pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase === 'out' ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, delay: phase === 'out' ? 0.8 : 0 }}
      />
    </motion.div>
  );
}
