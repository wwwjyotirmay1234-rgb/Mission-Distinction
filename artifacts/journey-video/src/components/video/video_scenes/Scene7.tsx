import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2800),
      setTimeout(() => setPhase(3), 4600),
      setTimeout(() => setPhase(4), 6800),
      setTimeout(() => setPhase(5), 9200),
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
      {/* ── AI student hope portrait — right side, fades in gently ── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
        transition={{ duration: 3, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_hope.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.4) contrast(1.05) brightness(0.45)' }}
          alt=""
        />
      </motion.div>

      {/* Heavy left-side dark overlay so text is readable */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(6,6,14,0.97) 0%, rgba(6,6,14,0.88) 45%, rgba(6,6,14,0.45) 75%, rgba(6,6,14,0.2) 100%)' }} />
      {/* Bottom gradient */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(6,6,14,0.9) 0%, transparent 40%)' }} />
      {/* Warm purple tint */}
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(60,30,100,0.2)' }} />
      {/* Cinematic vignette */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

      {/* Content — left-aligned */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="text-left max-w-[55vw] px-[8vw]">
          {/* ACT 1 */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-sans font-light text-white leading-tight"
              style={{ fontSize: '4.5vw', textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              To the first 500 students
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              className="font-sans font-light leading-tight italic"
              style={{ fontSize: '4.5vw', color: 'rgba(255,255,255,0.7)', textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
              initial={{ y: '110%', opacity: 0 }}
              animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              who believed —
            </motion.h1>
          </div>

          {/* ACT 2 — peak */}
          <motion.div
            className="mt-[3.5vw] mb-[3.5vw]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <span
              className="font-display"
              style={{ fontSize: '9vw', color: '#C8A340', textShadow: '0 0 60px rgba(200,163,64,0.45), 0 0 120px rgba(200,163,64,0.15)', letterSpacing: '-0.02em' }}>
              thank you.
            </span>
          </motion.div>

          {/* ACT 3 */}
          <motion.div
            className="space-y-[0.8vw]"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1.2 }}>
            <p className="font-sans font-light leading-relaxed" style={{ fontSize: '2vw', color: 'rgba(255,255,255,0.55)' }}>
              Every download represents a dream,
            </p>
            <p className="font-sans font-light leading-relaxed" style={{ fontSize: '2vw', color: 'rgba(255,255,255,0.55)' }}>
              a future doctor, and a shared belief
            </p>
            <p className="font-sans font-light leading-relaxed" style={{ fontSize: '2vw', color: 'rgba(200,163,64,0.7)' }}>
              that learning can be better.
            </p>
          </motion.div>

          {/* Signature */}
          <motion.div
            className="mt-[4vw]"
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}>
            <div className="mb-3" style={{ width: '20vw', height: '1px', backgroundColor: 'rgba(200,163,64,0.22)' }} />
            <p className="font-sans italic" style={{ fontSize: '1.5vw', color: 'rgba(255,255,255,0.35)' }}>
              I'm grateful to be building this with you.
            </p>
            <p className="font-mono mt-2" style={{ fontSize: '1vw', letterSpacing: '0.4em', color: 'rgba(200,163,64,0.4)' }}>
              — FROM VIMSAR, WITH LOVE
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
