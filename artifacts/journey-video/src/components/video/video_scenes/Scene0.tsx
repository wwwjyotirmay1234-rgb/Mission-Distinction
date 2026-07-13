import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

const RAIN_DROPS = Array.from({ length: 38 }, (_, i) => ({
  left: `${(i * 2.63 + (i % 7) * 1.2) % 100}%`,
  height: `${55 + (i % 5) * 18}px`,
  duration: 0.55 + (i % 6) * 0.12,
  delay: (i * 0.11) % 2.2,
  opacity: 0.06 + (i % 4) * 0.025,
}));

export function Scene0() {
  const [phase, setPhase] = useState(0);
  const [tick, setTick] = useState(false);

  useSceneSpeech([
    { atPhase: 3, text: 'Exhaustion. Doubt. Fear.' },
    { atPhase: 4, text: 'What if I fail?' },
  ], phase);

  useEffect(() => {
    const tickInterval = setInterval(() => setTick(t => !t), 900);
    const timers = [
      setTimeout(() => setPhase(1), 1000),   // rain starts
      setTimeout(() => setPhase(2), 2500),   // 2:17 AM appears
      // long visual pause — let the illustration breathe
      setTimeout(() => setPhase(3), 11500),  // Exhaustion. Doubt. Fear.
      setTimeout(() => setPhase(4), 15500),  // "What if I fail?"
      setTimeout(() => setPhase(5), 19500),  // flash out
    ];
    return () => { timers.forEach(clearTimeout); clearInterval(tickInterval); };
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>

      {/* ── CINEMATIC ILLUSTRATION ──────────────── */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 20, ease: 'easeOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/scene0_desk_illustration.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.82) contrast(1.05)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic bars */}
      <div className="absolute inset-x-0 top-0 h-[6%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black z-10 pointer-events-none" />

      {/* Bottom gradient for text area */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.92) 0%, rgba(2,3,12,0.4) 28%, transparent 55%)' }} />

      {/* ── ANIMATED RAIN ── */}
      <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
        {RAIN_DROPS.map((drop, i) => (
          <motion.div key={i} className="absolute"
            style={{
              left: drop.left, top: 0,
              width: '1px', height: drop.height,
              background: 'rgba(160,200,255,1)',
              borderRadius: '1px', opacity: drop.opacity,
            }}
            animate={{ y: ['0vh', '105vh'] }}
            transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      {/* Lamp glow pulse */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '22%', top: '28%', width: '28%', height: '40%',
          background: 'radial-gradient(ellipse at 38% 18%, rgba(255,180,60,0.12) 0%, transparent 68%)',
        }}
        animate={{ opacity: [0.7, 1, 0.8, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── 2:17 AM ── */}
      <motion.div className="absolute z-20 w-full flex flex-col items-center" style={{ top: '9%' }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.8 }}>
        <div className="flex items-center gap-[1.5vw]">
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.6 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
          <p className="font-mono" style={{ fontSize: '2.2vw', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.28)' }}>
            {`2${tick ? ':' : ' '}17 AM`}
          </p>
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.6 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
        </div>
        <p className="font-mono mt-2"
          style={{ fontSize: '0.72vw', letterSpacing: '0.55em', color: 'rgba(255,255,255,0.14)' }}>
          VIMSAR · BURLA · HOSTEL ROOM
        </p>
      </motion.div>

      {/* ── EMOTIONAL PUNCHES ONLY ── */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-[11%] px-[10vw]">
        <div className="text-center w-full">

          {/* "Exhaustion. Doubt. Fear." — 3 words, spaced dramatically */}
          {phase >= 3 && phase < 4 && (
            <motion.div className="flex items-center justify-center gap-[4vw]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
              {['Exhaustion.', 'Doubt.', 'Fear.'].map((word, i) => (
                <WordReveal key={word} text={word} startDelay={i * 0.45} wordInterval={0.1}
                  style={{ fontSize: '3.2vw', fontWeight: 300, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em',
                    fontFamily: 'var(--font-display, serif)' }} />
              ))}
            </motion.div>
          )}

          {/* The BIG question */}
          {phase >= 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
              <WordReveal text='"What if I fail?"' startDelay={0.1} wordInterval={0.2}
                style={{
                  fontSize: '8vw',
                  fontFamily: 'var(--font-display, serif)',
                  color: '#C8A340',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 80px rgba(200,163,64,0.5)',
                  lineHeight: 1,
                  display: 'block',
                }} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Flash out */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.2 }} />
    </motion.div>
  );
}
