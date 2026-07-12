import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// SCENE 5 — THE LOWEST POINT
export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [redFlash, setRedFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useSceneSpeech([
    { atPhase: 2, text: 'Something breaks.' },
    { atPhase: 3, text: 'Months of work seem lost.' },
    { atPhase: 4, text: 'The room falls silent. No one speaks.' },
    { atPhase: 6, text: 'The dream appears to be over.' },
    { atPhase: 7, text: 'We didn\'t come this far to stop here.' },
    { atPhase: 8, text: 'Laptops reopen. The fight continues.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => {
        setPhase(2); setRedFlash(true); setShake(true);
        setTimeout(() => setRedFlash(false), 800);
        setTimeout(() => setShake(false), 600);
      }, 2800),
      setTimeout(() => setPhase(3), 4200),
      setTimeout(() => setPhase(4), 6000),
      setTimeout(() => setPhase(5), 8000),
      setTimeout(() => setPhase(6), 10000),
      setTimeout(() => setPhase(7), 13500),
      setTimeout(() => setPhase(8), 17500),
      setTimeout(() => setPhase(9), 20000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#020106' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>

      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 14, ease: 'easeOut' }}>
        <img src={`${import.meta.env.BASE_URL}images/student_darknight.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.2) contrast(1.25) brightness(0.28)' }} alt="" />
      </motion.div>
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(2,1,6,0.6) 0%, rgba(2,1,6,0.95) 100%)' }} />

      <motion.div className="absolute inset-0 pointer-events-none z-40"
        style={{ backgroundColor: 'rgba(220,38,38,0.45)' }}
        animate={redFlash ? { opacity: [0, 1, 0.6, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.7 }} />

      <motion.div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]"
        animate={shake ? { x: [-14, 14, -9, 9, -5, 5, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.5 } : { duration: 0 }}>

        <motion.p className="font-mono mb-[4vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.2)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
          MAY 2026 · 02:47 AM
        </motion.p>

        {/* Error card */}
        {phase >= 2 && (
          <motion.div className="mb-[3.5vw] border rounded-md" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            style={{ backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.35)', padding: '1.2vw 2.5vw' }}>
            <div className="flex items-center gap-[1vw] justify-center mb-[0.5vw]">
              <motion.div className="rounded-full bg-red-500" style={{ width: '0.8vw', height: '0.8vw' }}
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
              <span className="font-mono" style={{ fontSize: '1.3vw', color: 'rgba(252,165,165,0.8)', letterSpacing: '0.12em' }}>
                ERROR · SOMETHING WENT WRONG
              </span>
            </div>
            <p className="font-mono text-center" style={{ fontSize: '0.9vw', color: 'rgba(252,165,165,0.45)', letterSpacing: '0.08em' }}>
              Please try again.
            </p>
          </motion.div>
        )}

        {phase >= 2 && (
          <div style={{ fontFamily: 'var(--font-display, serif)', letterSpacing: '-0.02em', marginBottom: '2.5vw' }}>
            <WordReveal text="Something breaks." startDelay={0} wordInterval={0.22}
              style={{ fontSize: '6.5vw', color: '#fff', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }} />
          </div>
        )}
        {phase >= 3 && (
          <div style={{ fontSize: '2.3vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em', marginBottom: '2vw' }}>
            <WordReveal text="Months of work seem lost." startDelay={0} wordInterval={0.12} />
          </div>
        )}
        {phase >= 4 && (
          <div style={{ fontSize: '2.2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1em', lineHeight: 2, marginBottom: '2vw' }}>
            <WordReveal text="The room falls silent." startDelay={0} wordInterval={0.12} style={{ display: 'block' }} />
            <WordReveal text="No one speaks." startDelay={0.8} wordInterval={0.12}
              style={{ display: 'block', color: 'rgba(255,255,255,0.22)' }} />
          </div>
        )}
        {phase >= 6 && (
          <div style={{ fontSize: '2.5vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '3.5vw' }}>
            <WordReveal text="The dream appears to be over." startDelay={0} wordInterval={0.14} />
          </div>
        )}

        {/* THE TURN */}
        {phase >= 7 && (
          <div style={{ lineHeight: 1.15, marginBottom: '3.5vw' }}>
            <div style={{ fontFamily: 'var(--font-display, serif)', textShadow: '0 0 60px rgba(200,163,64,0.42)' }}>
              <WordReveal text={"\u201CWe didn\u2019t come this far"} startDelay={0} wordInterval={0.16}
                style={{ display: 'block', fontSize: '5vw', color: '#C8A340', letterSpacing: '-0.01em' }} />
              <WordReveal text={"to stop here.\u201D"} startDelay={1.0} wordInterval={0.22}
                style={{ display: 'block', fontSize: '5vw', color: '#C8A340', letterSpacing: '-0.01em' }} />
            </div>
          </div>
        )}
        {phase >= 8 && (
          <div style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.14em' }}>
            <WordReveal text="Laptops reopen. The fight continues." startDelay={0} wordInterval={0.1} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
