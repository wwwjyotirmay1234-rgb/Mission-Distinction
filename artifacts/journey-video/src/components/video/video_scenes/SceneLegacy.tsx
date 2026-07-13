import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Silhouette, FloatingParticles, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: THE LEGACY — Every doubt answered ─────────────────────────
export function SceneLegacy() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => setPhase(2), 8000),
      setTimeout(() => setPhase(3), 15000),
      setTimeout(() => setPhase(4), 23000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Warm sunset amber → deep gold */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(170deg,#1a0800 0%,#3a1400 35%,#6a2a00 65%,#1a0800 100%)'
          : 'linear-gradient(170deg,#0c0402 0%,#1a0a04 50%,#0c0402 100%)' }}
        transition={{ duration: 2.2 }} />

      {/* Sunset glow from above */}
      <motion.div className="absolute top-0 left-0 right-0 pointer-events-none z-[3]"
        style={{ height:'50%', background:'linear-gradient(to bottom,rgba(200,80,10,0.22) 0%,transparent 100%)' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration: 1.8 }} />

      {/* Rows of studying students */}
      {[22,36,50,64,78].map((x, i) => (
        <Silhouette key={i} x={x} y={65} scale={1.0} fill="#100600" variant="sitting"
          show={phase >= 1} delay={i * 0.10} />
      ))}
      {[14,28,42,56,70,84].map((x, i) => (
        <Silhouette key={`b-${i}`} x={x} y={75} scale={0.85} fill="#0e0400" variant="hunched"
          show={phase >= 1} delay={0.4 + i * 0.08} />
      ))}

      {/* Medical cross — glowing */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div className="absolute pointer-events-none z-[12]"
            style={{ top:'18%', left:'50%', transform:'translateX(-50%)' }}
            initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.8, ease:[0.16,1,0.3,1] }}>
            <svg width="clamp(55px,9vw,105px)" height="clamp(55px,9vw,105px)" viewBox="0 0 70 70">
              <rect x="28" y="5" width="14" height="60" rx="5" fill="rgba(200,163,64,0.90)"
                style={{ filter:'drop-shadow(0 0 12px rgba(200,163,64,0.75))' }} />
              <rect x="5" y="23" width="60" height="14" rx="5" fill="rgba(200,163,64,0.90)"
                style={{ filter:'drop-shadow(0 0 12px rgba(200,163,64,0.75))' }} />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cross pulse rings */}
      {phase >= 2 && [0,1,2].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-[6]"
          style={{ border:'1.5px solid rgba(200,163,64,0.40)', top:'26%', left:'50%', transform:'translate(-50%,-50%)' }}
          initial={{ width:0, height:0, opacity:0.8 }}
          animate={{ width:'50vmin', height:'50vmin', opacity:0 }}
          transition={{ delay: i * 0.8, duration:2.5, repeat:Infinity, ease:'easeOut' }}
        />
      ))}

      {/* Testimonial bubbles floating up */}
      {phase >= 3 && ['Cleared MBBS!','Doubt solved ✓','Thank you MD','98 marks!','Got through it'].map((txt, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[14]"
          style={{ left:`${15 + i * 18}%`, bottom:'28%',
            background:'rgba(20,10,4,0.82)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(200,163,64,0.28)',
            borderRadius:'12px 12px 12px 3px',
            padding:'clamp(4px,0.6vw,7px) clamp(8px,1.2vw,14px)' }}
          initial={{ y:0, opacity:0 }}
          animate={{ y:-200, opacity:[0,1,1,0] }}
          transition={{ delay: i * 0.4, duration:5, repeat:Infinity, ease:'easeOut' }}>
          <p style={{ fontSize:'clamp(0.55rem,1.0vw,0.80rem)', color:'rgba(220,185,100,0.85)',
            fontFamily:'monospace', whiteSpace:'nowrap' }}>{txt}</p>
        </motion.div>
      ))}

      <FloatingParticles count={20} color="#ff8c00" active={phase >= 3} />

      <AnimeText lines={['Every doubt answered.','Every exam conquered.']}
        show={phase >= 4} accent="#C8A340" bottom="14%" />

      <Vignette strength={0.70} />
      <BottomGrad color="12,4,0" />
    </motion.div>
  );
}
