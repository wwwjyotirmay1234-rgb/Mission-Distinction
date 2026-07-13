import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, FloatingParticles, SpeedLines
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

// 5 founders gathered — watching the screen with growing excitement
function FoundersWatching({ show }: { show: boolean }) {
  const positions = [-36, -18, 0, 18, 36];
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute pointer-events-none z-[10]"
          style={{ left: 0, right: 0, bottom: '16%', height: '32%' }}>
          {positions.map((dx, i) => (
            <motion.div key={i} className="absolute"
              style={{ left: `calc(50% + ${dx}%)`, bottom: 0,
                width: 'clamp(28px,5vw,60px)', height: 'clamp(70px,12vw,140px)',
                transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, y: 16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.10, duration: 0.80, ease: [0.16, 1, 0.3, 1] }}>
              <svg viewBox="0 0 60 140" width="100%" height="100%">
                <ellipse cx="30" cy="26" rx="17" ry="20" fill="rgba(6,4,12,0.92)" />
                <ellipse cx="30" cy="14" rx="17" ry="12" fill="rgba(4,3,8,0.92)" />
                <path d="M14,44 Q22,38 46,44 L48,95 Q30,104 12,95 Z" fill="rgba(6,4,12,0.92)" />
                <path d="M16,55 Q5,76 2,100" stroke="rgba(6,4,12,0.92)" strokeWidth="14"
                  fill="none" strokeLinecap="round"/>
                <path d="M44,55 Q55,76 58,100" stroke="rgba(6,4,12,0.92)" strokeWidth="14"
                  fill="none" strokeLinecap="round"/>
                <path d="M16,95 L12,140" stroke="rgba(6,4,12,0.90)" strokeWidth="10" strokeLinecap="round"/>
                <path d="M44,95 L48,140" stroke="rgba(6,4,12,0.90)" strokeWidth="10" strokeLinecap="round"/>
                {/* Phone light reflected */}
                <ellipse cx="30" cy="50" rx="20" ry="16" fill="rgba(200,163,64,0.12)" />
              </svg>
            </motion.div>
          ))}
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
      <FoundersWatching show={phase >= 1} />

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

      <ChapterTitle chapter="Chapter VI" title="Launch Day" show={phase >= 4} />

      <Vignette strength={0.75} />
      <BottomGrad color="10,4,0" />
      <FilmGrain opacity={0.28} />
      <CinemaBars />
    </motion.div>
  );
}
