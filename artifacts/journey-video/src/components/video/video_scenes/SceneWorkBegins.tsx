import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { StarField, Silhouette, FloatingParticles, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: WORK BEGINS — Deep night, code streams, time races ────────
export function SceneWorkBegins() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 6500),
      setTimeout(() => setPhase(3), 11000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Midnight indigo */}
      <div className="absolute inset-0"
        style={{ background:'linear-gradient(160deg,#020812 0%,#050e28 45%,#03091e 100%)' }} />

      <StarField count={80} />

      {/* Laptop screen glow */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{ bottom:'28%', left:'46%' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ delay:0.5, duration:1.2 }}>
        <div style={{ width:'clamp(70px,11vw,130px)', height:'clamp(50px,8vh,90px)',
          background:'linear-gradient(to bottom,rgba(40,100,255,0.60),rgba(20,60,200,0.22))',
          borderRadius:'4px 4px 0 0',
          boxShadow:'0 0 30px rgba(50,110,255,0.45), 0 0 60px rgba(50,110,255,0.18)' }} />
      </motion.div>

      {/* Desk */}
      <motion.div className="absolute pointer-events-none z-[7]"
        style={{ bottom:'25.5%', left:'32%', width:'36%', height:'5px', background:'#040a1a', borderRadius:'2px' }}
        animate={{ scaleX: phase >= 1 ? 1 : 0 }} transition={{ duration:0.4 }} />

      <Silhouette x={49} y={65} scale={1.45} fill="#030a18" variant="hunched" show={phase >= 1} delay={0.3} />

      {/* Floating code particles */}
      <FloatingParticles count={28} color="#3a7eff" active={phase >= 2} />
      {/* Amber coffee steam */}
      <FloatingParticles count={8} color="rgba(220,160,50,0.70)" active={phase >= 1} />

      {/* Fast clock */}
      <motion.div className="absolute pointer-events-none z-[8]"
        style={{ top:'12%', right:'9%' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration:0.5 }}>
        <svg width="clamp(52px,8vw,88px)" height="clamp(52px,8vw,88px)" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="27" fill="none" stroke="rgba(60,120,255,0.28)" strokeWidth="1.8"/>
          <motion.line x1="30" y1="30" x2="30" y2="8" stroke="rgba(60,120,255,0.80)" strokeWidth="2.2" strokeLinecap="round"
            style={{ transformOrigin:'30px 30px' }}
            animate={{ rotate: phase >= 2 ? 7200 : 0 }}
            transition={{ duration:5, ease:'linear', repeat: phase >= 2 ? Infinity : 0 }} />
          <motion.line x1="30" y1="30" x2="30" y2="13" stroke="rgba(60,120,255,0.50)" strokeWidth="1.4" strokeLinecap="round"
            style={{ transformOrigin:'30px 30px' }}
            animate={{ rotate: phase >= 2 ? 600 : 0 }}
            transition={{ duration:5, ease:'linear', repeat: phase >= 2 ? Infinity : 0 }} />
        </svg>
      </motion.div>

      {/* 3 AM badge */}
      <motion.p className="absolute pointer-events-none z-[10]"
        style={{ top:'13%', left:'9%',
          fontFamily:'monospace', fontSize:'clamp(0.55rem,1.0vw,0.85rem)',
          color:'rgba(60,120,255,0.55)', letterSpacing:'0.22em', textTransform:'uppercase' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ delay:0.8, duration:0.8 }}>
        03:00 AM
      </motion.p>

      <AnimeText lines={['The work had begun.','Lines of code. Nights without sleep.']}
        show={phase >= 3} accent="#3a7eff" bottom="14%" />

      <Vignette strength={0.72} />
      <BottomGrad color="2,6,16" />
    </motion.div>
  );
}
