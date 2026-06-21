import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene6Outro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0a1e] z-30"
      initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Intense center glow */}
      <motion.div 
        className="absolute w-[80vw] h-[80vw] rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary), transparent)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 text-center flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}favicon.svg`} 
            alt="Logo" 
            className="w-24 h-24 mb-8 mx-auto filter drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          />
        </motion.div>

        <motion.h1 
          className="text-[6vw] font-black text-white leading-none tracking-tighter"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
        >
          MISSION DISTINCTION
        </motion.h1>

        <motion.p 
          className="text-[2.2vw] text-primary-light font-bold mt-6 tracking-widest uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Study Smarter. Score Higher.
        </motion.p>
      </div>
    </motion.div>
  );
}
