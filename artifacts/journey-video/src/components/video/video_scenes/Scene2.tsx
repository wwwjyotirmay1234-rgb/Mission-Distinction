import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, VolumetricLight, FloatingParticles, SpeedLines
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE 2 — THE SPARK   (12 000 ms)
//  Five friends. A hostel room. One lightbulb moment.
// ════════════════════════════════════════════════════════════════════════

// Five founders at a table — detailed SVG
function FoundersAtTable({ show, lit }: { show: boolean; lit: boolean }) {
  const seats = [
    { x: 120, angle: -18, variant: 'hunch' },
    { x: 240, angle: -8,  variant: 'lean'  },
    { x: 370, angle:  0,  variant: 'upright'},
    { x: 500, angle:  8,  variant: 'lean'  },
    { x: 620, angle: 15,  variant: 'hunch' },
  ];
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[10]"
          style={{ left: '8%', right: '8%', bottom: '22%', height: '50%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 760 280" width="100%" height="100%">
            <defs>
              <filter id="glow2"><feGaussianBlur stdDeviation="4"/></filter>
            </defs>
            {/* Table top — long oval */}
            <ellipse cx="380" cy="250" rx="330" ry="28"
              fill="rgba(30,20,10,0.92)" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.80))' }} />
            {/* Table surface highlight */}
            <ellipse cx="380" cy="245" rx="290" ry="14" fill="rgba(55,38,18,0.60)" />
            {/* Lamp reflection on table when lit */}
            {lit && (
              <ellipse cx="380" cy="240" rx="120" ry="12" fill="rgba(255,200,60,0.18)"
                style={{ filter: 'blur(8px)' }} />
            )}
            {/* Papers / notebooks on table */}
            {[150,260,340,440,540].map((x, i) => (
              <g key={i}>
                <rect x={x} y={218} width={70} height={46} rx="2"
                  fill="rgba(220,210,185,0.40)"
                  style={{ transform: `rotate(${(i - 2) * 5}deg)`, transformOrigin: `${x + 35}px 241px` }} />
                <line x1={x + 8} y1={228} x2={x + 62} y2={228} stroke="rgba(40,30,14,0.22)" strokeWidth="1.5"/>
                <line x1={x + 8} y1={236} x2={x + 55} y2={236} stroke="rgba(40,30,14,0.18)" strokeWidth="1.5"/>
              </g>
            ))}
            {/* Pens */}
            <line x1="320" y1="248" x2="345" y2="260" stroke="rgba(200,163,64,0.55)" strokeWidth="3" strokeLinecap="round"/>
            <line x1="415" y1="248" x2="440" y2="256" stroke="rgba(60,120,200,0.50)" strokeWidth="3" strokeLinecap="round"/>
            {/* Five founder silhouettes */}
            {seats.map((s, i) => (
              <motion.g key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.10, duration: 0.65, ease: [0.16,1,0.3,1] }}>
                {/* Body */}
                <ellipse cx={s.x} cy={180} rx={28} ry={22} fill="rgba(8,6,14,0.90)"
                  style={{ transform: `rotate(${s.angle}deg)`, transformOrigin: `${s.x}px 190px` }} />
                {/* Head */}
                <ellipse cx={s.x} cy={130} rx={22} ry={26} fill="rgba(8,6,14,0.90)" />
                {/* Hair */}
                <ellipse cx={s.x} cy={115} rx={22} ry={15} fill="rgba(6,4,10,0.90)" />
                {/* Arms toward table */}
                <path d={`M${s.x - 20},195 Q${s.x - 30},225 ${s.x - 18},240`}
                  fill="rgba(8,6,14,0.85)" stroke="rgba(8,6,14,0.85)" strokeWidth="14" strokeLinecap="round"/>
                <path d={`M${s.x + 20},195 Q${s.x + 30},225 ${s.x + 18},240`}
                  fill="rgba(8,6,14,0.85)" stroke="rgba(8,6,14,0.85)" strokeWidth="14" strokeLinecap="round"/>
                {/* Glow when lit — idea spreading to each person */}
                {lit && (
                  <motion.ellipse cx={s.x} cy={150} rx={30} ry={38}
                    fill={`rgba(255,200,60,${0.04 + i * 0.01})`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }} />
                )}
              </motion.g>
            ))}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hanging bare lightbulb — classic idea bulb
function LightBulb({ phase }: { phase: number }) {
  return (
    <div className="absolute pointer-events-none z-[12]"
      style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}>
      <svg viewBox="0 0 60 160" width="clamp(30px,5vw,60px)" height="clamp(80px,14vw,160px)">
        {/* Wire from ceiling */}
        <line x1="30" y1="0" x2="30" y2="50" stroke="rgba(80,60,30,0.70)" strokeWidth="2"/>
        {/* Socket */}
        <rect x="22" y="46" width="16" height="10" rx="3" fill="rgba(60,45,20,0.85)" />
        {/* Bulb glass */}
        <motion.ellipse cx="30" cy="90" rx="22" ry="30"
          fill={phase >= 2 ? 'rgba(255,235,120,0.92)' : 'rgba(30,24,14,0.80)'}
          animate={{ fill: phase >= 2 ? 'rgba(255,235,120,0.92)' : 'rgba(30,24,14,0.80)' }}
          transition={{ duration: 0.15 }}
          style={{ filter: phase >= 2 ? 'drop-shadow(0 0 20px rgba(255,200,60,0.85))' : 'none' }} />
        {/* Filament */}
        <motion.path d="M24,88 Q26,80 28,88 Q30,80 32,88 Q34,80 36,88"
          fill="none" stroke={phase >= 2 ? 'rgba(255,160,0,0.90)' : 'rgba(80,60,30,0.40)'}
          strokeWidth="1.8" strokeLinecap="round"
          animate={{ stroke: phase >= 2 ? 'rgba(255,160,0,0.90)' : 'rgba(80,60,30,0.40)' }}
          transition={{ duration: 0.15 }} />
        {/* Neck */}
        <rect x="24" y="118" width="12" height="8" rx="2" fill="rgba(60,45,20,0.80)" />
        {/* Base ring */}
        <ellipse cx="30" cy="126" rx="8" ry="3" fill="rgba(50,36,16,0.80)" />
      </svg>
    </div>
  );
}

export function Scene2() {
  const [phase, setPhase] = useState(0);
  const [flash, setFlash] = useState(false);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 1800),
      setTimeout(() => {
        setFlash(true); setTimeout(() => setFlash(false), 180);
        setPhase(2);
      }, 4800),
      setTimeout(() => setPhase(3), 7500),
      setTimeout(() => setPhase(4), 9500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Hostel room — dark, late night */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(160deg,#100a00 0%,#1e1000 45%,#100a00 100%)'
          : 'linear-gradient(160deg,#04040c 0%,#08060e 50%,#04040c 100%)' }}
        transition={{ duration: 1.2 }} />

      {/* Room wall features — poster on wall */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{ top: '15%', left: '6%', width: '12%', height: '18%',
          border: '2px solid rgba(60,45,20,0.50)',
          background: 'rgba(12,8,4,0.80)' }}
        animate={{ opacity: phase >= 1 ? 0.60 : 0 }} transition={{ duration: 1.2 }} />

      {/* Hanging bulb */}
      <LightBulb phase={phase} />

      {/* Warm glow pool when bulb on */}
      <VolumetricLight x={50} y={0} angle={55} length={65}
        color="rgba(255,190,60,0.20)" show={phase >= 2} />

      {/* Five founders */}
      <FoundersAtTable show={phase >= 1} lit={phase >= 2} />

      {/* Explosion ring on spark */}
      {phase >= 2 && [0, 1, 2].map(i => (
        <motion.div key={i} className="absolute pointer-events-none z-[8]"
          style={{ top: '18%', left: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%',
            border: '2px solid rgba(255,200,60,0.45)' }}
          initial={{ width: 0, height: 0, opacity: 0.9 }}
          animate={{ width: '60vmin', height: '60vmin', opacity: 0 }}
          transition={{ delay: i * 0.45, duration: 1.8, ease: 'easeOut' }} />
      ))}

      <FloatingParticles count={20} color="#ffd700" active={phase >= 2} />
      <FloatingParticles count={10} color="#ff8c00" active={phase >= 3} />
      <SpeedLines active={phase >= 4} color="rgba(255,200,50,0.65)" count={28} cx={50} cy={20} />

      <ChapterTitle chapter="Chapter II" title="The Spark" show={phase >= 4} />

      {/* White flash */}
      <motion.div className="absolute inset-0 bg-amber-100 pointer-events-none z-[95]"
        animate={{ opacity: flash ? 0.80 : 0 }} transition={{ duration: 0.05 }} />

      <Vignette strength={0.80} />
      <BottomGrad color="6,4,0" />
      <FilmGrain opacity={0.32} />
      <CinemaBars />
    </motion.div>
  );
}
