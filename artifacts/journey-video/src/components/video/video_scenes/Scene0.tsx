import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene0() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),   // location stamp fades in quietly
      setTimeout(() => setPhase(2), 2000),  // TITLE SMASHES IN
      setTimeout(() => setPhase(3), 3500),  // second line
      setTimeout(() => setPhase(4), 4800),  // smash-cut flash
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      {/* Subtle CRT grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=")',
        }}
      />

      {/* Location stamp — small, quiet, establishing */}
      <motion.div
        className="absolute z-10"
        style={{ top: '28%', left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <p
          className="font-mono text-center whitespace-nowrap"
          style={{ fontSize: '1.1vw', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.18)' }}
        >
          VIMSAR · BURLA, SAMBALPUR · ODISHA, INDIA
        </p>
        <motion.p
          className="font-mono text-center mt-2 whitespace-nowrap"
          style={{ fontSize: '1vw', letterSpacing: '0.35em', color: 'rgba(200,163,64,0.35)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2, delay: 0.6 }}
        >
          18 APRIL 2026
        </motion.p>
      </motion.div>

      {/* MAIN TITLE — fills the frame, hits like a hammer */}
      <div className="relative z-10 text-center px-[8vw]" style={{ marginTop: '4vw' }}>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-white leading-[0.9] text-center"
            style={{
              fontSize: '7.5vw',
              textShadow: '0 2px 40px rgba(255,255,255,0.08)',
              letterSpacing: '-0.01em',
            }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            AN MBBS STUDENT
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display leading-[0.9] text-center"
            style={{
              fontSize: '7.5vw',
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-0.01em',
            }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            WAS STRUGGLING.
          </motion.h1>
        </div>

        {/* Ruled line between lines */}
        <motion.div
          className="mx-auto my-[1.5vw]"
          style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }}
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: '40vw' } : { width: 0 }}
          transition={{ duration: 0.6 }}
        />

        <div className="overflow-hidden">
          <motion.h2
            className="font-display text-center"
            style={{
              fontSize: '6vw',
              color: 'rgba(200,163,64,0.9)',
              letterSpacing: '-0.01em',
            }}
            initial={{ y: '105%', opacity: 0 }}
            animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            SO THEY BUILT SOMETHING.
          </motion.h2>
        </div>
      </div>

      {/* Smash-cut white flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.15 }}
      />
    </motion.div>
  );
}
