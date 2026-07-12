import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.3, y: '5%' }}
        animate={{ scale: 1, y: '0%' }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <video
          src={`${import.meta.env.BASE_URL}videos/world-map.mp4`}
          className="w-full h-full object-cover opacity-80"
          autoPlay muted playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-transparent to-brand-navy opacity-90" />
      </motion.div>

      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center p-[5vw]">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-[4vw]"
        >
          <img
            src={`${import.meta.env.BASE_URL}caduceus-hero-nobg.png`}
            alt="Caduceus"
            className="w-[10vw] h-auto object-contain mx-auto"
            style={{ filter: 'drop-shadow(0 0 20px rgba(200, 163, 64, 0.5))' }}
          />
        </motion.div>

        <motion.h1
          className="text-[7vw] font-display text-white uppercase leading-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          GLOBAL IMPACT
        </motion.h1>

        <div className="flex gap-[6vw] mt-[4vw]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-left"
          >
            <div className="text-[2vw] text-brand-gold font-sans font-bold">10+</div>
            <div className="text-[1.5vw] text-white/70 font-sans">Countries</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-left border-l border-white/20 pl-[4vw]"
          >
            <div className="text-[2vw] text-brand-gold font-sans font-bold">1000s</div>
            <div className="text-[1.5vw] text-white/70 font-sans">Quizzes Solved</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="text-left border-l border-white/20 pl-[4vw]"
          >
            <div className="text-[2vw] text-brand-gold font-sans font-bold">24/7</div>
            <div className="text-[1.5vw] text-white/70 font-sans">Active Learning</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
