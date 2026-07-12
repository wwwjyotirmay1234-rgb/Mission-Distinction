import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Heavy downpour — 65 drops, Cameron-scale storm
const RAIN = Array.from({ length: 65 }, (_, i) => ({
  id: i,
  left: 0.5 + (i * 37 % 99),
  delay: (i * 0.13) % 2.2,
  duration: 0.45 + (i * 0.09 % 0.65),
  height: 18 + (i * 11 % 28),
  opacity: 0.1 + (i * 0.016 % 0.28),
  width: i % 4 === 0 ? 1.5 : 1,
}));

// Lightning strike timings
const LIGHTNING_FLASHES = [1600, 3200, 4800];

export function Scene3() {
  const [phase, setPhase] = useState(0);
  const [lightning, setLightning] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setPhase(5), 7000),
    ];

    // Lightning flashes
    const flashTimers = LIGHTNING_FLASHES.map(t =>
      setTimeout(() => {
        setLightning(true);
        setTimeout(() => setLightning(false), 120);
      }, t)
    );

    // Screen shake when "We nearly lost everything" hits
    const shakeTimer = setTimeout(() => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }, 3100);

    return () => {
      timers.forEach(t => clearTimeout(t));
      flashTimers.forEach(t => clearTimeout(t));
      clearTimeout(shakeTimer);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#030307' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.04, opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Deep gradient atmosphere — shifts to pre-dawn amber at resolution */}
      <motion.div
        className="absolute inset-0"
        animate={phase >= 5
          ? { background: 'linear-gradient(to top, rgba(80,30,0,0.7) 0%, rgba(3,3,7,1) 55%)' }
          : { background: 'linear-gradient(to top, rgba(5,0,15,0.9) 0%, rgba(3,3,7,1) 55%)' }
        }
        transition={{ duration: 3 }}
      />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)' }}
      />

      {/* Lightning flash overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-40"
        style={{ backgroundColor: 'rgba(180,200,255,0.08)' }}
        animate={lightning ? { opacity: [0, 1, 0.3, 0] } : { opacity: 0 }}
        transition={{ duration: 0.12 }}
      />

      {/* Heavy rain */}
      {phase >= 1 && RAIN.map(drop => (
        <motion.div
          key={drop.id}
          className="absolute top-0 pointer-events-none z-5"
          style={{ left: `${drop.left}%`, width: `${drop.width}px` }}
          initial={{ y: '-10vh', opacity: 0 }}
          animate={phase >= 5
            ? { y: '-10vh', opacity: 0 }
            : {
                y: '110vh',
                opacity: [0, drop.opacity, drop.opacity, 0],
              }
          }
          transition={{
            y: { duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' },
            opacity: { duration: drop.duration, delay: drop.delay, repeat: Infinity },
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: `${drop.width}px`,
              height: drop.height,
              background: `rgba(${140 + drop.id % 30},${170 + drop.id % 20},220,0.75)`,
            }}
          />
        </motion.div>
      ))}

      {/* Flickering window — desperate, failing light */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ right: '20%', top: '26%' }}
        animate={phase >= 5
          ? { opacity: 0 }
          : { opacity: [0.2, 0.9, 0.1, 0.8, 0.05, 0.7, 0.3, 0.85] }
        }
        transition={phase >= 5
          ? { duration: 1.5 }
          : { duration: 2.5, repeat: Infinity, ease: 'linear' }
        }
      >
        <div className="rounded-sm" style={{ width: '2.4vw', height: '3vw', backgroundColor: 'rgba(255,220,100,0.3)', filter: 'blur(2px)' }} />
        <div className="absolute inset-0 rounded-sm" style={{ backgroundColor: 'rgba(255,190,60,0.15)', filter: 'blur(12px)', transform: 'scale(2)' }} />
      </motion.div>

      {/* MAIN CONTENT — screen shakes on crisis hit */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-center px-[8vw] z-10"
        animate={shake ? { x: [-10, 10, -7, 7, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45, ease: 'easeOut' } : { duration: 0 }}
      >
        {/* Timestamp */}
        <motion.p
          className="font-mono mb-[5vw]"
          style={{ fontSize: '1.1vw', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.2)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          DURING DEVELOPMENT · MAY 2026 · 02:47 AM
        </motion.p>

        {/* BIG TEXT — Cameron scale */}
        <div className="overflow-hidden">
          <motion.h2
            className="font-display text-white uppercase leading-none"
            style={{ fontSize: '6.5vw' }}
            initial={{ x: -60, opacity: 0 }}
            animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: -60, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            We nearly lost
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            className="font-display uppercase leading-none"
            style={{ fontSize: '6.5vw', color: '#dc2626', textShadow: '0 0 60px rgba(220,38,38,0.4)' }}
            initial={{ x: -60, opacity: 0 }}
            animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: -60, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            everything.
          </motion.h2>
        </div>

        <motion.div
          className="mt-[3.5vw] space-y-[1.5vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-sans" style={{ fontSize: '2.2vw', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
            Platform access cut off. Mid-build.
          </p>
          <p className="font-sans" style={{ fontSize: '2.2vw', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
            Weeks of work. Suspended. No backup plan.
          </p>
        </motion.div>

        {/* Error terminal — glitching */}
        <motion.div
          className="mt-[3vw] inline-flex items-center gap-3 border rounded-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.18)', padding: '1vw 2vw', width: 'fit-content' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 && phase < 5 ? { opacity: [0, 1, 0.8, 1, 0.6, 1] } : { opacity: 0 }}
          transition={phase >= 3 && phase < 5
            ? { duration: 0.5, times: [0, 0.1, 0.3, 0.5, 0.7, 1] }
            : { duration: 0.4 }
          }
        >
          <motion.span
            className="inline-block rounded-full bg-red-500"
            style={{ width: '0.7vw', height: '0.7vw' }}
            animate={{ opacity: [1, 0.1, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <span className="font-mono" style={{ fontSize: '1.4vw', color: 'rgba(252,165,165,0.7)', letterSpacing: '0.1em' }}>
            ACCESS_DENIED · BUILD_SUSPENDED
          </span>
        </motion.div>

        {/* The dark moment — quiet italic */}
        <motion.p
          className="font-sans font-light italic mt-[4vw]"
          style={{ fontSize: '2.8vw', color: 'rgba(255,255,255,0.22)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          "We could have stopped here."
        </motion.p>
      </motion.div>

      {/* RESOLUTION — dawn breaks, "We didn't." */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-30"
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2 }}
      >
        {/* Dawn — warm light bleeding up from below */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: '55%', background: 'linear-gradient(to top, rgba(200,100,15,0.22), rgba(200,80,5,0.08) 50%, transparent)' }}
        />

        {/* The word that carries everything */}
        <motion.h1
          className="font-display text-brand-gold relative z-10 text-center"
          style={{
            fontSize: '10vw',
            textShadow: '0 0 80px rgba(200,163,64,0.55), 0 0 160px rgba(200,163,64,0.2)',
            letterSpacing: '-0.01em',
          }}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={phase >= 5 ? { scale: 1, opacity: 1 } : { scale: 0.75, opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        >
          We didn't.
        </motion.h1>

        <motion.p
          className="font-sans relative z-10 text-center mt-[2vw]"
          style={{ fontSize: '2vw', color: 'rgba(255,255,255,0.5)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, delay: 1.2 }}
        >
          6 students. One promise. One more try.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
