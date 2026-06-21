import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5Free() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[#0f0a1e] z-20"
      initial={{ opacity: 0, y: '10%' }}
      animate={{ opacity: 1, y: '0%' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 bg-primary/5 z-0" />
      
      <div className="text-center relative z-10 flex flex-col items-center">
        <motion.h2 
          className="text-[6vw] font-black text-white leading-tight uppercase tracking-tighter"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          100% Free.
        </motion.h2>

        <motion.h3
          className="text-[3vw] text-primary-light font-bold uppercase tracking-widest mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          No Paywalls. No Subscriptions.
        </motion.h3>

        <motion.div 
          className="mt-12 px-6 py-3 border border-white/20 rounded-full"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[1.5vw] text-white/60 font-medium">Built by students, for students.</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
