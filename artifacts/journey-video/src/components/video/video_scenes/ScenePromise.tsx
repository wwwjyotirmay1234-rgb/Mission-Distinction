import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingParticles, Silhouette, SpeedLines, AnimeText, RisingSun, CityLights, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: THE PROMISE — MISSION DISTINCTION. The Mission Continues. ──
export function ScenePromise() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 7000),
      setTimeout(() => setPhase(3), 13000),
      setTimeout(() => setPhase(4), 20000),
      setTimeout(() => setPhase(5), 26000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Morning gold → epic sunrise */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#100420 0%,#4a0e00 25%,#a03500 50%,#e06000 72%,#ffa000 88%,#ffd040 100%)'
          : phase >= 2
            ? 'linear-gradient(180deg,#0c0318 0%,#2a0a00 45%,#5a2000 75%,#8a4000 100%)'
            : 'linear-gradient(180deg,#060210 0%,#100808 50%,#060210 100%)' }}
        transition={{ duration: 2.8 }} />

      <CityLights count={65} opacity={0.55} color="#ffaa40" />
      <RisingSun phase={phase >= 4 ? 3 : phase >= 2 ? 1 : 0} />

      {/* Morning sunbeam from window */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{ top:0, left:'62%', width:'clamp(60px,9vw,110px)', height:'85%',
          background:'linear-gradient(to bottom,rgba(255,200,60,0.22) 0%,rgba(255,160,30,0.06) 60%,transparent 100%)',
          clipPath:'polygon(15% 0%,85% 0%,100% 100%,0% 100%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 2.0 }} />

      {/* Lone founder — quiet morning */}
      <Silhouette x={50} y={65} scale={1.55} fill="#060210" variant="standing" show={phase >= 1} />

      {/* Student message bubble */}
      <AnimatePresence>
        {phase >= 2 && phase < 4 && (
          <motion.div className="absolute pointer-events-none z-[14]"
            style={{ top:'16%', left:'7%' }}
            initial={{ opacity:0, x:-18, y:6 }} animate={{ opacity:1, x:0, y:0 }} exit={{ opacity:0 }}
            transition={{ duration:0.9, ease:[0.16,1,0.3,1] }}>
            <div style={{ background:'rgba(14,22,48,0.90)', backdropFilter:'blur(10px)',
              border:'1px solid rgba(100,140,255,0.25)', borderRadius:'12px 12px 12px 3px',
              padding:'clamp(8px,1.2vw,14px) clamp(12px,1.8vw,20px)',
              maxWidth:'clamp(180px,28vw,260px)' }}>
              <p style={{ fontSize:'clamp(0.46rem,0.80vw,0.64rem)', color:'rgba(140,165,255,0.65)',
                letterSpacing:'0.16em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:'6px' }}>
                An MBBS Student
              </p>
              <p style={{ fontSize:'clamp(0.66rem,1.18vw,0.95rem)', color:'rgba(210,220,255,0.88)',
                lineHeight:1.6, fontStyle:'italic' }}>
                "Because of Mission Distinction, I cleared my doubts and scored better.
                You all are doing something truly amazing. ❤️"
              </p>
              <p style={{ fontSize:'clamp(0.40rem,0.68vw,0.52rem)', color:'rgba(110,130,190,0.45)',
                textAlign:'right', marginTop:'5px', fontFamily:'monospace' }}>11:47 PM</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5 founders at sunrise */}
      {[-32,-16,0,16,32].map((dx, i) => (
        <Silhouette key={i} x={50+dx} y={72} scale={1.3} fill="#060210" variant="standing"
          show={phase >= 3} delay={i * 0.12} />
      ))}

      <FloatingParticles count={28} color="#ffaa30" active={phase >= 3} />
      <FloatingParticles count={14} color="#ffd700" active={phase >= 4} />
      <SpeedLines active={phase >= 5} color="rgba(200,163,64,0.65)" count={32} cx={50} cy={42} />

      {/* Final epic text */}
      <AnimatePresence>
        {phase >= 5 && (
          <motion.div className="absolute pointer-events-none z-[22]"
            style={{ bottom:'14%', right:'7%', textAlign:'right' }}
            initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
            transition={{ duration:1.4, ease:[0.16,1,0.3,1] }}>
            {['Every student deserves a chance.','Every dream deserves support.'].map((line, i) => (
              <motion.p key={i} initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay: i * 0.45, duration:1.0 }}
                style={{ fontSize:'clamp(0.88rem,1.9vw,1.52rem)',
                  fontFamily:'var(--font-display,serif)', fontWeight:300, fontStyle:'italic',
                  color:'rgba(235,210,165,0.90)', lineHeight:1.5,
                  textShadow:'0 2px 32px rgba(0,0,0,0.98)' }}>
                {line}
              </motion.p>
            ))}
            <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }}
              transition={{ delay:0.9, duration:0.8 }}
              style={{ height:'1px', background:'linear-gradient(to left,rgba(200,163,64,0.65),transparent)',
                margin:'8px 0', transformOrigin:'right', width:'clamp(70px,16vw,150px)', marginLeft:'auto' }} />
            <motion.p initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:1.3, duration:1.2, ease:[0.16,1,0.3,1] }}
              style={{ fontSize:'clamp(1.6rem,3.8vw,3.0rem)',
                fontFamily:'var(--font-display,serif)', fontWeight:900, letterSpacing:'0.06em',
                color:'#C8A340', lineHeight:1.1,
                textShadow:'0 0 45px rgba(200,163,64,0.48),0 2px 40px rgba(0,0,0,0.98)' }}>
              MISSION DISTINCTION.
            </motion.p>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:2.0, duration:1.1 }}
              style={{ fontSize:'clamp(0.78rem,1.65vw,1.30rem)',
                fontFamily:'var(--font-display,serif)', fontWeight:300, fontStyle:'italic',
                color:'rgba(215,225,255,0.78)', letterSpacing:'0.08em', marginTop:'4px',
                textShadow:'0 2px 28px rgba(0,0,0,0.95)' }}>
              The Mission Continues.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Vignette strength={0.68} />
      <BottomGrad color="6,2,0" />
    </motion.div>
  );
}
