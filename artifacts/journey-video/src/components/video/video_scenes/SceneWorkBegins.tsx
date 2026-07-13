import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, VolumetricLight, DustMotes, StarField, Bokeh
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: WORK BEGINS   (15 000 ms)
//  Five screens. Five laptops. Months of nights.
// ════════════════════════════════════════════════════════════════════════

// Animated clock — spinning fast (time-lapse)
function FastClock({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'absolute', top: '14%', right: '8%',
      width: 'clamp(52px,8vw,88px)', aspectRatio: '1', zIndex: 12 }}>
      <svg viewBox="0 0 60 60" width="100%" height="100%">
        <circle cx="30" cy="30" r="27" fill="rgba(12,14,26,0.85)"
          stroke="rgba(60,100,220,0.35)" strokeWidth="1.6"/>
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(h => {
          const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
          return <circle key={h} cx={30 + 22*Math.cos(a)} cy={30 + 22*Math.sin(a)}
            r={h % 3 === 0 ? 1.4 : 0.7} fill="rgba(80,130,255,0.45)" />;
        })}
        <motion.line x1="30" y1="30" x2="30" y2="10" stroke="rgba(100,160,255,0.85)"
          strokeWidth="2.2" strokeLinecap="round"
          style={{ transformOrigin: '30px 30px' }}
          animate={{ rotate: active ? 7200 : 0 }}
          transition={{ duration: 4, ease: 'linear', repeat: active ? Infinity : 0 }} />
        <motion.line x1="30" y1="30" x2="30" y2="14" stroke="rgba(80,130,255,0.55)"
          strokeWidth="1.3" strokeLinecap="round"
          style={{ transformOrigin: '30px 30px' }}
          animate={{ rotate: active ? 600 : 0 }}
          transition={{ duration: 4, ease: 'linear', repeat: active ? Infinity : 0 }} />
        <circle cx="30" cy="30" r="2" fill="rgba(80,130,255,0.80)" />
      </svg>
    </div>
  );
}

// Multiple developer workstations — 3 desks visible
function MultiDesk({ phase }: { phase: number }) {
  const screens = [
    { x: 160, col1: 'rgba(100,200,120,0.65)', col2: 'rgba(60,130,200,0.60)', col3: 'rgba(220,120,80,0.55)' },
    { x: 450, col1: 'rgba(80,160,255,0.70)', col2: 'rgba(200,160,60,0.60)', col3: 'rgba(100,200,120,0.55)' },
    { x: 740, col1: 'rgba(220,80,120,0.60)', col2: 'rgba(80,160,255,0.65)', col3: 'rgba(200,160,60,0.55)' },
  ];
  return (
    <div className="absolute pointer-events-none z-[9]"
      style={{ left: '4%', right: '4%', bottom: '20%', height: '48%' }}>
      <svg viewBox="0 0 940 260" width="100%" height="100%">
        <defs>
          <linearGradient id="dkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(28,20,12,0.95)" />
            <stop offset="100%" stopColor="rgba(18,12,8,0.98)" />
          </linearGradient>
        </defs>
        {/* Continuous desk surface */}
        <polygon points="0,260 940,260 900,110 40,110" fill="url(#dkGrad)" />
        <line x1="0" y1="260" x2="940" y2="260" stroke="rgba(60,42,18,0.60)" strokeWidth="2.5"/>
        <line x1="40" y1="110" x2="900" y2="110" stroke="rgba(60,42,18,0.30)" strokeWidth="1"/>
        {/* Energy drink cans */}
        {[280, 570, 860].map((x, i) => (
          <g key={i}>
            <rect x={x - 12} y={95} width={24} height={38} rx="4"
              fill={i === 0 ? 'rgba(40,180,60,0.80)' : i === 1 ? 'rgba(80,40,180,0.80)' : 'rgba(200,40,40,0.80)'}
              style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.60))' }} />
            <ellipse cx={x} cy={95} rx={12} ry={4} fill="rgba(60,55,50,0.90)" />
          </g>
        ))}
        {/* Three laptops */}
        {screens.map((s, i) => (
          <motion.g key={i}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: i * 0.18, duration: 0.7 }}>
            {/* Laptop base */}
            <polygon points={`${s.x - 80},165 ${s.x + 80},165 ${s.x + 65},125 ${s.x - 65},125`}
              fill="rgba(24,26,34,0.92)" />
            {/* Screen */}
            <polygon points={`${s.x - 65},125 ${s.x + 65},125 ${s.x + 52},60 ${s.x - 52},60`}
              fill="rgba(14,16,26,0.96)" />
            {/* Screen content */}
            <polygon points={`${s.x - 58},121 ${s.x + 58},121 ${s.x + 46},64 ${s.x - 46},64`}
              fill="rgba(8,10,22,0.98)" />
            {/* Code lines */}
            {phase >= 1 && [0,1,2,3,4,5].map(li => (
              <motion.rect key={li} x={s.x - 42} y={70 + li * 8} rx="1.5"
                width={[55, 40, 62, 35, 48, 30][li]} height={3}
                fill={[s.col1, s.col2, s.col3, s.col1, s.col2, s.col3][li]}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.15 + li * 0.07, duration: 0.35, ease: 'easeOut' }} />
            ))}
            {/* Screen glow on keyboard */}
            <ellipse cx={s.x} cy={128} rx={55} ry={6}
              fill={`rgba(40,80,200,0.14)`} style={{ filter: 'blur(4px)' }} />
          </motion.g>
        ))}
        {/* Post-it notes */}
        {[[330, 105], [620, 108], [820, 105]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={36} height={30} rx="1"
            fill={['rgba(255,230,80,0.55)', 'rgba(80,200,120,0.45)', 'rgba(255,150,80,0.45)'][i]} />
        ))}
      </svg>
    </div>
  );
}

export function SceneWorkBegins() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => setPhase(2), 6000),
      setTimeout(() => setPhase(3), 11000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Midnight blue — lab / shared office */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg,#010814 0%,#030f24 50%,#01080e 100%)'
      }} />

      <StarField count={50} show={true} />
      <Bokeh count={8} active={phase >= 1} />

      {/* Room ceiling with overhead light */}
      <VolumetricLight x={50} y={0} angle={50} length={60}
        color="rgba(40,80,200,0.14)" show={phase >= 1} />

      {/* Multi-desk setup */}
      <MultiDesk phase={phase} />

      {/* Student silhouettes at screens — 3 hunched figures */}
      {[20, 50, 80].map((x, i) => (
        <AnimatePresence key={i}>
          {phase >= 1 && (
            <motion.div className="absolute pointer-events-none z-[11]"
              style={{ left: `${x - 8}%`, bottom: '30%', width: '16%', height: '36%' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.8 }}>
              <svg viewBox="0 0 140 220" width="100%" height="100%">
                {/* Head */}
                <ellipse cx="70" cy="48" rx="25" ry="30" fill="rgba(6,5,14,0.90)" />
                <ellipse cx="70" cy="30" rx="25" ry="18" fill="rgba(4,3,10,0.90)" />
                {/* Body */}
                <path d="M44,72 Q54,65 86,72 L90,130 Q70,140 50,130 Z" fill="rgba(6,5,14,0.90)" />
                {/* Arms forward */}
                <path d="M48,90 Q36,130 30,155" stroke="rgba(6,5,14,0.90)" strokeWidth="20"
                  fill="none" strokeLinecap="round"/>
                <path d="M92,90 Q104,130 110,155" stroke="rgba(6,5,14,0.90)" strokeWidth="20"
                  fill="none" strokeLinecap="round"/>
                {/* Screen glow on face */}
                <ellipse cx="70" cy="70" rx="30" ry="25" fill="rgba(40,80,200,0.15)" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      <DustMotes active={phase >= 2} cx={50} width={60} />
      <FastClock active={phase >= 2} />

      {/* Timestamp cycle */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.p className="absolute pointer-events-none z-[15]"
            style={{ top: '14%', left: '8%',
              fontFamily: 'monospace', fontSize: 'clamp(0.50rem,0.90vw,0.72rem)',
              color: 'rgba(80,130,255,0.50)', letterSpacing: '0.24em', textTransform: 'uppercase' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Months passed. Sleep didn't matter.
          </motion.p>
        )}
      </AnimatePresence>

      <ChapterTitle chapter="Chapter III" title="The Work Begins" show={phase >= 3} />

      <Vignette strength={0.80} />
      <BottomGrad color="1,4,14" />
      <FilmGrain opacity={0.32} />
      <CinemaBars />
    </motion.div>
  );
}
