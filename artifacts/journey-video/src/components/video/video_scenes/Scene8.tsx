import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// FINAL SCENE — The camera rises. Lights across Odisha. Narrator. Fade to black.
// "For every student who studies when nobody is watching."
// "MISSION DISTINCTION. By Students. For Students."
const NARRATOR_LINES = [
  'Great stories do not begin with success.',
  'They begin with a problem that someone refuses to ignore.',
  'Five students started with a struggle.',
  'Hundreds found a solution.',
  'Tomorrow, thousands will carry the mission forward.',
];

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 3000),   // narrator line 1
      setTimeout(() => setPhase(3), 5800),   // narrator line 2
      setTimeout(() => setPhase(4), 8600),   // narrator line 3
      setTimeout(() => setPhase(5), 11200),  // narrator line 4
      setTimeout(() => setPhase(6), 13800),  // narrator line 5
      setTimeout(() => setPhase(7), 17000),  // "For every student..."
      setTimeout(() => setPhase(8), 19500),  // "For every dream..."
      setTimeout(() => setPhase(9), 22000),  // MISSION DISTINCTION
      setTimeout(() => setPhase(10), 23800), // "By Students. For Students."
      setTimeout(() => setPhase(11), 25500), // fade to black
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
      {/* Background — team silhouette against sky */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.05, y: '3%' }}
        animate={{ scale: 1, y: '0%' }}
        transition={{ duration: 18, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_team_outro.png`}
          className="w-full h-full object-cover object-top"
          style={{ filter: 'saturate(0.48) contrast(1.08) brightness(0.42)' }}
          alt=""
        />
      </motion.div>

      {/* Gradually rising dark gradient — "camera rises" effect */}
      <motion.div
        className="absolute inset-0 z-1 pointer-events-none"
        animate={phase >= 2
          ? { background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.82) 82%, rgba(0,0,0,0.99) 100%)' }
          : { background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.72) 85%, rgba(0,0,0,0.98) 100%)' }
        }
        transition={{ duration: 4 }}
      />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Glowing light dots — "thousands of students" constellation */}
      {phase >= 1 && Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${5 + (i * 73 % 90)}%`,
            top: `${8 + (i * 47 % 55)}%`,
            zIndex: 2,
            width: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
            height: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
            backgroundColor: i % 4 === 0 ? '#C8A340' : i % 4 === 1 ? '#a78bfa' : 'rgba(255,255,255,0.7)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.5 + (i % 5) * 0.1, 0.3 + (i % 3) * 0.15], scale: 1 }}
          transition={{
            opacity: { duration: 2 + (i % 4), delay: (i * 0.08) % 3, repeat: Infinity, repeatType: 'reverse' },
            scale: { duration: 0.8, delay: (i * 0.07) % 2 },
          }}
        />
      ))}

      {/* Content — narrator text as subtitle-style cards */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[10vw]">

        {/* Narrator lines — film subtitle style */}
        <div className="text-center mb-[2vw]">
          {NARRATOR_LINES.map((line, i) => (
            <motion.p
              key={line}
              style={{
                fontSize: '2.4vw',
                fontWeight: 100,
                fontStyle: 'italic',
                letterSpacing: '0.06em',
                color: phase >= i + 2 && phase < i + 4
                  ? 'rgba(255,255,255,0.72)'
                  : phase >= i + 4
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(255,255,255,0)',
                lineHeight: 1.8,
                transition: 'color 1.2s ease',
              }}>
              {line}
            </motion.p>
          ))}
        </div>

        {/* Hair divider before the dedication */}
        <motion.div
          className="mx-auto my-[3vw]"
          style={{ height: '1px', background: 'rgba(200,163,64,0.22)' }}
          initial={{ width: 0 }}
          animate={phase >= 7 ? { width: '24vw' } : { width: 0 }}
          transition={{ duration: 1 }}
        />

        {/* "For every student who studies when nobody is watching." */}
        <div className="overflow-hidden mb-[0.8vw]">
          <motion.p
            style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={phase >= 7 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            For every student who studies when nobody is watching.
          </motion.p>
        </div>

        {/* "For every dream that refuses to quit." */}
        <div className="overflow-hidden mb-[4vw]">
          <motion.p
            style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={phase >= 8 ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            For every dream that refuses to quit.
          </motion.p>
        </div>

        {/* MISSION DISTINCTION — massive final reveal */}
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-white text-center"
            style={{ fontSize: '9.5vw', letterSpacing: '-0.02em', textShadow: '0 4px 80px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 9 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            MISSION DISTINCTION
          </motion.h1>
        </div>

        {/* "By Students. For Students." */}
        <motion.div
          className="flex flex-col items-center mt-[1.8vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 10 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <div className="mb-[1.5vw]" style={{ width: '1px', height: '4vh', backgroundColor: 'rgba(200,163,64,0.35)' }} />
          <p style={{ fontSize: '2.2vw', fontWeight: 100, letterSpacing: '0.35em', color: 'rgba(200,163,64,0.8)', textTransform: 'uppercase' }}>
            By Students. For Students.
          </p>
          <motion.div
            className="mt-[2.5vw] flex flex-col items-center"
            initial={{ opacity: 0, y: 12 }}
            animate={phase >= 10 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 1.5, delay: 0.4 }}>
            <img
              src={`${import.meta.env.BASE_URL}md-logo-new.png`}
              alt="Mission Distinction"
              className="w-[6vw] h-auto object-contain rounded-xl"
              style={{ boxShadow: '0 0 24px rgba(124,58,237,0.35), 0 0 50px rgba(124,58,237,0.1)' }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Final fade to black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none z-60"
        initial={{ opacity: 0 }}
        animate={phase >= 11 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 3 }}
      />
    </motion.div>
  );
}
