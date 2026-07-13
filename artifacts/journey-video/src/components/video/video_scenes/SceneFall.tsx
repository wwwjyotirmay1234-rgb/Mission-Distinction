import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmGrain, CinemaBars, Vignette, BottomGrad, ChapterTitle, Rain, Lightning, CinematicCamera, RainDepth } from '../../../anime/index';

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

// Dejected founder — Pixar-quality seated figure, head dropped, defeated expression
function DejectedFigure({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[13]"
          style={{ left: '22%', bottom: '16%', width: '22%', height: '52%' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 200 320" width="100%" height="100%">
            {/* === BODY === */}
            {/* Legs stretched left */}
            <path d="M40,220 Q55,278 165,282 Q178,284 180,270 Q181,258 162,262 Q72,255 68,217 Z"
              fill="#12101e"/>
            {/* Torso — dark navy hoodie, slumped */}
            <path d="M55,130 Q62,112 96,109 Q130,112 135,130 L138,218 Q96,228 56,218 Z"
              fill="#171424"/>
            {/* Hoodie pocket seam */}
            <path d="M68,175 Q96,168 124,175" stroke="rgba(50,40,70,0.60)" strokeWidth="1.8" fill="none"/>
            {/* Left arm limp */}
            <path d="M60,158 Q42,200 38,242" stroke="#c8805a" strokeWidth="20" fill="none" strokeLinecap="round"/>
            {/* Right arm limp */}
            <path d="M132,158 Q150,200 155,238" stroke="#c8805a" strokeWidth="20" fill="none" strokeLinecap="round"/>
            {/* Hands on floor */}
            <ellipse cx="37" cy="248" rx="13" ry="10" fill="#c8805a"/>
            <ellipse cx="156" cy="244" rx="13" ry="10" fill="#c8805a"/>
            {/* Phone face-down (dead) */}
            <g transform="rotate(14, 148, 274)">
              <rect x="122" y="260" width="52" height="30" rx="6" fill="#14101c"/>
              <rect x="124" y="262" width="48" height="26" rx="4" fill="#0e0b14"/>
            </g>
            {/* MD enamel pin */}
            <circle cx="118" cy="162" r="5.5" fill="rgba(180,40,40,0.70)" stroke="rgba(220,80,80,0.45)" strokeWidth="0.8"/>
            <text x="118" y="165.5" textAnchor="middle" fontSize="4.5" fontWeight="900" fill="white" fontFamily="serif">MD</text>
            {/* Neck */}
            <rect x="87" y="102" width="18" height="14" rx="5" fill="#c8805a"/>
            {/* === HEAD — tilted 18° forward, chin to chest === */}
            <g transform="rotate(18, 100, 88)">
              {/* Skull */}
              <ellipse cx="100" cy="78" rx="28" ry="30" fill="#c8805a"/>
              {/* Jaw / chin */}
              <path d="M73,90 Q80,110 100,112 Q120,110 127,90" fill="#c8805a"/>
              {/* Hair — dark, messy (been awake all night) */}
              <ellipse cx="100" cy="57" rx="28" ry="18" fill="#1c0f06"/>
              <path d="M73,65 Q70,78 72,88" stroke="#1c0f06" strokeWidth="12" fill="none" strokeLinecap="round"/>
              <path d="M127,65 Q130,78 128,88" stroke="#1c0f06" strokeWidth="12" fill="none" strokeLinecap="round"/>
              {/* Disheveled strands falling over forehead */}
              <path d="M84,57 Q79,72 77,82" stroke="#1c0f06" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M93,55 Q90,67 89,79" stroke="#1c0f06" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <path d="M102,55 Q101,64 100,74" stroke="#1c0f06" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              {/* Deep dark undereye bags — extreme exhaustion */}
              <ellipse cx="87" cy="83" rx="11" ry="5" fill="rgba(30,15,6,0.60)"/>
              <ellipse cx="113" cy="83" rx="10" ry="4.5" fill="rgba(30,15,6,0.50)"/>
              {/* LEFT EYE — barely open, extremely heavy lids */}
              <ellipse cx="87" cy="79" rx="10.5" ry="7" fill="rgba(228,210,190,0.85)"/>
              {/* Upper eyelid crushing down */}
              <path d="M76.5,75 Q87,70 97.5,75 Q94,83 80,83 Z" fill="#c8805a"/>
              {/* Iris — peeking under lid, looking down */}
              <ellipse cx="87" cy="81" rx="5" ry="3.8" fill="#2a1508"/>
              <ellipse cx="88" cy="81.5" rx="2.8" ry="2.2" fill="#0a0502"/>
              {/* Faint catchlight — barely visible, matching the dim room */}
              <ellipse cx="90" cy="79.5" rx="1.3" ry="1.0" fill="rgba(255,255,255,0.40)"/>
              {/* RIGHT EYE */}
              <ellipse cx="113" cy="79" rx="9.5" ry="6.5" fill="rgba(228,210,190,0.80)"/>
              <path d="M103.5,75 Q113,70 122.5,75 Q119,82 106,82 Z" fill="#c8805a"/>
              <ellipse cx="113" cy="80.5" rx="4.5" ry="3.5" fill="#2a1508"/>
              <ellipse cx="114" cy="81" rx="2.5" ry="2.0" fill="#0a0502"/>
              <ellipse cx="116" cy="79" rx="1.1" ry="0.9" fill="rgba(255,255,255,0.35)"/>
              {/* Nose (simple, side angle) */}
              <path d="M96,90 Q100,98 104,96 Q109,94 112,90" stroke="rgba(155,72,32,0.55)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* Mouth — downturned corners: the universal expression of defeat */}
              <path d="M83,104 Q91,101 100,103 Q109,101 117,104" fill="rgba(155,62,28,0.85)"/>
              <path d="M82,105 Q91,111 100,110 Q109,111 118,105" fill="rgba(120,48,22,0.72)"/>
              {/* Corner pulls down */}
              <path d="M82,105 Q80,109 79,112" stroke="rgba(90,35,15,0.75)" strokeWidth="2.0" fill="none" strokeLinecap="round"/>
              <path d="M118,105 Q120,109 121,112" stroke="rgba(90,35,15,0.75)" strokeWidth="2.0" fill="none" strokeLinecap="round"/>
              {/* Stubble — 2-day growth */}
              {[80,86,92,98,104,110,83,89,95,101,107].map((cx, k) => (
                <ellipse key={k} cx={cx} cy={k < 6 ? 108 : 113} rx="0.9" ry="0.7" fill="rgba(50,25,10,0.38)"/>
              ))}
              {/* Error glow — red from the laptop screen */}
              <ellipse cx="100" cy="82" rx="38" ry="32" fill="rgba(180,35,35,0.09)"/>
            </g>
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
  const [phase, setPhase] = useState(2);
  const [lightning, setLightning] = useState(false);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase(3), 3000));
    // Lightning flashes
    [2500, 6000, 11000, 17000].forEach(t =>
      ts.push(setTimeout(() => { setLightning(true); setTimeout(() => setLightning(false), 160); }, t))
    );
    ts.push(setTimeout(() => setPhase(4), 14000));
    ts.push(setTimeout(() => setPhase(5), 22000));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* CINEMATIC CAMERA — slow push down into the fallen figure */}
      <CinematicCamera zoom={[1.0, 1.09]} origin="38% 68%" duration={28}>

        {/* Deep purple-grey storm atmosphere */}
        <motion.div className="absolute inset-0"
          animate={{ background: phase >= 4
            ? 'linear-gradient(175deg,#020104 0%,#05030c 50%,#020104 100%)'
            : 'linear-gradient(175deg,#0a0616 0%,#140a22 40%,#0c0818 100%)' }}
          transition={{ duration: 2.5 }} />

        {/* 3-layer parallax storm rain */}
        <RainDepth show={phase >= 2 && phase < 5} />

        {/* Lightning flash */}
        <Lightning flash={lightning} />

        {/* Storm window */}
        <StormWindow show={phase >= 2} />

        {/* Error screen glow */}
        <ErrorScreen show={phase >= 2 && phase < 4} />

        {/* Dejected figure — visible from phase 2 (immediately) */}
        <DejectedFigure show={phase >= 2} />

        {/* Lamp glow — sole warm light in darkness */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div className="absolute pointer-events-none z-[6]"
              style={{ bottom: '35%', left: '20%', width: 'clamp(70px,12vw,140px)', height: 'clamp(70px,12vw,140px)',
                background: 'radial-gradient(circle,rgba(200,120,30,0.35) 0%,rgba(180,90,20,0.10) 55%,transparent 80%)',
                filter: 'blur(10px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 2.4 }} />
          )}
        </AnimatePresence>

      </CinematicCamera>

      {/* ── OVERLAYS stay outside camera (don't zoom) ── */}
      <ChapterTitle chapter="Chapter IV" title="The Fall" show={phase >= 5} />
      <Vignette strength={0.88} />
      <BottomGrad color="2,1,6" />
      <FilmGrain opacity={0.38} />
      <CinemaBars />
    </motion.div>
  );
}
