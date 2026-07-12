import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 1 — THE SCALE
// It wasn't just him. All of Odisha was studying blind.
export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ filter: 'brightness(3.5)' }}
      animate={{ filter: 'brightness(1)' }}
      exit={{ x: '-6%', opacity: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background — group silhouette, dark */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 9, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_silhouette.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.3) contrast(1.12) brightness(0.38)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,4,18,0.98) 0%, rgba(5,4,18,0.4) 50%, rgba(5,4,18,0.25) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.72) 100%)' }} />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        {/* Gold vertical line entrance */}
        <motion.div
          className="mx-auto mb-[2.5vw] bg-brand-gold"
          style={{ width: '1px' }}
          initial={{ height: 0 }}
          animate={phase >= 1 ? { height: '7vh' } : { height: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Thin whisper */}
        <div className="overflow-hidden mb-[0.8vw]">
          <motion.p
            style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.38)' }}
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            it wasn't just him.
          </motion.p>
        </div>

        {/* Massive scale reveal */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '9vw', letterSpacing: '-0.025em', textShadow: '0 4px 70px rgba(0,0,0,0.95)' }}
            initial={{ y: '100%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            ALL OF ODISHA
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display leading-none"
            style={{ fontSize: '9vw', color: 'rgba(255,255,255,0.18)', letterSpacing: '-0.025em', textShadow: '0 4px 70px rgba(0,0,0,0.95)' }}
            initial={{ y: '100%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
            transition={{ duration: 1, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}>
            WAS STRUGGLING.
          </motion.h1>
        </div>

        {/* Context — specific */}
        <motion.p
          className="mt-[3vw]"
          style={{ fontSize: '1.7vw', fontWeight: 100, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}
          initial={{ opacity: 0, y: 12 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 1.2 }}>
          no app. no platform. no proper resource —
        </motion.p>
        <motion.p
          className="mt-[0.5vw]"
          style={{ fontSize: '1.7vw', fontWeight: 100, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}>
          for students who deserved to pass.
        </motion.p>

        {/* Earned coda */}
        <motion.p
          className="mt-[3vw]"
          style={{ fontSize: '1.5vw', fontWeight: 100, letterSpacing: '0.35em', color: 'rgba(200,163,64,0.6)', fontStyle: 'italic' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.4 }}>
          ODISHA · EVERY MEDICAL COLLEGE
        </motion.p>
      </div>
    </motion.div>
  );
}
