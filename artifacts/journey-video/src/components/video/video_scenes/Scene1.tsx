import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 2 — THE REALIZATION
// Lecture hall. Hundreds of students. All struggling.
// "I am not the only one struggling."
export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 8500),
      setTimeout(() => setPhase(5), 11500),
      setTimeout(() => setPhase(6), 15000),
      setTimeout(() => setPhase(7), 17500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ filter: 'brightness(3)' }}
      animate={{ filter: 'brightness(1)' }}
      exit={{ x: '-5%', opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background — lecture hall, crowd */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coldopen.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.3) contrast(1.15) brightness(0.38)' }}
          alt=""
        />
      </motion.div>

      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(4,3,16,0.98) 0%, rgba(4,3,16,0.42) 50%, rgba(4,3,16,0.25) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.72) 100%)' }} />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Morning location */}
        <motion.p
          className="font-mono mb-[4vw]"
          style={{ fontSize: '0.9vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.2)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          MORNING · VIMSAR LECTURE HALL · HUNDREDS OF STUDENTS
        </motion.p>

        {/* What they all do — three lines cycling in */}
        <motion.div
          className="mb-[3.5vw] space-y-[0.8vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          {[
            { text: 'Some hide their anxiety behind smiles.', delay: 0 },
            { text: 'Some desperately copy notes.', delay: 0.4 },
            { text: 'Some search Telegram groups for PDFs.', delay: 0.8 },
          ].map(({ text, delay }) => (
            <motion.p
              key={text}
              style={{ fontSize: '1.8vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.32)' }}
              initial={{ opacity: 0, x: -16 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
              transition={{ delay, duration: 1 }}>
              {text}
            </motion.p>
          ))}
        </motion.div>

        {/* "Everyone is studying. Yet everyone seems lost." */}
        <motion.div
          className="mb-[3.5vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <p style={{ fontSize: '2.4vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.08em' }}>
            Everyone is studying.
          </p>
          <p style={{ fontSize: '2.4vw', fontWeight: 700, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.04em', marginTop: '0.4vw' }}>
            Yet everyone seems lost.
          </p>
        </motion.div>

        {/* The realization — massive */}
        <div className="overflow-hidden mb-[0.5vw]">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '4.5vw', letterSpacing: '-0.01em', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}
            initial={{ y: '110%' }}
            animate={phase >= 4 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            "I am not
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-[0.5vw]">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '4.5vw', letterSpacing: '-0.01em', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}
            initial={{ y: '110%' }}
            animate={phase >= 4 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 1, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
            the only one
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display leading-none"
            style={{ fontSize: '4.5vw', color: '#C8A340', letterSpacing: '-0.01em', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}
            initial={{ y: '110%' }}
            animate={phase >= 4 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 1, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}>
            struggling."
          </motion.h1>
        </div>

        {/* "Different colleges. Different cities." */}
        <motion.div
          className="mt-[3.5vw] space-y-[0.5vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <p style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.15em' }}>
            Different colleges. Different cities.
          </p>
        </motion.div>

        {/* "Same battle. Same dream." — the emotional peak */}
        <div className="overflow-hidden mt-[1.5vw]">
          <motion.h2
            className="font-display"
            style={{ fontSize: '6.5vw', color: '#ffffff', letterSpacing: '-0.015em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '110%' }}
            animate={phase >= 6 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            Same battle.
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            className="font-display"
            style={{ fontSize: '6.5vw', color: '#C8A340', letterSpacing: '-0.015em', textShadow: '0 0 50px rgba(200,163,64,0.3)' }}
            initial={{ y: '110%' }}
            animate={phase >= 6 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}>
            Same dream.
          </motion.h2>
        </div>
      </div>
    </motion.div>
  );
}
