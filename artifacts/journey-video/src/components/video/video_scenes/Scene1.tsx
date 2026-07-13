import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useSceneSpeech([
    { atPhase: 2, text: 'Some hide their anxiety behind smiles. Some desperately copy notes. Some search Telegram groups for PDFs.' },
    { atPhase: 3, text: 'Everyone is studying. Yet everyone seems lost.' },
    { atPhase: 4, text: 'I am not the only one struggling.' },
    { atPhase: 5, text: 'Different colleges. Different cities.' },
    { atPhase: 6, text: 'Same battle. Same dream.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 6000),
      setTimeout(() => setPhase(4), 9000),
      setTimeout(() => setPhase(5), 12500),
      setTimeout(() => setPhase(6), 15500),
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

      {/* Dark vignette for text legibility */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,7,20,0.97) 0%, rgba(5,7,20,0.5) 38%, rgba(5,7,20,0.1) 60%, rgba(5,7,20,0.55) 100%)' }} />

      {/* Dust mote particles — light streaming through windows */}
      {phase >= 1 && Array.from({ length: 14 }, (_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-2"
          style={{
            left: `${15 + (i * 5.5) % 40}%`,
            top: `${10 + (i * 7) % 55}%`,
            width: 2, height: 2,
            background: 'rgba(255,240,180,0.35)',
          }}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 3.5 + (i % 4), delay: i * 0.28, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-[10vw]">

        <motion.p className="font-mono mb-[4vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.22)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
          MORNING · VIMSAR LECTURE HALL
        </motion.p>

        {phase >= 2 && (
          <div className="mb-[3.5vw] space-y-[0.8vw]">
            {[
              { t: 'Some hide their anxiety behind smiles.', d: 0 },
              { t: 'Some desperately copy notes.', d: 0.7 },
              { t: 'Some search Telegram groups for PDFs.', d: 1.3 },
            ].map(({ t, d }) => (
              <div key={t} style={{ fontSize: '1.9vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
                <WordReveal text={t} startDelay={d} wordInterval={0.08} />
              </div>
            ))}
          </div>
        )}

        {phase >= 3 && (
          <div className="mb-[3.5vw]">
            <div style={{ fontSize: '2.4vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.06em', lineHeight: 2 }}>
              <WordReveal text="Everyone is studying." startDelay={0} wordInterval={0.1} style={{ display: 'block' }} />
              <WordReveal text="Yet everyone seems lost." startDelay={0.8} wordInterval={0.1}
                style={{ display: 'block', fontWeight: 700, color: 'rgba(255,255,255,0.68)' }} />
            </div>
          </div>
        )}

        {phase >= 4 && (
          <div className="mb-[2.5vw]">
            <div style={{ fontSize: '4.8vw', fontFamily: 'var(--font-display, serif)', lineHeight: 1.15, textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}>
              <WordReveal text='"I am not' startDelay={0} wordInterval={0.15} style={{ display: 'block', color: '#fff' }} />
              <WordReveal text='the only one' startDelay={0.55} wordInterval={0.15} style={{ display: 'block', color: '#fff' }} />
              <WordReveal text='struggling."' startDelay={1.1} wordInterval={0.15} style={{ display: 'block', color: '#C8A340' }} />
            </div>
          </div>
        )}

        {phase >= 5 && (
          <div className="mt-[2vw]" style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em' }}>
            <WordReveal text="Different colleges. Different cities." startDelay={0} wordInterval={0.1} />
          </div>
        )}

        {phase >= 6 && (
          <div className="mt-[1.8vw]">
            <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.1 }}>
              <WordReveal text="Same battle." startDelay={0} wordInterval={0.2}
                style={{ display: 'block', fontSize: '6.5vw', color: '#fff', letterSpacing: '-0.015em' }} />
              <WordReveal text="Same dream." startDelay={0.5} wordInterval={0.2}
                style={{ display: 'block', fontSize: '6.5vw', color: '#C8A340', letterSpacing: '-0.015em' }} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
