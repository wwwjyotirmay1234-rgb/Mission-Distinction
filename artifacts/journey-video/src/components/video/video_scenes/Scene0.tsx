import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene0() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1900),
      setTimeout(() => setPhase(3), 3100),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-center max-w-[80vw] z-10">
        <motion.p
          className="text-[1.3vw] font-mono tracking-[0.45em] uppercase mb-[1.5vw]"
          style={{ color: 'rgba(255,255,255,0.22)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          VIMSAR · Burla, Sambalpur · Odisha, India
        </motion.p>

        <motion.p
          className="text-[1.1vw] font-mono tracking-[0.4em] mb-[4.5vw]"
          style={{ color: 'rgba(200,163,64,0.45)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          18 APRIL 2026
        </motion.p>

        <motion.div
          className="mx-auto mb-[4.5vw]"
          style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)' }}
          initial={{ width: 0 }}
          animate={phase >= 2 ? { width: '48vw' } : { width: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="overflow-hidden mb-[2.5vw]">
          <motion.h1
            className="text-[4vw] font-sans font-light text-white leading-snug"
            initial={{ y: '115%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '115%' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            An MBBS student was struggling in exams.
          </motion.h1>
        </div>

        <div className="overflow-hidden">
          <motion.h2
            className="text-[3.2vw] font-sans font-light italic"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            initial={{ y: '115%' }}
            animate={phase >= 3 ? { y: 0 } : { y: '115%' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            So they built something.
          </motion.h2>
        </div>
      </div>

      {/* Smash-cut white flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
    </motion.div>
  );
}
