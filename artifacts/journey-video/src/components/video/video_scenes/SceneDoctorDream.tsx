import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarField, SpeedLines, FloatingParticles, Silhouette, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: THE DOCTOR DREAM — The dream was real ─────────────────────
export function SceneDoctorDream() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => setPhase(2), 8000),
      setTimeout(() => setPhase(3), 15000),
      setTimeout(() => setPhase(4), 22000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Deep ceremonial blue */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 3
          ? 'linear-gradient(170deg,#040c22 0%,#071a3a 40%,#030d20 100%)'
          : 'linear-gradient(170deg,#020810 0%,#04111e 50%,#020810 100%)' }}
        transition={{ duration: 2.5 }} />

      <StarField count={90} show={phase >= 0} />

      {/* Stage light beams */}
      {phase >= 2 && [-18, 0, 18].map((dx, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[3]"
          style={{ top:0, left:`calc(50% + ${dx}vw)`, width:'clamp(40px,6vw,80px)',
            height:'65%',
            background:'linear-gradient(to bottom,rgba(200,163,64,0.20) 0%,rgba(200,163,64,0.04) 70%,transparent 100%)',
            clipPath:'polygon(20% 0%,80% 0%,100% 100%,0% 100%)',
            transform:'translateX(-50%)' }}
          initial={{ opacity:0, scaleY:0 }} animate={{ opacity:1, scaleY:1 }}
          transition={{ delay: i * 0.2, duration:0.8, ease:'easeOut' }}
        />
      ))}

      {/* Student silhouette */}
      <Silhouette x={50} y={65} scale={1.6} fill="#030a1a" variant="standing" show={phase >= 1} />

      {/* Graduation cap drops onto figure */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div className="absolute pointer-events-none z-[11]"
            style={{ left:'50%', top:'38%', transform:'translateX(-50%)' }}
            initial={{ y:-80, opacity:0, rotate:-20 }}
            animate={{ y:0, opacity:1, rotate:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.9, ease:[0.16,1,0.3,1] }}>
            <svg width="clamp(55px,9vw,105px)" height="clamp(40px,7vw,85px)" viewBox="0 0 90 65">
              {/* Board top */}
              <rect x="5" y="12" width="80" height="12" rx="2" fill="rgba(200,163,64,0.92)"
                style={{ filter:'drop-shadow(0 0 10px rgba(200,163,64,0.65))' }} />
              {/* Cap body */}
              <polygon points="45,0 90,14 45,28 0,14" fill="rgba(180,143,50,0.95)"
                style={{ filter:'drop-shadow(0 0 8px rgba(200,163,64,0.50))' }} />
              {/* Button */}
              <circle cx="45" cy="14" r="4" fill="rgba(220,190,80,0.90)" />
              {/* Tassel */}
              <line x1="80" y1="14" x2="85" y2="42" stroke="rgba(200,163,64,0.75)" strokeWidth="2"/>
              <circle cx="85" cy="44" r="4" fill="rgba(200,163,64,0.75)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doctor coat white overlay */}
      <motion.div className="absolute pointer-events-none z-[9]"
        style={{ bottom:'20%', left:'50%', transform:'translateX(-50%)',
          width:'clamp(50px,8vw,90px)', height:'clamp(100px,16vw,180px)',
          background:'linear-gradient(to bottom,rgba(200,210,255,0.65),rgba(160,180,255,0.25))',
          borderRadius:'8px 8px 14px 14px',
          boxShadow:'0 0 30px rgba(160,180,255,0.40)' }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration:1.8 }}
      />

      {/* Stethoscope arc */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div className="absolute pointer-events-none z-[12]"
            style={{ bottom:'31%', left:'50%', transform:'translateX(-50%)' }}
            initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            transition={{ delay:0.4, duration:0.7 }}>
            <svg width="clamp(40px,6.5vw,75px)" height="clamp(30px,5vw,55px)" viewBox="0 0 60 40">
              <path d="M10,5 Q10,30 30,30 Q50,30 50,5" fill="none"
                stroke="rgba(160,180,255,0.80)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="30" cy="34" r="5" fill="none" stroke="rgba(160,180,255,0.80)" strokeWidth="2.5"/>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingParticles count={24} color="#C8A340" active={phase >= 3} />
      <FloatingParticles count={12} color="rgba(160,180,255,0.80)" active={phase >= 3} />
      <SpeedLines active={phase >= 4} color="rgba(160,180,255,0.60)" count={28} cx={50} cy={45} />

      <AnimeText lines={['The dream was real.', 'One student at a time.']}
        show={phase >= 4} accent="rgba(160,185,255,0.95)" bottom="14%" />

      <Vignette strength={0.72} />
      <BottomGrad color="2,5,18" />
    </motion.div>
  );
}
