import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmGrain, CinemaBars, Vignette, BottomGrad, ChapterTitle, Rain, Lightning } from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE FALL   (31 100 ms)
//  Bugs. Burnout. Users leaving. The darkest night.
// ════════════════════════════════════════════════════════════════════════

// Cracked/rejected UI screen on laptop
function ErrorScreen({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[12]"
          style={{ left: '35%', bottom: '28%', width: '30%', height: '22%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}>
          <svg viewBox="0 0 280 140" width="100%" height="100%">
            {/* Screen */}
            <rect x="0" y="0" width="280" height="140" rx="6" fill="rgba(12,8,16,0.95)"
              stroke="rgba(180,40,40,0.30)" strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 14px rgba(180,40,40,0.25))' }} />
            {/* Red error bar at top */}
            <rect x="0" y="0" width="280" height="28" rx="6" fill="rgba(140,20,20,0.70)" />
            <text x="14" y="19" fontSize="11" fill="rgba(255,120,120,0.90)" fontFamily="monospace">✕  Fatal Error — Server Crash</text>
            {/* Error lines */}
            {[
              { y: 46, text: 'Error: Cannot read properties of undefined', col: 'rgba(255,100,100,0.75)' },
              { y: 62, text: '   at Object.<anonymous> (server.js:48)', col: 'rgba(180,140,80,0.60)' },
              { y: 76, text: 'Users: 0 online  ↓ down 94% today', col: 'rgba(100,180,100,0.50)' },
              { y: 90, text: 'Database: CONNECTION REFUSED', col: 'rgba(255,100,100,0.65)' },
              { y: 106, text: '>> Uptime: 0h 0m 0s', col: 'rgba(255,80,80,0.55)' },
            ].map((l, i) => (
              <motion.text key={i} x="10" y={l.y} fontSize="8" fill={l.col} fontFamily="monospace"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}>
                {l.text}
              </motion.text>
            ))}
            {/* Blinking cursor */}
            <motion.rect x="10" y="118" width="5" height="10" fill="rgba(255,80,80,0.70)"
              animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Dejected founder — sitting on floor, back to wall
function DejectedFigure({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[13]"
          style={{ left: '30%', bottom: '18%', width: '16%', height: '42%' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 160 280" width="100%" height="100%">
            {/* Wall behind */}
            <rect x="0" y="0" width="160" height="280" fill="rgba(8,5,14,0.0)" />
            {/* Seated body against wall */}
            {/* Legs stretched out */}
            <path d="M30,200 Q40,250 120,260 Q130,262 135,255 Q140,248 120,248 Q52,238 48,196 Z"
              fill="rgba(6,4,12,0.90)" />
            {/* Torso slumped */}
            <path d="M45,120 Q50,105 80,102 Q110,105 115,120 L118,200 Q80,210 42,200 Z"
              fill="rgba(6,4,12,0.90)" />
            {/* Head dropped — chin on chest */}
            <ellipse cx="80" cy="88" rx="26" ry="30" fill="rgba(6,4,12,0.90)" />
            <ellipse cx="80" cy="70" rx="26" ry="20" fill="rgba(4,3,8,0.90)" />
            {/* Arms hanging */}
            <path d="M50,145 Q28,178 22,220" stroke="rgba(6,4,12,0.90)" strokeWidth="22"
              fill="none" strokeLinecap="round"/>
            <path d="M110,145 Q132,178 138,215" stroke="rgba(6,4,12,0.90)" strokeWidth="22"
              fill="none" strokeLinecap="round"/>
            {/* Phone face down on floor */}
            <rect x="100" y="250" width="40" height="24" rx="4"
              fill="rgba(18,14,26,0.85)" style={{ transform: 'rotate(15deg)', transformOrigin: '120px 262px' }} />
            <rect x="102" y="252" width="36" height="20" rx="3"
              fill="rgba(30,22,40,0.80)" style={{ transform: 'rotate(15deg)', transformOrigin: '120px 262px' }} />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Rain-streaked window at night
function StormWindow({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[5]"
          style={{ right: '8%', top: '16%', width: '20%', height: '45%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.0 }}>
          <svg viewBox="0 0 180 210" width="100%" height="100%">
            {/* Sky behind — deep purple storm */}
            <rect x="5" y="5" width="170" height="200" fill="rgba(6,3,18,0.95)" />
            {/* Storm cloud mass */}
            <ellipse cx="90" cy="40" rx="85" ry="45" fill="rgba(20,12,35,0.92)" />
            <ellipse cx="45" cy="55" rx="50" ry="35" fill="rgba(18,10,30,0.85)" />
            <ellipse cx="135" cy="50" rx="50" ry="38" fill="rgba(22,14,38,0.90)" />
            {/* Window frame */}
            <rect x="0" y="0" width="180" height="210" fill="none"
              stroke="rgba(40,30,16,0.85)" strokeWidth="8"/>
            <line x1="90" y1="0" x2="90" y2="210" stroke="rgba(40,30,16,0.75)" strokeWidth="5"/>
            <line x1="0" y1="100" x2="180" y2="100" stroke="rgba(40,30,16,0.70)" strokeWidth="4"/>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SceneFall() {
  const [phase, setPhase] = useState(0);
  const [lightning, setLightning] = useState(false);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase(1), 2000));
    ts.push(setTimeout(() => setPhase(2), 6000));
    // Lightning flashes
    [5000, 8500, 13500, 19000].forEach(t =>
      ts.push(setTimeout(() => { setLightning(true); setTimeout(() => setLightning(false), 150); }, t))
    );
    ts.push(setTimeout(() => setPhase(3), 12000));
    ts.push(setTimeout(() => setPhase(4), 18000));
    ts.push(setTimeout(() => setPhase(5), 25000));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Deep purple-grey storm */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(175deg,#020104 0%,#05030c 50%,#020104 100%)'
          : 'linear-gradient(175deg,#0a0616 0%,#140a22 40%,#0c0818 100%)' }}
        transition={{ duration: 2.5 }} />

      {/* Storm rain */}
      <Rain intensity={65} show={phase >= 1 && phase < 5} />

      {/* Lightning */}
      <Lightning flash={lightning} />

      {/* Storm window */}
      <StormWindow show={phase >= 1} />

      {/* Error screen */}
      <ErrorScreen show={phase >= 2 && phase < 4} />

      {/* Dejected figure */}
      <DejectedFigure show={phase >= 3} />

      {/* Single lamp glow — the only light */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div className="absolute pointer-events-none z-[6]"
            style={{ bottom: '35%', left: '20%', width: 'clamp(60px,10vw,120px)', height: 'clamp(60px,10vw,120px)',
              background: 'radial-gradient(circle,rgba(200,120,30,0.30) 0%,rgba(180,90,20,0.08) 55%,transparent 80%)',
              filter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2.2 }} />
        )}
      </AnimatePresence>

      <ChapterTitle chapter="Chapter IV" title="The Fall" show={phase >= 5} />

      <Vignette strength={0.85} />
      <BottomGrad color="2,1,6" />
      <FilmGrain opacity={0.35} />
      <CinemaBars />
    </motion.div>
  );
}
