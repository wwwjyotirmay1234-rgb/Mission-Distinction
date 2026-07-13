import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useSceneSpeech([
    { atPhase: 2, text: 'Yet everyone seems lost.' },
    { atPhase: 3, text: 'I am not the only one struggling.' },
    { atPhase: 4, text: 'Same battle. Same dream.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      // long visual pause — lecture hall breathes
      setTimeout(() => setPhase(2), 4500),   // "Yet everyone seems lost."
      setTimeout(() => setPhase(3), 9000),   // big quote
      setTimeout(() => setPhase(4), 15000),  // "Same battle. Same dream."
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#050714' }}
      initial={{ filter: 'brightness(3)' }} animate={{ filter: 'brightness(1)' }}
      exit={{ x: '-5%', opacity: 0 }} transition={{ duration: 0.8 }}>

      {/* ── CINEMATIC LECTURE HALL ILLUSTRATION ── */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 18, ease: 'easeOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/scene1_lecture_hall.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.75) saturate(0.85)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic bars */}
      <div className="absolute inset-x-0 top-0 h-[6%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black z-10 pointer-events-none" />

      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,7,20,0.97) 0%, rgba(5,7,20,0.4) 32%, transparent 55%)' }} />

      {/* Dust motes in light shafts */}
      {phase >= 1 && Array.from({ length: 14 }, (_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-2"
          style={{
            left: `${15 + (i * 5.5) % 40}%`, top: `${10 + (i * 7) % 55}%`,
            width: 2, height: 2, background: 'rgba(255,240,180,0.35)',
          }}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 3.5 + (i % 4), delay: i * 0.28, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Location — fades in subtly */}
        <motion.p className="font-mono absolute" style={{ top: '11%', letterSpacing: '0.5em', fontSize: '0.8vw', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 2 }}>
          MORNING · VIMSAR LECTURE HALL
        </motion.p>

        {/* "Yet everyone seems lost." — short punch before the big quote */}
        {phase >= 2 && phase < 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <div style={{ fontSize: '3vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>
              <WordReveal text="Yet everyone seems lost." startDelay={0} wordInterval={0.12} />
            </div>
          </motion.div>
        )}

        {/* The realization — big serif */}
        {phase >= 3 && phase < 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.15, textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}>
              <WordReveal text='"I am not' startDelay={0} wordInterval={0.18}
                style={{ display: 'block', fontSize: '5.5vw', color: '#fff' }} />
              <WordReveal text='the only one' startDelay={0.6} wordInterval={0.18}
                style={{ display: 'block', fontSize: '5.5vw', color: '#fff' }} />
              <WordReveal text='struggling."' startDelay={1.2} wordInterval={0.18}
                style={{ display: 'block', fontSize: '5.5vw', color: '#C8A340' }} />
            </div>
          </motion.div>
        )}

        {/* Payoff — "Same battle. Same dream." */}
        {phase >= 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
            <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.0 }}>
              <WordReveal text="Same battle." startDelay={0} wordInterval={0.25}
                style={{ display: 'block', fontSize: '8vw', color: '#fff', letterSpacing: '-0.015em' }} />
              <WordReveal text="Same dream." startDelay={0.55} wordInterval={0.25}
                style={{ display: 'block', fontSize: '8vw', color: '#C8A340', letterSpacing: '-0.015em' }} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
