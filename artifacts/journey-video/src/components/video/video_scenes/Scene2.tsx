import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(4), 4800),
      setTimeout(() => setPhase(5), 6500),
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
      {/* ── AI team photo — slow zoom ── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/student_team.png`}
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.5) contrast(1.05) brightness(0.5)' }}
          alt=""
        />
      </motion.div>

      {/* Overlay layers */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(10,8,30,0.92) 0%, rgba(10,8,30,0.55) 55%, rgba(10,8,30,0.35) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,8,30,0.9) 0%, transparent 50%)' }} />
      {/* Purple tint */}
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(80,40,140,0.2)' }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 z-1 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDAuNWg0ME0wIDM5LjVoNDBNMC41IDB2NDBNMzkuNSAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=")` }} />

      <div className="absolute inset-0 z-10 p-[5vw] flex flex-col justify-center">
        <motion.div
          className="absolute top-1/2 left-[5vw] h-[1px] bg-white/10 w-[90vw]"
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="relative">
          <div className="overflow-hidden mb-2">
            <motion.h2
              className="text-[6vw] font-display text-white leading-none uppercase"
              style={{ textShadow: '0 4px 40px rgba(0,0,0,0.9)' }}
              initial={{ y: '100%', opacity: 0 }}
              animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              Building the Dream
            </motion.h2>
          </div>

          <motion.p
            className="text-[1.5vw] font-sans text-brand-purpleLight/80 tracking-[0.2em] uppercase mb-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}>
            6 MBBS students · 1 mission
          </motion.p>

          <div className="flex gap-[2.5vw] mt-4">
            {[
              { n: '01', title: 'CODE', sub: 'Late nights, early mornings.' },
              { n: '02', title: 'DESIGN', sub: 'Medical dashboards & quizzes.' },
              { n: '03', title: 'TEAM', sub: 'One girl. Five builders. One dream.' },
            ].map(({ n, title, sub }, i) => (
              <motion.div
                key={n}
                className="flex-1 backdrop-blur-md border border-white/10 p-6 rounded-xl"
                style={{ backgroundColor: 'rgba(10,8,30,0.55)' }}
                initial={{ opacity: 0, y: 30 }}
                animate={phase >= i + 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6 }}>
                <div className="text-[1.4vw] font-sans text-brand-gold mb-2 font-mono">{n} // {title}</div>
                <div className="text-[1.1vw] text-white/60">{sub}</div>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="mt-6 text-[1.2vw] font-mono text-brand-purple/70 tracking-[0.2em]"
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}>
            APR → JUN 2026 · 72 DAYS OF BUILDING
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
