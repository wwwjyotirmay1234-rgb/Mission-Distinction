import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2Solution() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2800)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: '-10%', filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="absolute inset-0 opacity-50 z-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 4, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}assets/network.png`} 
          alt="Neural Network" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f0a1e]/60" />
      </motion.div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.div
          className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center mb-8"
          initial={{ opacity: 0, scale: 0 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, rotate: 180 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary/20 blur-md" />
        </motion.div>

        <motion.h2 
          className="text-[5vw] font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          You need an <span className="text-primary-light">edge</span>.
        </motion.h2>
      </div>
    </motion.div>
  );
}
