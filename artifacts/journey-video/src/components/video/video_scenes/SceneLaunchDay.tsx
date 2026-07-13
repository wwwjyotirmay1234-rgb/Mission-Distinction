import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, FloatingParticles, SpeedLines, CinematicCamera
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: LAUNCH DAY   (30 000 ms)
//  Shaking hands. First install notification. 500 by midnight.
// ════════════════════════════════════════════════════════════════════════

// Phone showing the Play Store listing
function PhonePlayStore({ show, phase }: { show: boolean; phase: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[12]"
          style={{ left: '50%', top: '14%', transform: 'translateX(-50%)',
            width: 'clamp(100px,16vw,190px)', height: 'clamp(190px,30vw,360px)' }}
          initial={{ opacity: 0, y: -30, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 200 380" width="100%" height="100%">
            {/* Phone body */}
            <rect x="0" y="0" width="200" height="380" rx="22"
              fill="rgba(18,16,24,0.96)"
              style={{ filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.80))' }} />
            {/* Screen area */}
            <rect x="8" y="18" width="184" height="344" rx="16" fill="rgba(8,10,18,0.98)" />
            {/* Notch */}
            <rect x="72" y="18" width="56" height="14" rx="7" fill="rgba(18,16,24,0.96)" />
            {/* App header bar */}
            <rect x="8" y="18" width="184" height="44" rx="8" fill="rgba(14,8,4,0.95)" />
            <text x="100" y="44" textAnchor="middle" fontSize="13" fontWeight="900"
              fill="rgba(200,163,64,0.90)" fontFamily="serif">Mission Distinction</text>
            {/* App icon large */}
            <rect x="68" y="72" width="64" height="64" rx="14"
              fill="rgba(200,163,64,0.92)"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(200,163,64,0.55))' }} />
            <text x="100" y="112" textAnchor="middle" fontSize="30" fontWeight="900"
              fill="rgba(8,6,4,0.95)" fontFamily="serif">MD</text>
            {/* App name */}
            <text x="100" y="158" textAnchor="middle" fontSize="11" fontWeight="700"
              fill="rgba(230,215,185,0.90)" fontFamily="sans-serif">Mission Distinction</text>
            <text x="100" y="172" textAnchor="middle" fontSize="8"
              fill="rgba(140,130,110,0.70)" fontFamily="sans-serif">MBBS Study Companion</text>
            {/* Install button */}
            <rect x="44" y="184" width="112" height="30" rx="15"
              fill="rgba(200,163,64,0.90)"
              style={{ filter: 'drop-shadow(0 3px 10px rgba(200,163,64,0.45))' }} />
            <text x="100" y="204" textAnchor="middle" fontSize="11" fontWeight="700"
              fill="rgba(8,6,4,0.95)" fontFamily="sans-serif">INSTALL FREE</text>
            {/* Rating */}
            <text x="100" y="228" textAnchor="middle" fontSize="9"
              fill="rgba(200,163,64,0.60)" fontFamily="sans-serif">★★★★★  4.9  •  Medical</text>
            {/* Download notifications arriving */}
            {phase >= 2 && [
              '📲 New installation — Delhi',
              '📲 New installation — Mumbai',
              '📲 New installation — Bhubaneswar',
            ].map((txt, i) => (
              <motion.g key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.55, duration: 0.5 }}>
                <rect x="10" y={252 + i * 28} width="180" height="22" rx="5"
                  fill="rgba(30,22,40,0.85)" />
                <text x="18" y={267 + i * 28} fontSize="7"
                  fill="rgba(140,180,255,0.80)" fontFamily="sans-serif">{txt}</text>
              </motion.g>
            ))}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 5 founders — Pixar faces, phone-screen lit, ELATED expressions
function FoundersWatching({ show, phase }: { show: boolean; phase: number }) {
  // Each founder: position offset, skin tone, hair, shirt color, expression mood
  const founders = [
    { dx: -36, skin: '#c07848', hair: '#1c0d04', shirt: '#2a3a28', mood: 'amazed'   },
    { dx: -18, skin: '#7a4a28', hair: '#0e0804', shirt: '#1e3048', mood: 'grinning' },
    { dx:   0, skin: '#c89060', hair: '#1a0d06', shirt: '#1e2f4a', mood: 'shock'    },
    { dx:  18, skin: '#b06830', hair: '#160c04', shirt: '#2a2818', mood: 'jump'     },
    { dx:  36, skin: '#c07040', hair: '#180b04', shirt: '#342018', mood: 'laugh'    },
  ];
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute pointer-events-none z-[10]"
          style={{ left: 0, right: 0, bottom: '14%', height: '34%' }}>
          {founders.map((f, i) => {
            const isCenter = i === 2;
            const armUp = f.mood === 'jump' || f.mood === 'amazed';
            return (
              <motion.div key={i} className="absolute"
                style={{ left: `calc(50% + ${f.dx}%)`, bottom: 0,
                  width: 'clamp(30px,5.5vw,66px)', height: 'clamp(75px,13vw,150px)',
                  transform: 'translateX(-50%)' }}
                initial={{ opacity: 0, y: 20, scale: 0.80 }}
                animate={{ opacity: 1, y: isCenter ? -4 : 0, scale: isCenter ? 1.06 : 1.0 }}
                transition={{ delay: i * 0.10, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
                <svg viewBox="0 0 66 150" width="100%" height="100%">
                  {/* === BODY === */}
                  <path d="M16,48 Q24,42 50,48 L52,102 Q33,112 14,102 Z" fill={f.shirt}/>
                  {/* === ARMS (raised if excited) === */}
                  <path d={armUp
                    ? `M18,58 Q6,44 2,30`
                    : `M18,58 Q6,78 3,104`}
                    stroke={f.skin} strokeWidth="14" fill="none" strokeLinecap="round"/>
                  <path d={f.mood === 'grinning' || f.mood === 'laugh'
                    ? `M48,58 Q60,44 62,30`
                    : `M48,58 Q60,78 63,104`}
                    stroke={f.skin} strokeWidth="14" fill="none" strokeLinecap="round"/>
                  {/* === LEGS === */}
                  <path d="M18,102 L14,150" stroke={f.shirt} strokeWidth="11" strokeLinecap="round" fill="none"/>
                  <path d="M48,102 L52,150" stroke={f.shirt} strokeWidth="11" strokeLinecap="round" fill="none"/>
                  {/* === NECK === */}
                  <rect x="26" y="40" width="14" height="11" rx="5" fill={f.skin}/>
                  {/* === HEAD === */}
                  {/* Skull */}
                  <ellipse cx="33" cy="27" rx="18" ry="19" fill={f.skin}/>
                  {/* Jaw */}
                  <path d="M16,32 Q22,44 33,45 Q44,44 50,32" fill={f.skin}/>
                  {/* Hair */}
                  <ellipse cx="33" cy="14" rx="18" ry="11" fill={f.hair}/>
                  <path d="M16,22 Q15,13 20,10" stroke={f.hair} strokeWidth="8" fill="none" strokeLinecap="round"/>
                  <path d="M50,22 Q51,13 46,10" stroke={f.hair} strokeWidth="8" fill="none" strokeLinecap="round"/>
                  {/* Phone glow on face — warm gold */}
                  <ellipse cx="33" cy="27" rx="18" ry="18" fill="rgba(200,163,64,0.18)"/>
                  {/* === LEFT EYE (wide open — EXCITED) === */}
                  <ellipse cx="25" cy="25" rx="5.5" ry="6" fill="white" opacity="0.95"/>
                  <ellipse cx="25" cy="26" rx="3.8" ry="3.8" fill={f.mood === 'grinning' ? '#5a3010' : '#1e1008'}/>
                  <ellipse cx="26.5" cy="24" rx="1.5" ry="1.5" fill="white" opacity="0.85"/>
                  {/* Raised brow left */}
                  <path d="M19,18 Q25,15 31,17" stroke={f.hair} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  {/* === RIGHT EYE === */}
                  <ellipse cx="41" cy="25" rx="5.5" ry="6" fill="white" opacity="0.95"/>
                  <ellipse cx="41" cy="26" rx="3.8" ry="3.8" fill={f.mood === 'grinning' ? '#5a3010' : '#1e1008'}/>
                  <ellipse cx="42.5" cy="24" rx="1.5" ry="1.5" fill="white" opacity="0.85"/>
                  {/* Raised brow right */}
                  <path d="M35,18 Q41,15 47,17" stroke={f.hair} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  {/* === MOUTH (by mood) === */}
                  {(f.mood === 'grinning' || f.mood === 'jump') && (
                    <>
                      <path d="M22,36 Q33,44 44,36" fill="rgba(160,60,25,0.90)"/>
                      <path d="M23,36 Q33,42 43,36" fill="rgba(220,100,50,0.80)"/>
                      {/* Teeth row */}
                      <path d="M24,36 Q33,42 42,36" fill="rgba(240,230,220,0.75)" clipPath="none"/>
                    </>
                  )}
                  {(f.mood === 'shock' || f.mood === 'amazed') && (
                    <>
                      <ellipse cx="33" cy="38" rx="7" ry="6" fill="rgba(50,18,8,0.90)"/>
                      <ellipse cx="33" cy="37" rx="5" ry="4" fill="rgba(240,230,220,0.45)"/>
                    </>
                  )}
                  {f.mood === 'laugh' && (
                    <>
                      <path d="M20,35 Q33,46 46,35 Q33,42 20,35 Z" fill="rgba(150,55,22,0.90)"/>
                      <path d="M22,36 Q33,43 44,36" fill="rgba(240,225,210,0.60)"/>
                    </>
                  )}
                  {/* Cheek blush (joy) */}
                  <ellipse cx="20" cy="33" rx="5" ry="3.5" fill="rgba(220,100,60,0.18)"/>
                  <ellipse cx="46" cy="33" rx="5" ry="3.5" fill="rgba(220,100,60,0.18)"/>
                  {/* Phase 2+ glow intensifies */}
                  {phase >= 2 && (
                    <ellipse cx="33" cy="27" rx="20" ry="20" fill="rgba(200,163,64,0.14)"/>
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

export function SceneLaunchDay() {
  const [phase, setPhase] = useState(0);
  const [counter, setCounter] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase(1), 1800));
    ts.push(setTimeout(() => setPhase(2), 6000));
    ts.push(setTimeout(() => setPhase(3), 12000));
    ts.push(setTimeout(() => setPhase(4), 22000));
    // counter runs from phase 3
    ts.push(setTimeout(() => {
      let n = 0;
      const tick = setInterval(() => {
        n = Math.min(n + Math.ceil(Math.random() * 16 + 4), 500);
        setCounter(n);
        if (n >= 500) clearInterval(tick);
      }, 55);
    }, 12000));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* CINEMATIC CAMERA — slow push toward the phone + founders */}
      <CinematicCamera zoom={[1.05, 1.0]} origin="50% 60%" duration={28}>

      {/* Dark prestige — midnight launch */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(155deg,#140800 0%,#2a1200 35%,#140800 100%)'
          : 'linear-gradient(155deg,#060404 0%,#0c0808 50%,#060404 100%)' }}
        transition={{ duration: 1.8 }} />

      {/* Energy pulse rings from phone */}
      {phase >= 2 && [0, 1, 2, 3].map(i => (
        <motion.div key={i} className="absolute pointer-events-none z-[6]"
          style={{ top: '42%', left: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%',
            border: '1.5px solid rgba(200,163,64,0.42)' }}
          initial={{ width: 0, height: 0, opacity: 0.85 }}
          animate={{ width: '70vmin', height: '70vmin', opacity: 0 }}
          transition={{ delay: i * 0.75, duration: 3.0, repeat: Infinity, ease: 'easeOut' }} />
      ))}

      {/* Founders */}
      <FoundersWatching show={phase >= 1} phase={phase} />

      {/* Phone */}
      <PhonePlayStore show={phase >= 1} phase={phase} />

      {/* Counter — top right */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div className="absolute pointer-events-none z-[18]"
            style={{ top: '14%', right: '8%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
            <p style={{ fontSize: 'clamp(0.38rem,0.68vw,0.55rem)', letterSpacing: '0.32em',
              color: 'rgba(200,163,64,0.55)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Installs · Day 1
            </p>
            <motion.p key={counter}
              initial={{ y: -4, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.12 }}
              style={{ fontSize: 'clamp(2.8rem,9vw,7rem)', fontFamily: 'monospace', fontWeight: 900,
                color: counter >= 500 ? '#C8A340' : 'rgba(200,163,64,0.85)', lineHeight: 0.85,
                textShadow: '0 0 60px rgba(200,163,64,0.55), 0 2px 28px rgba(0,0,0,1)' }}>
              {counter.toLocaleString()}
            </motion.p>
            {counter >= 500 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                style={{ fontSize: 'clamp(0.50rem,0.90vw,0.72rem)', color: 'rgba(200,163,64,0.60)',
                  letterSpacing: '0.22em', fontFamily: 'monospace' }}>
                ✓ TARGET REACHED
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingParticles count={30} color="#ffd700" active={phase >= 3} />
      <FloatingParticles count={15} color="#ff8c00" active={phase >= 3} />
      <SpeedLines active={phase >= 4} color="rgba(200,163,64,0.68)" count={32} cx={50} cy={45} />

      </CinematicCamera>

      {/* ── OVERLAYS outside camera ── */}
      <ChapterTitle chapter="Chapter VI" title="Launch Day" show={phase >= 4} />

      <Vignette strength={0.75} />
      <BottomGrad color="10,4,0" />
      <FilmGrain opacity={0.28} />
      <CinemaBars />
    </motion.div>
  );
}
