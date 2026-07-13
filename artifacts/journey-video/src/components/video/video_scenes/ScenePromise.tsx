import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  VolumetricLight, FloatingParticles, SpeedLines, RisingSun, CinematicCamera
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE PROMISE   (31 000 ms)
//  "Every student deserves a chance." Final title card.
// ════════════════════════════════════════════════════════════════════════

// Rooftop with all 5 founders watching full sunrise
function FiveFoundersSunrise({ show, phase }: { show: boolean; phase: number }) {
  const positions = [
    { x: '18%', scale: 0.88, delay: 0.18 },
    { x: '30%', scale: 0.92, delay: 0.10 },
    { x: '50%', scale: 1.00, delay: 0.00 },
    { x: '70%', scale: 0.92, delay: 0.10 },
    { x: '82%', scale: 0.88, delay: 0.18 },
  ];
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute pointer-events-none z-[11]">
          {positions.map((p, i) => {
            const s = p.scale;
            const w = Math.round(80 * s);
            const h = Math.round(220 * s);
            return (
              <motion.div key={i} className="absolute"
                style={{ left: p.x, bottom: '20%', transform: 'translateX(-50%)', width: w, height: h }}
                initial={{ opacity: 0, y: 18, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: p.delay + 0.5, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
                <svg viewBox="0 0 80 220" width="100%" height="100%">
                  {/* Head */}
                  <ellipse cx="40" cy="30" rx="18" ry="22" fill="rgba(4,3,10,0.92)" />
                  <ellipse cx="40" cy="18" rx="18" ry="12" fill="rgba(3,2,7,0.92)" />
                  {/* Body */}
                  <path d="M24,50 Q32,44 56,50 L60,130 Q40,140 20,130 Z" fill="rgba(4,3,10,0.92)" />
                  {/* Arms at side — shoulders back (proud) */}
                  <path d="M26,62 Q14,88 10,115" stroke="rgba(4,3,10,0.90)"
                    strokeWidth="13" fill="none" strokeLinecap="round"/>
                  <path d="M54,62 Q66,88 70,115" stroke="rgba(4,3,10,0.90)"
                    strokeWidth="13" fill="none" strokeLinecap="round"/>
                  {/* Legs */}
                  <path d="M28,130 L24,220" stroke="rgba(4,3,10,0.90)" strokeWidth="10" strokeLinecap="round"/>
                  <path d="M52,130 L56,220" stroke="rgba(4,3,10,0.90)" strokeWidth="10" strokeLinecap="round"/>
                  {/* Sunrise rim lighting — warm orange on edges */}
                  {phase >= 3 && (
                    <>
                      <path d="M24,50 Q14,75 10,175 L24,220"
                        fill="rgba(255,100,20,0.22)" style={{ filter: 'blur(3px)' }} />
                      <path d="M56,50 Q66,75 70,175 L56,220"
                        fill="rgba(255,130,30,0.18)" style={{ filter: 'blur(3px)' }} />
                    </>
                  )}
                </svg>
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

// Parapet / railing
function ParapetRail({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[9]"
          style={{ bottom: '17%', left: 0, right: 0, height: '6%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
          <svg viewBox="0 0 1000 44" width="100%" height="100%" preserveAspectRatio="none">
            <rect x="0" y="10" width="1000" height="8" fill="rgba(18,12,8,0.95)" />
            {Array.from({ length: 25 }, (_, i) => (
              <rect key={i} x={18 + i * 40} y="2" width="4" height="10" rx="1"
                fill="rgba(24,16,10,0.88)" />
            ))}
            <rect x="0" y="18" width="1000" height="26" fill="rgba(14,10,6,0.98)" />
            <line x1="0" y1="22" x2="1000" y2="22" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ScenePromise() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => setPhase(2), 6000),
      setTimeout(() => setPhase(3), 12000),
      setTimeout(() => setPhase(4), 19000),
      setTimeout(() => setPhase(5), 25500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const sunPhase = (phase >= 4 ? 3 : phase >= 3 ? 2 : phase >= 2 ? 1 : 0) as 0 | 1 | 2 | 3;

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}>

      {/* Epic sunrise sky */}
      {/* CINEMATIC CAMERA — slow push-in as the promise is made */}
      <CinematicCamera zoom={[1.0, 1.08]} origin="50% 48%" duration={28}>

      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#0c0220 0%,#3a0e00 22%,#8a3000 46%,#d06000 68%,#ff9800 84%,#ffc840 100%)'
          : phase >= 2
            ? 'linear-gradient(180deg,#060118 0%,#1a0600 40%,#4a1800 70%,#7a3200 100%)'
            : 'linear-gradient(180deg,#020110 0%,#040218 55%,#020110 100%)' }}
        transition={{ duration: 3.5 }} />

      <RisingSun phase={sunPhase} />

      {/* Sun rays */}
      {phase >= 3 && [40, 46, 50, 54, 60].map((x, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[3]"
          style={{ bottom: '19%', left: `${x}%`, width: '2px', height: '55%',
            background: `linear-gradient(to top,rgba(255,${100 + i * 12},0,0.35),transparent)`,
            transformOrigin: 'bottom center',
            transform: `rotate(${(x - 50) * 3}deg)`,
            filter: 'blur(5px)' }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: i * 0.25, duration: 2.5, ease: 'easeOut' }} />
      ))}

      {/* Light cone from above */}
      <VolumetricLight x={50} y={0} angle={60} length={75}
        color="rgba(255,160,40,0.14)" show={phase >= 3} />

      <ParapetRail show={phase >= 1} />
      <FiveFoundersSunrise show={phase >= 2} phase={phase} />

      <FloatingParticles count={28} color="#ff9500" active={phase >= 3} />
      <FloatingParticles count={16} color="#ffd700" active={phase >= 4} />
      <SpeedLines active={phase >= 5} color="rgba(200,163,64,0.65)" count={32} cx={50} cy={42} />

      {/* FINAL TITLE CARD */}
      <AnimatePresence>
        {phase >= 5 && (
          <motion.div className="absolute pointer-events-none z-[85]"
            style={{ bottom: '18%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
            {/* Chapter label */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              style={{ fontSize: 'clamp(0.40rem,0.72vw,0.58rem)', letterSpacing: '0.32em',
                color: 'rgba(200,163,64,0.55)', fontFamily: 'monospace', textTransform: 'uppercase',
                marginBottom: '6px' }}>
              Chapter XI — The Promise
            </motion.p>
            {/* Divider */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              style={{ height: '1px',
                background: 'linear-gradient(to left,rgba(200,163,64,0.65),transparent)',
                marginBottom: '10px', marginLeft: 'auto',
                width: 'clamp(80px,16vw,150px)', transformOrigin: 'right' }} />
            {['Every student deserves', 'a fighting chance.'].map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.45, duration: 0.90 }}
                style={{ fontSize: 'clamp(0.82rem,1.80vw,1.42rem)',
                  fontFamily: 'Georgia, serif', fontWeight: 300, fontStyle: 'italic',
                  color: 'rgba(235,215,180,0.90)', lineHeight: 1.5,
                  textShadow: '0 2px 28px rgba(0,0,0,1)' }}>
                {line}
              </motion.p>
            ))}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1.4, duration: 0.7 }}
              style={{ height: '1px',
                background: 'linear-gradient(to left,rgba(200,163,64,0.65),transparent)',
                margin: '10px 0', marginLeft: 'auto',
                width: 'clamp(80px,16vw,150px)', transformOrigin: 'right' }} />
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(1.8rem,4.2vw,3.5rem)',
                fontFamily: 'Georgia, serif', fontWeight: 900,
                color: '#C8A340', lineHeight: 1.0,
                letterSpacing: '0.04em',
                textShadow: '0 0 55px rgba(200,163,64,0.50), 0 2px 40px rgba(0,0,0,1)' }}>
              MISSION<br />DISTINCTION.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 1.2 }}
              style={{ fontSize: 'clamp(0.70rem,1.5vw,1.20rem)',
                fontFamily: 'Georgia, serif', fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(210,220,255,0.78)', letterSpacing: '0.08em', marginTop: '5px',
                textShadow: '0 2px 25px rgba(0,0,0,0.98)' }}>
              The Mission Continues.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      </CinematicCamera>

      {/* ── OVERLAYS outside camera ── */}
      <Vignette strength={0.68} />
      <BottomGrad color="6,2,0" />
      <FilmGrain opacity={0.28} />
      <CinemaBars />
    </motion.div>
  );
}
