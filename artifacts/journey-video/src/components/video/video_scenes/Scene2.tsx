import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-brand-navy"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ scale: [1, 1.15] }}
        transition={{ duration: 8, ease: 'linear' }}
      >
        <video
          src={`${import.meta.env.BASE_URL}videos/coding-montage.mp4`}
          className="w-full h-full object-cover mix-blend-screen opacity-50"
          autoPlay muted playsInline
        />
        <div className="absolute inset-0 bg-brand-purple/20 mix-blend-overlay" />
      </motion.div>

      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDAuNWg0ME0wIDM5LjVoNDBNMC41IDB2NDBNMzkuNSAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=")`,
        }}
      />

      <div className="absolute inset-0 z-10 p-[5vw] flex flex-col justify-center">
        <motion.div
          className="absolute top-1/2 left-[5vw] h-[1px] bg-white/20 w-[90vw]"
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="relative">
          <div className="overflow-hidden mb-4">
            <motion.h2
              className="text-[6vw] font-display text-white leading-none uppercase"
              initial={{ y: '100%', opacity: 0 }}
              animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              Building the Dream
            </motion.h2>
          </div>

          <div className="flex gap-[4vw] mt-8">
            <motion.div
              className="flex-1 bg-brand-card/40 backdrop-blur-md border border-white/10 p-6 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-[1.5vw] font-sans text-brand-gold mb-2 font-mono">01 // CODE</div>
              <div className="text-[1.2vw] text-white/70">Late nights, early mornings.</div>
            </motion.div>

            <motion.div
              className="flex-1 bg-brand-card/40 backdrop-blur-md border border-white/10 p-6 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-[1.5vw] font-sans text-brand-gold mb-2 font-mono">02 // DESIGN</div>
              <div className="text-[1.2vw] text-white/70">Medical dashboards &amp; quizzes.</div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
