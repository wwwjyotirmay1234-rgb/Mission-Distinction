import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      // BREATHING ROOM — 2.5 seconds of pure silence before anything appears
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 4200),
      setTimeout(() => setPhase(3), 7200),
      setTimeout(() => setPhase(4), 9500),
      // Match-cut prep — "72" scales up to fill screen
      setTimeout(() => setPhase(5), 10200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 28, damping: 16 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 2) count.set(72);
  }, [phase, count]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Group coding photo */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 0 }}
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coding.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.35) contrast(1.12) brightness(0.38)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'radial-gradient(ellipse at center, rgba(10,8,30,0.5) 0%, rgba(10,8,30,0.92) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(10,8,30,0.75) 0%, transparent 35%, transparent 65%, rgba(10,8,30,0.9) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none mix-blend-color" style={{ zIndex: 1,
        backgroundColor: 'rgba(80,40,140,0.16)' }} />

      {/* PHASE 0-1: Silence — just the photo. Nothing. Breathing room. */}

      {/* Content appears only after the breathing room */}
      <div className="relative text-center flex flex-col items-center" style={{ zIndex: 10 }}>

        {/* Thin whisper label */}
        <motion.p
          style={{
            fontSize: '1.1vw',
            fontWeight: 100,
            letterSpacing: '0.45em',
            color: 'rgba(255,255,255,0.3)',
            fontStyle: 'italic',
            marginBottom: '1.2vw',
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          days of building
        </motion.p>

        {/* The massive counter — match-cut anchor */}
        <motion.div
          className="flex items-baseline justify-center"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={phase >= 2 ? {
            scale: phase >= 5 ? 6 : phase >= 3 ? 1.08 : 1,
            opacity: phase >= 5 ? 0 : 1,
          } : { scale: 0.6, opacity: 0 }}
          transition={phase >= 5
            ? { duration: 0.7, ease: [0.55, 0, 1, 0.45] }
            : { duration: 0.9, type: 'spring', stiffness: 180, damping: 22 }}
        >
          <motion.span
            className="font-display text-white leading-none tracking-tighter"
            style={{ fontSize: '18vw', textShadow: '0 0 80px rgba(255,255,255,0.08)' }}>
            {displayCount}
          </motion.span>
        </motion.div>

        {/* Earned copy — specific */}
        <motion.p
          style={{
            fontSize: '2.2vw',
            fontWeight: 100,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '0.8vw',
            letterSpacing: '0.08em',
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}>
          late nights. no guarantee.
        </motion.p>

        {/* Features — whisper quiet */}
        <motion.div
          className="mt-[2.5vw] flex gap-[2.5vw]"
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 1 }}>
          {['Quizzes', 'Notes', 'Community', 'Clinical AI', 'Viva Prep'].map((f, i) => (
            <motion.span
              key={f}
              style={{
                fontSize: '1vw',
                fontWeight: 100,
                letterSpacing: '0.25em',
                color: 'rgba(200,163,64,0.55)',
                fontStyle: 'italic',
              }}
              initial={{ opacity: 0 }}
              animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: i * 0.12, duration: 0.6 }}>
              {f}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
