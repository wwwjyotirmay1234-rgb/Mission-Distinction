import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// SCENE 2 — THE REALIZATION
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
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ filter: 'brightness(3)' }} animate={{ filter: 'brightness(1)' }}
      exit={{ x: '-5%', opacity: 0 }} transition={{ duration: 0.8 }}>

      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 12, ease: 'easeOut' }}>
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.65) contrast(1.08) brightness(0.42)' }}>
          <source src={`${import.meta.env.BASE_URL}videos/scene2_realization_lecture_hall.mp4`} type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(4,3,16,0.98) 0%, rgba(4,3,16,0.42) 50%, rgba(4,3,16,0.25) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.72) 100%)' }} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Stamp */}
        <motion.p className="font-mono mb-[4vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.2)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
          MORNING · VIMSAR LECTURE HALL
        </motion.p>

        {/* Three student types */}
        {phase >= 2 && (
          <div className="mb-[3.5vw] space-y-[0.8vw]">
            {[
              { t: 'Some hide their anxiety behind smiles.', d: 0 },
              { t: 'Some desperately copy notes.', d: 0.7 },
              { t: 'Some search Telegram groups for PDFs.', d: 1.3 },
            ].map(({ t, d }) => (
              <div key={t} style={{ fontSize: '1.9vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em' }}>
                <WordReveal text={t} startDelay={d} wordInterval={0.08} />
              </div>
            ))}
          </div>
        )}

        {/* "Everyone studying. Yet lost." */}
        {phase >= 3 && (
          <div className="mb-[3.5vw]">
            <div style={{ fontSize: '2.4vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.06em', lineHeight: 2 }}>
              <WordReveal text="Everyone is studying." startDelay={0} wordInterval={0.1} style={{ display: 'block' }} />
              <WordReveal text="Yet everyone seems lost." startDelay={0.8} wordInterval={0.1}
                style={{ display: 'block', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }} />
            </div>
          </div>
        )}

        {/* THE REALIZATION */}
        {phase >= 4 && (
          <div className="mb-[2.5vw]">
            <div style={{
              fontSize: '4.8vw',
              fontFamily: 'var(--font-display, serif)',
              lineHeight: 1.15,
              textShadow: '0 4px 50px rgba(0,0,0,0.95)',
            }}>
              <WordReveal text='"I am not' startDelay={0} wordInterval={0.15}
                style={{ display: 'block', color: '#fff' }} />
              <WordReveal text='the only one' startDelay={0.55} wordInterval={0.15}
                style={{ display: 'block', color: '#fff' }} />
              <WordReveal text='struggling."' startDelay={1.1} wordInterval={0.15}
                style={{ display: 'block', color: '#C8A340' }} />
            </div>
          </div>
        )}

        {/* "Different colleges. Different cities." */}
        {phase >= 5 && (
          <div className="mt-[2vw]" style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em' }}>
            <WordReveal text="Different colleges. Different cities." startDelay={0} wordInterval={0.1} />
          </div>
        )}

        {/* "Same battle. Same dream." */}
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
