import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { StarField, FloatingParticles, Silhouette, AnimeText, RisingSun, CityLights, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: NEXT DREAMER — For every student who comes after ──────────
export function SceneNextDreamer() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => setPhase(2), 8000),
      setTimeout(() => setPhase(3), 14000),
      setTimeout(() => setPhase(4), 21000),
      setTimeout(() => setPhase(5), 26500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Deep night → dawn transition */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#100520 0%,#3a1000 35%,#8a3500 65%,#c86000 85%,#ff9500 100%)'
          : 'linear-gradient(180deg,#020210 0%,#05041a 50%,#030312 100%)' }}
        transition={{ duration: 3.0 }} />

      <StarField count={95} show={phase < 4} />
      <CityLights count={50} opacity={0.45} />

      {/* Doorway / arch shape */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{ bottom:'24%', left:'44%', transform:'translateX(-50%)',
          width:'clamp(50px,8vw,90px)', height:'clamp(130px,22vh,200px)',
          border:'3px solid rgba(200,163,64,0.30)',
          borderBottom:'none', borderRadius:'50% 50% 0 0 / 30% 30% 0 0',
          boxShadow:'0 0 20px rgba(200,163,64,0.15) inset' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 1.0 }} />

      {/* Founder — standing, looking out */}
      <Silhouette x={47} y={65} scale={1.55} fill="#040212" variant="standing" show={phase >= 1} />

      {/* New small dreamer in doorway background */}
      <motion.div className="absolute pointer-events-none z-[7]"
        style={{ bottom:'30%', left:'50%', transform:'translateX(-50%)' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 1.4 }}>
        <div style={{ width:'clamp(8px,1.2vw,15px)', height:'clamp(24px,4vh,40px)',
          background:'rgba(200,163,64,0.60)',
          clipPath:'polygon(40% 0%,60% 0%,70% 40%,100% 100%,0% 100%,30% 40%)',
          borderRadius:'2px',
          boxShadow:'0 0 12px rgba(200,163,64,0.50)' }} />
      </motion.div>

      {/* Torch / light passing */}
      <motion.div className="absolute pointer-events-none z-[8]"
        style={{ bottom:'38%', left:'50%' }}
        animate={{ x: phase >= 3 ? 'clamp(20px,4vw,50px)' : 0, opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 1.6, ease: [0.16,1,0.3,1] }}>
        <div style={{ width:'clamp(14px,2.2vw,26px)', height:'clamp(28px,5vh,52px)',
          background:'linear-gradient(to top,rgba(255,100,0,0.90),rgba(255,220,60,0.95),rgba(255,255,160,0.70))',
          borderRadius:'40% 40% 50% 50% / 50% 50% 60% 60%',
          boxShadow:'0 -4px 20px rgba(255,180,0,0.75), 0 0 35px rgba(255,120,0,0.50)',
          animation:'flame 0.5s ease-in-out infinite alternate' }} />
      </motion.div>

      <RisingSun phase={phase >= 4 ? 2 : 0} />
      <FloatingParticles count={18} color="#ff9500" active={phase >= 4} />
      <FloatingParticles count={10} color="#ffd700" active={phase >= 4} />

      <AnimeText lines={['For every student who comes after.','The torch is passed.']}
        show={phase >= 5} accent="#ff9500" bottom="14%" />

      <Vignette strength={0.72} />
      <BottomGrad color="2,2,12" />
    </motion.div>
  );
}
