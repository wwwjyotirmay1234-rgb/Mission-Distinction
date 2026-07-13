import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, StarField, RisingSun, CityLights, FloatingParticles
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE NEXT DREAMER   (30 500 ms)
//  A new student opens the app for the first time. The cycle continues.
// ════════════════════════════════════════════════════════════════════════

// Young student — smaller, looking up at the sky (aspirational)
function YoungStudent({ show, phase }: { show: boolean; phase: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[12]"
          style={{ left: '50%', bottom: '20%', transform: 'translateX(-50%)',
            width: 'clamp(50px,8vw,100px)', height: 'clamp(130px,22vw,265px)' }}
          initial={{ opacity: 0, scale: 0.80, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 100 265" width="100%" height="100%">
            {/* Head — tilted up slightly (looking at stars/horizon) */}
            <ellipse cx="50" cy="38" rx="20" ry="25" fill="rgba(4,3,10,0.92)" />
            <ellipse cx="50" cy="24" rx="20" ry="14" fill="rgba(3,2,7,0.92)" />
            {/* Body */}
            <path d="M32,60 Q42,54 58,60 L62,140 Q50,150 38,140 Z"
              fill="rgba(4,3,10,0.92)" />
            {/* Left arm — slightly raised (holding phone up) */}
            <path d="M36,72 Q22,90 18,118" stroke="rgba(4,3,10,0.90)" strokeWidth="14"
              fill="none" strokeLinecap="round"/>
            {/* Right arm — phone in hand, raised toward horizon */}
            <path d="M64,72 Q80,85 88,100"
              stroke="rgba(4,3,10,0.90)" strokeWidth="14" fill="none" strokeLinecap="round"/>
            {/* Phone in hand */}
            <rect x="80" y="96" width="22" height="36" rx="4"
              fill="rgba(14,12,22,0.90)"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.70))' }} />
            {/* Screen glow — MD app open */}
            <rect x="82" y="99" width="18" height="30" rx="3"
              fill="rgba(8,10,22,0.96)"
              style={{ filter: phase >= 3 ? 'drop-shadow(0 0 6px rgba(200,163,64,0.65))' : 'none' }} />
            {phase >= 3 && (
              <>
                <rect x="84" y="102" width="14" height="14" rx="3"
                  fill="rgba(200,163,64,0.90)" />
                <text x="91" y="112" textAnchor="middle" fontSize="7" fontWeight="900"
                  fill="rgba(6,4,2,0.95)" fontFamily="serif">MD</text>
                <rect x="84" y="120" width="14" height="2" rx="1"
                  fill="rgba(200,163,64,0.45)" />
                <rect x="84" y="124" width="10" height="2" rx="1"
                  fill="rgba(200,163,64,0.35)" />
              </>
            )}
            {/* Legs */}
            <path d="M40,140 L36,265" stroke="rgba(4,3,10,0.90)" strokeWidth="12" strokeLinecap="round"/>
            <path d="M60,140 L64,265" stroke="rgba(4,3,10,0.90)" strokeWidth="12" strokeLinecap="round"/>
            {/* Dawn rim light */}
            {phase >= 3 && (
              <path d="M32,60 Q22,90 22,200 L36,265"
                fill="rgba(255,120,30,0.20)"
                style={{ filter: 'blur(2px)' }} />
            )}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Older founder — larger, standing beside the young student passing torch
function FounderMentor({ show, phase }: { show: boolean; phase: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[11]"
          style={{ left: '30%', bottom: '20%', transform: 'translateX(-50%)',
            width: 'clamp(55px,9vw,110px)', height: 'clamp(150px,25vw,305px)' }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 110 305" width="100%" height="100%">
            {/* Head */}
            <ellipse cx="55" cy="42" rx="22" ry="27" fill="rgba(4,3,10,0.92)" />
            <ellipse cx="55" cy="26" rx="22" ry="15" fill="rgba(3,2,7,0.92)" />
            {/* Body */}
            <path d="M34,66 Q44,59 66,66 L70,155 Q55,165 40,155 Z"
              fill="rgba(4,3,10,0.92)" />
            {/* Right arm reaching toward young student — passing torch */}
            <path d="M66,80 Q84,100 96,118"
              stroke="rgba(4,3,10,0.90)" strokeWidth="15" fill="none" strokeLinecap="round"/>
            {/* Left arm at side */}
            <path d="M36,80 Q22,108 16,135" stroke="rgba(4,3,10,0.90)" strokeWidth="15"
              fill="none" strokeLinecap="round"/>
            {/* Torch / glowing element in hand */}
            {phase >= 2 && (
              <motion.g animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <circle cx="99" cy="120" r="10"
                  fill="rgba(255,160,30,0.90)"
                  style={{ filter: 'drop-shadow(0 0 14px rgba(255,140,0,0.85))' }} />
                <circle cx="99" cy="120" r="6" fill="rgba(255,230,100,0.95)" />
              </motion.g>
            )}
            {/* Legs */}
            <path d="M44,155 L40,305" stroke="rgba(4,3,10,0.90)" strokeWidth="12" strokeLinecap="round"/>
            <path d="M66,155 L70,305" stroke="rgba(4,3,10,0.90)" strokeWidth="12" strokeLinecap="round"/>
            {/* White coat lining */}
            {phase >= 2 && (
              <path d="M38,80 Q30,110 28,180 L40,305"
                fill="rgba(160,175,220,0.18)"
                style={{ filter: 'blur(2px)' }} />
            )}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// City skyline silhouette on horizon
function CitySkyline({ show }: { show: boolean }) {
  const buildings = [
    { x: 30, w: 40, h: 120 }, { x: 75, w: 28, h: 90 }, { x: 108, w: 55, h: 150 },
    { x: 168, w: 32, h: 100 }, { x: 205, w: 20, h: 70 }, { x: 230, w: 45, h: 130 },
    { x: 280, w: 35, h: 80 }, { x: 320, w: 60, h: 160 }, { x: 385, w: 25, h: 90 },
    { x: 415, w: 50, h: 140 }, { x: 470, w: 30, h: 100 }, { x: 505, w: 45, h: 125 },
    { x: 555, w: 20, h: 70 }, { x: 580, w: 55, h: 145 }, { x: 640, w: 35, h: 95 },
    { x: 680, w: 50, h: 130 }, { x: 735, w: 28, h: 85 }, { x: 768, w: 42, h: 110 },
    { x: 815, w: 30, h: 75 }, { x: 850, w: 60, h: 155 }, { x: 915, w: 25, h: 80 },
    { x: 945, w: 45, h: 120 },
  ];
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[5]"
          style={{ bottom: '18%', left: 0, right: 0, height: '25%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
          <svg viewBox="0 0 1000 200" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
            {buildings.map((b, i) => (
              <motion.rect key={i} x={b.x} y={200 - b.h} width={b.w} height={b.h}
                fill="rgba(4,3,12,0.90)"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                style={{ transformOrigin: `${b.x + b.w / 2}px 200px` }}
                transition={{ delay: i * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
            ))}
            {/* Random lit windows */}
            {buildings.map((b, bi) =>
              Array.from({ length: Math.floor(b.h / 20) }, (_, wi) => (
                Math.random() > 0.55 ? (
                  <motion.rect key={`${bi}-${wi}`}
                    x={b.x + 6} y={200 - b.h + 8 + wi * 18} width={b.w > 35 ? 8 : 5} height={5} rx="1"
                    fill="rgba(255,200,80,0.30)"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ delay: Math.random() * 5, duration: 2 + Math.random() * 3, repeat: Infinity }} />
                ) : null
              ))
            )}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SceneNextDreamer() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 8000),
      setTimeout(() => setPhase(3), 14000),
      setTimeout(() => setPhase(4), 22000),
      setTimeout(() => setPhase(5), 27000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const sunPhase = (phase >= 4 ? 2 : phase >= 3 ? 1 : 0) as 0 | 1 | 2 | 3;

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Night to pre-dawn */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#080218 0%,#280a00 35%,#6a2800 62%,#c06000 82%,#ff9500 100%)'
          : 'linear-gradient(180deg,#020110 0%,#040218 50%,#02010c 100%)' }}
        transition={{ duration: 3.2 }} />

      <StarField count={100} show={phase < 4} />
      <CityLights count={70} opacity={0.50} color="#ff9040" />
      <CitySkyline show={phase >= 1} />
      <RisingSun phase={sunPhase} />

      {/* Horizon glow */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{ bottom: '18%', left: 0, right: 0, height: '3px',
          background: 'linear-gradient(to right,transparent 5%,rgba(255,100,20,0.75) 50%,transparent 95%)' }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }} transition={{ duration: 2.5 }} />

      {/* Mentor founder */}
      <FounderMentor show={phase >= 2} phase={phase} />

      {/* Young dreamer */}
      <YoungStudent show={phase >= 1} phase={phase} />

      {/* Torch glow connecting them */}
      {phase >= 2 && (
        <motion.div className="absolute pointer-events-none z-[10]"
          style={{ left: '40%', bottom: '40%', width: '18%', height: '8%',
            background: 'linear-gradient(to right,rgba(255,140,0,0.40),rgba(255,180,40,0.20),transparent)',
            filter: 'blur(8px)', borderRadius: '50%' }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      )}

      <FloatingParticles count={18} color="#ff9000" active={phase >= 3} />
      <FloatingParticles count={10} color="#ffd700" active={phase >= 4} />

      <ChapterTitle chapter="Chapter X" title="The Next Dreamer" show={phase >= 5} />

      <Vignette strength={0.78} />
      <BottomGrad color="2,1,8" />
      <FilmGrain opacity={0.30} />
      <CinemaBars />
    </motion.div>
  );
}
