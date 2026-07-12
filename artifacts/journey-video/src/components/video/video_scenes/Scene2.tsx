import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 3 — THE SPARK
// Five students. Small room. "What if we build what we wish existed?"
export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5500),
      setTimeout(() => setPhase(4), 8000),
      setTimeout(() => setPhase(5), 11000),
      setTimeout(() => setPhase(6), 13500),
      setTimeout(() => setPhase(7), 15800),
      setTimeout(() => setPhase(8), 18000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Background — 5 students gathered */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.09 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coldopen.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.32) contrast(1.12) brightness(0.34)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays — warm evening feel */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(200,163,64,0.04) 0%, transparent 60%)' }} />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Scene stamp */}
        <motion.p
          className="font-mono mb-[3.5vw]"
          style={{ fontSize: '0.9vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          LATE EVENING · A SMALL ROOM · VIMSAR, BURLA
        </motion.p>

        {/* "No investors, no office..." */}
        <motion.div
          className="mb-[3vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <p style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', lineHeight: 2 }}>
            No investors. No office. No fancy equipment.
          </p>
          <p style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', lineHeight: 2 }}>
            Just laptops. Notebooks. Determination.
          </p>
        </motion.div>

        {/* "A whiteboard..." — the setup */}
        <motion.p
          className="mb-[3vw]"
          style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          A whiteboard filled with ideas.
        </motion.p>
        <motion.p
          className="mb-[3.5vw]"
          style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}>
          One question written in bold:
        </motion.p>

        {/* THE QUESTION — the most important line */}
        <div className="overflow-hidden mb-[0.3vw]">
          <motion.h1
            className="font-display leading-tight"
            style={{ fontSize: '5.2vw', color: '#C8A340', letterSpacing: '-0.01em', textShadow: '0 0 60px rgba(200,163,64,0.4), 0 4px 50px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 4 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            "What if we build
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display leading-tight"
            style={{ fontSize: '5.2vw', color: '#C8A340', letterSpacing: '-0.01em', textShadow: '0 0 60px rgba(200,163,64,0.4), 0 4px 50px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 4 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 1, delay: 0.09, ease: [0.16, 1, 0.3, 1] }}>
            what we wish existed?"
          </motion.h1>
        </div>

        {/* "Silence." */}
        <motion.p
          className="mt-[4vw]"
          style={{ fontSize: '2.5vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.25em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          Silence.
        </motion.p>

        {/* "Then nods." */}
        <motion.p
          className="mt-[1.5vw]"
          style={{ fontSize: '2.5vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.2em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          Then nods.
        </motion.p>

        {/* Hair divider */}
        <motion.div
          className="mx-auto my-[3vw]"
          style={{ height: '1px', background: 'rgba(200,163,64,0.2)' }}
          initial={{ width: 0 }}
          animate={phase >= 7 ? { width: '18vw' } : { width: 0 }}
          transition={{ duration: 0.9 }}
        />

        {/* THE MISSION BEGINS — massive */}
        <div className="overflow-hidden">
          <motion.h2
            className="font-display text-white"
            style={{ fontSize: '7.5vw', letterSpacing: '-0.02em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '110%' }}
            animate={phase >= 8 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            THE MISSION BEGINS.
          </motion.h2>
        </div>
      </div>
    </motion.div>
  );
}
