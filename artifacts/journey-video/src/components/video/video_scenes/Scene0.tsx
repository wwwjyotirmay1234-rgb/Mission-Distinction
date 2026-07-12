import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 0 — THE WOUND
// One student. Alone. Night. Failing. No resources.
export function Scene0() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(4), 4400),
      setTimeout(() => setPhase(5), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background — lone student at desk */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 9, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_coldopen.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.25) contrast(1.2) brightness(0.32)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.97) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 60% 55%, transparent 30%, rgba(0,0,0,0.8) 100%)' }} />

      {/* Location stamp — top center */}
      <motion.div
        className="absolute z-10 w-full flex flex-col items-center"
        style={{ top: '18%' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2 }}>
        <p className="font-mono text-center"
          style={{ fontSize: '1vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.25)' }}>
          VIMSAR · BURLA, SAMBALPUR · ODISHA, INDIA
        </p>
        <div className="w-[1px] h-[3vh] bg-white/10 mt-3" />
      </motion.div>

      {/* Main title block — center */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[8vw]">
        <div className="text-center">

          {/* Thin whisper — sets the subject */}
          <div className="overflow-hidden mb-[1.4vw]">
            <motion.p
              style={{
                fontSize: '2.3vw',
                fontWeight: 100,
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.42)',
                fontStyle: 'italic',
              }}
              initial={{ y: '120%' }}
              animate={phase >= 2 ? { y: 0 } : { y: '120%' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              one mbbs student
            </motion.p>
          </div>

          {/* Massive impact — the wound */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-display text-white leading-none"
              style={{ fontSize: '10.5vw', letterSpacing: '-0.025em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
              initial={{ y: '105%' }}
              animate={phase >= 2 ? { y: 0 } : { y: '105%' }}
              transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
              COULDN'T PASS.
            </motion.h1>
          </div>

          {/* Hair-line divider */}
          <motion.div
            className="mx-auto my-[2.2vw]"
            style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
            initial={{ width: 0 }}
            animate={phase >= 3 ? { width: '28vw' } : { width: 0 }}
            transition={{ duration: 1 }}
          />

          {/* Context whisper */}
          <div className="overflow-hidden mb-[0.8vw]">
            <motion.p
              style={{
                fontSize: '2vw',
                fontWeight: 100,
                fontStyle: 'italic',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.35)',
              }}
              initial={{ y: '110%' }}
              animate={phase >= 3 ? { y: 0 } : { y: '110%' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              not for lack of trying —
            </motion.p>
          </div>

          {/* Gold payoff — the truth */}
          <div className="overflow-hidden">
            <motion.h2
              className="font-display leading-tight text-center"
              style={{ fontSize: '5.8vw', color: '#C8A340', letterSpacing: '-0.01em', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}
              initial={{ y: '105%' }}
              animate={phase >= 4 ? { y: 0 } : { y: '105%' }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
              FOR LACK OF RESOURCES.
            </motion.h2>
          </div>

        </div>
      </div>

      {/* Smash-cut white flash to next scene */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
    </motion.div>
  );
}
