import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// Emotion arc: Reflection → Inspiration → Initiative → Unity → Excitement → Vision → Hope → Commitment → Planning → Destiny
type Shot = {
  src: string;
  dur: number;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
  showGolden: boolean;   // warm golden shimmer (lecture hall / sunset shots)
  showDust: boolean;     // dust motes (hostel room shots)
};

const SHOTS: Shot[] = [
  {
    // A — lone student in empty lecture hall at golden hour  [Reflection]
    src: 's3_shot_a_silent_observation.png', dur: 3500,
    initial: { scale: 1.08, y: '-1.5%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', showGolden: true, showDust: true,
  },
  {
    // B — notebook close-up, pen stops, idea sparks  [Inspiration]
    src: 's3_shot_b_idea_begins.png', dur: 2500,
    initial: { scale: 1.0, x: '-0.5%' },
    animate: { scale: 1.06, x: '0%' },
    transition: { duration: 2.8, ease: 'easeIn' },
    cutType: 'dissolve', showGolden: true, showDust: false,
  },
  {
    // C — hostel room, phone call, determination growing  [Initiative]
    src: 's3_shot_c_calling_friends.png', dur: 2500,
    initial: { scale: 1.05, y: '1%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3.0, ease: 'easeOut' },
    cutType: 'dissolve', showGolden: true, showDust: false,
  },
  {
    // D — five students crowd into hostel room  [Unity]
    src: 's3_shot_d_gathering_team.png', dur: 2500,
    initial: { scale: 1.06, x: '1%' },
    animate: { scale: 1.0, x: '0%' },
    transition: { duration: 3.0, ease: 'easeOut' },
    cutType: 'dissolve', showGolden: false, showDust: true,
  },
  {
    // E — FLASH CUT to brainstorm energy  [Excitement]
    src: 's3_shot_e_brainstorm.png', dur: 2500,
    initial: { scale: 1.1 },
    animate: { scale: 1.0 },
    transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', showGolden: false, showDust: true,
  },
  {
    // F — FLASH CUT to whiteboard moment, THE founding question  [Vision]
    src: 's3_shot_f_whiteboard.png', dur: 3500,
    initial: { scale: 1.04, y: '-0.5%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'flash', showGolden: false, showDust: false,
  },
  {
    // G — five faces, doubt → hope → excitement  [Hope]
    src: 's3_shot_g_reactions.png', dur: 2500,
    initial: { scale: 1.0, x: '-0.3%' },
    animate: { scale: 1.05, x: '0%' },
    transition: { duration: 2.8, ease: 'easeIn' },
    cutType: 'dissolve', showGolden: false, showDust: false,
  },
  {
    // H — overhead, five hands together over books + laptop  [Commitment]
    src: 's3_shot_h_mission_born.png', dur: 3000,
    initial: { scale: 1.08, y: '-1%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', showGolden: true, showDust: false,
  },
  {
    // I — FLASH CUT to whiteboard full of diagrams and app sketches  [Planning]
    src: 's3_shot_i_first_plan.png', dur: 2500,
    initial: { scale: 1.06, x: '-1%' },
    animate: { scale: 1.0, x: '0%' },
    transition: { duration: 3.0, ease: 'easeOut' },
    cutType: 'flash', showGolden: false, showDust: true,
  },
  {
    // J — night exterior, one glowing window, entire campus dark  [Destiny]
    src: 's3_shot_j_destiny_pull.png', dur: 4000,
    initial: { scale: 1.1, y: '0%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', showGolden: false, showDust: false,
  },
];

// Total: 29000ms

const DUST = Array.from({ length: 16 }, (_, i) => ({
  left: `${8 + (i * 5.7) % 82}%`,
  top: `${6 + (i * 7.1) % 68}%`,
  dur: 3.0 + (i % 6) * 0.6,
  delay: i * 0.28,
}));

export function Scene2() {
  const [shotIndex, setShotIndex] = useState(0);
  const [phase, setPhase] = useState<'shots' | 'reflection' | 'commitment' | 'destiny' | 'out'>('shots');
  const [flashActive, setFlashActive] = useState(false);
  const builtTimers = useRef(false);

  const currentShot = SHOTS[shotIndex];

  useSceneSpeech([
    { atPhase: 0, text: 'He stayed back.' },
    { atPhase: 7, text: 'Five of them.' },
    { atPhase: 9, text: 'This is how it starts.' },
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

    // Shot starts (cumulative)
    const shotStart = SHOTS.reduce<number[]>((acc, s, i) => {
      acc.push(i === 0 ? 0 : acc[i - 1] + SHOTS[i - 1].dur);
      return acc;
    }, []);

    // "He stayed back." — appears 1.2s into shot A, fades before shot B
    timers.push(setTimeout(() => setPhase('reflection'), shotStart[0] + 1200));
    timers.push(setTimeout(() => setPhase('shots'), shotStart[1] - 200));

    // "Five of them." — appears 1s into shot H (index 7)
    timers.push(setTimeout(() => setPhase('commitment'), shotStart[7] + 1000));
    timers.push(setTimeout(() => setPhase('shots'), shotStart[8] - 200));

    // "This is how it starts." — appears 800ms into shot J (index 9)
    timers.push(setTimeout(() => setPhase('destiny'), shotStart[9] + 800));
    timers.push(setTimeout(() => setPhase('out'), shotStart[9] + SHOTS[9].dur - 500));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}>

      {/* ── ALL SHOTS stacked, crossfading ── */}
      {SHOTS.map((shot, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: shotIndex === i ? 1 : 0 }}
          transition={{ duration: shot.cutType === 'flash' ? 0.07 : 0.6, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={shot.initial}
            animate={shotIndex === i ? shot.animate : shot.initial}
            transition={shotIndex === i ? shot.transition : { duration: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}images/${shot.src}`}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.9) contrast(1.04) saturate(0.95)' }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── GOLDEN SHIMMER — lecture hall / sunset shots ── */}
      <motion.div className="absolute pointer-events-none z-3 inset-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 90%, rgba(255,160,30,0.16) 0%, rgba(255,120,0,0.05) 40%, transparent 65%)',
        }}
        animate={{ opacity: currentShot.showGolden ? 1 : 0 }}
        transition={{ duration: 1.0 }}
      />

      {/* ── DUST MOTES — hostel room shots ── */}
      <motion.div className="absolute inset-0 z-3 pointer-events-none"
        animate={{ opacity: currentShot.showDust ? 1 : 0 }}
        transition={{ duration: 0.8 }}>
        {DUST.map((d, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ left: d.left, top: d.top, width: 2, height: 2, background: 'rgba(255,220,140,0.4)' }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.45, 0.1] }}
            transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* ── CINEMATIC BARS ── */}
      <div className="absolute inset-x-0 top-0 h-[5%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[5%] bg-black z-10 pointer-events-none" />

      {/* Bottom gradient for text legibility */}
      <motion.div className="absolute inset-0 z-5 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(4,5,18,0.97) 0%, rgba(4,5,18,0.2) 30%, transparent 55%)' }}
        animate={{ opacity: (phase === 'reflection' || phase === 'commitment' || phase === 'destiny' || phase === 'out') ? 1 : 0.15 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-20"
        animate={{ opacity: flashActive ? 0.88 : 0 }}
        transition={{ duration: 0.05 }}
      />

      {/* ── TEXT OVERLAYS ── */}
      <div className="absolute inset-0 z-15 flex flex-col items-center justify-end pb-[10%] px-[8vw]">
        <div className="text-center w-full">

          {/* Shot A — "He stayed back." — context the visual alone can't give */}
          <AnimatePresence>
            {phase === 'reflection' && (
              <motion.div key="reflection"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
                <p style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: 'clamp(1.4rem, 5vw, 4rem)',
                  color: 'rgba(255,255,255,0.72)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  letterSpacing: '0.04em',
                  textShadow: '0 4px 40px rgba(0,0,0,0.95)',
                }}>
                  He stayed back.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot H — "Five of them." — callback to Scene 1's "All of them." */}
          <AnimatePresence>
            {phase === 'commitment' && (
              <motion.div key="commitment"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}>
                <p style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: 'clamp(2rem, 8.5vw, 7rem)',
                  color: 'rgba(255,255,255,0.90)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.0,
                  textShadow: '0 4px 60px rgba(0,0,0,0.98)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                }}>
                  Five of them.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot J — "This is how it starts." — the arc payoff */}
          <AnimatePresence>
            {(phase === 'destiny' || phase === 'out') && (
              <motion.div key="destiny"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}>
                <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.1, textShadow: '0 4px 40px rgba(0,0,0,0.98)' }}>
                  <WordReveal text="This is how" startDelay={0} wordInterval={0.3}
                    style={{ display: 'block', fontSize: 'clamp(2rem, 8vw, 6.5rem)', color: '#fff', letterSpacing: '-0.015em' }} />
                  <WordReveal text="it starts." startDelay={0.9} wordInterval={0.32}
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
        transition={{ duration: 1.0, delay: phase === 'out' ? 0.9 : 0 }}
      />
    </motion.div>
  );
}
