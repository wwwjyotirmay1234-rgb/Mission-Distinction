import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 4 — THE DECISION
// "What about the rest of Odisha?" — The question that changed everything.
export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4200),
      setTimeout(() => setPhase(4), 6500),
      setTimeout(() => setPhase(5), 8800),
      setTimeout(() => setPhase(6), 10500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#04030f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background — group portrait, barely visible */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_portrait.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.2) contrast(1.1) brightness(0.22)' }}
          alt=""
        />
      </motion.div>

      {/* Deep dark overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(4,3,15,0.65) 0%, rgba(4,3,15,0.96) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(4,3,15,0.9) 0%, rgba(4,3,15,0.4) 40%, rgba(4,3,15,0.88) 100%)' }} />

      {/* Content — centred */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Setup */}
        <div className="overflow-hidden mb-[2vw]">
          <motion.p
            style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            then someone asked —
          </motion.p>
        </div>

        {/* THE QUESTION — massive, gold, everything changes here */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <p style={{
            fontSize: '5.5vw',
            fontWeight: 700,
            color: '#C8A340',
            textShadow: '0 0 60px rgba(200,163,64,0.4), 0 4px 50px rgba(0,0,0,0.95)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            "what about the rest
          </p>
          <p style={{
            fontSize: '5.5vw',
            fontWeight: 700,
            color: '#C8A340',
            textShadow: '0 0 60px rgba(200,163,64,0.4), 0 4px 50px rgba(0,0,0,0.95)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            of Odisha?"
          </p>
        </motion.div>

        {/* The truth */}
        <motion.div
          className="mt-[3.5vw]"
          initial={{ opacity: 0, y: 14 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1.1 }}>
          <p style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            students at every medical college across Odisha —
          </p>
          <p style={{ fontSize: '2.2vw', fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em', marginTop: '0.3vw' }}>
            struggling. silent. alone.
          </p>
        </motion.div>

        {/* Hair divider */}
        <motion.div
          className="mx-auto my-[3vw]"
          style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
          initial={{ width: 0 }}
          animate={phase >= 4 ? { width: '20vw' } : { width: 0 }}
          transition={{ duration: 0.8 }}
        />

        {/* The decision */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display leading-none"
            style={{ fontSize: '8.5vw', color: '#ffffff', letterSpacing: '-0.025em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 5 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
            SO THEY DECIDED
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            className="font-display leading-none"
            style={{ fontSize: '4.5vw', color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.01em' }}
            initial={{ y: '105%' }}
            animate={phase >= 5 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            to build the app.
          </motion.h2>
        </div>

        {/* The moment */}
        <motion.p
          className="font-mono mt-[3vw]"
          style={{ fontSize: '0.9vw', letterSpacing: '0.45em', color: 'rgba(200,163,64,0.4)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          THE MOMENT EVERYTHING CHANGED · VIMSAR, 2026
        </motion.p>
      </div>
    </motion.div>
  );
}
