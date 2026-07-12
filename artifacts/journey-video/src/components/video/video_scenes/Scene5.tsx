import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

// SCENE 5 — THE BUILD
// 72 nights. Problems. Perseverance. The app takes shape.
export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),   // whisper label
      setTimeout(() => setPhase(2), 1800),  // counter begins
      setTimeout(() => setPhase(3), 5000),  // earned copy
      setTimeout(() => setPhase(4), 7000),  // features
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 26, damping: 15 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 2) count.set(72);
  }, [phase, count]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#04040e' }}
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Group coding — dark, moody */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coding.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.32) contrast(1.15) brightness(0.35)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'radial-gradient(ellipse at center, rgba(10,8,30,0.55) 0%, rgba(10,8,30,0.93) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(10,8,30,0.8) 0%, transparent 35%, transparent 65%, rgba(10,8,30,0.92) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none mix-blend-color" style={{ zIndex: 1,
        backgroundColor: 'rgba(80,40,140,0.14)' }} />

      {/* Content */}
      <div className="relative text-center flex flex-col items-center" style={{ zIndex: 10 }}>

        {/* Whisper label */}
        <motion.p
          style={{
            fontSize: '1.1vw',
            fontWeight: 100,
            letterSpacing: '0.48em',
            color: 'rgba(255,255,255,0.28)',
            fontStyle: 'italic',
            marginBottom: '1.2vw',
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.4 }}>
          nights of building
        </motion.p>

        {/* Massive counter — spring to 72 */}
        <motion.div
          className="flex items-baseline justify-center"
          initial={{ scale: 0.65, opacity: 0 }}
          animate={phase >= 2 ? { scale: phase >= 3 ? 1.04 : 1, opacity: 1 } : { scale: 0.65, opacity: 0 }}
          transition={{ duration: 1, type: 'spring', stiffness: 160, damping: 20 }}
        >
          <motion.span
            className="font-display text-white leading-none tracking-tighter"
            style={{ fontSize: '19vw', textShadow: '0 0 100px rgba(255,255,255,0.06)' }}>
            {displayCount}
          </motion.span>
        </motion.div>

        {/* Earned copy */}
        <motion.p
          style={{
            fontSize: '2.3vw',
            fontWeight: 100,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.45)',
            marginTop: '0.8vw',
            letterSpacing: '0.08em',
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}>
          late nights. no guarantee. no backup plan.
        </motion.p>

        {/* Feature list — whisper quiet */}
        <motion.div
          className="mt-[2.8vw] flex gap-[2.8vw] flex-wrap justify-center"
          initial={{ opacity: 0, y: 14 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1 }}>
          {['Quizzes', 'Notes', 'Community', 'Clinical AI', 'Viva Prep'].map((f, i) => (
            <motion.span
              key={f}
              style={{
                fontSize: '1vw',
                fontWeight: 100,
                letterSpacing: '0.28em',
                color: 'rgba(200,163,64,0.5)',
                fontStyle: 'italic',
              }}
              initial={{ opacity: 0 }}
              animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: i * 0.14, duration: 0.7 }}>
              {f}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
