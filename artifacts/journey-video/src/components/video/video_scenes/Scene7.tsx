import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LINES = [
  { text: 'To the first 500 students', delay: 0, size: '3.2vw', color: 'rgba(255,255,255,0.9)' },
  { text: 'who believed in Mission Distinction —', delay: 0.4, size: '3.2vw', color: 'rgba(255,255,255,0.9)' },
  { text: '', delay: 0, size: '1vw', color: 'transparent' },
  { text: 'thank you for being part of this journey', delay: 1.0, size: '2.4vw', color: 'rgba(255,255,255,0.6)' },
  { text: 'from the very beginning.', delay: 1.4, size: '2.4vw', color: 'rgba(255,255,255,0.6)' },
  { text: '', delay: 0, size: '1vw', color: 'transparent' },
  { text: 'Every download represents a dream,', delay: 2.2, size: '2vw', color: 'rgba(200,163,64,0.8)' },
  { text: 'a future doctor,', delay: 2.6, size: '2vw', color: 'rgba(200,163,64,0.8)' },
  { text: 'and a shared belief that learning can be better.', delay: 3.1, size: '2vw', color: 'rgba(200,163,64,0.8)' },
];

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 8200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#07070f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      {/* Very subtle purple radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.07) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 text-center max-w-[75vw]">
        {/* Thin gold rule */}
        <motion.div
          className="mx-auto mb-[4vw]"
          style={{ height: '1px', backgroundColor: 'rgba(200,163,64,0.25)' }}
          initial={{ width: 0 }}
          animate={phase >= 1 ? { width: '25vw' } : { width: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="space-y-[0.6vw]">
          {LINES.map((line, i) => (
            <div key={i} className="overflow-hidden" style={{ minHeight: line.text ? undefined : '1.5vw' }}>
              <motion.p
                className="font-sans font-light leading-snug text-left"
                style={{ fontSize: line.size, color: line.color, fontStyle: i === 1 ? 'italic' : 'normal' }}
                initial={{ y: '115%', opacity: 0 }}
                animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '115%', opacity: 0 }}
                transition={{ duration: 0.9, delay: line.delay, ease: [0.16, 1, 0.3, 1] }}
              >
                {line.text}
              </motion.p>
            </div>
          ))}
        </div>

        {/* Signature */}
        <motion.div
          className="mt-[4vw] text-right"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <p className="text-[1.3vw] font-sans italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
            I'm grateful to be building this with you.
          </p>
          <p className="text-[1.1vw] font-mono tracking-[0.3em] mt-2" style={{ color: 'rgba(200,163,64,0.45)' }}>
            — FROM VIMSAR, WITH LOVE
          </p>
        </motion.div>

        <motion.div
          className="mx-auto mt-[4vw]"
          style={{ height: '1px', backgroundColor: 'rgba(200,163,64,0.25)' }}
          initial={{ width: 0 }}
          animate={phase >= 1 ? { width: '25vw' } : { width: 0 }}
          transition={{ duration: 1, delay: 3.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}
