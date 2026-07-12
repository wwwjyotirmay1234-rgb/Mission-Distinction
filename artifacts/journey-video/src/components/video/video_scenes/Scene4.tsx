import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 5 — THE LOWEST POINT
// Laptop screen flashes red. Months of work seem lost.
// "We didn't come this far to stop here."
export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [redFlash, setRedFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      // Red error flash
      setTimeout(() => {
        setPhase(2);
        setRedFlash(true);
        setShake(true);
        setTimeout(() => setRedFlash(false), 800);
        setTimeout(() => setShake(false), 600);
      }, 2800),
      setTimeout(() => setPhase(3), 4200),
      setTimeout(() => setPhase(4), 6000),
      setTimeout(() => setPhase(5), 8000),
      setTimeout(() => setPhase(6), 10000),  // long pause — everything stops
      setTimeout(() => setPhase(7), 13500),  // "We didn't come this far..."
      setTimeout(() => setPhase(8), 17000),  // resolution
      setTimeout(() => setPhase(9), 19500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#020106' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background — dark night, student alone */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 14, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_darknight.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.2) contrast(1.25) brightness(0.28)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(2,1,6,0.6) 0%, rgba(2,1,6,0.95) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(2,1,6,0.9) 0%, rgba(2,1,6,0.3) 45%, rgba(2,1,6,0.88) 100%)' }} />

      {/* RED ERROR FLASH */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-40"
        style={{ backgroundColor: 'rgba(220,38,38,0.45)' }}
        animate={redFlash ? { opacity: [0, 1, 0.6, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.7 }}
      />

      {/* Main content */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]"
        animate={shake ? { x: [-14, 14, -9, 9, -5, 5, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.5 } : { duration: 0 }}
      >
        {/* Setup */}
        <motion.p
          className="mb-[4vw]"
          style={{ fontSize: '1.8vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          MAY 2026 · 02:47 AM
        </motion.p>

        {/* ERROR CARD — simulates laptop screen */}
        <motion.div
          className="mb-[3.5vw] border rounded-md"
          style={{
            backgroundColor: 'rgba(220,38,38,0.08)',
            borderColor: 'rgba(220,38,38,0.35)',
            padding: '1.2vw 2.5vw',
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-[1vw] justify-center mb-[0.6vw]">
            <motion.div
              className="rounded-full bg-red-500"
              style={{ width: '0.8vw', height: '0.8vw' }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <span className="font-mono" style={{ fontSize: '1.3vw', color: 'rgba(252,165,165,0.8)', letterSpacing: '0.12em' }}>
              ERROR · SOMETHING WENT WRONG
            </span>
          </div>
          <p className="font-mono text-center" style={{ fontSize: '1vw', color: 'rgba(252,165,165,0.5)', letterSpacing: '0.08em' }}>
            Please try again.
          </p>
        </motion.div>

        {/* "Something breaks." */}
        <div className="overflow-hidden mb-[0.8vw]">
          <motion.h2
            className="font-display text-white"
            style={{ fontSize: '6.5vw', letterSpacing: '-0.02em', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}
            initial={{ y: '110%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            Something breaks.
          </motion.h2>
        </div>

        {/* "Months of work seem lost." */}
        <motion.p
          className="mb-[3.5vw]"
          style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          Months of work seem lost.
        </motion.p>

        {/* "The room falls silent." */}
        <motion.p
          className="mb-[1vw]"
          style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          The room falls silent.
        </motion.p>

        {/* "No one speaks." */}
        <motion.p
          className="mb-[4vw]"
          style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          No one speaks.
        </motion.p>

        {/* Long pause — "The dream appears to be over." */}
        <motion.p
          className="mb-[4vw]"
          style={{ fontSize: '2.4vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2.5 }}>
          The dream appears to be over.
        </motion.p>

        {/* THE TURN — "We didn't come this far to stop here." */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display"
            style={{
              fontSize: '4.8vw',
              color: '#C8A340',
              letterSpacing: '-0.01em',
              textShadow: '0 0 60px rgba(200,163,64,0.42), 0 4px 50px rgba(0,0,0,0.95)',
              lineHeight: 1.1,
            }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 7 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            "We didn't come this far
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display"
            style={{
              fontSize: '4.8vw',
              color: '#C8A340',
              letterSpacing: '-0.01em',
              textShadow: '0 0 60px rgba(200,163,64,0.42), 0 4px 50px rgba(0,0,0,0.95)',
              lineHeight: 1.1,
            }}
            initial={{ y: '105%' }}
            animate={phase >= 7 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 1.2, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
            to stop here."
          </motion.h1>
        </div>

        {/* "Laptops reopen. The fight continues." */}
        <motion.p
          className="mt-[3.5vw]"
          style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 8 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          Laptops reopen. The fight continues.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
