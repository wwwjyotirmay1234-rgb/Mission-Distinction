import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// SCENE 8 — THE MILESTONE
export function Scene7() {
  const [phase, setPhase] = useState(0);
  const [goldFlash, setGoldFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useSceneSpeech([
    { atPhase: 1, text: 'Three weeks later.' },
    { atPhase: 2, text: 'The team gathers again. The screen refreshes.' },
    { atPhase: 4, text: '500 Downloads.' },
    { atPhase: 5, text: 'Nobody says anything.' },
    { atPhase: 6, text: 'Because some moments are too powerful for words.' },
    { atPhase: 7, text: 'The same room. The same friends. The same dream.' },
    { atPhase: 8, text: 'Only now... that dream belongs to hundreds.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => {
        setPhase(4); setGoldFlash(true); setShake(true);
        setTimeout(() => setGoldFlash(false), 700);
        setTimeout(() => setShake(false), 600);
      }, 9500),
      setTimeout(() => setPhase(5), 12000),
      setTimeout(() => setPhase(6), 15000),
      setTimeout(() => setPhase(7), 18000),
      setTimeout(() => setPhase(8), 21500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const count = useSpring(0, { stiffness: 18, damping: 13 });
  const displayCount = useTransform(count, Math.round);
  useEffect(() => { if (phase >= 3) count.set(500); }, [phase, count]);

  return (
    <motion.div className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#020206' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>

      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }} animate={phase >= 4 ? { scale: 1.02 } : { scale: 1 }} transition={{ duration: 10, ease: 'easeOut' }}>
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.65) contrast(1.08) brightness(0.38)' }}>
          <source src={`${import.meta.env.BASE_URL}videos/scene10_500_milestone_finale.mp4`} type="video/mp4" />
        </video>
      </motion.div>
      <motion.div className="absolute inset-0 pointer-events-none z-1"
        animate={phase >= 4
          ? { background: 'radial-gradient(ellipse at center, rgba(200,163,64,0.2) 0%, rgba(0,0,0,0.9) 65%)' }
          : { background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.92) 65%)' }}
        transition={{ duration: 2 }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.92) 100%)' }} />

      <motion.div className="absolute inset-0 pointer-events-none z-50"
        style={{ backgroundColor: 'rgba(200,163,64,0.35)' }}
        animate={goldFlash ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.65 }} />

      <motion.div className="relative text-center flex flex-col items-center z-10"
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45 } : { duration: 0 }}>

        {phase >= 1 && (
          <div className="mb-[2vw]" style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)' }}>
            <WordReveal text="Three weeks later." startDelay={0} wordInterval={0.22} />
          </div>
        )}
        {phase >= 2 && (
          <div className="mb-[2vw]" style={{ fontSize: '1.8vw', fontStyle: 'italic', fontWeight: 100, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', lineHeight: 2 }}>
            <WordReveal text="The team gathers again." startDelay={0} wordInterval={0.14} style={{ display: 'block' }} />
            <WordReveal text="The screen refreshes." startDelay={0.8} wordInterval={0.14} style={{ display: 'block' }} />
          </div>
        )}

        {/* Counter */}
        <motion.span className="font-display leading-none tracking-tighter block"
          style={{
            fontSize: '22vw',
            color: phase >= 4 ? '#C8A340' : 'rgba(255,255,255,0.88)',
            textShadow: phase >= 4 ? '0 0 120px rgba(200,163,64,0.45)' : '0 0 80px rgba(255,255,255,0.05)',
            transition: 'color 0.9s ease, text-shadow 0.9s ease',
          }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={phase >= 3 ? { scale: phase >= 4 ? 1.04 : 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
          transition={{ duration: 1, type: 'spring', stiffness: 140, damping: 18 }}>
          {displayCount}
        </motion.span>

        {phase >= 4 && (
          <div className="mt-[0.8vw] mb-[3vw]" style={{ fontFamily: 'var(--font-display, serif)' }}>
            <WordReveal text="Downloads." startDelay={0} wordInterval={0.28}
              style={{ fontSize: '3.5vw', color: '#C8A340', letterSpacing: '0.04em', textShadow: '0 2px 30px rgba(0,0,0,0.9)' }} />
          </div>
        )}

        {phase >= 5 && (
          <div className="mt-[1vw]" style={{ fontSize: '2.5vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.2em' }}>
            <WordReveal text="Nobody says anything." startDelay={0} wordInterval={0.22} />
          </div>
        )}
        {phase >= 6 && (
          <div className="mt-[1.5vw]" style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            <WordReveal text="Because some moments are too powerful for words." startDelay={0} wordInterval={0.1} />
          </div>
        )}
        {phase >= 7 && (
          <div className="mt-[3vw]" style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1em' }}>
            <WordReveal text="The same room. The same friends. The same dream." startDelay={0} wordInterval={0.1} />
          </div>
        )}
        {phase >= 8 && (
          <div className="mt-[2vw]" style={{ fontFamily: 'var(--font-display, serif)', textShadow: '0 0 50px rgba(200,163,64,0.35)' }}>
            <WordReveal text="Only now — that dream belongs to hundreds." startDelay={0} wordInterval={0.14}
              style={{ fontSize: '4.2vw', color: '#C8A340', letterSpacing: '-0.01em' }} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
