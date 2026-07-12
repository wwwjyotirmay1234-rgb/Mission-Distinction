import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 3500),
      setTimeout(() => setPhase(3), 6500),
      setTimeout(() => setPhase(4), 9000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#000000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
    >
      {/* Team silhouette — slow Ken Burns, golden hour */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_team_outro.png`}
          className="w-full h-full object-cover object-top"
          style={{ filter: 'saturate(0.55) contrast(1.08) brightness(0.45)' }}
          alt=""
        />
      </motion.div>

      {/* Minimal overlays — let the photo breathe */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.97) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)' }} />

      {/* Barely-visible warm tint */}
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(160,100,30,0.12)' }} />

      {/* THE ONE LINE — everything else stripped */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">

        {/* Thin whisper first */}
        <motion.p
          style={{
            fontSize: '1.8vw',
            fontWeight: 100,
            fontStyle: 'italic',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '1.5vw',
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          5 students. 1 room. 72 nights.
        </motion.p>

        {/* The ONE line — massive, earned, human */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-center"
            style={{
              fontSize: '7vw',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 60px rgba(0,0,0,0.95)',
              lineHeight: 1,
            }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            THE DREAM IS ALIVE.
          </motion.h1>
        </div>

        {/* Thin rule */}
        <motion.div
          style={{ height: '1px', backgroundColor: 'rgba(200,163,64,0.25)', marginTop: '3vw', marginBottom: '3vw' }}
          initial={{ width: 0 }}
          animate={phase >= 2 ? { width: '22vw' } : { width: 0 }}
          transition={{ duration: 1 }}
        />

        {/* Logo — fades in quiet, holds */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 1.5 }}>
          <img
            src={`${import.meta.env.BASE_URL}md-logo-new.png`}
            alt="Mission Distinction"
            className="w-[9vw] h-auto object-contain rounded-xl mb-[1.5vw]"
            style={{ boxShadow: '0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15)' }}
          />
          <p
            className="font-mono text-center"
            style={{ fontSize: '0.9vw', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.3)' }}>
            MISSION DISTINCTION
          </p>
        </motion.div>

        {/* Still building — barely visible, the promise */}
        <motion.p
          style={{
            fontSize: '1.2vw',
            fontWeight: 100,
            fontStyle: 'italic',
            letterSpacing: '0.2em',
            color: 'rgba(200,163,64,0.4)',
            marginTop: '3vw',
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          still building. for every mbbs student.
        </motion.p>
      </div>

      {/* Final fade to black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ zIndex: 50 }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2.5 }}
      />
    </motion.div>
  );
}
