import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene8() {
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
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#0a080f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* ── AI team outro photo — slow Ken Burns ── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_team_outro.png`}
          className="w-full h-full object-cover object-top"
          style={{ filter: 'saturate(0.45) contrast(1.1) brightness(0.5)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,8,15,0.88) 0%, rgba(10,8,15,0.4) 35%, rgba(10,8,15,0.75) 75%, rgba(10,8,15,0.97) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />
      {/* Purple tint */}
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(70,30,120,0.2)' }} />

      {/* Floating gold particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none z-2"
          style={{
            width: 2 + (i % 3), height: 2 + (i % 3),
            left: `${8 + (i * 29 % 84)}%`, top: `${10 + (i * 37 % 80)}%`,
            backgroundColor: i % 2 === 0 ? 'rgba(200,163,64,0.4)' : 'rgba(124,58,237,0.35)',
          }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-[5vw]">
        {/* Logo + name */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, y: -50 } : { scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-[4vw]">
          <img
            src={`${import.meta.env.BASE_URL}md-logo-new.png`}
            alt="Mission Distinction Logo"
            className="w-[12vw] h-auto object-contain rounded-xl mb-[2vw]"
            style={{ boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)' }}
          />
          <h1 className="text-[5vw] font-display text-white tracking-wide"
            style={{ textShadow: '0 4px 40px rgba(0,0,0,0.9)' }}>
            MISSION DISTINCTION
          </h1>
        </motion.div>

        <div className="flex gap-[4vw] absolute top-[55%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 && phase < 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }} className="text-center">
            <div className="text-[3vw] font-display text-brand-gold">500+</div>
            <div className="text-[1.2vw] font-sans text-white/60 uppercase tracking-widest">Downloads</div>
          </motion.div>

          <motion.div className="w-[1px] bg-white/20 self-stretch"
            initial={{ scaleY: 0 }} animate={phase >= 3 && phase < 5 ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.4 }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 3 && phase < 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }} className="text-center">
            <div className="text-[3vw] font-display text-brand-purpleLight">3 WEEKS</div>
            <div className="text-[1.2vw] font-sans text-white/60 uppercase tracking-widest">Of Growth</div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-[20%] text-center w-full"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 4 && phase < 5 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}>
          <p className="text-[2vw] font-sans font-light text-white/90 italic"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.9)' }}>
            A Dream Built by Students, For Students
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-[25%] text-center w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-[3vw] font-display text-brand-gold tracking-widest uppercase"
            style={{ textShadow: '0 0 40px rgba(200,163,64,0.4)' }}>
            The Journey Has Just Begun
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-[6%] text-center w-full"
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.8 }}>
          <p className="text-[1vw] font-sans tracking-[0.2em] uppercase"
            style={{ color: 'rgba(255,255,255,0.22)' }}>
            © {new Date().getFullYear()} Mission Distinction · All Rights Reserved · missiondistinction.in
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
