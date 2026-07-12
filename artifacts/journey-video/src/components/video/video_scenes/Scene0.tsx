import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene0() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 4800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      {/* ── AI student photo — cinematic base ── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 5, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_coldopen.png`}
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.45) contrast(1.15) brightness(0.55)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic overlays — heavy bottom vignette, top fade */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)' }}
      />
      {/* Subtle warm tint overlay — Odisha amber */}
      <div
        className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(180,120,40,0.18)' }}
      />
      {/* Film grain */}
      <div
        className="absolute inset-0 z-1 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43NSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=")' }}
      />

      {/* Location stamp */}
      <motion.div
        className="absolute z-10"
        style={{ top: '22%', left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <p className="font-mono text-center whitespace-nowrap"
          style={{ fontSize: '1.1vw', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.35)' }}>
          VIMSAR · BURLA, SAMBALPUR · ODISHA, INDIA
        </p>
        <motion.p
          className="font-mono text-center mt-2 whitespace-nowrap"
          style={{ fontSize: '1vw', letterSpacing: '0.35em', color: 'rgba(200,163,64,0.55)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2, delay: 0.6 }}>
          18 APRIL 2026
        </motion.p>
      </motion.div>

      {/* TITLE — fills frame */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[8vw]">
        <div className="text-center" style={{ marginTop: '6vw' }}>
          <div className="overflow-hidden">
            <motion.h1
              className="font-display text-white leading-[0.9] text-center"
              style={{ fontSize: '7.5vw', textShadow: '0 4px 40px rgba(0,0,0,0.8)', letterSpacing: '-0.01em' }}
              initial={{ y: '105%', opacity: 0 }}
              animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
              AN MBBS STUDENT
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              className="font-display leading-[0.9] text-center"
              style={{ fontSize: '7.5vw', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em', textShadow: '0 4px 40px rgba(0,0,0,0.8)' }}
              initial={{ y: '105%', opacity: 0 }}
              animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
              WAS STRUGGLING.
            </motion.h1>
          </div>

          <motion.div
            className="mx-auto my-[1.5vw]"
            style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.12)' }}
            initial={{ width: 0 }}
            animate={phase >= 3 ? { width: '40vw' } : { width: 0 }}
            transition={{ duration: 0.7 }}
          />

          <div className="overflow-hidden">
            <motion.h2
              className="font-display text-center"
              style={{ fontSize: '6vw', color: '#C8A340', letterSpacing: '-0.01em', textShadow: '0 4px 40px rgba(0,0,0,0.9)' }}
              initial={{ y: '105%', opacity: 0 }}
              animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
              SO THEY BUILT SOMETHING.
            </motion.h2>
          </div>
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
