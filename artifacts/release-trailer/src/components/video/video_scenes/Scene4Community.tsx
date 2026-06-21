import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4Community() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2800)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-end z-10"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-10%' }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="absolute inset-0 opacity-50 z-0"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 5, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}assets/trophy.png`} 
          alt="Trophy" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0f0a1e] via-[#0f0a1e]/80 to-transparent" />
      </motion.div>

      <div className="w-[50vw] pr-[10vw] relative z-10 text-right">
        <motion.div
          className="inline-block px-4 py-2 bg-primary/20 border border-primary/40 rounded-full mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[1.2vw] font-bold text-primary-light uppercase tracking-widest">
            Gamified Learning
          </span>
        </motion.div>

        <motion.h2 
          className="text-[4.5vw] font-black text-white leading-tight mb-4"
          initial={{ opacity: 0, x: 50 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Rank up as you learn.
        </motion.h2>

        <motion.p 
          className="text-[2vw] text-white/70 font-medium"
          initial={{ opacity: 0, x: 50 }}
          animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Earn XP, top the leaderboards,<br/>and discuss in the community.
        </motion.p>
      </div>
    </motion.div>
  );
}
