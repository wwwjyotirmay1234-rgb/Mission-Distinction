import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 2 — THE ASSEMBLY
// He made a call. Built a team of 5.
export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Background — full group together */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 9, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coldopen.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.35) contrast(1.12) brightness(0.36)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.75) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(200,163,64,0.08)' }} />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Setup whisper */}
        <div className="overflow-hidden mb-[1.2vw]">
          <motion.p
            style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)' }}
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            so he made a call.
          </motion.p>
        </div>

        {/* The action — massive */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '9.5vw', letterSpacing: '-0.025em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            HE BUILT A TEAM.
          </motion.h1>
        </div>

        {/* Hair divider */}
        <motion.div
          className="mx-auto my-[2.5vw]"
          style={{ height: '1px', background: 'rgba(200,163,64,0.2)' }}
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: '22vw' } : { width: 0 }}
          transition={{ duration: 0.9 }}
        />

        {/* The promise */}
        <div className="overflow-hidden mb-[0.6vw]">
          <motion.p
            style={{ fontSize: '3.2vw', fontWeight: 700, letterSpacing: '0.08em', color: '#C8A340', textShadow: '0 2px 30px rgba(0,0,0,0.9)' }}
            initial={{ y: '110%' }}
            animate={phase >= 3 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            5 STUDENTS. 1 PROMISE.
          </motion.p>
        </div>
        <div className="overflow-hidden">
          <motion.p
            style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)' }}
            initial={{ y: '110%' }}
            animate={phase >= 3 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            to fix what the system broke.
          </motion.p>
        </div>

        {/* Location/time stamp */}
        <motion.p
          className="font-mono mt-[3vw]"
          style={{ fontSize: '0.9vw', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          VIMSAR, BURLA · MARCH 2026
        </motion.p>
      </div>
    </motion.div>
  );
}
