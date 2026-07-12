import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Hands on anatomy book — intimate close-up */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 9, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/hands_on_book.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.35) contrast(1.15) brightness(0.42)' }}
          alt=""
        />
      </motion.div>

      {/* Group coding fades in over hands — scale transition */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2.5, ease: 'easeIn' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coding.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.4) contrast(1.1) brightness(0.4)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(80,40,140,0.18)' }} />

      {/* SINGLE POWERFUL VISUAL + ONE LINE — no cards */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Thin whisper — sets up the tension */}
        <div className="overflow-hidden">
          <motion.p
            style={{
              fontSize: '2.1vw',
              fontWeight: 100,
              fontStyle: 'italic',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.38)',
            }}
            initial={{ y: '110%', opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            no app existed for mbbs students.
          </motion.p>
        </div>

        {/* Massive impact — the turn */}
        <div className="overflow-hidden mt-[0.8vw]">
          <motion.h1
            className="font-display leading-none"
            style={{
              fontSize: '10.5vw',
              color: '#ffffff',
              textShadow: '0 4px 60px rgba(0,0,0,0.95)',
              letterSpacing: '-0.025em',
            }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            SO THEY BUILT ONE.
          </motion.h1>
        </div>

        {/* Thin earned detail — specific, not generic */}
        <motion.div
          className="mt-[3.5vw]"
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 1.2 }}>
          <div className="flex items-center justify-center gap-[2.5vw]">
            {['72 nights', 'no blueprint', 'no guarantee'].map((item, i) => (
              <motion.span
                key={item}
                style={{
                  fontSize: '1.3vw',
                  fontWeight: 100,
                  letterSpacing: '0.3em',
                  color: 'rgba(200,163,64,0.6)',
                  fontStyle: 'italic',
                  textTransform: 'lowercase',
                }}
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, delay: i * 0.25 }}>
                {i > 0 && <span style={{ marginRight: '2.5vw', color: 'rgba(255,255,255,0.12)' }}>·</span>}
                {item}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Date stamp — whisper quiet */}
        <motion.p
          className="font-mono mt-[2.5vw]"
          style={{ fontSize: '0.9vw', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}>
          APR → JUN 2026
        </motion.p>
      </div>
    </motion.div>
  );
}
