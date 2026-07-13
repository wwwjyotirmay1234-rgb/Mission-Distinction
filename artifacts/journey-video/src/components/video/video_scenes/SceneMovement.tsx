import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { NodeMap, Silhouette, SpeedLines, AnimeText, Vignette, BottomGrad } from '../../../anime/index';

// ── SCENE: THE MOVEMENT — A network of students ───────────────────────
const NODE_POSITIONS = [
  {x:50,y:48},{x:28,y:32},{x:70,y:30},{x:35,y:62},
  {x:65,y:68},{x:18,y:50},{x:80,y:52},{x:50,y:22},
  {x:42,y:75},{x:72,y:18},{x:22,y:70},{x:58,y:82},
];

export function SceneMovement() {
  const [phase, setPhase] = useState(0);
  const [nodeCount, setNodeCount] = useState(1);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 7000),
      setTimeout(() => setPhase(3), 14000),
      setTimeout(() => setPhase(4), 22000),
    ];
    // Grow node count gradually
    let n = 1;
    const grow = setInterval(() => {
      n = Math.min(n + 1, NODE_POSITIONS.length);
      setNodeCount(n);
      if (n >= NODE_POSITIONS.length) clearInterval(grow);
    }, 600);
    ts.push(grow as unknown as ReturnType<typeof setTimeout>);
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Deep night strategic blue */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 3
          ? 'linear-gradient(160deg,#040e20 0%,#081828 50%,#030d1c 100%)'
          : 'linear-gradient(160deg,#020810 0%,#050e1c 50%,#020810 100%)' }}
        transition={{ duration: 2.0 }} />

      {/* Grid lines — faint strategic feel */}
      <div className="absolute inset-0 pointer-events-none z-[2]" style={{
        backgroundImage:'linear-gradient(rgba(60,120,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(60,120,255,0.05) 1px,transparent 1px)',
        backgroundSize:'8% 8%',
      }} />

      <NodeMap show={phase >= 1} phaseCount={nodeCount} />

      {/* Silhouettes at node positions */}
      {NODE_POSITIONS.slice(0, phase >= 3 ? nodeCount : 0).map((n, i) => (
        <Silhouette key={i} x={n.x} y={n.y} scale={0.65} fill="#040c1c" variant="standing"
          show={true} delay={i * 0.15} />
      ))}

      {/* Central glow — origin */}
      <motion.div className="absolute pointer-events-none z-[5]"
        style={{ top:'48%', left:'50%', transform:'translate(-50%,-50%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.0 }}>
        <div style={{ width:'clamp(40px,7vw,80px)', height:'clamp(40px,7vw,80px)',
          background:'radial-gradient(circle,rgba(255,210,60,0.50) 0%,rgba(200,163,64,0.15) 55%,transparent 80%)',
          borderRadius:'50%' }} />
      </motion.div>

      {/* Ripple rings from center */}
      {phase >= 2 && [0,1,2,3].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-[4]"
          style={{ border:'1px solid rgba(200,163,64,0.30)',
            top:'48%', left:'50%', transform:'translate(-50%,-50%)' }}
          initial={{ width:0, height:0, opacity:0.7 }}
          animate={{ width:'80vmin', height:'80vmin', opacity:0 }}
          transition={{ delay: i * 0.9, duration: 3.6, repeat: Infinity, ease:'easeOut' }}
        />
      ))}

      <SpeedLines active={phase >= 4} color="rgba(200,163,64,0.60)" count={26} cx={50} cy={48} />
      <AnimeText lines={['It was no longer just an app.','It was a movement.']}
        show={phase >= 4} accent="#C8A340" bottom="14%" />

      <Vignette strength={0.70} />
      <BottomGrad color="2,6,14" />
    </motion.div>
  );
}
