import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// SCENE 7 — THE RIPPLE EFFECT
const VIGNETTES = [
  { line: 'A student studies in a hostel room.', detail: 'VIMSAR · BURLA' },
  { line: 'Another studies on a bus.', detail: 'SAMBALPUR → CUTTACK' },
  { line: 'Another revises before an exam.', detail: 'SCB MEDICAL COLLEGE' },
  { line: 'Another finally understands a difficult topic.', detail: 'MKCG · BERHAMPUR' },
];

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const [vigIdx, setVigIdx] = useState(0);

  useSceneSpeech([
    { atPhase: 2, text: 'A student studies in a hostel room. Another studies on a bus. Another revises before an exam. Another finally understands a difficult topic.' },
    { atPhase: 3, text: 'Different faces. Different stories.' },
    { atPhase: 4, text: 'Connected by one idea.' },
    { atPhase: 5, text: 'Students helping students.' },
    { atPhase: 6, text: 'Across Odisha. One mission.' },
  ], phase);

  useEffect(() => {
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

      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 14, ease: 'easeOut' }}>
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.65) contrast(1.08) brightness(0.38)' }}>
          <source src={`${import.meta.env.BASE_URL}videos/scene9_ripple_across_odisha.mp4`} type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.28) 48%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.75) 100%)' }} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[10vw]">

        <motion.p className="font-mono mb-[5vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
          THE CAMERA TRAVELS ACROSS ODISHA
        </motion.p>

        {/* Vignette cycling */}
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
