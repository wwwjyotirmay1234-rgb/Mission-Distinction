import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, FloatingParticles, VolumetricLight
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE LEGACY   (30 000 ms)
//  Every doubt answered. Every exam passed. The ripple.
// ════════════════════════════════════════════════════════════════════════

// Library scene — rows of studying students at long tables
function LibraryScene({ show }: { show: boolean }) {
  const tables = [
    { y: '62%', seats: [20, 35, 50, 65, 80], scale: 1.00 },
    { y: '74%', seats: [14, 28, 42, 56, 70, 84], scale: 0.82 },
    { y: '84%', seats: [18, 30, 44, 58, 72], scale: 0.68 },
  ];
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none z-[7]">
          {tables.map((table, ti) =>
            table.seats.map((x, si) => (
              <motion.div key={`${ti}-${si}`} className="absolute"
                style={{ left: `${x}%`, top: table.y,
                  width: `${8 * table.scale}%`, height: `${26 * table.scale}%`,
                  transform: 'translate(-50%,-50%)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: ti * 0.12 + si * 0.05, duration: 0.65 }}>
                <svg viewBox="0 0 70 220" width="100%" height="100%">
                  {/* Head */}
                  <ellipse cx="35" cy="38" rx="18" ry="22" fill="rgba(6,4,12,0.90)" />
                  <ellipse cx="35" cy="24" rx="18" ry="13" fill="rgba(4,3,8,0.90)" />
                  {/* Hunched body */}
                  <path d="M16,58 Q24,50 46,58 L50,110 Q35,118 20,110 Z"
                    fill="rgba(6,4,12,0.90)" />
                  {/* Arms on desk */}
                  <path d="M20,80 Q10,105 6,128" stroke="rgba(6,4,12,0.88)"
                    strokeWidth="13" fill="none" strokeLinecap="round"/>
                  <path d="M50,80 Q60,105 64,128" stroke="rgba(6,4,12,0.88)"
                    strokeWidth="13" fill="none" strokeLinecap="round"/>
                  {/* Desk edge visible */}
                  <line x1="2" y1="130" x2="68" y2="130" stroke="rgba(40,28,14,0.55)" strokeWidth="3"/>
                  {/* Book on desk */}
                  <rect x="14" y="115" width="42" height="28" rx="2"
                    fill="rgba(30,22,10,0.70)" />
                  {/* Lamp glow on face */}
                  <ellipse cx="35" cy="60" rx="22" ry="18" fill="rgba(200,140,40,0.08)" />
                </svg>
              </motion.div>
            ))
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

// Medical cross — glowing gold, animated */
function MedicalCross({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[15]"
          style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }}
          initial={{ opacity: 0, scale: 0.4, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 80 80" width="clamp(50px,8vw,100px)" height="clamp(50px,8vw,100px)">
            <defs>
              <filter id="crossGlow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            {/* Cross glow layer */}
            <rect x="28" y="4" width="24" height="72" rx="6" fill="rgba(200,163,64,0.25)"
              filter="url(#crossGlow)" />
            <rect x="4" y="28" width="72" height="24" rx="6" fill="rgba(200,163,64,0.25)"
              filter="url(#crossGlow)" />
            {/* Cross solid */}
            <rect x="30" y="6" width="20" height="68" rx="5" fill="rgba(200,163,64,0.92)"
              style={{ filter: 'drop-shadow(0 0 10px rgba(200,163,64,0.75))' }} />
            <rect x="6" y="30" width="68" height="20" rx="5" fill="rgba(200,163,64,0.92)"
              style={{ filter: 'drop-shadow(0 0 10px rgba(200,163,64,0.75))' }} />
          </svg>
          {/* Pulse rings */}
          {[0, 1, 2].map(i => (
            <motion.div key={i} style={{ position: 'absolute', inset: -i * 18 - 10, borderRadius: '50%',
              border: '1.5px solid rgba(200,163,64,0.40)' }}
              animate={{ scale: [1, 2.0], opacity: [0.65, 0] }}
              transition={{ delay: i * 0.75, duration: 2.5, repeat: Infinity, ease: 'easeOut' }} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Testimonial message cards floating up
const TESTIMONIALS = [
  { text: '"I cleared my Biochem because\nof Mission Distinction."', name: '— Priya, 2nd Year', dx: '12%' },
  { text: '"Every doubt. 3AM.\nSomeone always answered."', name: '— Rahul, 3rd Year', dx: '58%' },
  { text: '"Scored 94 in Anatomy.\nThis app changed my life."', name: '— Sneha, 1st Year', dx: '34%' },
];

export function SceneLegacy() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 7000),
      setTimeout(() => setPhase(3), 14000),
      setTimeout(() => setPhase(4), 22000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Warm mahogany library */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(175deg,#0e0600 0%,#1c0e00 40%,#140a00 100%)'
          : 'linear-gradient(175deg,#060402 0%,#0e0802 50%,#060402 100%)' }}
        transition={{ duration: 2.0 }} />

      {/* Ceiling library lights — warm rows */}
      <VolumetricLight x={25} y={0} angle={28} length={55} color="rgba(220,160,60,0.16)" show={phase >= 1} />
      <VolumetricLight x={50} y={0} angle={28} length={55} color="rgba(220,160,60,0.16)" show={phase >= 1} />
      <VolumetricLight x={75} y={0} angle={28} length={55} color="rgba(220,160,60,0.16)" show={phase >= 1} />

      {/* Warm ceiling gradient */}
      <motion.div className="absolute top-0 left-0 right-0 pointer-events-none z-[3]"
        style={{ height: '30%',
          background: 'linear-gradient(to bottom,rgba(180,100,20,0.18) 0%,transparent 100%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.5 }} />

      {/* Library floor — rows of students */}
      <LibraryScene show={phase >= 1} />

      {/* Table surface */}
      <motion.div className="absolute pointer-events-none z-[6]"
        style={{ bottom: '14%', left: 0, right: 0, height: '4px',
          background: 'rgba(40,28,12,0.70)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.0 }} />

      {/* Medical cross */}
      <MedicalCross show={phase >= 2} />

      {/* Testimonial cards float up */}
      {phase >= 3 && TESTIMONIALS.map((t, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[16]"
          style={{ left: t.dx, bottom: '-8%',
            background: 'rgba(12,8,4,0.90)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(200,163,64,0.22)',
            borderRadius: '10px 10px 10px 3px',
            padding: 'clamp(8px,1.2vw,14px) clamp(10px,1.6vw,18px)',
            maxWidth: 'clamp(160px,22vw,210px)' }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '-90vh', opacity: [0, 1, 1, 1, 0] }}
          transition={{ delay: i * 1.8, duration: 9.0, repeat: Infinity, ease: 'easeInOut' }}>
          <p style={{ fontSize: 'clamp(0.55rem,0.95vw,0.76rem)', color: 'rgba(215,200,165,0.88)',
            lineHeight: 1.55, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{t.text}</p>
          <p style={{ fontSize: 'clamp(0.38rem,0.68vw,0.52rem)', color: 'rgba(200,163,64,0.55)',
            letterSpacing: '0.10em', marginTop: '5px', fontFamily: 'monospace' }}>{t.name}</p>
        </motion.div>
      ))}

      <FloatingParticles count={16} color="#C8A340" active={phase >= 2} />

      <ChapterTitle chapter="Chapter VIII" title="The Legacy" show={phase >= 4} />

      <Vignette strength={0.78} />
      <BottomGrad color="10,4,0" />
      <FilmGrain opacity={0.30} />
      <CinemaBars />
    </motion.div>
  );
}
