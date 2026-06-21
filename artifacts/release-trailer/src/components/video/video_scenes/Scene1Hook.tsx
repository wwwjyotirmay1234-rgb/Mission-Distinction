import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { slideUp, scaleFade } from '@/lib/video/animations';

export function Scene1Hook() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-transparent z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <motion.div 
        className="absolute inset-0 opacity-40 z-0"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 5, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}assets/studying.png`} 
          alt="Student studying late" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1e] via-[#0f0a1e]/80 to-transparent" />
      </motion.div>

      <div className="text-center z-10 relative px-10 flex flex-col items-center">
        <motion.h1 
          className="text-[6vw] font-black tracking-tighter text-white leading-tight uppercase"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          1st Year MBBS.
        </motion.h1>
        
        <motion.div 
          className="h-1 bg-primary mt-4"
          initial={{ width: 0 }}
          animate={phase >= 2 ? { width: '100px' } : { width: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        <motion.p 
          className="text-[2.5vw] text-white/80 mt-6 font-medium tracking-wide uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          The sheer volume is overwhelming.
        </motion.p>
      </div>
    </motion.div>
  );
}
