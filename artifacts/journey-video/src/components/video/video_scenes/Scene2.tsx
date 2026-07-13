import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useSceneSpeech([
    { atPhase: 2, text: 'What if we build what we wish existed?' },
    { atPhase: 3, text: 'Silence.' },
    { atPhase: 4, text: 'Then nods.' },
    { atPhase: 5, text: 'The mission begins.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      // long pause — let them absorb the hostel room / whiteboard scene
      setTimeout(() => setPhase(2), 5500),   // big question
      setTimeout(() => setPhase(3), 12000),  // silence
      setTimeout(() => setPhase(4), 14500),  // nods
      setTimeout(() => setPhase(5), 16500),  // THE MISSION BEGINS
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#060817' }}
      initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ opacity: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>

      {/* ── CINEMATIC HOSTEL WHITEBOARD ILLUSTRATION ── */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.06, x: '2%' }} animate={{ scale: 1, x: '0%' }} transition={{ duration: 18, ease: 'easeOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/scene2_whiteboard_team.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.72) saturate(0.9)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic bars */}
      <div className="absolute inset-x-0 top-0 h-[6%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black z-10 pointer-events-none" />

      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(6,8,23,0.75) 0%, transparent 40%, rgba(6,8,23,0.92) 100%)' }} />

      {/* Whiteboard area soft glow */}
      <motion.div className="absolute pointer-events-none z-2"
        style={{
          left: '-5%', top: '10%', width: '55%', height: '75%',
          background: 'radial-gradient(ellipse at 20% 50%, rgba(220,230,255,0.07) 0%, transparent 65%)',
        }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 1.5 }}
      />

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Location tag */}
        <motion.p className="font-mono absolute" style={{ top: '11%', letterSpacing: '0.5em', fontSize: '0.8vw', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 2 }}>
          LATE EVENING · VIMSAR, BURLA
        </motion.p>

        {/* The founding question — jump straight to it, no preamble */}
        {phase >= 2 && phase < 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
            <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.2, textShadow: '0 0 60px rgba(200,163,64,0.4)' }}>
              <WordReveal text='"What if we build' startDelay={0} wordInterval={0.2}
                style={{ display: 'block', fontSize: '6vw', color: '#C8A340', letterSpacing: '-0.01em' }} />
              <WordReveal text='what we wish existed?"' startDelay={1.0} wordInterval={0.2}
                style={{ display: 'block', fontSize: '6vw', color: '#C8A340', letterSpacing: '-0.01em' }} />
            </div>
          </motion.div>
        )}

        {/* Silence / nods — short single words, dramatic spacing */}
        {phase >= 3 && phase < 5 && (
          <motion.div className="flex flex-col items-center gap-[2vw]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <div style={{ fontSize: '3.2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.3em' }}>
              {phase >= 3 && <WordReveal text="Silence." startDelay={0} wordInterval={0.3} />}
            </div>
            {phase >= 4 && (
              <div style={{ fontSize: '3.2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.52)', letterSpacing: '0.25em' }}>
                <WordReveal text="Then nods." startDelay={0} wordInterval={0.3} />
              </div>
            )}
          </motion.div>
        )}

        {/* THE MISSION BEGINS — title card */}
        {phase >= 5 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div style={{ height: '1px', background: 'rgba(200,163,64,0.22)', margin: '0 auto 2.5vw' }}
              initial={{ width: 0 }} animate={{ width: '20vw' }} transition={{ duration: 0.9 }} />
            <WordReveal text="THE MISSION BEGINS." startDelay={0.3} wordInterval={0.22}
              style={{ fontSize: '7.5vw', color: '#fff', fontFamily: 'var(--font-display, serif)', letterSpacing: '-0.02em', display: 'block' }} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
