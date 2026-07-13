import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

const VIGNETTES = [
  { line: 'A student studies in a hostel room.', detail: 'VIMSAR · BURLA' },
  { line: 'Another studies on a bus.', detail: 'SAMBALPUR → CUTTACK' },
  { line: 'Another revises before an exam.', detail: 'SCB MEDICAL COLLEGE' },
  { line: 'Another finally understands a difficult topic.', detail: 'MKCG · BERHAMPUR' },
];

// Animated light dots spreading across Odisha map
const MAP_DOTS = Array.from({ length: 32 }, (_, i) => ({
  x: 20 + (i * 1.97 + Math.sin(i) * 12) % 62,
  y: 22 + (i * 2.31 + Math.cos(i) * 10) % 55,
  delay: 0.3 + (i * 0.18),
  size: 3 + (i % 4),
}));

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const [vigIdx, setVigIdx] = useState(0);
  const builtTimers = useRef(false);

  useSceneSpeech([
    { atPhase: 2, text: 'A student studies in a hostel room. Another studies on a bus. Another revises before an exam. Another finally understands a difficult topic.' },
    { atPhase: 3, text: 'Different faces. Different stories.' },
    { atPhase: 4, text: 'Connected by one idea.' },
    { atPhase: 5, text: 'Students helping students.' },
    { atPhase: 6, text: 'Across Odisha. One mission.' },
  ], phase);

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 10000),
      setTimeout(() => setPhase(4), 13000),
      setTimeout(() => setPhase(5), 16000),
      setTimeout(() => setPhase(6), 18500),
    ];
    let idx = 0;
    const vt = setInterval(() => { idx = Math.min(idx + 1, VIGNETTES.length - 1); setVigIdx(idx); }, 1900);
    const st = setTimeout(() => clearInterval(vt), 8500);
    return () => { timers.forEach(clearTimeout); clearInterval(vt); clearTimeout(st); };
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: '5%' }} transition={{ duration: 0.9 }}>

      {/* ── CINEMATIC ODISHA MAP ILLUSTRATION ── */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 20, ease: 'easeOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/char_s6_odisha_students.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.7) saturate(0.9)' }}
          alt=""
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 48%, rgba(0,0,0,0.88) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Animated gold pulse rings from center of map */}
      {phase >= 1 && [1, 2, 3].map(ring => (
        <motion.div key={ring} className="absolute pointer-events-none z-2 rounded-full"
          style={{
            left: '50%', top: '50%',
            border: '1px solid rgba(200,163,64,0.4)',
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: '80vw', height: '80vw', opacity: 0 }}
          transition={{ duration: 4, delay: ring * 1.3, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}

      {/* Spreading light dots over the map */}
      {phase >= 2 && MAP_DOTS.map((dot, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-3"
          style={{
            left: `${dot.x}%`, top: `${dot.y}%`,
            width: dot.size, height: dot.size,
            background: 'radial-gradient(circle, rgba(255,200,80,0.95) 0%, rgba(255,160,40,0.6) 100%)',
            boxShadow: `0 0 ${dot.size * 3}px rgba(255,180,50,0.7)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.8], scale: [0, 1.5, 1] }}
          transition={{ duration: 0.5, delay: dot.delay, ease: 'easeOut' }}
        />
      ))}

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-[10vw]">

        <motion.p className="font-mono mb-[5vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
          THE RIPPLE SPREADS ACROSS ODISHA
        </motion.p>

        {phase >= 2 && phase < 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <motion.div key={vigIdx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p style={{ fontSize: '4vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.68)', letterSpacing: '0.05em', marginBottom: '1vw' }}>
                {VIGNETTES[vigIdx].line}
              </p>
              <p className="font-mono" style={{ fontSize: '0.8vw', letterSpacing: '0.45em', color: 'rgba(200,163,64,0.45)' }}>
                {VIGNETTES[vigIdx].detail}
              </p>
            </motion.div>
          </motion.div>
        )}

        {phase >= 3 && phase < 4 && (
          <div style={{ fontSize: '3.5vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', lineHeight: 2 }}>
            <WordReveal text="Different faces. Different stories." startDelay={0} wordInterval={0.14} />
          </div>
        )}

        {phase >= 4 && phase < 5 && (
          <div style={{ fontSize: '4vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.05em' }}>
            <WordReveal text="Connected by one idea." startDelay={0} wordInterval={0.16} />
          </div>
        )}

        {phase >= 5 && phase < 6 && (
          <div style={{ fontFamily: 'var(--font-display, serif)', textShadow: '0 4px 50px rgba(0,0,0,0.95)' }}>
            <WordReveal text="Students helping students." startDelay={0} wordInterval={0.2}
              style={{ fontSize: '5.5vw', color: '#fff', letterSpacing: '-0.01em' }} />
          </div>
        )}

        {phase >= 6 && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.1 }}>
              <WordReveal text="ACROSS ODISHA." startDelay={0} wordInterval={0.28}
                style={{ display: 'block', fontSize: '8.5vw', color: '#fff', letterSpacing: '-0.02em', textShadow: '0 4px 70px rgba(0,0,0,0.95)' }} />
              <WordReveal text="ONE MISSION." startDelay={0.7} wordInterval={0.3}
                style={{ display: 'block', fontSize: '8.5vw', color: '#C8A340', letterSpacing: '-0.02em', textShadow: '0 0 60px rgba(200,163,64,0.35)' }} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
