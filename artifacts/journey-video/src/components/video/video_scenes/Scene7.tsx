import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 7000),
      setTimeout(() => setPhase(5), 9500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#06060e' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* Female student close-up — fades in first, anchors the emotion */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
        transition={{ duration: 3.5, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/face_female_focused.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.35) contrast(1.08) brightness(0.4)' }}
          alt=""
        />
      </motion.div>

      {/* Student hope portrait layers over it — crossfade for continuity */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 0.7 } : { opacity: 0 }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_hope.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.4) contrast(1.05) brightness(0.42)' }}
          alt=""
        />
      </motion.div>

      {/* Heavy left-side dark overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(6,6,14,0.97) 0%, rgba(6,6,14,0.88) 42%, rgba(6,6,14,0.4) 72%, rgba(6,6,14,0.15) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(6,6,14,0.92) 0%, transparent 42%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(60,30,100,0.18)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 28% 50%, transparent 38%, rgba(0,0,0,0.62) 100%)' }} />

      {/* Content — left-aligned */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="text-left max-w-[55vw] px-[8vw]">

          {/* Thin whisper — sets the register */}
          <div className="overflow-hidden mb-[0.5vw]">
            <motion.p
              style={{
                fontSize: '1.8vw',
                fontWeight: 100,
                fontStyle: 'italic',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.35)',
              }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              to the first 500
            </motion.p>
          </div>

          {/* Massive emotional anchor */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-sans leading-tight"
              style={{
                fontSize: '5.5vw',
                fontWeight: 800,
                color: '#ffffff',
                textShadow: '0 4px 40px rgba(0,0,0,0.8)',
                letterSpacing: '-0.02em',
              }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
              who believed
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              className="font-sans leading-tight"
              style={{
                fontSize: '5.5vw',
                fontWeight: 100,
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.6)',
                textShadow: '0 4px 30px rgba(0,0,0,0.8)',
              }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              before we did —
            </motion.h1>
          </div>

          {/* Gold "thank you" — the peak */}
          <motion.div
            className="mt-[3vw] mb-[3vw]"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <span
              className="font-display"
              style={{
                fontSize: '9vw',
                color: '#C8A340',
                textShadow: '0 0 60px rgba(200,163,64,0.45), 0 0 120px rgba(200,163,64,0.12)',
                letterSpacing: '-0.02em',
              }}>
              thank you.
            </span>
          </motion.div>

          {/* Thin personal copy — weight contrast */}
          <motion.div
            className="space-y-[0.6vw]"
            initial={{ opacity: 0, y: 18 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 1.2 }}>
            <p style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
              every download is a future doctor
            </p>
            <p style={{ fontSize: '2vw', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
              choosing to learn better.
            </p>
          </motion.div>

          {/* Signature */}
          <motion.div
            className="mt-[3.5vw]"
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}>
            <div className="mb-3" style={{ width: '18vw', height: '1px', backgroundColor: 'rgba(200,163,64,0.2)' }} />
            <p style={{ fontSize: '1.4vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>
              with love, from Burla.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
