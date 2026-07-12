import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// OPENING SCENE — 2:17 AM. Books scattered. "What if I fail?"
// Script: Black screen → ticking clock → student alone → fear
export function Scene0() {
  const [phase, setPhase] = useState(0);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    // Clock ticks before anything appears
    const tickInterval = setInterval(() => {
      setTick(t => !t);
    }, 900);

    const timers = [
      setTimeout(() => setPhase(1), 1200),   // image fades in
      setTimeout(() => setPhase(2), 3000),   // 2:17 AM stamp
      setTimeout(() => setPhase(3), 5200),   // "books scattered..."
      setTimeout(() => setPhase(4), 8000),   // "outside, rain..."
      setTimeout(() => setPhase(5), 10500),  // "he stares at a blank page"
      setTimeout(() => setPhase(6), 13000),  // "Exhaustion. Doubt. Fear."
      setTimeout(() => setPhase(7), 15500),  // "WHAT IF I FAIL?" — the fear
      setTimeout(() => setPhase(8), 19200),  // flash to next
    ];
    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(tickInterval);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#000000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background — lone student at desk, 2 AM */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
        transition={{ duration: 3.5, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_coldopen.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.18) contrast(1.25) brightness(0.28)' }}
          alt=""
        />
      </motion.div>

      {/* Deep dark overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 62% 45%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.78) 82%, rgba(0,0,0,0.97) 100%)' }} />

      {/* Ticking clock pulse — top center */}
      <motion.div
        className="absolute z-10 flex items-center justify-center"
        style={{ top: '18%', left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5 }}>
        <div className="flex items-center gap-[1.2vw]">
          <motion.div
            className="w-[5px] h-[5px] rounded-full bg-white"
            style={{ opacity: 0.18 }}
            animate={tick ? { scale: 1.8, opacity: 0.5 } : { scale: 1, opacity: 0.18 }}
            transition={{ duration: 0.1 }}
          />
          {/* 2:17 AM — colon blinks with tick */}
          <p className="font-mono text-center" style={{ fontSize: '2.5vw', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.22)' }}>
            2{tick ? ':' : <span style={{ color: 'transparent' }}>:</span>}17 AM
          </p>
          <motion.div
            className="w-[5px] h-[5px] rounded-full bg-white"
            style={{ opacity: 0.18 }}
            animate={tick ? { scale: 1.8, opacity: 0.5 } : { scale: 1, opacity: 0.18 }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="absolute font-mono text-center whitespace-nowrap" style={{ top: '3.5vw', fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.14)' }}>
          VIMSAR · BURLA, SAMBALPUR · HOSTEL ROOM 214
        </p>
      </motion.div>

      {/* Main content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[10vw]">
        <div className="text-center">

          {/* "books scattered everywhere" — prose lines */}
          <motion.div
            className="mb-[3.5vw]"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 2 }}>
            <p style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', lineHeight: 2 }}>
              Books scattered everywhere.
            </p>
            <p style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.24)', lineHeight: 2 }}>
              Highlighters dried out. Notes incomplete.
            </p>
            <p style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', lineHeight: 2 }}>
              The syllabus feels endless.
            </p>
          </motion.div>

          {/* "Outside, rain..." */}
          <motion.p
            style={{ fontSize: '1.8vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', marginBottom: '3vw' }}
            initial={{ opacity: 0 }}
            animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 2 }}>
            Outside, rain taps against the window.
          </motion.p>

          {/* "He stares at a blank page" */}
          <motion.p
            style={{ fontSize: '2.1vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: '3.5vw' }}
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.8 }}>
            He stares at a blank page.
          </motion.p>

          {/* "Exhaustion. Doubt. Fear." — three beats */}
          <motion.div
            className="flex items-center justify-center gap-[3vw] mb-[3.5vw]"
            initial={{ opacity: 0 }}
            animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}>
            {['Exhaustion.', 'Doubt.', 'Fear.'].map((word, i) => (
              <motion.span
                key={word}
                style={{ fontSize: '2.8vw', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}
                initial={{ opacity: 0 }}
                animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: i * 0.4, duration: 1 }}>
                {word}
              </motion.span>
            ))}
          </motion.div>

          {/* "WHAT IF I FAIL?" — the one haunting question */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-display text-center"
              style={{
                fontSize: '8.5vw',
                color: '#C8A340',
                letterSpacing: '-0.02em',
                textShadow: '0 0 80px rgba(200,163,64,0.45), 0 4px 60px rgba(0,0,0,0.95)',
                lineHeight: 1,
              }}
              initial={{ y: '105%', opacity: 0 }}
              animate={phase >= 7 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              "What if I fail?"
            </motion.h1>
          </div>
        </div>
      </div>

      {/* Smash-cut to next */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 8 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
}
