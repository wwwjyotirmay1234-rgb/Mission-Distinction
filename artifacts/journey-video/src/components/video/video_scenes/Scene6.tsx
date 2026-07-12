import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 7 — THE RIPPLE EFFECT
// Camera travels across Odisha. Different faces. Same idea. Students helping students.
const VIGNETTES = [
  { line: 'A student studies in a hostel room.', detail: 'VIMSAR · BURLA' },
  { line: 'Another studies on a bus.', detail: 'SAMBALPUR → CUTTACK' },
  { line: 'Another revises before an exam.', detail: 'SCB MEDICAL COLLEGE' },
  { line: 'Another finally understands a difficult topic.', detail: 'MKCG · BERHAMPUR' },
];

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const [vigIdx, setVigIdx] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2200),   // vignettes begin
      setTimeout(() => setPhase(3), 10000),  // "Different faces. Different stories."
      setTimeout(() => setPhase(4), 13000),  // "Connected by one idea."
      setTimeout(() => setPhase(5), 16000),  // "Students helping students."
      setTimeout(() => setPhase(6), 18500),  // "ACROSS ODISHA. ONE MISSION."
    ];

    // Vignette cycling
    let idx = 0;
    const vigTimer = setInterval(() => {
      idx = Math.min(idx + 1, VIGNETTES.length - 1);
      setVigIdx(idx);
    }, 1900);
    const stopVig = setTimeout(() => clearInterval(vigTimer), 8500);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(vigTimer);
      clearTimeout(stopVig);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '5%' }}
      transition={{ duration: 0.9 }}
    >
      {/* Background — student hope */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 14, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_hope.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.32) contrast(1.15) brightness(0.35)' }}
          alt=""
        />
      </motion.div>

      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.28) 48%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.75) 100%)' }} />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Opening travel line */}
        <motion.p
          className="font-mono mb-[5vw]"
          style={{ fontSize: '0.9vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          THE CAMERA TRAVELS ACROSS ODISHA
        </motion.p>

        {/* Vignette cycling */}
        {phase >= 2 && phase < 3 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}>
            <motion.div
              key={vigIdx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <p style={{ fontSize: '3.8vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', marginBottom: '1vw' }}>
                {VIGNETTES[vigIdx].line}
              </p>
              <p className="font-mono" style={{ fontSize: '0.85vw', letterSpacing: '0.45em', color: 'rgba(200,163,64,0.45)' }}>
                {VIGNETTES[vigIdx].detail}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* "Different faces. Different stories." */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={phase >= 3 && phase < 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <p style={{ fontSize: '3.2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', lineHeight: 2 }}>
            Different faces. Different stories.
          </p>
        </motion.div>

        {/* "Connected by one idea." */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={phase >= 4 && phase < 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <p style={{ fontSize: '3.8vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>
            Connected by one idea.
          </p>
        </motion.div>

        {/* "Students helping students." */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={phase >= 5 && phase < 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <div className="overflow-hidden">
            <motion.h2
              className="font-display text-white"
              style={{ fontSize: '5.5vw', letterSpacing: '-0.01em', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}
              initial={{ y: '110%' }}
              animate={phase >= 5 ? { y: 0 } : { y: '110%' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              Students helping students.
            </motion.h2>
          </div>
        </motion.div>

        {/* "ACROSS ODISHA. ONE MISSION." */}
        {phase >= 6 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            <div className="overflow-hidden mb-[0.5vw]">
              <motion.h1
                className="font-display text-white"
                style={{ fontSize: '8.5vw', letterSpacing: '-0.02em', textShadow: '0 4px 70px rgba(0,0,0,0.95)' }}
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                ACROSS ODISHA.
              </motion.h1>
            </div>
            <div className="overflow-hidden">
              <motion.h1
                className="font-display"
                style={{ fontSize: '8.5vw', color: '#C8A340', letterSpacing: '-0.02em', textShadow: '0 0 60px rgba(200,163,64,0.35)' }}
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
                ONE MISSION.
              </motion.h1>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
