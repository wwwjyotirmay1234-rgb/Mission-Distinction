import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, VolumetricLight, DustMotes, StarField, Bokeh, CinematicCamera
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
  const [phase, setPhase] = useState(1);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(2), 4000),
      setTimeout(() => setPhase(3), 10000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* CINEMATIC CAMERA — slow pan left across the three workstations */}
      <CinematicCamera zoom={[1.03, 1.07]} panX={['1.5%', '-1.5%']} origin="50% 55%" duration={14}>

        {/* Midnight blue — late-night lab */}
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

      {/* Pixar-style developers — 3 focused students at laptops */}
      {[
        { x: 20, skin: '#c8805a', hair: '#1c0f06', shirt: '#1e2f4a', mood: 'focused'     },
        { x: 50, skin: '#7a4a28', hair: '#0e0804', shirt: '#2a1e3a', mood: 'intense'     },
        { x: 80, skin: '#b87040', hair: '#160c04', shirt: '#1a2818', mood: 'determined'  },
      ].map((dev, i) => (
        <AnimatePresence key={i}>
          {phase >= 1 && (
            <motion.div className="absolute pointer-events-none z-[11]"
              style={{ left: `${dev.x - 9}%`, bottom: '31%', width: '18%', height: '38%' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.18, duration: 0.9 }}>
              <svg viewBox="0 0 160 240" width="100%" height="100%">
                {/* Body — hunched forward slightly */}
                <path d="M46,88 Q58,78 102,88 L106,155 Q80,166 54,155 Z" fill={dev.shirt}/>
                {/* Arms reaching forward to keyboard */}
                <path d="M52,110 Q36,148 28,178" stroke={dev.skin} strokeWidth="20" fill="none" strokeLinecap="round"/>
                <path d="M108,110 Q124,148 132,178" stroke={dev.skin} strokeWidth="20" fill="none" strokeLinecap="round"/>
                {/* Hands on keyboard */}
                <ellipse cx="27" cy="184" rx="13" ry="9" fill={dev.skin}/>
                <ellipse cx="133" cy="184" rx="13" ry="9" fill={dev.skin}/>
                {/* Neck */}
                <rect x="73" y="78" width="14" height="14" rx="5" fill={dev.skin}/>
                {/* HEAD (tilted ~8° forward toward screen — focused posture) */}
                <g transform="rotate(8, 80, 64)">
                  {/* Skull */}
                  <ellipse cx="80" cy="58" rx="26" ry="28" fill={dev.skin}/>
                  {/* Jaw */}
                  <path d="M56,68 Q64,84 80,85 Q96,84 104,68" fill={dev.skin}/>
                  {/* Hair */}
                  <ellipse cx="80" cy="38" rx="26" ry="16" fill={dev.hair}/>
                  <path d="M55,46 Q52,58 54,68" stroke={dev.hair} strokeWidth="11" fill="none" strokeLinecap="round"/>
                  <path d="M105,46 Q108,58 106,68" stroke={dev.hair} strokeWidth="11" fill="none" strokeLinecap="round"/>
                  {/* Characteristic hair strand */}
                  <path d="M72,38 Q68,52 66,64" stroke={dev.hair} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
                  {/* BLUE SCREEN GLOW on face — this is the money shot */}
                  <ellipse cx="80" cy="62" rx="34" ry="30" fill="rgba(40,80,220,0.22)"/>
                  {/* LEFT EYE — squinted with focus/concentration */}
                  <ellipse cx="68" cy="58" rx="9" ry="6.5" fill="rgba(228,210,190,0.90)"/>
                  {/* Eyelid (focus squint — lid closed ~40%) */}
                  <path d="M59,55 Q68,51 77,55 Q74,62 62,61 Z" fill={dev.skin}/>
                  {/* Lower lid slightly raised (squint) */}
                  <path d="M59,61 Q68,65 77,61" stroke={dev.skin} strokeWidth="3.5" fill="none"/>
                  {/* Iris */}
                  <ellipse cx="68" cy="59" rx="5" ry="4" fill={dev.mood === 'intense' ? '#1a2a5a' : '#2a1508'}/>
                  <ellipse cx="69" cy="59.5" rx="2.8" ry="2.2" fill="#050a14"/>
                  {/* Screen catchlight (bright blue-white) */}
                  <ellipse cx="70" cy="57.5" rx="2.0" ry="1.4" fill="rgba(140,180,255,0.85)"/>
                  {/* RIGHT EYE */}
                  <ellipse cx="92" cy="58" rx="9" ry="6.5" fill="rgba(228,210,190,0.90)"/>
                  <path d="M83,55 Q92,51 101,55 Q98,62 86,61 Z" fill={dev.skin}/>
                  <path d="M83,61 Q92,65 101,61" stroke={dev.skin} strokeWidth="3.5" fill="none"/>
                  <ellipse cx="92" cy="59" rx="5" ry="4" fill={dev.mood === 'intense' ? '#1a2a5a' : '#2a1508'}/>
                  <ellipse cx="93" cy="59.5" rx="2.8" ry="2.2" fill="#050a14"/>
                  <ellipse cx="94" cy="57.5" rx="2.0" ry="1.4" fill="rgba(140,180,255,0.85)"/>
                  {/* Brow — furrowed in concentration (inner brows lowered) */}
                  <path d="M59,51 Q68,47 77,50" stroke={dev.hair} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M83,50 Q92,47 101,51" stroke={dev.hair} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  {/* Inner brow crease (furrowed) */}
                  <path d="M74,50 Q77,52 80,50 Q83,52 86,50" stroke="rgba(80,40,15,0.45)" strokeWidth="1.4" fill="none"/>
                  {/* Nose */}
                  <path d="M77,70 Q80,76 83,74 Q87,72 89,69" stroke="rgba(155,72,32,0.50)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  {/* Mouth — closed, set in concentration / slight determined press */}
                  <path d="M68,78 Q74,75 80,77 Q86,75 92,78" fill="rgba(150,60,28,0.80)"/>
                  {dev.mood === 'determined' && (
                    <path d="M68,79 Q80,83 92,79" fill="rgba(115,46,20,0.65)"/>
                  )}
                  {/* Undereye circles — tired but focused */}
                  <ellipse cx="68" cy="65" rx="8" ry="3" fill="rgba(30,15,6,0.30)"/>
                  <ellipse cx="92" cy="65" rx="8" ry="3" fill="rgba(30,15,6,0.25)"/>
                </g>
                {/* Subtle energy drink can glow from desk below */}
                <ellipse cx="80" cy="180" rx="55" ry="10" fill="rgba(40,80,200,0.10)"/>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      <DustMotes active={phase >= 2} cx={50} width={60} />
      <FastClock active={phase >= 2} />

      {/* Timestamp */}
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

      </CinematicCamera>

      {/* ── OVERLAYS outside camera ── */}
      <ChapterTitle chapter="Chapter III" title="The Work Begins" show={phase >= 3} />
      <Vignette strength={0.80} />
      <BottomGrad color="1,4,14" />
      <FilmGrain opacity={0.32} />
      <CinemaBars />
    </motion.div>
  );
}
