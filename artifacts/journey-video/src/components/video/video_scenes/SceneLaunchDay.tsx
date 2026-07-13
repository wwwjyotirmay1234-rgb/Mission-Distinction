import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeedLines, FloatingParticles, Silhouette, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: LAUNCH DAY — 500 Downloads. Day One. ──────────────────────
export function SceneLaunchDay() {
  const [phase, setPhase] = useState(0);
  const [counter, setCounter] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => setPhase(2), 6000),
      setTimeout(() => setPhase(3), 12000),
      setTimeout(() => setPhase(4), 22000),
    ];
    // Counter animation
    let n = 0;
    const tick = setInterval(() => {
      n = Math.min(n + Math.ceil(Math.random() * 18 + 4), 500);
      setCounter(n);
      if (n >= 500) clearInterval(tick);
    }, 55);
    ts.push(tick as unknown as ReturnType<typeof setTimeout>);
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}>

      {/* Electric gold / orange energy */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(145deg,#1a0800 0%,#3a1200 30%,#6a2200 60%,#1a0800 100%)'
          : 'linear-gradient(145deg,#080402 0%,#14080a 50%,#080402 100%)' }}
        transition={{ duration: 1.5 }} />

      {/* Energy pulse rings */}
      {phase >= 2 && [0,1,2].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-[3]"
          style={{ border:`2px solid rgba(255,${140+i*30},0,${0.35-i*0.1})`,
            top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}
          initial={{ width:0, height:0, opacity:0.8 }}
          animate={{ width:'clamp(100px,40vw,500px)', height:'clamp(100px,40vw,500px)', opacity:0 }}
          transition={{ delay: i * 0.5, duration: 2.5, repeat: Infinity, ease:'easeOut' }}
        />
      ))}

      {/* App icon — MD circle */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div className="absolute pointer-events-none z-[10]"
            style={{ top:'28%', left:'50%', transform:'translateX(-50%)' }}
            initial={{ scale:0, rotate:-180, opacity:0 }}
            animate={{ scale:1, rotate:0, opacity:1 }}
            exit={{ scale:0, opacity:0 }}
            transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}>
            <motion.div
              animate={{ rotate: phase >= 3 ? 0 : [0,5,-5,0] }}
              transition={{ duration:0.4, delay:0.3 }}>
              <svg width="clamp(60px,10vw,120px)" height="clamp(60px,10vw,120px)" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="rgba(200,163,64,0.92)"
                  style={{ filter:'drop-shadow(0 0 18px rgba(200,163,64,0.70))' }} />
                <text x="40" y="48" textAnchor="middle" fontSize="26" fontWeight="900"
                  fill="#0a0502" fontFamily="serif">MD</text>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5 founders huddled */}
      {[-30,-15,0,15,30].map((dx, i) => (
        <Silhouette key={i} x={50+dx} y={70} scale={1.1} fill="#100600" variant="standing"
          show={phase >= 1} delay={i*0.10} />
      ))}

      {/* Notification burst particles */}
      <FloatingParticles count={35} color="#ffd700" active={phase >= 3} />
      <FloatingParticles count={18} color="#ff8c00" active={phase >= 3} />

      <SpeedLines active={phase >= 3} color="rgba(200,163,64,0.70)" count={32} cx={50} cy={50} />

      {/* Counter */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div className="absolute pointer-events-none z-[15]"
            style={{ top:'14%', right:'8%', textAlign:'right' }}
            initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
            transition={{ duration:0.6 }}>
            <p style={{ fontSize:'clamp(0.42rem,0.75vw,0.60rem)', letterSpacing:'0.28em',
              color:'rgba(200,163,64,0.62)', fontFamily:'monospace', textTransform:'uppercase' }}>Downloads</p>
            <p style={{ fontSize:'clamp(2.5rem,8vw,6.5rem)', fontFamily:'monospace', fontWeight:900,
              color:'#C8A340', lineHeight:0.9,
              textShadow:'0 0 55px rgba(200,163,64,0.55),0 2px 30px rgba(0,0,0,0.98)' }}>
              {counter.toLocaleString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimeText lines={['500 Downloads.','Day One.']} show={phase >= 4} accent="#C8A340" bottom="14%" />

      <Vignette strength={0.68} />
      <BottomGrad color="10,4,0" />
    </motion.div>
  );
}
