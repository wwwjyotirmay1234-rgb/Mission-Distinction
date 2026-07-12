import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 6200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ filter: 'brightness(4)' }}
      animate={{ filter: 'brightness(1)' }}
      exit={{ scale: 1.08, opacity: 0, filter: 'blur(16px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Group silhouette — all 5 facing a glowing screen */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_silhouette.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.38) contrast(1.12) brightness(0.48)' }}
          alt=""
        />
      </motion.div>

      {/* Male close-up face fades in — gives one face to follow */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 0.5 } : { opacity: 0 }}
        transition={{ duration: 2.5, ease: 'easeIn' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/face_male_determined.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.3) contrast(1.18) brightness(0.38)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,8,25,0.97) 0%, rgba(10,8,25,0.42) 45%, rgba(10,8,25,0.22) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.68) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(150,90,20,0.14)' }} />

      {/* Content — typography contrast: thin sets up, bold lands */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12 text-center">
        <div className="relative">
          <motion.div
            className="w-[2px] h-[8vh] bg-brand-gold mx-auto mb-6"
            style={{ opacity: 0.5 }}
            initial={{ scaleY: 0, transformOrigin: 'top' }}
            animate={phase >= 1 ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Thin whisper label */}
          <div className="overflow-hidden mb-[0.5vw]">
            <motion.p
              style={{
                fontSize: '1.8vw',
                fontWeight: 100,
                fontStyle: 'italic',
                letterSpacing: '0.3em',
                color: 'rgba(200,163,64,0.55)',
                textShadow: '0 2px 20px rgba(0,0,0,0.9)',
              }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
              from a dream
            </motion.p>
          </div>

          {/* Massive bold — the weight contrast */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-display text-white leading-none"
              style={{
                fontSize: '8.5vw',
                letterSpacing: '-0.025em',
                textShadow: '0 4px 60px rgba(0,0,0,0.95)',
              }}
              initial={{ y: '100%' }}
              animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              THE MISSION
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              className="font-display leading-none"
              style={{
                fontSize: '8.5vw',
                letterSpacing: '-0.025em',
                color: '#C8A340',
                textShadow: '0 4px 60px rgba(0,0,0,0.95)',
              }}
              initial={{ y: '100%' }}
              animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 1, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}>
              BEGINS.
            </motion.h1>
          </div>
        </div>
      </div>

      {/* Location stamp — bottom left */}
      <motion.div
        className="absolute bottom-[8%] left-[5%] z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 1 }}>
        <div className="w-6 h-[1px] bg-brand-gold/40 mb-2" />
        <p style={{ fontSize: '1vw', fontWeight: 100, letterSpacing: '0.35em', color: 'rgba(200,163,64,0.7)', textTransform: 'uppercase' }}>
          Burla, Sambalpur · Odisha
        </p>
        <p style={{ fontSize: '0.9vw', fontWeight: 100, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
          18 April 2026
        </p>
      </motion.div>

      {/* Earned bottom-right line — specific not generic */}
      <motion.p
        className="absolute bottom-[8%] right-[5%] z-20"
        style={{
          fontSize: '1vw',
          fontWeight: 100,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.28)',
          letterSpacing: '0.08em',
        }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2 }}>
        after failing their 1st year exams —
      </motion.p>
    </motion.div>
  );
}
