import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

// SCENE 8 — THE MILESTONE
// 3 weeks. 500 downloads. The dream is alive.
export function Scene8() {
  const [phase, setPhase] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),  // counter starts
      setTimeout(() => {
        setPhase(3);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }, 5500),  // 500 hit
      setTimeout(() => setPhase(4), 7000),  // THE DREAM IS ALIVE
      setTimeout(() => setPhase(5), 8500),  // logo
      setTimeout(() => setPhase(6), 9200),  // fade to black
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 20, damping: 14 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (phase >= 2) count.set(500);
  }, [phase, count]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#000000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* Team outro photo — golden hour */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_team_outro.png`}
          className="w-full h-full object-cover object-top"
          style={{ filter: 'saturate(0.5) contrast(1.08) brightness(0.42)' }}
          alt=""
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.72) 82%, rgba(0,0,0,0.97) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.6) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(160,100,30,0.1)' }} />

      {/* Gold flash on 500 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 50, backgroundColor: 'rgba(200,163,64,0.32)' }}
        animate={phase >= 3 ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Content */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[8vw]"
        animate={shake ? { x: [-10, 10, -7, 7, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45 } : { duration: 0 }}
      >
        {/* Setup whisper */}
        <motion.p
          style={{ fontSize: '1.8vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.8vw' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.8 }}>
          three weeks later —
        </motion.p>

        {/* Counter to 500 */}
        <motion.span
          className="font-display leading-none tracking-tighter block"
          style={{
            fontSize: '22vw',
            color: phase >= 3 ? '#C8A340' : 'rgba(255,255,255,0.88)',
            textShadow: phase >= 3 ? '0 0 120px rgba(200,163,64,0.45)' : '0 0 80px rgba(255,255,255,0.06)',
            transition: 'color 0.8s ease, text-shadow 0.8s ease',
          }}
          initial={{ scale: 0.72, opacity: 0 }}
          animate={phase >= 2 ? { scale: phase >= 3 ? 1.04 : 1, opacity: 1 } : { scale: 0.72, opacity: 0 }}
          transition={{ duration: 1, type: 'spring', stiffness: 150, damping: 18 }}
        >
          {displayCount}
        </motion.span>

        {/* Context */}
        <motion.p
          className="mt-[0.5vw]"
          style={{ fontSize: '2.2vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          students across Odisha.
        </motion.p>

        {/* THE BIG LINE */}
        <div className="overflow-hidden mt-[2.5vw]">
          <motion.h1
            className="font-display text-white leading-none"
            style={{ fontSize: '7.2vw', letterSpacing: '-0.02em', textShadow: '0 4px 60px rgba(0,0,0,0.95)' }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 4 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            THE DREAM IS ALIVE.
          </motion.h1>
        </div>

        {/* Rule + logo */}
        <motion.div
          style={{ height: '1px', backgroundColor: 'rgba(200,163,64,0.28)', marginTop: '3vw', marginBottom: '2.5vw' }}
          initial={{ width: 0 }}
          animate={phase >= 5 ? { width: '22vw' } : { width: 0 }}
          transition={{ duration: 1 }}
        />

        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 14 }}
          animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1.5 }}>
          <img
            src={`${import.meta.env.BASE_URL}md-logo-new.png`}
            alt="Mission Distinction"
            className="w-[8vw] h-auto object-contain rounded-xl mb-[1.2vw]"
            style={{ boxShadow: '0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.12)' }}
          />
          <p className="font-mono text-center"
            style={{ fontSize: '0.88vw', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.28)' }}>
            MISSION DISTINCTION
          </p>
          <p style={{ fontSize: '1.1vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.18em', color: 'rgba(200,163,64,0.42)', marginTop: '1.5vw' }}>
            still building. for every mbbs student.
          </p>
        </motion.div>
      </motion.div>

      {/* Final fade to black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ zIndex: 60 }}
        initial={{ opacity: 0 }}
        animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2.5 }}
      />
    </motion.div>
  );
}
