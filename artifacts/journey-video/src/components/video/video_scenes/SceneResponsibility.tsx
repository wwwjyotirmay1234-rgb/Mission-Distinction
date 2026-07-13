import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingParticles, Silhouette, SpeedLines, AnimeText, RisingSun, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: THE RESPONSIBILITY — 500 Was Just The Beginning ───────────
export function SceneResponsibility() {
  const [phase, setPhase] = useState(0);
  const [growNum, setGrowNum] = useState(500);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => setPhase(2), 7000),
      setTimeout(() => setPhase(3), 14000),
      setTimeout(() => setPhase(4), 22000),
    ];
    // Counter explosion: 500 → 25,000+
    const milestones = [500,940,1680,2900,5200,9400,15800,22000,25368];
    milestones.forEach((v, i) => {
      ts.push(setTimeout(() => setGrowNum(v), 2200 + i * 380));
    });
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Tech cool blue → warm sunrise */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 3
          ? 'linear-gradient(160deg,#0e0520 0%,#3a0e00 35%,#7a2800 65%,#c06000 85%,#ff9500 100%)'
          : 'linear-gradient(160deg,#020c1e 0%,#040e24 45%,#020c1e 100%)' }}
        transition={{ duration: 3.0 }} />

      {/* Grid */}
      <motion.div className="absolute inset-0 pointer-events-none z-[2]"
        style={{ backgroundImage:'linear-gradient(rgba(60,120,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(60,120,255,0.06) 1px,transparent 1px)',
          backgroundSize:'8% 8%' }}
        animate={{ opacity: phase < 3 ? 1 : 0 }} transition={{ duration: 1.5 }} />

      {/* Growth counter */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div className="absolute pointer-events-none z-[15]"
            style={{ top:'14%', right:'8%', textAlign:'right' }}
            initial={{ opacity:0, y:-12, scale:0.85 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0 }} transition={{ duration:0.7 }}>
            <p style={{ fontSize:'clamp(0.4rem,0.72vw,0.58rem)', letterSpacing:'0.28em',
              color:'rgba(80,200,120,0.60)', fontFamily:'monospace', textTransform:'uppercase' }}>
              Total Students
            </p>
            <motion.p key={growNum}
              initial={{ opacity:0.5, y:4 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.18 }}
              style={{ fontSize:'clamp(2.4rem,7.5vw,6.2rem)', fontFamily:'monospace', fontWeight:900,
                color:'rgba(70,210,120,0.97)', lineHeight:0.90,
                textShadow:'0 0 55px rgba(50,190,100,0.55),0 2px 30px rgba(0,0,0,0.98)' }}>
              {growNum >= 1000 ? `${(growNum/1000).toFixed(1)}K` : growNum}
            </motion.p>
            <p style={{ fontSize:'clamp(0.4rem,0.70vw,0.56rem)', color:'rgba(70,200,110,0.50)',
              fontFamily:'monospace', letterSpacing:'0.18em', marginTop:'2px' }}>▲ GROWING</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification bubbles rising */}
      {phase >= 2 && ['Bhaiya, thank you!','Cleared! 🎉','Doubt solved ✓','Need help with Physio','MBBS 2nd yr here','Got 85 marks!',
        'Amazing platform','Night study mode!'].map((txt, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[12]"
          style={{ left:`${8 + (i % 4) * 23}%`, bottom:'-10%',
            background:'rgba(8,20,44,0.88)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(80,140,255,0.25)',
            borderRadius:'10px 10px 10px 2px',
            padding:'clamp(4px,0.6vw,7px) clamp(8px,1.2vw,14px)' }}
          initial={{ y:0, opacity:0 }}
          animate={{ y:-700, opacity:[0,1,1,0] }}
          transition={{ delay: i * 0.7, duration:6, repeat:Infinity, ease:'easeOut' }}>
          <p style={{ fontSize:'clamp(0.52rem,0.95vw,0.75rem)', color:'rgba(140,180,255,0.85)',
            fontFamily:'monospace', whiteSpace:'nowrap' }}>{txt}</p>
        </motion.div>
      ))}

      {/* 5 founders walking forward */}
      {[-32,-16,0,16,32].map((dx, i) => (
        <Silhouette key={i} x={50+dx} y={68} scale={phase >= 3 ? 1.4 : 1.2} fill="#060210" variant="walking"
          show={phase >= 3} delay={i * 0.10} />
      ))}

      <RisingSun phase={phase >= 3 ? 2 : 0} />
      <FloatingParticles count={22} color="#ff8c00" active={phase >= 3} />
      <FloatingParticles count={12} color="#ffd700" active={phase >= 4} />
      <SpeedLines active={phase >= 4} color="rgba(255,160,30,0.65)" count={30} cx={50} cy={44} />

      {/* Cliffhanger final text */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div className="absolute pointer-events-none z-[22]"
            style={{ bottom:'16%', right:'7%', textAlign:'right' }}
            initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
            transition={{ duration:1.4, ease:[0.16,1,0.3,1] }}>
            {['500 Downloads Was Never','The Destination.'].map((line, i) => (
              <motion.p key={i} initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay: i * 0.50, duration:1.0 }}
                style={{ fontSize:'clamp(0.88rem,1.95vw,1.55rem)',
                  fontFamily:'var(--font-display,serif)', fontWeight:300, fontStyle:'italic',
                  color:'rgba(235,215,165,0.90)', lineHeight:1.5,
                  textShadow:'0 2px 32px rgba(0,0,0,0.98)' }}>
                {line}
              </motion.p>
            ))}
            <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }}
              transition={{ delay:1.1, duration:0.8 }}
              style={{ height:'1px', background:'linear-gradient(to left,rgba(200,163,64,0.65),transparent)',
                margin:'8px 0', transformOrigin:'right', width:'clamp(70px,16vw,150px)', marginLeft:'auto' }} />
            <motion.p initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:1.5, duration:1.1, ease:[0.16,1,0.3,1] }}
              style={{ fontSize:'clamp(1.3rem,3.2vw,2.6rem)',
                fontFamily:'var(--font-display,serif)', fontWeight:700, fontStyle:'italic',
                color:'#C8A340', lineHeight:1.2,
                textShadow:'0 0 35px rgba(200,163,64,0.45),0 2px 40px rgba(0,0,0,0.98)' }}>
              It Was The Beginning.
            </motion.p>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:2.3, duration:1.0 }}
              style={{ fontSize:'clamp(0.48rem,0.88vw,0.70rem)', fontFamily:'monospace',
                color:'rgba(155,170,215,0.50)', letterSpacing:'0.28em',
                textTransform:'uppercase', marginTop:'8px',
                textShadow:'0 2px 18px rgba(0,0,0,0.95)' }}>
              The story continues.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Vignette strength={0.68} />
      <BottomGrad color="2,6,16" />
    </motion.div>
  );
}
