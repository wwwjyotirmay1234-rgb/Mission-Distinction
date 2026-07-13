import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmGrain, CinemaBars, Vignette, BottomGrad, ChapterTitle, VolumetricLight, SpeedLines } from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE 1 — THE REALIZATION   (10 000 ms)
//  A lecture hall. Hundreds struggling with the same doubt. He's not alone.
// ════════════════════════════════════════════════════════════════════════

// Detailed lecture-hall SVG — tiered seating, stage, projector beam
function LectureHall({ phase }: { phase: number }) {
  const rows = [
    { y: 178, count: 14, scale: 0.42, xStart: 60 },
    { y: 154, count: 12, scale: 0.46, xStart: 70 },
    { y: 128, count: 10, scale: 0.50, xStart: 88 },
    { y: 102, count:  8, scale: 0.54, xStart: 108 },
    { y:  78, count:  6, scale: 0.58, xStart: 128 },
  ];
  // spotlight target: row 3, seat 4 (0-indexed)
  const spotRow = rows[2]; const spotSeatIdx = 4;
  const spotX = spotRow.xStart + spotSeatIdx * 62 + 30;
  const spotY = spotRow.y;
  return (
    <div className="absolute inset-0 pointer-events-none z-[4]">
      <svg viewBox="0 0 900 230" width="100%" height="100%" preserveAspectRatio="xMidYMax meet"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(200,163,64,0.28)" />
            <stop offset="100%" stopColor="rgba(200,163,64,0.05)" />
          </linearGradient>
          <filter id="sfBlur"><feGaussianBlur stdDeviation="2.5"/></filter>
        </defs>
        {/* Stage floor */}
        <rect x="0" y="195" width="900" height="35" fill="rgba(18,12,8,0.95)" />
        {/* Stage front light strip */}
        <rect x="0" y="194" width="900" height="3" fill="rgba(200,163,64,0.28)" />
        {/* Podium */}
        <rect x="410" y="175" width="80" height="22" rx="3" fill="rgba(30,22,12,0.92)" />
        {/* Projector beam from ceiling */}
        {phase >= 2 && (
          <polygon points="450,0 390,195 510,195" fill="url(#stageGrad)" opacity="0.70"/>
        )}
        {/* Tiered seating rows */}
        {rows.map((row, ri) =>
          Array.from({ length: row.count }, (_, si) => {
            const x = row.xStart + si * (850 / row.count);
            const isSpotted = phase >= 2 && ri === 2 && si === spotSeatIdx;
            const headFill = isSpotted ? 'rgba(200,163,64,0.22)' : 'rgba(22,16,28,0.88)';
            const bodyFill = isSpotted ? 'rgba(18,12,22,0.88)' : 'rgba(16,12,20,0.82)';
            return (
              <motion.g key={`${ri}-${si}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: ri * 0.06 + si * 0.012, duration: 0.5 }}>
                {/* Seat */}
                <rect x={x - 10 * row.scale} y={row.y + 5} width={20 * row.scale} height={12 * row.scale}
                  rx="2" fill="rgba(20,14,24,0.80)" />
                {/* Body */}
                <rect x={x - 8 * row.scale} y={row.y - 18 * row.scale} width={16 * row.scale} height={22 * row.scale}
                  rx="3" fill={bodyFill} />
                {/* Head */}
                <ellipse cx={x} cy={row.y - 22 * row.scale} rx={7 * row.scale} ry={9 * row.scale}
                  fill={headFill}
                  style={isSpotted ? { filter: 'drop-shadow(0 0 6px rgba(200,163,64,0.45))' } : {}} />
              </motion.g>
            );
          })
        )}
        {/* Spotlight circle on spotlighted student */}
        {phase >= 2 && (
          <motion.ellipse cx={spotX} cy={spotY - 20} rx={28} ry={35}
            fill="none" stroke="rgba(200,163,64,0.40)" strokeWidth="2"
            initial={{ r: 0, opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }} />
        )}
      </svg>
    </div>
  );
}

export function Scene1() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 1800),
      setTimeout(() => setPhase(2), 4500),
      setTimeout(() => setPhase(3), 7000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Lecture hall walls — warm dark wood */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(175deg,#080508 0%,#0e0810 40%,#120a16 70%,#080508 100%)'
      }} />

      {/* Ceiling panels */}
      <motion.div className="absolute top-0 left-0 right-0 pointer-events-none z-[3]"
        style={{ height: '18%',
          background: 'linear-gradient(to bottom,rgba(14,10,20,0.98) 0%,rgba(10,8,16,0.70) 100%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.0 }} />

      {/* Ceiling light strips */}
      {phase >= 1 && [12, 36, 62, 86].map(x => (
        <motion.div key={x} className="absolute pointer-events-none z-[3]"
          style={{ top: '3%', left: `${x - 6}%`, width: '10%', height: '2px',
            background: 'rgba(200,163,64,0.25)',
            boxShadow: '0 0 8px rgba(200,163,64,0.18)' }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ delay: x * 0.04, duration: 3, repeat: Infinity }} />
      ))}

      {/* Projector cone from ceiling center */}
      <VolumetricLight x={50} y={0} angle={18} length={72}
        color="rgba(200,163,64,0.12)" show={phase >= 2} />

      {/* Lecture hall seating */}
      <LectureHall phase={phase} />

      {/* Spotlight from above on one student */}
      <VolumetricLight x={47} y={0} angle={8} length={68}
        color="rgba(255,210,90,0.20)" show={phase >= 2} />

      {/* "Are you the only one struggling?" */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div className="absolute pointer-events-none z-[20]"
            style={{ top: '16%', right: '8%' }}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <p style={{ fontSize: 'clamp(0.40rem,0.72vw,0.58rem)', letterSpacing: '0.30em',
              color: 'rgba(200,163,64,0.50)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              The question no one asks
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <SpeedLines active={phase >= 3} color="rgba(200,163,64,0.55)" count={22} cx={47} cy={72} />

      <ChapterTitle chapter="Chapter I" title="The Realization" show={phase >= 3} />

      <Vignette strength={0.82} />
      <BottomGrad color="4,2,8" />
      <FilmGrain opacity={0.30} />
      <CinemaBars />
    </motion.div>
  );
}
