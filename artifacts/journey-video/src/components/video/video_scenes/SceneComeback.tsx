import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, RisingSun, FloatingParticles, SpeedLines, StarField, CityLights
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE COMEBACK   (29 600 ms)
//  They didn't quit. They rebuilt. Dawn breaks.
// ════════════════════════════════════════════════════════════════════════

// Five founders standing at a rooftop railing watching dawn
function FoundersAtDawn({ show, phase }: { show: boolean; phase: number }) {
  const positions = [
    { x: '22%', delay: 0.10 }, { x: '32%', delay: 0.18 },
    { x: '50%', delay: 0.00 }, { x: '68%', delay: 0.18 }, { x: '78%', delay: 0.10 },
  ];
  // Center figure slightly taller / more prominent
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute pointer-events-none z-[11]">
          {positions.map((p, i) => (
            <motion.div key={i} className="absolute"
              style={{ left: p.x, bottom: '18%',
                width: i === 2 ? 'clamp(38px,6.5vw,80px)' : 'clamp(30px,5.5vw,66px)',
                height: i === 2 ? 'clamp(90px,16vw,190px)' : 'clamp(70px,13vw,155px)',
                transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: p.delay + 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <svg viewBox="0 0 70 200" width="100%" height="100%" overflow="visible">
                {/* Head */}
                <ellipse cx="35" cy="36" rx={i === 2 ? 20 : 17} ry={i === 2 ? 24 : 20}
                  fill="rgba(4,3,10,0.92)" />
                <ellipse cx="35" cy="22" rx={i === 2 ? 20 : 17} ry={i === 2 ? 14 : 12}
                  fill="rgba(3,2,7,0.92)" />
                {/* Body */}
                <path d={`M14,58 Q22,52 48,58 L52,130 Q35,138 18,130 Z`}
                  fill="rgba(4,3,10,0.92)" />
                {/* Arms — slightly raised (determined stance) */}
                <path d={`M18,72 Q8,100 4,118`} stroke="rgba(4,3,10,0.92)" strokeWidth={i===2?18:15}
                  fill="none" strokeLinecap="round"/>
                <path d={`M52,72 Q62,100 66,118`} stroke="rgba(4,3,10,0.92)" strokeWidth={i===2?18:15}
                  fill="none" strokeLinecap="round"/>
                {/* Legs */}
                <path d="M22,130 L18,200" stroke="rgba(4,3,10,0.90)" strokeWidth="14" strokeLinecap="round"/>
                <path d="M48,130 L52,200" stroke="rgba(4,3,10,0.90)" strokeWidth="14" strokeLinecap="round"/>
                {/* Sunrise reflected — rim light on silhouette edge */}
                {phase >= 3 && (
                  <path d="M14,58 Q5,80 4,130 L18,200 L22,130 Z"
                    fill="rgba(255,120,30,0.18)" />
                )}
              </svg>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Railing / rooftop edge
function Rooftop({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[9]"
          style={{ bottom: '15%', left: 0, right: 0, height: '6%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.0 }}>
          <svg viewBox="0 0 1000 40" width="100%" height="100%" preserveAspectRatio="none">
            {/* Parapet top */}
            <rect x="0" y="8" width="1000" height="8" fill="rgba(24,16,10,0.95)" />
            {/* Railing posts */}
            {Array.from({ length: 20 }, (_, i) => (
              <rect key={i} x={25 + i * 50} y="0" width="4" height="8" rx="1"
                fill="rgba(30,20,12,0.88)" />
            ))}
            {/* Parapet base */}
            <rect x="0" y="16" width="1000" height="24" fill="rgba(20,14,8,0.98)" />
            {/* Subtle concrete texture lines */}
            <line x1="0" y1="20" x2="1000" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="30" x2="1000" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SceneComeback() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 7000),
      setTimeout(() => setPhase(3), 13000),
      setTimeout(() => setPhase(4), 20000),
      setTimeout(() => setPhase(5), 25000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const sunPhase = (phase >= 4 ? 3 : phase >= 3 ? 2 : phase >= 2 ? 1 : 0) as 0 | 1 | 2 | 3;

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Sky — shifts from near-black to pre-dawn indigo to amber */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#0e0520 0%,#4a1200 28%,#aa3800 55%,#e86000 78%,#ffa000 100%)'
          : phase >= 2
            ? 'linear-gradient(180deg,#08031a 0%,#1e0828 40%,#4a1800 68%,#7a3000 100%)'
            : 'linear-gradient(180deg,#020210 0%,#060318 50%,#080520 100%)' }}
        transition={{ duration: 3.0 }} />

      {/* Stars fade as dawn rises */}
      <StarField count={80} show={phase < 3} />

      {/* City skyline in distance */}
      <CityLights count={80} opacity={0.55} color="#ff9040" />

      {/* Horizon glow line */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{ bottom: '22%', left: 0, right: 0, height: '3px',
          background: 'linear-gradient(to right,transparent 5%,rgba(255,110,20,0.80) 50%,transparent 95%)' }}
        animate={{ opacity: phase >= 2 ? 1 : 0, scaleX: phase >= 2 ? 1 : 0.4 }}
        transition={{ duration: 2.2 }} />

      {/* Sunrise */}
      <RisingSun phase={sunPhase} />

      {/* Atmospheric light rays from sun */}
      {phase >= 3 && [42, 48, 52, 56, 62].map((x, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[3]"
          style={{ bottom: '22%', left: `${x}%`, width: '1px', height: '50%',
            background: `linear-gradient(to top,rgba(255,${100 + i * 10},20,0.30),transparent)`,
            transformOrigin: 'bottom center',
            transform: `rotate(${(x - 52) * 2}deg)`,
            filter: 'blur(4px)' }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: i * 0.22, duration: 2.0, ease: 'easeOut' }} />
      ))}

      {/* Rooftop */}
      <Rooftop show={phase >= 1} />

      {/* Five founders — silhouetted against dawn */}
      <FoundersAtDawn show={phase >= 2} phase={phase} />

      <FloatingParticles count={18} color="#ff8c00" active={phase >= 3} />
      <FloatingParticles count={10} color="#ffd700" active={phase >= 4} />
      <SpeedLines active={phase >= 5} color="rgba(255,160,30,0.65)" count={30} cx={50} cy={55} />

      <ChapterTitle chapter="Chapter V" title="The Rise" show={phase >= 5} />

      <Vignette strength={0.70} />
      <BottomGrad color="8,3,0" />
      <FilmGrain opacity={0.30} />
      <CinemaBars />
    </motion.div>
  );
}
