import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { StarField, SpeedLines, FloatingParticles, Silhouette, AnimeText, RisingSun, CityLights, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: THE COMEBACK — Then they rise ─────────────────────────────
export function SceneComeback() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 3500),
      setTimeout(() => setPhase(2), 8000),
      setTimeout(() => setPhase(3), 14000),
      setTimeout(() => setPhase(4), 20000),
      setTimeout(() => setPhase(5), 25500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const sunPhase = phase >= 3 ? 2 : phase >= 2 ? 1 : 0;

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Sky color shifts through dawn */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#160820 0%,#5a1000 28%,#c84000 55%,#ff7b00 78%,#ffd000 100%)'
          : phase >= 2
            ? 'linear-gradient(180deg,#0d0520 0%,#2a0a35 45%,#5a1a00 78%,#8b3a00 100%)'
            : 'linear-gradient(180deg,#02020c 0%,#06031a 50%,#0a0520 100%)' }}
        transition={{ duration: 2.8 }} />

      <StarField count={70} show={phase < 3} />
      <CityLights count={55} opacity={0.45} color="#ff8030" />
      <RisingSun phase={sunPhase as 0|1|2|3} />

      {/* Horizon glow line */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{ bottom:'28%', left:0, right:0, height:'3px',
          background:'linear-gradient(to right,transparent,rgba(255,120,20,0.70),transparent)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.8 }} />

      {/* Kneeling → standing figure */}
      <Silhouette x={50} y={72} scale={1.5} fill="#080310" variant="hunched" show={phase >= 1 && phase < 3} delay={0.2} />
      <Silhouette x={50} y={68} scale={1.6} fill="#060210" variant="standing" show={phase >= 3} />

      {/* 4 supporting figures flanking */}
      {[-24,-12,12,24].map((dx, i) => (
        <Silhouette key={i} x={50+dx} y={72} scale={1.2} fill="#060210" variant="standing"
          show={phase >= 4} delay={i * 0.12} />
      ))}

      <FloatingParticles count={25} color="#ff8c00" active={phase >= 3} />
      <FloatingParticles count={14} color="#ffd700" active={phase >= 4} />

      <SpeedLines active={phase >= 5} color="rgba(255,160,30,0.70)" count={30} cx={50} cy={42} />
      <AnimeText lines={['Then they rise.','Harder. Together.']} show={phase >= 5} accent="#ff8c00" bottom="14%" />

      <Vignette strength={0.65} />
      <BottomGrad color="8,2,0" />
    </motion.div>
  );
}
