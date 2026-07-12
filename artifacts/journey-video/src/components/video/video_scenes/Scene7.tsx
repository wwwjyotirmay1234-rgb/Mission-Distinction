import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Cameron style — one monumental thought at a time, centered, massive
// The audience needs space to feel each line

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),    // "To the first 500 students"
      setTimeout(() => setPhase(2), 2800),   // "who believed..."
      setTimeout(() => setPhase(3), 4600),   // "thank you." — the emotional peak
      setTimeout(() => setPhase(4), 6800),   // personal message
      setTimeout(() => setPhase(5), 9200),   // signature
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#06060e' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* Barely visible radial — like candlelight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(124,58,237,0.05) 0%, transparent 60%)' }}
      />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)' }}
      />

      <div className="relative z-10 text-center max-w-[80vw] flex flex-col items-center">

        {/* ACT 1 — The Address */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-sans font-light text-white leading-tight text-center"
            style={{ fontSize: '4.5vw' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            To the first 500 students
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-sans font-light leading-tight text-center italic"
            style={{ fontSize: '4.5vw', color: 'rgba(255,255,255,0.7)' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            who believed in Mission Distinction —
          </motion.h1>
        </div>

        {/* ACT 2 — The peak: two words that carry everything */}
        <motion.div
          className="mt-[3.5vw] mb-[3.5vw]"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span
            className="font-display"
            style={{
              fontSize: '9vw',
              color: '#C8A340',
              textShadow: '0 0 60px rgba(200,163,64,0.45), 0 0 120px rgba(200,163,64,0.15)',
              letterSpacing: '-0.02em',
            }}
          >
            thank you.
          </span>
        </motion.div>

        {/* ACT 3 — The detail */}
        <motion.div
          className="space-y-[0.8vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.2 }}
        >
          <p
            className="font-sans font-light text-center leading-relaxed"
            style={{ fontSize: '2vw', color: 'rgba(255,255,255,0.55)' }}
          >
            Every download represents a dream,
          </p>
          <p
            className="font-sans font-light text-center leading-relaxed"
            style={{ fontSize: '2vw', color: 'rgba(255,255,255,0.55)' }}
          >
            a future doctor, and a shared belief
          </p>
          <p
            className="font-sans font-light text-center leading-relaxed"
            style={{ fontSize: '2vw', color: 'rgba(200,163,64,0.7)' }}
          >
            that learning can be better.
          </p>
        </motion.div>

        {/* ACT 4 — Signature */}
        <motion.div
          className="mt-[4vw] flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          <div
            className="mb-3"
            style={{ width: '20vw', height: '1px', backgroundColor: 'rgba(200,163,64,0.2)' }}
          />
          <p
            className="font-sans italic text-center"
            style={{ fontSize: '1.5vw', color: 'rgba(255,255,255,0.35)' }}
          >
            I'm grateful to be building this with you.
          </p>
          <p
            className="font-mono text-center mt-2"
            style={{ fontSize: '1vw', letterSpacing: '0.4em', color: 'rgba(200,163,64,0.4)' }}
          >
            — FROM VIMSAR, WITH LOVE
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
