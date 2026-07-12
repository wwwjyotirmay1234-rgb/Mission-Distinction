import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 6 — THE LAUNCH
// 18 April 2026. One button. Everything on the line.
export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1700),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setPhase(5), 6500),
      setTimeout(() => setPhase(6), 7800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#030210' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.06, opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Background — launch / celebration */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 9, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_launch.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.35) contrast(1.15) brightness(0.38)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays — deep purple tint for tension */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(3,2,16,0.9) 0%, rgba(3,2,16,0.35) 45%, rgba(3,2,16,0.88) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,0.78) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(80,40,200,0.12)' }} />

      {/* Content — centred */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Setup whisper */}
        <div className="overflow-hidden mb-[1.5vw]">
          <motion.p
            style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.38)' }}
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            after everything —
          </motion.p>
        </div>

        {/* THE LAUNCH — massive */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '10.5vw', letterSpacing: '-0.025em', textShadow: '0 4px 70px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '105%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            THEY LAUNCHED.
          </motion.h1>
        </div>

        {/* Tension */}
        <motion.p
          className="mt-[2vw]"
          style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          one button. one prayer.
        </motion.p>

        {/* Hair divider */}
        <motion.div
          className="mx-auto my-[3vw]"
          style={{ height: '1px', background: 'rgba(200,163,64,0.22)' }}
          initial={{ width: 0 }}
          animate={phase >= 4 ? { width: '18vw' } : { width: 0 }}
          transition={{ duration: 0.9 }}
        />

        {/* THE DATE — gold, massive */}
        <div className="overflow-hidden">
          <motion.p
            className="font-mono"
            style={{ fontSize: '2.8vw', letterSpacing: '0.5em', color: '#C8A340', textShadow: '0 0 40px rgba(200,163,64,0.35)' }}
            initial={{ y: '110%' }}
            animate={phase >= 4 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            18 APRIL 2026
          </motion.p>
        </div>

        {/* App name reveal */}
        <motion.p
          className="mt-[2.5vw]"
          style={{ fontSize: '1.6vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}>
          a name for what they built:
        </motion.p>

        <div className="overflow-hidden mt-[0.8vw]">
          <motion.h2
            className="font-display"
            style={{ fontSize: '5.2vw', color: '#C8A340', letterSpacing: '0.08em', textShadow: '0 0 50px rgba(200,163,64,0.4)' }}
            initial={{ y: '110%' }}
            animate={phase >= 6 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            MISSION DISTINCTION
          </motion.h2>
        </div>
      </div>
    </motion.div>
  );
}
