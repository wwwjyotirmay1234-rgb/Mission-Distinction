import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Silhouette, AnimeText, SpeedLines, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE 1: THE REALIZATION — He wasn't alone ───────────────────────
const ROW_SEATS = [
  [14,52,60,70,80],
  [10,22,35,47,59,72,84,92],
  [8, 18,30,42,54,66,78,88],
];

export function Scene1() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 5500),
      setTimeout(() => setPhase(3), 7500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Lecture-hall warm dark gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(170deg,#0c0808 0%,#1a0f08 40%,#140b05 70%,#0a0606 100%)'
      }} />

      {/* Stage / podium glow at bottom */}
      <motion.div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[3]"
        style={{ height:'35%',
          background:'linear-gradient(to top,rgba(200,140,40,0.20) 0%,rgba(200,140,40,0.06) 40%,transparent 100%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.4 }} />

      {/* Rows of seated students */}
      {ROW_SEATS.map((cols, row) =>
        cols.map((x, i) => (
          <Silhouette key={`${row}-${i}`}
            x={x} y={44 + row * 14}
            scale={0.55 + row * 0.06}
            fill={phase >= 2 && row === 1 && i === 3 ? '#0a0a0a' : '#100808'}
            variant="sitting"
            show={phase >= 1}
            delay={row * 0.15 + i * 0.04}
          />
        ))
      )}

      {/* Spotlight on the one */}
      <motion.div className="absolute pointer-events-none z-[5]"
        style={{ top:0, left:0, right:0, bottom:0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration: 1.0 }}>
        <div style={{
          position:'absolute', top:'20%', left:'43%',
          width:'clamp(100px,16vw,180px)', height:'clamp(200px,40vh,350px)',
          background:'linear-gradient(to bottom,rgba(255,210,80,0.28) 0%,rgba(255,180,50,0.06) 70%,transparent 100%)',
          clipPath:'polygon(20% 0%,80% 0%,100% 100%,0% 100%)',
        }} />
      </motion.div>

      {/* Highlight the one figure */}
      <motion.div className="absolute pointer-events-none z-[6]"
        style={{ left:'43%', top:'46%', transform:'translate(-50%,-50%)' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 0.7 }}>
        <div style={{
          width:'clamp(30px,5vw,55px)', height:'clamp(30px,5vw,55px)',
          borderRadius:'50%',
          border:'2px solid rgba(200,163,64,0.55)',
          boxShadow:'0 0 20px rgba(200,163,64,0.35)',
        }} />
      </motion.div>

      <SpeedLines active={phase >= 3} color="rgba(200,163,64,0.55)" count={22} cx={50} cy={50} />
      <AnimeText lines={["He wasn't alone.", 'None of them were.']}
        show={phase >= 3} accent="#C8A340" bottom="14%" />

      <Vignette strength={0.78} />
      <BottomGrad color="10,6,4" />
    </motion.div>
  );
}
