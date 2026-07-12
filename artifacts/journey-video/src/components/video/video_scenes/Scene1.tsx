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
      {/* ── AI student overhead desk photo ── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_desk_overhead.png`}
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.5) contrast(1.1) brightness(0.6)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,8,25,0.95) 0%, rgba(10,8,25,0.5) 40%, rgba(10,8,25,0.3) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)' }} />
      {/* Amber tint */}
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(150,90,20,0.15)' }} />

      {/* Content */}
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
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}>
            From a Dream
          </motion.h2>
          <div className="overflow-hidden">
            <motion.h1
              className="text-[8vw] font-display text-white leading-none"
              style={{ textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
              initial={{ y: '100%' }}
              animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              THE MISSION BEGINS
            </motion.h1>
          </div>
        </div>
      </div>

      {/* Location stamp */}
      <motion.div
        className="absolute bottom-[8%] left-[5%] z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 1 }}>
        <div className="w-8 h-[1px] bg-brand-gold/50 mb-2" />
        <p className="text-[1vw] font-mono tracking-[0.3em] text-brand-gold/80 uppercase">
          Burla, Sambalpur · Odisha
        </p>
        <p className="text-[0.9vw] font-mono tracking-[0.25em] text-white/35 uppercase mt-1">
          18 April 2026
        </p>
      </motion.div>

      <motion.p
        className="absolute bottom-[8%] right-[5%] z-20 text-[1vw] font-sans italic"
        style={{ color: 'rgba(255,255,255,0.3)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2 }}>
        After struggling through 1st year exams —
      </motion.p>
    </motion.div>
  );
}
