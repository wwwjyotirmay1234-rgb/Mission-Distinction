import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Silhouette, SpeedLines, FloatingParticles, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE 2: THE SPARK — Five friends. One idea. ─────────────────────
const TABLE_FIGURES = [14, 28, 50, 72, 86];

export function Scene2() {
  const [phase, setPhase] = useState(0);
  const [flash, setFlash] = useState(false);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => { setFlash(true); setTimeout(() => setFlash(false), 200); setPhase(2); }, 4500),
      setTimeout(() => setPhase(3), 7000),
      setTimeout(() => setPhase(4), 9000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}>

      {/* Very dark room → warms on spark */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(160deg,#0d0800 0%,#1a0f00 50%,#120900 100%)'
          : 'linear-gradient(160deg,#040408 0%,#08060e 50%,#040408 100%)' }}
        transition={{ duration: 1.8 }} />

      {/* Table silhouette */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{ bottom:'28%', left:'8%', width:'84%', height:'6px', background:'#080614', borderRadius:'3px' }}
        animate={{ scaleX: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 0.5 }} />

      {/* Five founders */}
      {TABLE_FIGURES.map((x, i) => (
        <Silhouette key={i} x={x} y={58} scale={1.2} fill="#060414" variant="hunched"
          show={phase >= 1} delay={i * 0.08} />
      ))}

      {/* Idea burst — lightbulb SVG */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div className="absolute pointer-events-none z-[12]"
            style={{ top:'22%', left:'50%', transform:'translateX(-50%)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.2], opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
            <svg width="clamp(48px,8vw,90px)" height="clamp(60px,10vw,110px)" viewBox="0 0 60 75">
              <ellipse cx="30" cy="26" rx="18" ry="20" fill="rgba(255,220,60,0.92)"
                style={{ filter:'drop-shadow(0 0 14px rgba(255,200,0,0.80))' }} />
              <rect x="21" y="44" width="18" height="5" rx="2" fill="rgba(255,220,60,0.80)" />
              <rect x="23" y="51" width="14" height="4" rx="2" fill="rgba(255,200,40,0.65)" />
              <line x1="30" y1="4" x2="30" y2="0" stroke="rgba(255,220,60,0.60)" strokeWidth="2"/>
              <line x1="48" y1="10" x2="52" y2="6" stroke="rgba(255,220,60,0.60)" strokeWidth="2"/>
              <line x1="12" y1="10" x2="8" y2="6" stroke="rgba(255,220,60,0.60)" strokeWidth="2"/>
              <line x1="56" y1="26" x2="60" y2="26" stroke="rgba(255,220,60,0.60)" strokeWidth="2"/>
              <line x1="4" y1="26" x2="0" y2="26" stroke="rgba(255,220,60,0.60)" strokeWidth="2"/>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warm glow from idea */}
      <motion.div className="absolute inset-0 pointer-events-none z-[3]"
        style={{ background:'radial-gradient(ellipse at 50% 35%,rgba(255,200,40,0.28) 0%,rgba(255,140,0,0.10) 40%,transparent 68%)' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration: 0.8 }} />

      <FloatingParticles count={22} color="#ffd700" active={phase >= 3} />
      <SpeedLines active={phase >= 3} color="rgba(255,200,50,0.65)" count={26} cx={50} cy={35} />

      <AnimeText lines={['Five friends. One idea.','And a mission was born.']}
        show={phase >= 4} accent="#FFD700" bottom="14%" />

      {/* White flash on spark */}
      <motion.div className="absolute inset-0 bg-amber-100 pointer-events-none z-[25]"
        animate={{ opacity: flash ? 0.85 : 0 }} transition={{ duration: 0.05 }} />

      <Vignette strength={0.72} />
      <BottomGrad color="6,4,0" />
    </motion.div>
  );
}
