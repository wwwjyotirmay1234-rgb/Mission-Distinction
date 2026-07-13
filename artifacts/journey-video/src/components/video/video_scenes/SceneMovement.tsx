import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, NodeMap, FloatingParticles, SpeedLines, CinematicCamera
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE MOVEMENT   (30 500 ms)
//  It spread beyond Odisha. Medical students across India.
// ════════════════════════════════════════════════════════════════════════

// Stylised India map outline — key state shapes
function IndiaMap({ phase }: { phase: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[5]">
      <svg viewBox="0 0 700 800" width="55%" height="85%"
        style={{ position: 'absolute', left: '22%', top: '8%', opacity: 0.22 }}>
        <defs>
          <filter id="mapGlow"><feGaussianBlur stdDeviation="2"/></filter>
        </defs>
        {/* Approximate India border silhouette */}
        <path d="
          M340,20 L380,22 L420,35 L450,55 L475,80 L485,110 L490,140
          L500,165 L510,190 L520,220 L525,255 L520,285 L510,310
          L495,335 L480,355 L460,370 L450,395 L440,420 L445,450
          L440,480 L430,510 L410,535 L395,555 L375,570 L355,580
          L340,590 L325,580 L305,570 L285,555 L265,535 L255,510
          L248,480 L250,450 L255,420 L245,395 L235,370 L215,355
          L200,335 L185,310 L175,285 L170,255 L175,220 L185,190
          L195,165 L205,140 L210,110 L220,80 L245,55 L275,35
          L310,22 L340,20 Z
        " fill="none" stroke="rgba(200,163,64,0.60)" strokeWidth="2"
          style={{ filter: 'url(#mapGlow)' }} />
        {/* State boundary hints */}
        <line x1="340" y1="20" x2="340" y2="590" stroke="rgba(200,163,64,0.10)" strokeWidth="1" strokeDasharray="4,6"/>
        {/* North-east indent */}
        <path d="M480,140 L520,120 L540,145 L530,165 L510,165"
          fill="none" stroke="rgba(200,163,64,0.30)" strokeWidth="1.5"/>
        {/* Sri Lanka island */}
        <ellipse cx="378" cy="628" rx="18" ry="25" fill="none"
          stroke="rgba(200,163,64,0.35)" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

// City label pins appearing across map
const CITY_PINS = [
  { x: '42%', y: '32%', name: 'Delhi',        delay: 0.0 },
  { x: '36%', y: '52%', name: 'Mumbai',       delay: 0.4 },
  { x: '56%', y: '44%', name: 'Bhubaneswar', delay: 0.2 },
  { x: '54%', y: '36%', name: 'Kolkata',      delay: 0.6 },
  { x: '48%', y: '62%', name: 'Hyderabad',    delay: 0.8 },
  { x: '46%', y: '72%', name: 'Chennai',      delay: 1.0 },
  { x: '38%', y: '38%', name: 'Jaipur',       delay: 1.2 },
  { x: '60%', y: '28%', name: 'Guwahati',     delay: 1.4 },
];

function CityPins({ show, count }: { show: boolean; count: number }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none z-[13]">
          {CITY_PINS.slice(0, count).map((p, i) => (
            <motion.div key={i} className="absolute"
              style={{ left: p.x, top: p.y, transform: 'translate(-50%,-50%)' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: p.delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              {/* Pin */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ width: 'clamp(8px,1.2vw,14px)', height: 'clamp(8px,1.2vw,14px)',
                  borderRadius: '50%', background: '#C8A340',
                  boxShadow: '0 0 14px rgba(200,163,64,0.80)',
                  border: '2px solid rgba(255,230,140,0.65)' }} />
                {/* Pulse ring */}
                <motion.div style={{ position: 'absolute', inset: -6, borderRadius: '50%',
                  border: '1.5px solid rgba(200,163,64,0.50)' }}
                  animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                  transition={{ duration: 2.0, repeat: Infinity, ease: 'easeOut' }} />
                {/* Label */}
                <p style={{ position: 'absolute', left: 'calc(100% + 6px)', top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 'clamp(0.38rem,0.65vw,0.52rem)', whiteSpace: 'nowrap',
                  fontFamily: 'monospace', letterSpacing: '0.14em',
                  color: 'rgba(200,180,120,0.75)',
                  textShadow: '0 1px 8px rgba(0,0,0,0.95)' }}>
                  {p.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export function SceneMovement() {
  const [phase, setPhase] = useState(0);
  const [nodeCount, setNodeCount] = useState(1);
  const [pinCount, setPinCount] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase(1), 2500));
    ts.push(setTimeout(() => setPhase(2), 7000));
    ts.push(setTimeout(() => setPhase(3), 14000));
    ts.push(setTimeout(() => setPhase(4), 22000));
    // Nodes grow
    let n = 1;
    const nodeGrow = setInterval(() => {
      n = Math.min(n + 1, 12);
      setNodeCount(n);
      if (n >= 12) clearInterval(nodeGrow);
    }, 700);
    ts.push(nodeGrow as unknown as ReturnType<typeof setTimeout>);
    // Pins appear
    ts.push(setTimeout(() => {
      let p = 0;
      const pinGrow = setInterval(() => {
        p = Math.min(p + 1, CITY_PINS.length);
        setPinCount(p);
        if (p >= CITY_PINS.length) clearInterval(pinGrow);
      }, 900);
    }, 7000));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* CINEMATIC CAMERA — slow pan revealing the spreading map */}
      <CinematicCamera zoom={[1.0, 1.05]} panX={['-1%', '1%']} origin="50% 50%" duration={28}>

      {/* Deep strategic blue — command room feel */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 3
          ? 'linear-gradient(155deg,#030d20 0%,#061828 50%,#030d1c 100%)'
          : 'linear-gradient(155deg,#020810 0%,#040e1c 50%,#020810 100%)' }}
        transition={{ duration: 2.0 }} />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none z-[2]" style={{
        backgroundImage: 'linear-gradient(rgba(60,120,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(60,120,255,0.055) 1px,transparent 1px)',
        backgroundSize: '7% 7%',
      }} />

      {/* India map silhouette */}
      <IndiaMap phase={phase} />

      {/* Node network spreading */}
      <NodeMap show={phase >= 1} phaseCount={nodeCount} />

      {/* City pins with labels */}
      <CityPins show={phase >= 2} count={pinCount} />

      {/* Connection flash lines */}
      {phase >= 2 && (
        <div className="absolute inset-0 pointer-events-none z-[7]">
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
            {CITY_PINS.slice(0, pinCount).map((p, i) => {
              const px = parseFloat(p.x);
              const py = parseFloat(p.y);
              return (
                <motion.line key={i} x1="50" y1="48" x2={px} y2={py}
                  stroke="rgba(200,163,64,0.30)" strokeWidth="0.28"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ delay: p.delay, duration: 0.8, ease: 'easeOut' }} />
              );
            })}
          </svg>
        </div>
      )}

      {/* Ripple rings from center */}
      {phase >= 2 && [0, 1, 2, 3].map(i => (
        <motion.div key={i} className="absolute pointer-events-none z-[6]"
          style={{ top: '48%', left: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%',
            border: '1px solid rgba(200,163,64,0.30)' }}
          initial={{ width: 0, height: 0, opacity: 0.75 }}
          animate={{ width: '85vmin', height: '85vmin', opacity: 0 }}
          transition={{ delay: i * 1.0, duration: 4.0, repeat: Infinity, ease: 'easeOut' }} />
      ))}

      <FloatingParticles count={16} color="rgba(200,163,64,0.85)" active={phase >= 3} />
      <SpeedLines active={phase >= 4} color="rgba(200,163,64,0.60)" count={26} cx={50} cy={48} />

      </CinematicCamera>

      {/* ── OVERLAYS outside camera ── */}
      <ChapterTitle chapter="Chapter VII" title="The Movement" show={phase >= 4} />

      <Vignette strength={0.75} />
      <BottomGrad color="2,5,14" />
      <FilmGrain opacity={0.28} />
      <CinemaBars />
    </motion.div>
  );
}
