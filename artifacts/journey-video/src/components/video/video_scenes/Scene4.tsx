import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 5500),
      setTimeout(() => setPhase(4), 8000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 35, damping: 18 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 2) count.set(72);
  }, [phase, count]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-brand-navy flex items-center justify-center"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 to-transparent" />

      {phase >= 1 && Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[4px] h-[4px] bg-brand-gold rounded-full"
          initial={{ top: '50%', left: '50%', scale: 0 }}
          animate={{
            top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 38}%`,
            left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 38}%`,
            scale: [0, 1, 0],
          }}
          transition={{ duration: 3, delay: i * 0.1, repeat: Infinity }}
        />
      ))}

      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.div
          className="text-[1.2vw] font-mono tracking-[0.4em] text-brand-purpleLight/60 mb-[1vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          18 APR → 29 JUN 2026
        </motion.div>

        <motion.h3
          className="text-[2.5vw] font-sans font-medium text-brand-purpleLight mb-[2vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          DAYS OF BUILDING
        </motion.h3>

        <motion.div
          className="flex items-baseline justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={phase >= 2 ? { scale: phase >= 3 ? 1.15 : 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.span className="text-[18vw] font-display text-white leading-none tracking-tighter">
            {displayCount}
          </motion.span>
        </motion.div>

        <motion.div
          className="text-[2.5vw] font-sans text-white/60 mt-[1vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          Late nights. No guarantee.
        </motion.div>

        <motion.div
          className="mt-[3vw] flex gap-[3vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          {['Quizzes', 'Notes', 'Community', 'Clinical AI', 'Viva Prep'].map((f, i) => (
            <motion.span
              key={f}
              className="text-[1.1vw] font-sans px-3 py-1 rounded-full border border-brand-purple/40 text-brand-purpleLight/70"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              {f}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className="mt-[2.5vw] text-[1.5vw] font-sans text-brand-gold/80 tracking-[0.2em]"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          READY FOR LAUNCH
        </motion.p>
      </div>
    </motion.div>
  );
}
