import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';
import { WhiteboardScene } from '../WhiteboardScene';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useSceneSpeech([
    { atPhase: 2, text: 'No investors. No office. No fancy equipment. Just laptops. Notebooks. Determination.' },
    { atPhase: 3, text: 'A whiteboard filled with ideas. One question written in bold.' },
    { atPhase: 4, text: 'What if we build what we wish existed?' },
    { atPhase: 5, text: 'Silence.' },
    { atPhase: 6, text: 'Then nods.' },
    { atPhase: 8, text: 'The mission begins.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 6000),
      setTimeout(() => setPhase(4), 8500),
      setTimeout(() => setPhase(5), 12000),
      setTimeout(() => setPhase(6), 14000),
      setTimeout(() => setPhase(7), 15500),
      setTimeout(() => setPhase(8), 17000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#060817' }}
      initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ opacity: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>

      {/* Illustrated whiteboard + laptops scene */}
      <WhiteboardScene phase={phase} />

      {/* Overlay for text legibility */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5,
        background: 'linear-gradient(to bottom, rgba(6,8,23,0.88) 0%, rgba(6,8,23,0.28) 45%, rgba(6,8,23,0.9) 100%)' }} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        <motion.p className="font-mono mb-[3.5vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
          LATE EVENING · A SMALL ROOM · VIMSAR, BURLA
        </motion.p>

        {phase >= 2 && (
          <div className="mb-[3vw]">
            <div style={{ fontSize: '1.9vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', lineHeight: 2.1 }}>
              <WordReveal text="No investors. No office. No fancy equipment." startDelay={0} wordInterval={0.08} style={{ display: 'block' }} />
              <WordReveal text="Just laptops. Notebooks. Determination." startDelay={1.2} wordInterval={0.09} style={{ display: 'block' }} />
            </div>
          </div>
        )}

        {phase >= 3 && (
          <div className="mb-[3vw]">
            <div style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', lineHeight: 2 }}>
              <WordReveal text="A whiteboard filled with ideas." startDelay={0} wordInterval={0.09} style={{ display: 'block' }} />
              <WordReveal text="One question written in bold:" startDelay={0.9} wordInterval={0.09} style={{ display: 'block' }} />
            </div>
          </div>
        )}

        {phase >= 4 && (
          <div className="mb-[3.5vw]">
            <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.15, textShadow: '0 0 60px rgba(200,163,64,0.4)' }}>
              <WordReveal text='"What if we build' startDelay={0} wordInterval={0.18}
                style={{ display: 'block', fontSize: '5.5vw', color: '#C8A340', letterSpacing: '-0.01em' }} />
              <WordReveal text='what we wish existed?"' startDelay={0.9} wordInterval={0.18}
                style={{ display: 'block', fontSize: '5.5vw', color: '#C8A340', letterSpacing: '-0.01em' }} />
            </div>
          </div>
        )}

        {phase >= 5 && (
          <div style={{ fontSize: '2.8vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.28em', marginBottom: '0.5vw' }}>
            <WordReveal text="Silence." startDelay={0} wordInterval={0.25} />
          </div>
        )}

        {phase >= 6 && (
          <div style={{ fontSize: '2.8vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.22em', marginBottom: '3vw' }}>
            <WordReveal text="Then nods." startDelay={0} wordInterval={0.25} />
          </div>
        )}

        {phase >= 7 && (
          <motion.div style={{ height: '1px', background: 'rgba(200,163,64,0.2)', margin: '0 auto 2.5vw' }}
            initial={{ width: 0 }} animate={{ width: '18vw' }} transition={{ duration: 0.9 }} />
        )}
        {phase >= 8 && (
          <div style={{ fontFamily: 'var(--font-display, serif)', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}>
            <WordReveal text="THE MISSION BEGINS." startDelay={0} wordInterval={0.22}
              style={{ fontSize: '7.5vw', color: '#fff', letterSpacing: '-0.02em' }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
