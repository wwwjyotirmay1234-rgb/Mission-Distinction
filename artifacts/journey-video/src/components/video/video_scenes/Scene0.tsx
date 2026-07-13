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
    { atPhase: 3, text: 'Books scattered everywhere. Highlighters dried out. Notes incomplete. The syllabus feels endless.' },
    { atPhase: 4, text: 'Outside, rain taps against the window.' },
    { atPhase: 5, text: 'He stares at a blank page.' },
    { atPhase: 6, text: 'Exhaustion. Doubt. Fear.' },
    { atPhase: 7, text: 'A single thought echoes... What if I fail?' },
  ], phase);

  useEffect(() => {
    const tickInterval = setInterval(() => setTick(t => !t), 900);
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 5200),
      setTimeout(() => setPhase(4), 9000),
      setTimeout(() => setPhase(5), 11500),
      setTimeout(() => setPhase(6), 13500),
      setTimeout(() => setPhase(7), 15800),
      setTimeout(() => setPhase(8), 19500),
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

      {/* Cinematic bars top/bottom */}
      <div className="absolute inset-x-0 top-0 h-[6%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black z-10 pointer-events-none" />

      {/* Deep gradient — bottom text legibility */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,3,12,0.97) 0%, rgba(2,3,12,0.55) 32%, rgba(2,3,12,0.05) 60%, rgba(2,3,12,0.3) 100%)' }} />

      {/* ── ANIMATED RAIN ON TOP OF ILLUSTRATION ── */}
      <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
        {RAIN_DROPS.map((drop, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: drop.left,
              top: 0,
              width: '1px',
              height: drop.height,
              background: 'rgba(160,200,255,1)',
              borderRadius: '1px',
              opacity: drop.opacity,
            }}
            animate={{ y: ['0vh', '105vh'] }}
            transition={{
              duration: drop.duration,
              delay: drop.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Lamp glow pulse — warm amber radiating from lamp position */}
      <motion.div className="absolute pointer-events-none z-3"
        style={{
          left: '22%', top: '28%',
          width: '28%', height: '40%',
          background: 'radial-gradient(ellipse at 38% 18%, rgba(255,180,60,0.12) 0%, transparent 68%)',
        }}
        animate={{ opacity: [0.7, 1, 0.8, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── 2:17 AM CLOCK ─────────────────────────── */}
      <motion.div className="absolute z-20 w-full flex flex-col items-center" style={{ top: '9%' }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.8 }}>
        <div className="flex items-center gap-[1.5vw]">
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.6 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
          <p className="font-mono"
            style={{ fontSize: '2.2vw', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.28)' }}>
            {`2${tick ? ':' : ' '}17 AM`}
          </p>
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.6 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
        </div>
        <p className="font-mono mt-2"
          style={{ fontSize: '0.72vw', letterSpacing: '0.55em', color: 'rgba(255,255,255,0.14)' }}>
          VIMSAR · BURLA, SAMBALPUR · HOSTEL ROOM
        </p>
      </motion.div>

      {/* ── TEXT OVERLAYS ──────────────────────────── */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-[10%] px-[10vw]">
        <div className="text-center w-full">

          {phase >= 3 && (
            <div className="mb-[2.5vw]">
              <div style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', lineHeight: 2.1 }}>
                <WordReveal text="Books scattered everywhere." startDelay={0} wordInterval={0.1} style={{ display: 'block' }} />
                <WordReveal text="Highlighters dried out. Notes incomplete." startDelay={0.8} wordInterval={0.09} style={{ display: 'block' }} />
                <WordReveal text="The syllabus feels endless." startDelay={1.8} wordInterval={0.1} style={{ display: 'block' }} />
              </div>
            </div>
          )}

          {phase >= 4 && (
            <p className="mb-[2vw]"
              style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(160,200,255,0.62)', letterSpacing: '0.12em' }}>
              <WordReveal text="Outside, rain taps against the window." startDelay={0} wordInterval={0.1} />
            </p>
          )}

          {phase >= 5 && (
            <p className="mb-[2.5vw]"
              style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.44)', letterSpacing: '0.1em' }}>
              <WordReveal text="He stares at a blank page." startDelay={0} wordInterval={0.11} />
            </p>
          )}

          {phase >= 6 && (
            <div className="flex items-center justify-center gap-[3vw] mb-[2.5vw]">
              {['Exhaustion.', 'Doubt.', 'Fear.'].map((word, i) => (
                <WordReveal key={word} text={word} startDelay={i * 0.35} wordInterval={0.1}
                  style={{ fontSize: '3vw', fontWeight: 700, color: 'rgba(255,255,255,0.68)', letterSpacing: '0.06em' }} />
              ))}
            </div>
          )}

          {phase >= 7 && (
            <div className="overflow-visible">
              <WordReveal text='"What if I fail?"' startDelay={0.1} wordInterval={0.18}
                style={{
                  fontSize: '7.5vw',
                  fontFamily: 'var(--font-display, serif)',
                  color: '#C8A340',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 80px rgba(200,163,64,0.5)',
                  lineHeight: 1,
                  display: 'block',
                }} />
            </div>
          )}
        </div>
      </div>

      {/* Flash out */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 8 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.2 }} />
    </motion.div>
  );
}
