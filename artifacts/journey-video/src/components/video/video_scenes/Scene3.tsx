import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// Emotion arc: Sleepless → Setback → Breaking → Dawn → Months → AlmostQuit → Remembered → Perseverance
type Shot = {
  src: string;
  dur: number;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
  showBlue: boolean;   // cold blue laptop glow (coding shots)
  showDust: boolean;   // warm dust motes (hostel interior)
};

const SHOTS: Shot[] = [
  {
    // A — three students coding late at night, laptop glow  [Sleepless]
    src: 's4_shot_a_late_night_coding.png', dur: 3000,
    initial: { scale: 1.07, y: '-1%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showBlue: true, showDust: false,
  },
  {
    // B — FLASH CUT: red error message on laptop screen  [Setback]
    src: 'char_s3_crash_devastated.png', dur: 2000,
    initial: { scale: 1.12 },
    animate: { scale: 1.0 },
    transition: { duration: 2.2, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', showBlue: true, showDust: false,
  },
  {
    // C — character face, dark room 3 AM breaking point  [Breaking]
    src: 's4_shot_c_exhausted_3am.png', dur: 2500,
    initial: { scale: 1.04, x: '0.5%' },
    animate: { scale: 1.0, x: '0%' },
    transition: { duration: 2.8, ease: 'easeOut' },
    cutType: 'dissolve', showBlue: true, showDust: false,
  },
  {
    // D — character face, hope and dawn expression  [Dawn]
    src: 'char_s3_sunrise_determined.png', dur: 2000,
    initial: { scale: 1.06, y: '1%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 2.5, ease: 'easeOut' },
    cutType: 'dissolve', showBlue: false, showDust: false,
  },
  {
    // E — months of work, wall covered in notes and diagrams  [Months]
    src: 's4_shot_e_months_later.png', dur: 3000,
    initial: { scale: 1.05, x: '-0.5%' },
    animate: { scale: 1.0, x: '0%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', showBlue: false, showDust: true,
  },
  {
    // F — character at dark window, reflection, almost quitting  [AlmostQuit]
    src: 's4_shot_f_almost_giving_up.png', dur: 3500,
    initial: { scale: 1.03, y: '-0.5%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 4.0, ease: 'easeOut' },
    cutType: 'dissolve', showBlue: false, showDust: false,
  },
  {
    // G — notebook with "WHAT IF WE BUILD WHAT WE WISH EXISTED?"  [Remembered]
    src: 's4_shot_g_remembering_why.png', dur: 3000,
    initial: { scale: 1.0, x: '-0.3%' },
    animate: { scale: 1.07, x: '0%' },
    transition: { duration: 3.5, ease: 'easeIn' },
    cutType: 'dissolve', showBlue: false, showDust: false,
  },
  {
    // H — night exterior, one glowing window, whiteboard visible  [Perseverance]
    src: 's4_shot_h_team_still_going.png', dur: 5000,
    initial: { scale: 1.08, y: '0%' },
    animate: { scale: 1.0, y: '0%' },
    transition: { duration: 6.0, ease: 'easeOut' },
    cutType: 'dissolve', showBlue: false, showDust: false,
  },
];

// Total: 3000+2000+2500+2000+3000+3500+3000+5000 = 24000ms

const DUST = Array.from({ length: 14 }, (_, i) => ({
  left: `${10 + (i * 6.1) % 78}%`,
  top: `${8 + (i * 7.4) % 64}%`,
  dur: 3.4 + (i % 5) * 0.7,
  delay: i * 0.3,
}));

export function Scene3() {
  const [shotIndex, setShotIndex] = useState(0);
  const [phase, setPhase] = useState<'shots' | 'sleepless' | 'months' | 'quitting' | 'remembered' | 'payoff' | 'out'>('shots');
  const [flashActive, setFlashActive] = useState(false);
  const builtTimers = useRef(false);

  const currentShot = SHOTS[shotIndex];

  useSceneSpeech([
    { atPhase: 0, text: 'Sleepless nights.' },
    { atPhase: 4, text: 'Days become weeks. Weeks become months.' },
    { atPhase: 5, text: 'Many times, they almost quit.' },
    { atPhase: 6, text: 'But then they remembered.' },
    { atPhase: 7, text: 'The student alone at 2 AM. Just like they once were.' },
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

    // Cumulative shot starts
    const shotStart = SHOTS.reduce<number[]>((acc, s, i) => {
      acc.push(i === 0 ? 0 : acc[i - 1] + SHOTS[i - 1].dur);
      return acc;
    }, []);

    // "Sleepless nights." — 0.8s into shot A
    timers.push(setTimeout(() => setPhase('sleepless'), shotStart[0] + 800));
    timers.push(setTimeout(() => setPhase('shots'), shotStart[1]));

    // "DAYS BECOME WEEKS…" — 0.8s into shot E (index 4)
    timers.push(setTimeout(() => setPhase('months'), shotStart[4] + 800));
    timers.push(setTimeout(() => setPhase('shots'), shotStart[5]));

    // "Many times, they almost quit." — 1s into shot F (index 5)
    timers.push(setTimeout(() => setPhase('quitting'), shotStart[5] + 1000));
    timers.push(setTimeout(() => setPhase('shots'), shotStart[6]));

    // "But then they remembered." — 0.6s into shot G (index 6)
    timers.push(setTimeout(() => setPhase('remembered'), shotStart[6] + 600));
    timers.push(setTimeout(() => setPhase('shots'), shotStart[7]));

    // "The student alone at 2 AM…" — 1.2s into shot H (index 7)
    timers.push(setTimeout(() => setPhase('payoff'), shotStart[7] + 1200));
    timers.push(setTimeout(() => setPhase('out'), shotStart[7] + SHOTS[7].dur - 600));

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
              src={`${import.meta.env.BASE_URL}images/${shot.src}?v=2`}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.88) contrast(1.06) saturate(0.9)' }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── COLD BLUE TINT — laptop coding shots ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-3"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(40,80,180,0.12) 0%, transparent 60%)' }}
        animate={{ opacity: currentShot.showBlue ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* ── RED ERROR PULSE — shot B only ── */}
      <AnimatePresence>
        {shotIndex === 1 && (
          <motion.div key="error-pulse" className="absolute pointer-events-none z-3"
            style={{
              left: '20%', top: '25%', width: '60%', height: '50%',
              background: 'radial-gradient(ellipse, rgba(220,30,30,0.1) 0%, transparent 65%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── DUST MOTES — hostel interior shots ── */}
      <motion.div className="absolute inset-0 z-3 pointer-events-none"
        animate={{ opacity: currentShot.showDust ? 1 : 0 }}
        transition={{ duration: 0.8 }}>
        {DUST.map((d, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ left: d.left, top: d.top, width: 2, height: 2, background: 'rgba(255,220,140,0.4)' }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>


      {/* Date stamp — top center */}
      <motion.p className="absolute font-mono z-20"
        style={{ top: '14%', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(0.55rem, 1vw, 0.85rem)', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.16)', whiteSpace: 'nowrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}>
        THE JOURNEY · VIMSAR · MAR — JUN 2026
      </motion.p>

      {/* Bottom gradient for text */}
      <motion.div className="absolute inset-0 z-5 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.97) 0%, rgba(2,3,12,0.2) 30%, transparent 55%)' }}
        animate={{ opacity: (phase === 'shots') ? 0.15 : 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* ── FLASH FRAME ── */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-20"
        animate={{ opacity: flashActive ? 0.88 : 0 }}
        transition={{ duration: 0.05 }}
      />

      {/* ── TEXT OVERLAYS ── */}
      <div className="absolute inset-0 z-15 flex flex-col items-center justify-end pb-[14%] px-[8vw]">
        <div className="text-center w-full">

          {/* Shot A — "Sleepless nights." */}
          <AnimatePresence>
            {phase === 'sleepless' && (
              <motion.div key="sleepless"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
                <p style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: 'clamp(1.6rem, 6vw, 5rem)',
                  color: 'rgba(255,255,255,0.92)',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  textShadow: '0 4px 40px rgba(0,0,0,0.95)',
                }}>
                  Sleepless nights.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot E — "DAYS BECOME WEEKS. / WEEKS BECOME MONTHS." */}
          <AnimatePresence>
            {phase === 'months' && (
              <motion.div key="months"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
                <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.05 }}>
                  <WordReveal text="DAYS BECOME WEEKS." startDelay={0} wordInterval={0.18}
                    style={{ display: 'block', fontSize: 'clamp(1.8rem, 6.5vw, 5.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }} />
                  <WordReveal text="WEEKS BECOME MONTHS." startDelay={0.9} wordInterval={0.18}
                    style={{ display: 'block', fontSize: 'clamp(1.8rem, 6.5vw, 5.5rem)', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.02em' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot F — "Many times, they almost quit." */}
          <AnimatePresence>
            {phase === 'quitting' && (
              <motion.div key="quitting"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
                <p style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: 'clamp(1.4rem, 5.5vw, 4.5rem)',
                  color: 'rgba(255,255,255,0.5)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  letterSpacing: '0.02em',
                  textShadow: '0 4px 40px rgba(0,0,0,0.95)',
                }}>
                  Many times, they almost quit.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot G — "But then they remembered." */}
          <AnimatePresence>
            {phase === 'remembered' && (
              <motion.div key="remembered"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
                <p style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: 'clamp(1.6rem, 6vw, 5rem)',
                  color: 'rgba(255,255,255,0.72)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  letterSpacing: '0.03em',
                  textShadow: '0 4px 40px rgba(0,0,0,0.95)',
                }}>
                  But then they remembered.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot H — emotional payoff: "The student alone at 2 AM. / Just like they once were." */}
          <AnimatePresence>
            {(phase === 'payoff' || phase === 'out') && (
              <motion.div key="payoff"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}>
                <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.1, textShadow: '0 4px 40px rgba(0,0,0,0.98)' }}>
                  <WordReveal text="The student alone at 2 AM." startDelay={0} wordInterval={0.14}
                    style={{ display: 'block', fontSize: 'clamp(1.4rem, 5vw, 4rem)', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', fontWeight: 300 }} />
                  <WordReveal text="Just like they once were." startDelay={1.4} wordInterval={0.16}
                    style={{ display: 'block', fontSize: 'clamp(1.4rem, 5vw, 4rem)', color: '#C8A340', fontStyle: 'italic', fontWeight: 300 }} />
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
        transition={{ duration: 1.0, delay: phase === 'out' ? 0.8 : 0 }}
      />
    </motion.div>
  );
}
