import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

// SCENE 8 — THE MILESTONE
// Three weeks later. 500 downloads. Nobody says anything.
// "Because some moments are too powerful for words."
export function Scene7() {
  const [phase, setPhase] = useState(0);
  const [goldFlash, setGoldFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2200),   // team gathers
      setTimeout(() => setPhase(3), 4000),   // counter starts
      setTimeout(() => {
        setPhase(4);
        setGoldFlash(true);
        setShake(true);
        setTimeout(() => setGoldFlash(false), 700);
        setTimeout(() => setShake(false), 600);
      }, 9500),   // 500 hits
      setTimeout(() => setPhase(5), 12000),  // nobody says anything
      setTimeout(() => setPhase(6), 15000),  // "too powerful for words"
      setTimeout(() => setPhase(7), 18000),  // "same room, same friends"
      setTimeout(() => setPhase(8), 21500),  // "that dream belongs to hundreds"
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 18, damping: 13 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 3) count.set(500);
  }, [phase, count]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#020206' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Background — celebration */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={phase >= 4 ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_celebration.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.38) contrast(1.12) brightness(0.3)' }}
          alt=""
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none z-1"
        animate={phase >= 4
          ? { background: 'radial-gradient(ellipse at center, rgba(200,163,64,0.2) 0%, rgba(0,0,0,0.9) 65%)' }
          : { background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.92) 65%)' }
        }
        transition={{ duration: 2 }}
      />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.92) 100%)' }} />

      {/* Gold flash */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-50"
        style={{ backgroundColor: 'rgba(200,163,64,0.35)' }}
        animate={goldFlash ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.65 }}
      />

      {/* Content */}
      <motion.div
        className="relative text-center flex flex-col items-center z-10"
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45 } : { duration: 0 }}
      >
        {/* "Three weeks later." */}
        <motion.p
          className="mb-[2vw]"
          style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.32)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          Three weeks later.
        </motion.p>

        {/* "The team gathers again." */}
        <motion.p
          className="mb-[3vw]"
          style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          The team gathers again.
        </motion.p>

        {/* "The screen refreshes." */}
        <motion.p
          className="mb-[2vw]"
          style={{ fontSize: '1.6vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.6 }}>
          The screen refreshes.
        </motion.p>

        {/* Counter — 500 */}
        <motion.span
          className="font-display leading-none tracking-tighter block"
          style={{
            fontSize: '22vw',
            color: phase >= 4 ? '#C8A340' : 'rgba(255,255,255,0.88)',
            textShadow: phase >= 4 ? '0 0 120px rgba(200,163,64,0.45)' : '0 0 80px rgba(255,255,255,0.05)',
            transition: 'color 0.9s ease, text-shadow 0.9s ease',
          }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={phase >= 3 ? { scale: phase >= 4 ? 1.04 : 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
          transition={{ duration: 1, type: 'spring', stiffness: 140, damping: 18 }}
        >
          {displayCount}
        </motion.span>

        <motion.p
          className="mt-[0.8vw]"
          style={{ fontSize: '3vw', fontWeight: 700, color: '#C8A340', letterSpacing: '0.04em', textShadow: '0 2px 30px rgba(0,0,0,0.9)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1 }}>
          Downloads.
        </motion.p>

        {/* "Nobody says anything." */}
        <motion.p
          className="mt-[3.5vw]"
          style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2.5 }}>
          Nobody says anything.
        </motion.p>

        {/* "Because some moments..." */}
        <motion.p
          className="mt-[1.5vw]"
          style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2 }}>
          Because some moments are too powerful for words.
        </motion.p>

        {/* "The same room. The same friends. The same dream." */}
        <motion.div
          className="mt-[3.5vw] space-y-[0.5vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 7 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.8 }}>
          <p style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.12em' }}>
            The same room. The same friends. The same dream.
          </p>
        </motion.div>

        {/* "Only now... that dream belongs to hundreds." */}
        <div className="overflow-hidden mt-[2vw]">
          <motion.h2
            className="font-display"
            style={{ fontSize: '4.2vw', color: '#C8A340', letterSpacing: '-0.01em', textShadow: '0 0 50px rgba(200,163,64,0.35)' }}
            initial={{ y: '110%' }}
            animate={phase >= 8 ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            Only now — that dream belongs to hundreds.
          </motion.h2>
        </div>
      </motion.div>
    </motion.div>
  );
}
