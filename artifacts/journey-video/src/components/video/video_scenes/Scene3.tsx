import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 3 — THE PDF
// They started small. Made MBBS resource PDFs for their college. First win.
export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5800),
      setTimeout(() => setPhase(5), 7800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Background — late-night desk, books, papers */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_desk_overhead.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.28) contrast(1.22) brightness(0.32)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays — warm paper glow */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(5,4,18,0.9) 0%, rgba(5,4,18,0.5) 50%, rgba(5,4,18,0.88) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 40% 55%, rgba(200,163,64,0.05) 0%, transparent 60%)' }} />

      {/* Content — left aligned for contrast with S2 */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-[8vw]">

        {/* Setup whisper */}
        <div className="overflow-hidden mb-[1.5vw]">
          <motion.p
            style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.38)' }}
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            they started small.
          </motion.p>
        </div>

        {/* FIRST — dramatic pause */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '10.5vw', letterSpacing: '-0.03em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
            FIRST.
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display leading-none"
            style={{ fontSize: '10.5vw', letterSpacing: '-0.03em', color: '#C8A340', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 0.85, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}>
            THE PDF.
          </motion.h1>
        </div>

        {/* What they built */}
        <motion.p
          className="mt-[2.5vw]"
          style={{ fontSize: '2.1vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 1 }}>
          MBBS resources — built from scratch.
        </motion.p>
        <motion.p
          className="mt-[0.4vw]"
          style={{ fontSize: '2.1vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.25 }}>
          for their college. for their city.
        </motion.p>

        {/* First win */}
        <motion.div
          className="mt-[3vw] border-l-2 pl-[1.8vw]"
          style={{ borderColor: 'rgba(200,163,64,0.45)' }}
          initial={{ opacity: 0, x: -16 }}
          animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
          transition={{ duration: 1 }}>
          <p style={{ fontSize: '2.6vw', fontWeight: 700, color: '#C8A340', letterSpacing: '0.04em', textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            VIMSAR STUDENTS
          </p>
          <p style={{ fontSize: '2.6vw', fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.04em', textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            FINALLY HAD SOMETHING.
          </p>
        </motion.div>

        {/* The question that changes everything */}
        <motion.p
          className="mt-[3.5vw]"
          style={{ fontSize: '1.7vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.22)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          but they kept asking —
        </motion.p>
      </div>
    </motion.div>
  );
}
