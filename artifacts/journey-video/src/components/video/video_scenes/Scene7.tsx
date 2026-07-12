import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

// SCENE 7 — THE FIRST 24 HOURS
// 150 downloads. Strangers. People they had never met.
export function Scene7() {
  const [phase, setPhase] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3200), // counter starts
      setTimeout(() => {
        setPhase(4);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }, 6800), // 150 hit — shake
      setTimeout(() => setPhase(5), 8500),
      setTimeout(() => setPhase(6), 10000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 22, damping: 14 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 3) count.set(150);
  }, [phase, count]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#020208' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Background — group celebration photo */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={phase >= 4 ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_celebration.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.35) contrast(1.12) brightness(0.3)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays — get warmer when 150 hits */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
        animate={phase >= 4
          ? { background: 'radial-gradient(ellipse at center, rgba(200,163,64,0.18) 0%, rgba(0,0,0,0.88) 65%)' }
          : { background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.9) 65%)' }
        }
        transition={{ duration: 1.5 }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.92) 100%)' }} />

      {/* Gold flash when 150 hits */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 50, backgroundColor: 'rgba(200,163,64,0.28)' }}
        animate={phase >= 4 ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Content */}
      <motion.div
        className="relative text-center flex flex-col items-center"
        style={{ zIndex: 10 }}
        animate={shake ? { x: [-10, 10, -7, 7, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45 } : { duration: 0 }}
      >
        {/* Setup */}
        <div className="overflow-hidden mb-[0.8vw]">
          <motion.p
            style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.38)' }}
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            in the first
          </motion.p>
        </div>

        {/* 24 HOURS — big impact */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '9.5vw', letterSpacing: '-0.025em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            24 HOURS
          </motion.h1>
        </div>

        {/* Counter — climbs to 150 */}
        <motion.span
          className="font-display leading-none tracking-tighter block"
          style={{
            fontSize: '20vw',
            color: phase >= 4 ? '#C8A340' : 'rgba(255,255,255,0.85)',
            textShadow: phase >= 4 ? '0 0 100px rgba(200,163,64,0.35)' : '0 0 80px rgba(255,255,255,0.06)',
            transition: 'color 0.8s ease, text-shadow 0.8s ease',
            marginTop: '0.5vw',
          }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={phase >= 3 ? { scale: phase >= 4 ? 1.04 : 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.9, type: 'spring', stiffness: 160, damping: 20 }}
        >
          {displayCount}
        </motion.span>

        {/* Context — strangers, never met */}
        <motion.p
          className="mt-[1.5vw]"
          style={{ fontSize: '2.1vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          students they had never met —
        </motion.p>

        {/* Impact — bold */}
        <div className="overflow-hidden mt-[0.3vw]">
          <motion.p
            style={{ fontSize: '3vw', fontWeight: 700, color: '#C8A340', letterSpacing: '0.04em', textShadow: '0 2px 30px rgba(0,0,0,0.9)' }}
            initial={{ y: '110%' }}
            animate={phase >= 4 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            BELIEVED IN WHAT THEY BUILT.
          </motion.p>
        </div>

        {/* Quiet emotional coda */}
        <motion.p
          className="mt-[3vw]"
          style={{ fontSize: '1.6vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          that was just the beginning.
        </motion.p>

        {/* Timestamp */}
        <motion.p
          className="font-mono mt-[2vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.42em', color: 'rgba(200,163,64,0.35)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}>
          18 APRIL 2026 · 24:00 HRS
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
