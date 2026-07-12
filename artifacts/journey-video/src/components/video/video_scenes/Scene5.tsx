import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

// SCENE 6 — LAUNCH DAY
// Sunrise. "Launch." Trembling hand. Counter climbs. 150 students in 24 hours.
const MESSAGES = [
  '"Thank you."',
  '"This helped me."',
  '"I finally found everything in one place."',
];

export function Scene5() {
  const [phase, setPhase] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [goldFlash, setGoldFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5200),   // "LAUNCH." button
      setTimeout(() => setPhase(5), 6800),   // "Trembling hand clicks"
      setTimeout(() => setPhase(6), 8200),   // counter starts climbing
      setTimeout(() => setPhase(7), 12000),  // messages arriving
      setTimeout(() => {
        setPhase(8);
        setGoldFlash(true);
        setShake(true);
        setTimeout(() => setGoldFlash(false), 700);
        setTimeout(() => setShake(false), 600);
      }, 16000),  // joy erupts
      setTimeout(() => setPhase(9), 18500),  // "Within 24 hours..."
      setTimeout(() => setPhase(10), 20500), // "150 STUDENTS JOIN."
    ];

    // Message cycling
    let idx = 0;
    const msgTimer = setInterval(() => {
      idx = (idx + 1) % MESSAGES.length;
      setMsgIdx(idx);
    }, 1200);
    const stopMsg = setTimeout(() => clearInterval(msgTimer), 8000);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(msgTimer);
      clearTimeout(stopMsg);
    };
  }, []);

  const count = useSpring(0, { stiffness: 18, damping: 12 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 6) count.set(150);
  }, [phase, count]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#030210' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.05, opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background — launch / team */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={phase >= 8 ? { scale: 1.03 } : { scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_launch.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.35) contrast(1.12) brightness(0.35)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays — get warmer on joy */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-1"
        animate={phase >= 8
          ? { background: 'radial-gradient(ellipse at center, rgba(200,163,64,0.15) 0%, rgba(0,0,0,0.88) 65%)' }
          : { background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.9) 65%)' }
        }
        transition={{ duration: 1.5 }}
      />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.9) 100%)' }} />

      {/* Gold explosion flash */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-50"
        style={{ backgroundColor: 'rgba(200,163,64,0.3)' }}
        animate={goldFlash ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.65 }}
      />

      {/* Confetti-like particles on joy */}
      {phase >= 8 && Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: '50%', top: '50%', zIndex: 5,
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            backgroundColor: i % 3 === 0 ? '#C8A340' : i % 3 === 1 ? '#ffffff' : '#a78bfa',
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: Math.cos(i * 15 * Math.PI / 180) * (80 + (i % 4) * 45),
            y: Math.sin(i * 15 * Math.PI / 180) * (80 + (i % 4) * 45),
            opacity: [0, 1, 1, 0],
            scale: [0, 2, 1.5, 0],
          }}
          transition={{ duration: 2.5, delay: (i % 5) * 0.06, ease: 'easeOut' }}
        />
      ))}

      {/* Content */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]"
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45 } : { duration: 0 }}
      >
        {/* Sunrise stamp */}
        <motion.p
          className="font-mono mb-[3.5vw]"
          style={{ fontSize: '0.9vw', letterSpacing: '0.5em', color: 'rgba(200,163,64,0.45)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          SUNRISE · 18 APRIL 2026 · LAUNCH DAY
        </motion.p>

        {/* "The final button hovers..." */}
        <motion.p
          className="mb-[2.5vw]"
          style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          The final button hovers on the screen.
        </motion.p>

        {/* "LAUNCH." — the button */}
        <motion.div
          className="mb-[2.5vw] border"
          style={{
            backgroundColor: 'rgba(200,163,64,0.06)',
            borderColor: 'rgba(200,163,64,0.4)',
            padding: '1vw 4vw',
            borderRadius: '0.4vw',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 4 ? { opacity: 1, scale: [0.9, 1.04, 1] } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <span className="font-display" style={{ fontSize: '5.5vw', color: '#C8A340', letterSpacing: '0.15em', textShadow: '0 0 40px rgba(200,163,64,0.5)' }}>
            LAUNCH.
          </span>
        </motion.div>

        {/* "A trembling hand clicks." */}
        <motion.p
          className="mb-[2vw]"
          style={{ fontSize: '2.1vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          A trembling hand clicks.
        </motion.p>

        {/* Counter climbing */}
        {phase >= 6 && phase < 7 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}>
            <motion.p
              style={{ fontSize: '1.1vw', fontWeight: 100, letterSpacing: '0.45em', color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', marginBottom: '0.5vw' }}>
              One download. Two. Five. Ten. Twenty.
            </motion.p>
            <motion.span
              className="font-display text-white leading-none block"
              style={{ fontSize: '18vw', textShadow: '0 0 80px rgba(255,255,255,0.06)' }}>
              {displayCount}
            </motion.span>
          </motion.div>
        )}

        {/* Messages arriving */}
        {phase >= 7 && phase < 8 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}>
            <p style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.12em', marginBottom: '2vw' }}>
              Messages begin arriving.
            </p>
            <motion.p
              key={msgIdx}
              style={{ fontSize: '3.5vw', fontWeight: 100, fontStyle: 'italic', color: '#C8A340', letterSpacing: '0.02em', textShadow: '0 0 40px rgba(200,163,64,0.3)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}>
              {MESSAGES[msgIdx]}
            </motion.p>
          </motion.div>
        )}

        {/* JOY erupts */}
        {phase >= 8 && phase < 9 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}>
            <div className="flex items-center justify-center gap-[3vw]">
              {['Tears.', 'Laughter.', 'Disbelief.'].map((word, i) => (
                <motion.span
                  key={word}
                  style={{ fontSize: '4vw', fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em' }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.3, duration: 0.8 }}>
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* "Within 24 hours..." */}
        {phase >= 9 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}>
            <p style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.15em', marginBottom: '1.5vw' }}>
              Within 24 hours —
            </p>
          </motion.div>
        )}

        {/* "150 STUDENTS JOIN." */}
        {phase >= 10 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <div className="overflow-hidden">
              <motion.h1
                className="font-display"
                style={{ fontSize: '9vw', color: '#C8A340', letterSpacing: '-0.02em', textShadow: '0 0 80px rgba(200,163,64,0.45)' }}
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                150 STUDENTS JOIN.
              </motion.h1>
            </div>
            <p style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginTop: '1.5vw' }}>
              The dream is no longer theirs alone.
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
