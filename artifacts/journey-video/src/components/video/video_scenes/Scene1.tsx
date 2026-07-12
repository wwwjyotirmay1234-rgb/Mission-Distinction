import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 6500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ filter: 'brightness(4)' }}
      animate={{ filter: 'brightness(1)' }}
      exit={{ scale: 1.08, opacity: 0, filter: 'blur(16px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <video
          src={`${import.meta.env.BASE_URL}videos/study-room.mp4`}
          className="w-full h-full object-cover opacity-60"
          autoPlay muted playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 bg-brand-navy/30" />
      </motion.div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12 text-center">
        <div className="relative">
          <motion.div
            className="w-[2px] h-[10vh] bg-brand-gold mx-auto mb-8"
            initial={{ scaleY: 0, transformOrigin: 'top' }}
            animate={phase >= 1 ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.h2
            className="text-[2vw] font-sans font-semibold tracking-[0.3em] uppercase text-brand-gold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            From a Dream
          </motion.h2>

          <div className="overflow-hidden">
            <motion.h1
              className="text-[8vw] font-display text-white leading-none"
              style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9)' }}
              initial={{ y: '100%' }}
              animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              THE MISSION BEGINS
            </motion.h1>
          </div>
        </div>
      </div>

      {/* Location stamp — bottom left */}
      <motion.div
        className="absolute bottom-[8%] left-[5%] z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 1 }}
      >
        <div className="w-8 h-[1px] bg-brand-gold/50 mb-2" />
        <p className="text-[1vw] font-mono tracking-[0.3em] text-brand-gold/70 uppercase">
          Burla, Sambalpur · Odisha
        </p>
        <p className="text-[0.9vw] font-mono tracking-[0.25em] text-white/30 uppercase mt-1">
          18 April 2026
        </p>
      </motion.div>

      {/* Tagline fade in */}
      <motion.p
        className="absolute bottom-[8%] right-[5%] z-20 text-[1vw] font-sans text-white/30 italic"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2 }}
      >
        After struggling through 1st year exams —
      </motion.p>
    </motion.div>
  );
}
