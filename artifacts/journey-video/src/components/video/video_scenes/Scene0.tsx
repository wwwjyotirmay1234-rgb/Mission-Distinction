import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene0() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3600),
      setTimeout(() => setPhase(4), 5200),
      setTimeout(() => setPhase(5), 7200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      {/* Full group — cinematic cold open */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coldopen.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.4) contrast(1.18) brightness(0.48)' }}
          alt=""
        />
      </motion.div>

      {/* Close-up face fades in over group photo for personal anchor */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 0.55 } : { opacity: 0 }}
        transition={{ duration: 2.5, ease: 'easeIn' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/face_male_determined.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.3) contrast(1.2) brightness(0.4)' }}
          alt=""
        />
      </motion.div>

      {/* Bottom-heavy vignette */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.5) 72%, rgba(0,0,0,0.95) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.65) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(180,120,40,0.16)' }} />

      {/* Location stamp */}
      <motion.div
        className="absolute z-10"
        style={{ top: '22%', left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <p className="font-mono text-center whitespace-nowrap"
          style={{ fontSize: '1.05vw', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.3)' }}>
          VIMSAR · BURLA, SAMBALPUR · ODISHA, INDIA
        </p>
        <motion.p
          className="font-mono text-center mt-2 whitespace-nowrap"
          style={{ fontSize: '0.95vw', letterSpacing: '0.35em', color: 'rgba(200,163,64,0.5)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2, delay: 0.6 }}>
          18 APRIL 2026 · 5 STUDENTS · 1 MISSION
        </motion.p>
      </motion.div>

      {/* TITLE — typography contrast */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[8vw]">
        <div className="text-center" style={{ marginTop: '5vw' }}>

          {/* Thin whisper line first */}
          <div className="overflow-hidden mb-[1.2vw]">
            <motion.p
              className="text-center"
              style={{
                fontSize: '2.2vw',
                fontWeight: 100,
                letterSpacing: '0.25em',
                color: 'rgba(255,255,255,0.45)',
                fontStyle: 'italic',
                textShadow: '0 2px 20px rgba(0,0,0,0.9)',
              }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              an mbbs student
            </motion.p>
          </div>

          {/* Massive impact line */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-display text-white leading-[0.88] text-center"
              style={{ fontSize: '9.5vw', textShadow: '0 4px 50px rgba(0,0,0,0.9)', letterSpacing: '-0.02em' }}
              initial={{ y: '105%', opacity: 0 }}
              animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
              WAS STRUGGLING.
            </motion.h1>
          </div>

          {/* Breathing space — just a thin line */}
          <motion.div
            className="mx-auto my-[2vw]"
            style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}
            initial={{ width: 0 }}
            animate={phase >= 3 ? { width: '35vw' } : { width: 0 }}
            transition={{ duration: 0.8 }}
          />

          {/* Specific earned copy — replaces "SO THEY BUILT SOMETHING" */}
          <div className="overflow-hidden mb-[0.4vw]">
            <motion.p
              className="text-center"
              style={{
                fontSize: '2vw',
                fontWeight: 100,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.4)',
                fontStyle: 'italic',
              }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              so they stayed up every night
            </motion.p>
          </div>
          <div className="overflow-hidden">
            <motion.h2
              className="font-display text-center"
              style={{ fontSize: '5.5vw', color: '#C8A340', letterSpacing: '-0.01em', textShadow: '0 4px 40px rgba(0,0,0,0.9)' }}
              initial={{ y: '105%', opacity: 0 }}
              animate={phase >= 4 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
              AND BUILT THE APP THEY WISHED EXISTED.
            </motion.h2>
          </div>
        </div>
      </div>

      {/* Smash-cut white flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.15 }}
      />
    </motion.div>
  );
}
