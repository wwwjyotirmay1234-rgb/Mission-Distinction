import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 6000),
      setTimeout(() => setPhase(4), 8500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 40, damping: 20 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 2) {
      count.set(500);
    }
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
            top: `${50 + Math.sin(i * 30) * 35}%`,
            left: `${50 + Math.cos(i * 30) * 35}%`,
            scale: [0, 1, 0],
          }}
          transition={{ duration: 3, delay: i * 0.1, repeat: Infinity }}
        />
      ))}

      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.h3
          className="text-[2.5vw] font-sans font-medium text-brand-purpleLight mb-[2vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          PROGRESS &amp; VICTORIES
        </motion.h3>

        <motion.div
          className="flex items-baseline justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={phase >= 2 ? { scale: phase >= 3 ? 1.2 : 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.span className="text-[18vw] font-display text-white leading-none tracking-tighter">
            {displayCount}
          </motion.span>
          {phase >= 3 && (
            <motion.span
              className="text-[8vw] font-display text-brand-gold ml-[1vw]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              +
            </motion.span>
          )}
        </motion.div>

        <motion.div
          className="text-[3vw] font-sans text-white/70 mt-[1vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          DOWNLOADS
        </motion.div>
      </div>
    </motion.div>
  );
}
