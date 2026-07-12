import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// FINAL SCENE — Narrator. Lights. Logo. Fade to black.
const NARRATOR = [
  { text: 'Great stories do not begin with success.', phase: 2 },
  { text: 'They begin with a problem that someone refuses to ignore.', phase: 3 },
  { text: 'Five students started with a struggle.', phase: 4 },
  { text: 'Hundreds found a solution.', phase: 5 },
  { text: 'Tomorrow, thousands will carry the mission forward.', phase: 6 },
];

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useSceneSpeech([
    { atPhase: 2, text: 'Great stories do not begin with success.' },
    { atPhase: 3, text: 'They begin with a problem that someone refuses to ignore.' },
    { atPhase: 4, text: 'Five students started with a struggle.' },
    { atPhase: 5, text: 'Hundreds found a solution.' },
    { atPhase: 6, text: 'Tomorrow, thousands will carry the mission forward.' },
    { atPhase: 7, text: 'For every student who studies when nobody is watching.' },
    { atPhase: 8, text: 'For every dream that refuses to quit.' },
    { atPhase: 9, text: 'Mission Distinction.' },
    { atPhase: 10, text: 'By Students. For Students.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 6200),
      setTimeout(() => setPhase(4), 9400),
      setTimeout(() => setPhase(5), 12000),
      setTimeout(() => setPhase(6), 14500),
      setTimeout(() => setPhase(7), 17500),
      setTimeout(() => setPhase(8), 20000),
      setTimeout(() => setPhase(9), 22500),
      setTimeout(() => setPhase(10), 24200),
      setTimeout(() => setPhase(11), 26000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>

      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.05, y: '3%' }} animate={{ scale: 1, y: '0%' }} transition={{ duration: 18, ease: 'easeOut' }}>
        <img src={`${import.meta.env.BASE_URL}images/ai_scene10.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.55) contrast(1.08) brightness(0.38)' }} alt="" />
      </motion.div>
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.82) 82%, rgba(0,0,0,0.99) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Constellation dots */}
      {phase >= 1 && Array.from({ length: 40 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: `${5 + (i * 73 % 90)}%`, top: `${8 + (i * 47 % 55)}%`, zIndex: 2,
            width: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
            height: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
            backgroundColor: i % 4 === 0 ? '#C8A340' : i % 4 === 1 ? '#a78bfa' : 'rgba(255,255,255,0.7)' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.5 + (i % 5) * 0.1, 0.3 + (i % 3) * 0.15], scale: 1 }}
          transition={{
            opacity: { duration: 2 + (i % 4), delay: (i * 0.08) % 3, repeat: Infinity, repeatType: 'reverse' },
            scale: { duration: 0.8, delay: (i * 0.07) % 2 },
          }} />
      ))}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[10vw]">

        {/* Narrator lines — word by word */}
        <div className="text-center mb-[3vw]">
          {NARRATOR.map(({ text, phase: p }) => (
            phase >= p && (
              <div key={text} className="mb-[0.5vw]"
                style={{
                  fontSize: '2.5vw', fontStyle: 'italic', fontWeight: 100,
                  letterSpacing: '0.05em', lineHeight: 1.8,
                  color: phase === p ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.2)',
                  transition: 'color 1.5s ease',
                }}>
                <WordReveal text={text} startDelay={0} wordInterval={0.09} />
              </div>
            )
          ))}
        </div>

        {/* Divider */}
        <motion.div className="mx-auto my-[2.5vw]"
          style={{ height: '1px', background: 'rgba(200,163,64,0.22)' }}
          initial={{ width: 0 }} animate={phase >= 7 ? { width: '24vw' } : { width: 0 }} transition={{ duration: 1 }} />

        {/* Dedication */}
        {phase >= 7 && (
          <div className="text-center mb-[0.8vw]" style={{ fontSize: '2.3vw', fontStyle: 'italic', fontWeight: 100, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.62)' }}>
            <WordReveal text="For every student who studies when nobody is watching." startDelay={0} wordInterval={0.09} />
          </div>
        )}
        {phase >= 8 && (
          <div className="text-center mb-[4vw]" style={{ fontSize: '2.3vw', fontStyle: 'italic', fontWeight: 100, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.62)' }}>
            <WordReveal text="For every dream that refuses to quit." startDelay={0} wordInterval={0.12} />
          </div>
        )}

        {/* MISSION DISTINCTION */}
        {phase >= 9 && (
          <div className="text-center" style={{ fontFamily: 'var(--font-display, serif)', textShadow: '0 4px 80px rgba(0,0,0,0.95)' }}>
            <WordReveal text="MISSION DISTINCTION" startDelay={0} wordInterval={0.2}
              style={{ fontSize: '9.5vw', color: '#fff', letterSpacing: '-0.02em' }} />
          </div>
        )}

        {/* By Students. For Students. */}
        {phase >= 10 && (
          <motion.div className="flex flex-col items-center mt-[1.8vw]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
            <div style={{ width: '1px', height: '4vh', backgroundColor: 'rgba(200,163,64,0.35)', margin: '0 auto 1.5vw' }} />
            <div style={{ fontSize: '2.3vw', fontWeight: 100, letterSpacing: '0.35em', color: 'rgba(200,163,64,0.85)' }}>
              <WordReveal text="By Students. For Students." startDelay={0} wordInterval={0.18} />
            </div>
            <motion.div className="mt-[2.5vw]"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, delay: 0.6 }}>
              <img src={`${import.meta.env.BASE_URL}md-logo-new.png`}
                alt="Mission Distinction" className="w-[6vw] h-auto object-contain rounded-xl"
                style={{ boxShadow: '0 0 24px rgba(124,58,237,0.35), 0 0 50px rgba(124,58,237,0.1)' }} />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Final fade to black */}
      <motion.div className="absolute inset-0 bg-black pointer-events-none" style={{ zIndex: 60 }}
        initial={{ opacity: 0 }}
        animate={phase >= 11 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 3 }} />
    </motion.div>
  );
}
