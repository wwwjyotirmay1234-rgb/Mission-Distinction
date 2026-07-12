import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setPhase(5), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-[#0d0f1a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.2)_0%,_rgba(13,15,26,1)_70%)]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-[5vw]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={
            phase >= 5
              ? { scale: 0.8, opacity: 1, y: -100 }
              : phase >= 1
                ? { scale: 1, opacity: 1, y: -50 }
                : { scale: 0.8, opacity: 0, y: 50 }
          }
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-[4vw]"
        >
          <img
            src={`${import.meta.env.BASE_URL}md-logo-new.png`}
            alt="Mission Distinction Logo"
            className="w-[12vw] h-auto object-contain rounded-xl mb-[2vw]"
            style={{ boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}
          />
          <h1 className="text-[5vw] font-display text-white tracking-wide">MISSION DISTINCTION</h1>
        </motion.div>

        <div className="flex gap-[4vw] absolute top-[55%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 && phase < 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="text-center"
          >
            <div className="text-[3vw] font-display text-brand-gold">500+</div>
            <div className="text-[1.2vw] font-sans text-white/70 uppercase tracking-widest">Downloads</div>
          </motion.div>

          <motion.div
            className="w-[1px] bg-white/20 self-stretch"
            initial={{ scaleY: 0 }}
            animate={phase >= 3 && phase < 5 ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.4 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 3 && phase < 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="text-center"
          >
            <div className="text-[3vw] font-display text-brand-purpleLight">3 MONTHS</div>
            <div className="text-[1.2vw] font-sans text-white/70 uppercase tracking-widest">Of Growth</div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-[20%] text-center w-full"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 4 && phase < 5 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          <p className="text-[2vw] font-sans font-light text-white/90 italic">
            A Dream Built by Students, For Students
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-[25%] text-center w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[3vw] font-display text-brand-gold tracking-widest uppercase">
            The Journey Has Just Begun
          </p>
        </motion.div>

        {/* Copyright notice — fades in at the very end */}
        <motion.div
          className="absolute bottom-[6%] text-center w-full"
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        >
          <p className="text-[1vw] font-sans text-white/30 tracking-[0.2em] uppercase">
            © {new Date().getFullYear()} Mission Distinction · All Rights Reserved · missiondistinction.in
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
