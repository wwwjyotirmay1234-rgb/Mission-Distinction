import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, VolumetricLight, FloatingParticles, SpeedLines
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE DOCTOR DREAM   (30 500 ms)
//  The student becomes the doctor. The dream was always real.
// ════════════════════════════════════════════════════════════════════════

// Graduation ceremony hall — stage, columns, audience
function CeremonyHall({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[4]"
          style={{ inset: 0 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
          <svg viewBox="0 0 1000 580" width="100%" height="100%" preserveAspectRatio="xMidYMax meet"
            style={{ position: 'absolute', bottom: 0 }}>
            <defs>
              <linearGradient id="hallFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(28,18,10,0.90)" />
                <stop offset="100%" stopColor="rgba(16,10,4,0.98)" />
              </linearGradient>
              <filter id="colGlow"><feGaussianBlur stdDeviation="3"/></filter>
            </defs>
            {/* Marble floor in perspective */}
            <polygon points="0,580 1000,580 780,300 220,300" fill="url(#hallFloor)" />
            {/* Stage */}
            <rect x="300" y="280" width="400" height="30" rx="4" fill="rgba(30,22,10,0.95)" />
            {/* Stage front edge highlight */}
            <rect x="300" y="280" width="400" height="3" fill="rgba(200,163,64,0.30)" />
            {/* Columns left */}
            {[120, 200].map((x, i) => (
              <g key={i}>
                <rect x={x - 18} y={60} width={36} height={240} rx="4"
                  fill="rgba(24,18,10,0.92)"
                  style={{ filter: 'drop-shadow(2px 0 8px rgba(0,0,0,0.60))' }} />
                {/* Column capital */}
                <rect x={x - 24} y={56} width={48} height={10} rx="3"
                  fill="rgba(28,22,12,0.90)" />
                {/* Column glow from lights */}
                <line x1={x} y1={60} x2={x} y2={300} stroke="rgba(200,163,64,0.08)"
                  strokeWidth={8} style={{ filter: 'url(#colGlow)' }} />
              </g>
            ))}
            {/* Columns right */}
            {[800, 880].map((x, i) => (
              <g key={i}>
                <rect x={x - 18} y={60} width={36} height={240} rx="4"
                  fill="rgba(24,18,10,0.92)" />
                <rect x={x - 24} y={56} width={48} height={10} rx="3"
                  fill="rgba(28,22,12,0.90)" />
                <line x1={x} y1={60} x2={x} y2={300} stroke="rgba(200,163,64,0.08)"
                  strokeWidth={8} style={{ filter: 'url(#colGlow)' }} />
              </g>
            ))}
            {/* Audience rows */}
            {[380, 420, 455, 488, 518].map((y, ri) =>
              Array.from({ length: 10 + ri * 2 }, (_, si) => {
                const cols = 10 + ri * 2;
                const x = 80 + (si / (cols - 1)) * 840;
                return (
                  <motion.g key={`${ri}-${si}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: ri * 0.08 + si * 0.015, duration: 0.5 }}>
                    <ellipse cx={x} cy={y - 14} rx={9 - ri} ry={11 - ri} fill="rgba(12,8,18,0.85)" />
                    <rect x={x - 8 + ri} y={y - 6} width={16 - ri * 2} height={22 - ri * 3} rx="3"
                      fill="rgba(10,6,16,0.85)" />
                  </motion.g>
                );
              })
            )}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Graduate on stage — receiving degree
function GraduateOnStage({ show, phase }: { show: boolean; phase: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[13]"
          style={{ left: '50%', bottom: '30%', transform: 'translateX(-50%)',
            width: 'clamp(60px,10vw,130px)', height: 'clamp(160px,26vw,330px)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 130 330" width="100%" height="100%">
            {/* Graduation gown + white coat hybrid */}
            {/* Head */}
            <ellipse cx="65" cy="44" rx="24" ry="28" fill="rgba(5,4,12,0.92)" />
            <ellipse cx="65" cy="28" rx="24" ry="16" fill="rgba(4,3,8,0.92)" />
            {/* Graduation cap */}
            <polygon points="65,6 102,18 65,30 28,18" fill="rgba(4,3,8,0.94)"
              style={{ filter: 'drop-shadow(0 0 4px rgba(200,163,64,0.25))' }} />
            <rect x="55" y="6" width="20" height="6" rx="2" fill="rgba(8,6,14,0.90)" />
            {/* Board top */}
            <rect x="28" y="2" width="74" height="8" rx="2" fill="rgba(6,4,10,0.92)" />
            {/* Tassel */}
            <line x1="102" y1="14" x2="108" y2="42" stroke="rgba(200,163,64,0.65)" strokeWidth="2.5"/>
            <circle cx="108" cy="44" r="4" fill="rgba(200,163,64,0.65)" />
            {/* Gown body — dark robes */}
            <path d="M40,70 Q50,62 80,70 L90,190 Q65,202 40,190 Z" fill="rgba(5,4,12,0.92)" />
            {/* White coat visible under gown */}
            {phase >= 2 && (
              <path d="M44,90 Q54,84 76,90 L80,180 Q65,188 50,180 Z"
                fill="rgba(160,170,200,0.65)"
                style={{ filter: 'drop-shadow(0 0 8px rgba(160,170,200,0.35))' }} />
            )}
            {/* Stethoscope around neck */}
            {phase >= 2 && (
              <path d="M50,85 Q65,110 80,85" fill="none"
                stroke="rgba(140,160,200,0.70)" strokeWidth="3.5" strokeLinecap="round"/>
            )}
            {/* Arms - one raised to receive scroll */}
            <path d="M42,90 Q24,120 16,150" stroke="rgba(5,4,12,0.90)" strokeWidth="18"
              fill="none" strokeLinecap="round"/>
            <path d="M88,90 Q102,115 112,138 Q118,148 106,155"
              stroke="rgba(5,4,12,0.90)" strokeWidth="18" fill="none" strokeLinecap="round"/>
            {/* Degree scroll in hand */}
            <rect x="96" y="150" width="30" height="22" rx="5"
              fill="rgba(220,200,150,0.80)"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.60))' }} />
            <line x1="100" y1="158" x2="122" y2="158" stroke="rgba(60,40,20,0.50)" strokeWidth="1.5"/>
            <line x1="100" y1="163" x2="122" y2="163" stroke="rgba(60,40,20,0.40)" strokeWidth="1"/>
            {/* Legs */}
            <path d="M48,190 L44,330" stroke="rgba(5,4,12,0.90)" strokeWidth="14" strokeLinecap="round"/>
            <path d="M82,190 L86,330" stroke="rgba(5,4,12,0.90)" strokeWidth="14" strokeLinecap="round"/>
            {/* Rim lighting from stage lights */}
            {phase >= 1 && (
              <path d="M40,70 Q30,100 30,200 L44,330"
                fill="rgba(200,163,64,0.16)"
                style={{ filter: 'blur(2px)' }} />
            )}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SceneDoctorDream() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 8000),
      setTimeout(() => setPhase(3), 15000),
      setTimeout(() => setPhase(4), 23000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Ceremonial deep blue */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(165deg,#030a20 0%,#060e2e 40%,#040a1c 100%)'
          : 'linear-gradient(165deg,#02060e 0%,#040a18 50%,#020608 100%)' }}
        transition={{ duration: 2.2 }} />

      {/* Ceremony hall */}
      <CeremonyHall show={phase >= 1} />

      {/* Stage spotlights — three cone beams */}
      <VolumetricLight x={35} y={0} angle={12} length={72}
        color="rgba(200,163,64,0.18)" show={phase >= 1} />
      <VolumetricLight x={50} y={0} angle={16} length={72}
        color="rgba(220,180,80,0.24)" show={phase >= 1} />
      <VolumetricLight x={65} y={0} angle={12} length={72}
        color="rgba(200,163,64,0.18)" show={phase >= 1} />

      {/* Graduate on stage */}
      <GraduateOnStage show={phase >= 1} phase={phase} />

      {/* Confetti / particles burst */}
      <FloatingParticles count={28} color="#C8A340" active={phase >= 2} />
      <FloatingParticles count={18} color="rgba(160,180,255,0.85)" active={phase >= 2} />
      <FloatingParticles count={12} color="rgba(255,80,80,0.70)" active={phase >= 3} />

      {/* Gold camera flash blast */}
      {phase >= 2 && [0, 1, 2].map(i => (
        <motion.div key={i} className="absolute pointer-events-none z-[8]"
          style={{ top: '45%', left: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%',
            border: '2px solid rgba(200,163,64,0.45)' }}
          initial={{ width: 0, height: 0, opacity: 0.85 }}
          animate={{ width: '80vmin', height: '80vmin', opacity: 0 }}
          transition={{ delay: i * 1.2, duration: 3.0, ease: 'easeOut' }} />
      ))}

      <SpeedLines active={phase >= 4} color="rgba(200,163,64,0.60)" count={28} cx={50} cy={46} />
      <ChapterTitle chapter="Chapter IX" title="The Dream" show={phase >= 4} />

      <Vignette strength={0.78} />
      <BottomGrad color="2,4,16" />
      <FilmGrain opacity={0.28} />
      <CinemaBars />
    </motion.div>
  );
}
