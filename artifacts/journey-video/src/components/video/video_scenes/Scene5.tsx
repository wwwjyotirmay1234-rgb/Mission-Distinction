import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ODISHA_X = 71.5;
const ODISHA_Y = 43.5;
const COORDS = '20.9517° N  85.0985° E';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 4000),
      setTimeout(() => setPhase(5), 5800),
      setTimeout(() => setPhase(6), 7200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(30px)' }}
      transition={{ duration: 0.8 }}
    >
      {/* World map — zooms toward Odisha */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={
          phase >= 3
            ? { scale: 3.5, x: `${-(ODISHA_X - 50) * 3.5}%`, y: `${-(ODISHA_Y - 50) * 3.5}%` }
            : { scale: 1, x: '0%', y: '0%' }
        }
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${ODISHA_X}% ${ODISHA_Y}%` }}
      >
        <video
          src={`${import.meta.env.BASE_URL}videos/world-map.mp4`}
          className="w-full h-full object-cover"
          autoPlay muted playsInline
          style={{ opacity: 0.85 }}
        />
        <motion.div
          className="absolute inset-0"
          animate={phase >= 3 ? { backgroundColor: 'rgba(5,7,20,0.3)' } : { backgroundColor: 'rgba(5,7,20,0.55)' }}
          transition={{ duration: 2.5 }}
        />
      </motion.div>

      {/* HUD scan lines */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute left-0 right-0 h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.8) 40%, rgba(200,163,64,0.6) 60%, transparent)' }}
              initial={{ top: '-1px' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2.5, ease: 'linear', repeat: phase < 3 ? Infinity : 0 }}
            />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Targeting reticle */}
      {phase >= 1 && (
        <motion.div
          className="absolute z-20 pointer-events-none"
          style={{ left: `${ODISHA_X}%`, top: `${ODISHA_Y}%`, transform: 'translate(-50%, -50%)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div className="absolute border border-brand-gold/70 rounded-full"
            style={{ width: 120, height: 120, top: -60, left: -60 }}
            animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute border border-brand-purple/90 rounded-full"
            style={{ width: 70, height: 70, top: -35, left: -35 }}
            animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
          {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx, sy], i) => (
            <div key={i} className="absolute border-brand-gold" style={{
              width: 16, height: 16,
              top: sy < 0 ? -50 : 34, left: sx < 0 ? -50 : 34,
              borderTopWidth: sy < 0 ? 2 : 0, borderBottomWidth: sy > 0 ? 2 : 0,
              borderLeftWidth: sx < 0 ? 2 : 0, borderRightWidth: sx > 0 ? 2 : 0,
            }} />
          ))}
          <motion.div className="w-3 h-3 bg-brand-gold rounded-full"
            style={{ position: 'absolute', top: -6, left: -6 }}
            animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }} />
          <motion.div className="absolute text-brand-gold font-mono whitespace-nowrap"
            style={{ top: 45, left: -40, fontSize: 10, letterSpacing: 3 }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
            LOCKING...
          </motion.div>
        </motion.div>
      )}

      {/* Locked beacon */}
      {phase >= 2 && (
        <motion.div className="absolute z-20 pointer-events-none"
          style={{ left: `${ODISHA_X}%`, top: `${ODISHA_Y}%`, transform: 'translate(-50%, -50%)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.5 }}>
          {[1, 2, 3].map(i => (
            <motion.div key={i} className="absolute rounded-full border border-brand-gold"
              style={{ width: i*40, height: i*40, top: -i*20, left: -i*20 }}
              animate={{ scale: [1, 2], opacity: [0.7, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }} />
          ))}
          <div className="w-4 h-4 bg-brand-gold rounded-full"
            style={{ position: 'absolute', top: -8, left: -8, boxShadow: '0 0 20px #C8A340, 0 0 40px #C8A340' }} />
          <motion.div className="absolute text-brand-gold font-mono text-xs whitespace-nowrap font-bold"
            style={{ top: 16, left: 8, letterSpacing: 2 }}>✦ LOCKED</motion.div>
        </motion.div>
      )}

      {/* Zoomed Odisha beacon */}
      {phase >= 3 && (
        <motion.div className="absolute z-30 pointer-events-none"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          initial={{ opacity: 0, scale: 2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          {[1, 2].map(i => (
            <motion.div key={i} className="absolute rounded-full border-2 border-brand-gold"
              style={{ width: i*60, height: i*60, top: -i*30, left: -i*30 }}
              animate={{ scale: [1, 2.5], opacity: [0.9, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }} />
          ))}
          <div className="w-5 h-5 bg-brand-gold rounded-full"
            style={{ position: 'absolute', top: -10, left: -10, boxShadow: '0 0 30px #C8A340, 0 0 80px rgba(200,163,64,0.4)' }} />
        </motion.div>
      )}

      {/* HUD corners */}
      {phase >= 1 && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute top-6 left-6 border-t-2 border-l-2 border-brand-purple/60 w-12 h-12" />
          <div className="absolute top-6 right-6 border-t-2 border-r-2 border-brand-purple/60 w-12 h-12" />
          <div className="absolute bottom-6 left-6 border-b-2 border-l-2 border-brand-purple/60 w-12 h-12" />
          <div className="absolute bottom-6 right-6 border-b-2 border-r-2 border-brand-purple/60 w-12 h-12" />

          {/* Launch date stamp — top centre */}
          <motion.div className="absolute top-8 left-0 right-0 flex justify-center"
            initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}>
            <span className="font-mono text-brand-gold/80 text-xs tracking-[0.35em] uppercase">
              29 JUNE 2026 · LAUNCH DAY
            </span>
          </motion.div>

          {/* Coordinates */}
          <motion.div className="absolute bottom-10 left-0 right-0 flex justify-center"
            initial={{ opacity: 0 }} animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <span className="font-mono text-brand-gold/90 text-sm tracking-[0.25em]">
              {COORDS} · ODISHA, INDIA
            </span>
          </motion.div>
        </div>
      )}

      {/* Main title + stats */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div className="text-center"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <motion.div className="h-[1px] bg-brand-gold mx-auto mb-6"
                initial={{ width: 0 }} animate={{ width: '20vw' }}
                transition={{ duration: 0.8, delay: 0.2 }} />
              <h2 className="text-[1.5vw] font-sans font-semibold tracking-[0.4em] text-brand-gold uppercase mb-3">
                Impact All Over
              </h2>
              <h1 className="text-[9vw] font-display text-white leading-none"
                style={{ textShadow: '0 0 60px rgba(124,58,237,0.8), 0 0 120px rgba(124,58,237,0.4)' }}>
                ODISHA
              </h1>
              <motion.div className="h-[1px] bg-brand-gold mx-auto mt-6"
                initial={{ width: 0 }} animate={{ width: '20vw' }}
                transition={{ duration: 0.8, delay: 0.4 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* "100 in 24 hours" milestone */}
        {phase >= 6 && (
          <motion.div
            className="mt-[3vw] text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <div className="flex items-center gap-[2vw] justify-center">
              <div className="text-center">
                <div className="text-[3vw] font-display text-brand-gold">100</div>
                <div className="text-[1vw] font-sans text-white/50 uppercase tracking-widest">Downloads</div>
                <div className="text-[0.9vw] font-mono text-brand-gold/50 mt-1">in 24 hours</div>
              </div>
              <div className="w-[1px] h-[6vw] bg-white/15" />
              <div className="text-center">
                <div className="text-[3vw] font-display text-brand-purpleLight">30+</div>
                <div className="text-[1vw] font-sans text-white/50 uppercase tracking-widest">Colleges</div>
                <div className="text-[0.9vw] font-mono text-brand-purpleLight/50 mt-1">across Odisha</div>
              </div>
              <div className="w-[1px] h-[6vw] bg-white/15" />
              <div className="text-center">
                <div className="text-[3vw] font-display text-white">24/7</div>
                <div className="text-[1vw] font-sans text-white/50 uppercase tracking-widest">Active Learning</div>
                <div className="text-[0.9vw] font-mono text-white/30 mt-1">always on</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
