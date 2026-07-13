import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { StarField, SpeedLines, CityLights, Silhouette, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE 0: COLD OPEN — Night, a dream forming in silence ───────────
export function Scene0() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => setPhase(2), 7500),
      setTimeout(() => setPhase(3), 12000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Deep night gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#02020e 0%,#080825 50%,#0a0620 100%)' }} />

      <StarField count={110} />
      <CityLights count={55} opacity={0.50} />

      {/* Lamp warm glow */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{ bottom: '26%', left: '50%', transform: 'translateX(-50%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.6 }}>
        <div style={{ width: 'clamp(160px,26vw,320px)', height: 'clamp(160px,26vw,320px)',
          background: 'radial-gradient(circle,rgba(255,200,70,0.24) 0%,rgba(255,150,30,0.08) 45%,transparent 72%)',
          borderRadius: '50%' }} />
      </motion.div>

      {/* Desk + student */}
      <motion.div className="absolute pointer-events-none z-[7]"
        style={{ bottom: '25%', left: '34%', width: '32%', height: '5px', background: '#060615', borderRadius: '2px' }}
        animate={{ scaleX: phase >= 1 ? 1 : 0 }} transition={{ delay: 0.1, duration: 0.5 }}
      />
      <Silhouette x={50} y={66} scale={1.5} fill="#040412" variant="hunched" show={phase >= 1} delay={0.4} />

      {/* Laptop blue glow */}
      <motion.div className="absolute pointer-events-none z-[6]"
        style={{ bottom: '29%', left: '48%' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ delay: 0.6, duration: 0.9 }}>
        <div style={{ width: 'clamp(55px,9vw,100px)', height: 'clamp(38px,6vh,65px)',
          background: 'linear-gradient(to bottom,rgba(55,115,255,0.55),rgba(35,75,200,0.22))',
          borderRadius: '3px 3px 0 0', boxShadow: '0 0 22px rgba(60,120,255,0.38)' }} />
      </motion.div>

      {/* Spinning clock */}
      <motion.div className="absolute pointer-events-none z-[8]"
        style={{ top: '13%', right: '10%' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration: 0.5 }}>
        <svg width="clamp(52px,8vw,88px)" height="clamp(52px,8vw,88px)" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="27" fill="none" stroke="rgba(200,160,55,0.28)" strokeWidth="1.8"/>
          {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => {
            const a = (m/60)*Math.PI*2 - Math.PI/2;
            return <circle key={m} cx={30+22*Math.cos(a)} cy={30+22*Math.sin(a)} r="1" fill="rgba(200,160,55,0.40)"/>;
          })}
          <motion.line x1="30" y1="30" x2="30" y2="9" stroke="rgba(200,160,55,0.80)" strokeWidth="2" strokeLinecap="round"
            style={{ transformOrigin:'30px 30px' }}
            animate={{ rotate: phase >= 2 ? 3600 : 0 }}
            transition={{ duration: 4, ease:'linear', repeat: phase >= 2 ? Infinity : 0 }} />
          <motion.line x1="30" y1="30" x2="30" y2="14" stroke="rgba(200,160,55,0.55)" strokeWidth="1.4" strokeLinecap="round"
            style={{ transformOrigin:'30px 30px' }}
            animate={{ rotate: phase >= 2 ? 300 : 0 }}
            transition={{ duration: 4, ease:'linear', repeat: phase >= 2 ? Infinity : 0 }} />
        </svg>
      </motion.div>

      {/* Speed burst + title */}
      <SpeedLines active={phase >= 3} color="rgba(200,163,64,0.60)" count={32} cx={50} cy={46} />
      <AnimeText lines={['MISSION DISTINCTION','From a Dream to 500 Downloads']}
        show={phase >= 3} accent="#C8A340" bottom="16%" />

      <Vignette strength={0.70} />
      <BottomGrad />
    </motion.div>
  );
}
