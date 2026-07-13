import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { StarField, Rain, Lightning, Silhouette, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: THE FALL — Every founder hits rock bottom ─────────────────
export function SceneFall() {
  const [phase, setPhase] = useState(0);
  const [lightning, setLightning] = useState(false);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase(1), 2500));
    // Lightning bolts
    [5500, 8200, 12500].forEach(t => {
      ts.push(setTimeout(() => { setLightning(true); setTimeout(() => setLightning(false), 140); }, t));
    });
    ts.push(setTimeout(() => setPhase(2), 6500));
    ts.push(setTimeout(() => setPhase(3), 12000));
    ts.push(setTimeout(() => setPhase(4), 18000));
    ts.push(setTimeout(() => setPhase(5), 25000));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}>

      {/* Storm gradient — shifts from purple-grey to near-black */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#020202 0%,#06040a 100%)'
          : 'linear-gradient(180deg,#0e0c18 0%,#1a0f22 40%,#110c1c 100%)' }}
        transition={{ duration: 2.5 }} />

      <Rain intensity={52} show={phase >= 1 && phase < 4} />
      <Lightning flash={lightning} />

      {/* Cloud mass */}
      <motion.div className="absolute top-0 left-0 right-0 pointer-events-none z-[3]" style={{ height:'35%',
          background:'linear-gradient(to bottom,rgba(30,20,40,0.92) 0%,rgba(20,14,30,0.55) 70%,transparent 100%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.2 }} />

      {/* Standing figure → kneeling figure */}
      <Silhouette x={50} y={62} scale={1.5} fill="#0a0810" variant="standing" show={phase >= 1 && phase < 3} delay={0.2} />
      <Silhouette x={50} y={66} scale={1.5} fill="#0a0810" variant="hunched" show={phase >= 3 && phase < 4} />

      {/* Fallen / on ground */}
      <motion.div className="absolute pointer-events-none z-[8]"
        style={{ bottom:'26%', left:'38%', width:'24%', height:'8px', background:'#080610', borderRadius:'50%' }}
        animate={{ opacity: phase >= 4 ? 1 : 0, scaleX: phase >= 4 ? 1 : 0 }}
        transition={{ duration: 0.8 }} />

      {/* Single lamp in darkness */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{ bottom:'30%', left:'50%', transform:'translateX(-50%)' }}
        animate={{ opacity: phase >= 4 ? 1 : 0 }} transition={{ duration: 2.0 }}>
        <div style={{ width:'clamp(80px,12vw,140px)', height:'clamp(80px,12vw,140px)',
          background:'radial-gradient(circle,rgba(255,160,50,0.30) 0%,rgba(255,100,20,0.08) 50%,transparent 75%)',
          borderRadius:'50%' }} />
      </motion.div>

      <Silhouette x={50} y={64} scale={1.4} fill="#060410" variant="sitting" show={phase >= 4} delay={0.3} />

      {/* Stars slowly appear in calm */}
      <StarField count={40} show={phase >= 4} />

      <AnimeText lines={['Every founder falls.','What matters is the next choice.']}
        show={phase >= 5} accent="#a060ff" bottom="14%" />

      <Vignette strength={0.80} />
      <BottomGrad color="4,2,10" />
    </motion.div>
  );
}
