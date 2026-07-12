import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const RAIN = Array.from({ length: 38 }, (_, i) => ({
  id: i,
  left: 2 + (i * 41 % 96),
  delay: (i * 0.19) % 2.8,
  duration: 0.65 + (i * 0.11 % 0.9),
  height: 10 + (i * 9 % 22),
  opacity: 0.07 + (i * 0.018 % 0.22),
}));

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setPhase(5), 6800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#04040a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.05, opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Background — shifts from midnight blue to pre-dawn amber at resolution */}
      <motion.div
        className="absolute inset-0"
        animate={phase >= 5
          ? { background: 'linear-gradient(to top, rgba(60,25,0,0.6) 0%, #04040a 70%)' }
          : { background: 'linear-gradient(to top, rgba(8,0,20,0.8) 0%, #04040a 70%)' }
        }
        transition={{ duration: 2.5 }}
      />

      {/* Rain */}
      {phase >= 1 && RAIN.map(drop => (
        <motion.div
          key={drop.id}
          className="absolute top-0 pointer-events-none"
          style={{ left: `${drop.left}%`, width: '1px' }}
          initial={{ y: '-8vh', opacity: 0 }}
          animate={phase >= 5
            ? { y: '-8vh', opacity: 0 }
            : { y: '108vh', opacity: [0, drop.opacity, drop.opacity, 0] }
          }
          transition={{
            y: { duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' },
            opacity: { duration: drop.duration, delay: drop.delay, repeat: Infinity },
          }}
        >
          <div
            className="rounded-full"
            style={{ width: '1px', height: drop.height, backgroundColor: 'rgba(150,180,220,0.7)' }}
          />
        </motion.div>
      ))}

      {/* Distant flickering window light */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ right: '22%', top: '28%' }}
        animate={phase >= 5 ? { opacity: 0 } : { opacity: [0.25, 0.75, 0.35, 0.9, 0.4, 0.7] }}
        transition={phase >= 5
          ? { duration: 1 }
          : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <div className="w-[2.2vw] h-[2.8vw] rounded-sm blur-[2px]"
          style={{ backgroundColor: 'rgba(255,230,120,0.35)' }} />
        <div className="absolute inset-0 blur-[10px]"
          style={{ backgroundColor: 'rgba(255,200,80,0.18)' }} />
      </motion.div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col justify-center p-[8vw] z-10">

        {/* Timestamp */}
        <motion.p
          className="text-[1.1vw] font-mono tracking-[0.35em] mb-[4vw]"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          DURING DEVELOPMENT · MAY 2026 · 2:47 AM
        </motion.p>

        {/* "We nearly lost" */}
        <div className="overflow-hidden">
          <motion.h2
            className="text-[4.8vw] font-display text-white uppercase leading-tight"
            initial={{ x: -40, opacity: 0 }}
            animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: -40, opacity: 0 }}
            transition={{ duration: 0.55 }}
          >
            We nearly lost
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            className="text-[4.8vw] font-display uppercase leading-tight"
            style={{ color: '#dc2626' }}
            initial={{ x: -40, opacity: 0 }}
            animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: -40, opacity: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            everything.
          </motion.h2>
        </div>

        <motion.div
          className="mt-[3vw] space-y-[1.2vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.9 }}
        >
          <p className="text-[1.9vw] font-sans leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Our platform access was cut off mid-build.
          </p>
          <p className="text-[1.9vw] font-sans leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Weeks of work — suspended. No backup plan.
          </p>
        </motion.div>

        <motion.div
          className="mt-[2.5vw] inline-flex items-center gap-3 border rounded px-[2vw] py-[0.9vw]"
          style={{ backgroundColor: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.2)' }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={phase >= 3 && phase < 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="font-mono text-[1.3vw]" style={{ color: 'rgba(252,165,165,0.75)' }}>
            ACCESS_DENIED · BUILD_SUSPENDED
          </span>
        </motion.div>

        <motion.p
          className="mt-[3.5vw] text-[2.4vw] font-sans font-light italic"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          "We could have stopped here."
        </motion.p>
      </div>

      {/* Resolution overlay — dawn + "We didn't." */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-30"
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.8 }}
      >
        {/* Dawn glow from below */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '50%',
            background: 'linear-gradient(to top, rgba(180,80,10,0.18), transparent)',
          }}
        />
        <motion.h1
          className="text-[7.5vw] font-display text-brand-gold z-10 relative"
          style={{ textShadow: '0 0 60px rgba(200,163,64,0.5)' }}
          initial={{ scale: 0.82, opacity: 0 }}
          animate={phase >= 5 ? { scale: 1, opacity: 1 } : { scale: 0.82, opacity: 0 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          We didn't.
        </motion.h1>
        <motion.p
          className="text-[1.9vw] font-sans mt-[2.5vw] z-10 relative"
          style={{ color: 'rgba(255,255,255,0.55)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.9 }}
        >
          6 students. One promise. One more try.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
