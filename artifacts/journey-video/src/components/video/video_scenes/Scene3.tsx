import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
      setTimeout(() => setPhase(4), 6500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-brand-navy"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 bg-[#0d0f1a] opacity-80" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <motion.div
          className="w-[80vw] h-[80vw] border-[1px] border-red-500/50 rounded-full"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[60vw] h-[60vw] border-[1px] border-brand-purple/50 rounded-full"
          animate={{ scale: [0.5, 1.2], opacity: [0, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="absolute inset-0 p-[8vw] flex flex-col justify-center items-start z-10">
        <motion.h2
          className="text-[5vw] font-display text-white uppercase leading-tight"
          initial={{ opacity: 0, x: -20 }}
          animate={
            phase >= 2
              ? { opacity: 1, x: 0, filter: ['drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 blue)', 'drop-shadow(0 0 0 transparent)'] }
              : phase >= 1
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: -20 }
          }
          transition={{ duration: 0.4 }}
        >
          Features Break.
        </motion.h2>

        <motion.h2
          className="text-[5vw] font-display text-white/50 uppercase leading-tight mt-[-1vw]"
          initial={{ opacity: 0, x: -20 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          Plans Erased.
        </motion.h2>

        <motion.div
          className="mt-[4vw] bg-red-500/10 border border-red-500/30 px-[2vw] py-[1vw] rounded-sm backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 1 && phase < 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-red-400 font-mono text-[1.5vw]">ERR_COMPILE_FAILED</span>
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-brand-navy z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={phase >= 3 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h1 className="text-[7vw] font-display text-brand-gold mb-[2vw]">RESILIENCE.</h1>
            <p className="text-[2vw] text-white/70 max-w-[50vw] mx-auto leading-relaxed">
              We started again. Together.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
