import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarField, VolumetricLight, DustMotes, Bokeh,
  FilmGrain, CinemaBars, Vignette, BottomGrad, AnimeText, ChapterTitle
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE 0 — THE CALL   (15 000 ms)
//  A medical student alone at 3 AM. The world asleep. One lamp on.
// ════════════════════════════════════════════════════════════════════════

// Animated clock hands
function ClockFace({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="28" fill="rgba(14,14,22,0.80)" stroke="rgba(200,180,120,0.35)" strokeWidth="1.4"/>
      {/* Hour markers */}
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(h => {
        const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
        return <circle key={h} cx={30 + 22 * Math.cos(a)} cy={30 + 22 * Math.sin(a)} r={h % 3 === 0 ? 1.4 : 0.7}
          fill="rgba(200,180,100,0.50)" />;
      })}
      {/* Hour hand */}
      <motion.line x1="30" y1="30" x2="30" y2="14" stroke="rgba(220,195,130,0.85)" strokeWidth="2.2" strokeLinecap="round"
        style={{ transformOrigin: '30px 30px' }}
        animate={{ rotate: spinning ? [0, 3600] : 0 }}
        transition={{ duration: spinning ? 4 : 0, ease: 'linear', repeat: spinning ? Infinity : 0 }} />
      {/* Minute hand — faster */}
      <motion.line x1="30" y1="30" x2="30" y2="9" stroke="rgba(200,175,110,0.65)" strokeWidth="1.3" strokeLinecap="round"
        style={{ transformOrigin: '30px 30px' }}
        animate={{ rotate: spinning ? [0, 36000] : 0 }}
        transition={{ duration: spinning ? 4 : 0, ease: 'linear', repeat: spinning ? Infinity : 0 }} />
      <circle cx="30" cy="30" r="2" fill="rgba(200,163,64,0.80)" />
    </svg>
  );
}

// Night window with rain-streaked glass and distant city
function NightWindow({ show }: { show: boolean }) {
  const streaks = Array.from({ length: 18 }, (_, i) => ({
    x: 6 + i * 4.8, delay: (i * 0.27) % 2.2, dur: 1.8 + (i % 4) * 0.4, len: 8 + (i % 5) * 5,
  }));
  const cityDots = Array.from({ length: 55 }, (_, i) => ({
    x: 2 + (i % 11) * 8.5 + (i % 3 === 0 ? 3 : 0),
    y: 56 + Math.floor(i / 11) * 6 + (i % 2 === 0 ? 2 : 0),
    r: 0.6 + (i % 3 === 0 ? 0.4 : 0),
    color: i % 5 === 0 ? 'rgba(255,120,60,0.55)' : i % 3 === 0 ? 'rgba(255,200,80,0.45)' : 'rgba(120,160,255,0.40)',
  }));
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none"
          style={{ left: '4%', top: '14%', width: '22%', height: '52%', zIndex: 4 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }}>
          {/* Night sky fill */}
          <div style={{ position: 'absolute', inset: 4, background: 'linear-gradient(180deg,#02020e 0%,#05081e 55%,#0a1030 100%)',
            overflow: 'hidden' }}>
            {/* Distant city glow on horizon */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',
              background: 'linear-gradient(to top,rgba(60,40,120,0.40) 0%,transparent 100%)' }} />
            {/* City lights */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100">
              {cityDots.map((d, i) => (
                <motion.circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ delay: i * 0.18, duration: 2 + i % 3, repeat: Infinity, repeatType: 'mirror' }} />
              ))}
            </svg>
            {/* Rain streaks on glass */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100">
              {streaks.map((s, i) => (
                <motion.line key={i} x1={s.x} y1={-5} x2={s.x - 1.5} y2={s.len - 5}
                  stroke="rgba(140,180,220,0.35)" strokeWidth="0.5"
                  initial={{ y: -100 }} animate={{ y: 220 }}
                  transition={{ delay: s.delay, duration: s.dur, repeat: Infinity, ease: 'linear' }} />
              ))}
            </svg>
          </div>
          {/* Window frame — wood/metal */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100" fill="none" stroke="rgba(60,45,25,0.90)" strokeWidth="6"/>
            {/* Pane dividers */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(60,45,25,0.80)" strokeWidth="4"/>
            <line x1="0" y1="48" x2="100" y2="48" stroke="rgba(60,45,25,0.80)" strokeWidth="3.5"/>
            {/* Glass reflection shine */}
            <line x1="8" y1="4" x2="8" y2="44" stroke="rgba(200,220,255,0.10)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="58" y1="52" x2="58" y2="93" stroke="rgba(200,220,255,0.08)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {/* Condensation overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(120,150,200,0.04)',
            backdropFilter: 'blur(0.8px)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Detailed desk lamp SVG
function DeskLamp({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none"
          style={{ right: '12%', top: '22%', width: '8%', height: '38%', zIndex: 12 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1.2 }}>
          <svg viewBox="0 0 40 80" width="100%" height="100%" overflow="visible">
            {/* Base */}
            <ellipse cx="20" cy="77" rx="14" ry="4" fill="rgba(60,50,30,0.90)" />
            {/* Stand */}
            <rect x="18" y="42" width="4" height="36" rx="2" fill="rgba(80,65,35,0.88)" />
            {/* Arm */}
            <line x1="20" y1="44" x2="26" y2="22" stroke="rgba(80,65,35,0.88)" strokeWidth="3.5" strokeLinecap="round"/>
            {/* Shade */}
            <polygon points="14,22 38,22 32,8 20,8" fill="rgba(200,163,64,0.80)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(200,163,64,0.50))' }} />
            {/* Shade inner bright */}
            <polygon points="16,22 36,22 31,10 21,10" fill="rgba(255,230,120,0.90)" />
            {/* Bulb glow dot */}
            <circle cx="27" cy="15" r="3" fill="rgba(255,245,180,0.95)"
              style={{ filter: 'drop-shadow(0 0 5px rgba(255,230,100,0.90))' }} />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Desk surface with books, laptop, cup
function DeskScene({ show, phase }: { show: boolean; phase: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none"
          style={{ left: 0, right: 0, bottom: '18%', height: '38%', zIndex: 11 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1.0 }}>
          <svg viewBox="0 0 1000 220" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            {/* ── Desk surface (perspective) ── */}
            <polygon points="80,220 920,220 860,80 140,80"
              fill="url(#deskGrad)" />
            <defs>
              <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(42,32,16,0.95)" />
                <stop offset="100%" stopColor="rgba(28,20,10,0.98)" />
              </linearGradient>
            </defs>
            {/* Desk front edge highlight */}
            <line x1="80" y1="220" x2="920" y2="220" stroke="rgba(80,60,28,0.70)" strokeWidth="3"/>
            <line x1="140" y1="80" x2="860" y2="80" stroke="rgba(80,60,28,0.40)" strokeWidth="1.5"/>
            {/* ── Stack of books left ── */}
            {[
              { x: 180, w: 80, h: 18, col: 'rgba(140,30,30,0.88)', label: 'Anatomy' },
              { x: 182, w: 76, h: 16, col: 'rgba(30,80,140,0.88)', label: 'Physio' },
              { x: 184, w: 72, h: 14, col: 'rgba(30,120,60,0.80)', label: 'Biochem' },
            ].map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={110 - i * 17} width={b.w} height={b.h} rx="2" fill={b.col}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.60))' }} />
                {/* Page edges */}
                <rect x={b.x + b.w} y={110 - i * 17 + 2} width={5} height={b.h - 4} rx="1" fill="rgba(230,220,200,0.55)" />
              </g>
            ))}
            {/* ── Laptop open ── */}
            {/* Laptop base */}
            <polygon points="380,160 620,160 600,90 400,90"
              fill="rgba(28,32,40,0.92)" style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.70))' }} />
            {/* Screen lid */}
            <polygon points="400,90 600,90 580,30 420,30"
              fill="rgba(22,26,34,0.95)" style={{ filter: 'drop-shadow(0 -2px 8px rgba(40,100,255,0.25))' }} />
            {/* Screen content — blue IDE glow */}
            <polygon points="408,86 592,86 574,34 426,34" fill="rgba(12,18,40,0.98)" />
            {/* Code lines on screen */}
            {phase >= 1 && [
              { y: 46, w: 90, col: 'rgba(100,180,255,0.70)' },
              { y: 54, w: 65, col: 'rgba(140,220,130,0.60)' },
              { y: 62, w: 110, col: 'rgba(200,160,80,0.55)' },
              { y: 70, w: 80, col: 'rgba(100,180,255,0.65)' },
              { y: 78, w: 50, col: 'rgba(220,120,120,0.50)' },
            ].map((l, i) => (
              <motion.rect key={i} x={432} y={l.y} width={l.w} height={3} rx="1.5" fill={l.col}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.12, duration: 0.4, ease: 'easeOut' }} />
            ))}
            {/* Screen glow reflected on desk */}
            <ellipse cx="500" cy="92" rx="80" ry="8" fill="rgba(40,80,200,0.12)" />
            {/* Keyboard area */}
            <rect x="398" y="148" width="204" height="14" rx="3" fill="rgba(35,40,50,0.80)" />
            {/* Trackpad */}
            <rect x="460" y="152" width="80" height="8" rx="2" fill="rgba(40,46,58,0.80)" />
            {/* ── Tea/coffee mug ── */}
            <g transform="translate(680, 108)">
              {/* Mug body */}
              <rect x="-22" y="0" width="44" height="46" rx="5" fill="rgba(45,35,20,0.90)"
                style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.55))' }} />
              {/* Mug rim */}
              <ellipse cx="0" cy="0" rx="22" ry="6" fill="rgba(55,44,24,0.95)" />
              {/* Tea inside */}
              <ellipse cx="0" cy="3" rx="17" ry="4" fill="rgba(160,90,30,0.70)" />
              {/* Handle */}
              <path d="M22,12 Q40,12 40,28 Q40,44 22,44" fill="none" stroke="rgba(45,35,20,0.90)" strokeWidth="7" strokeLinecap="round"/>
              {/* MD logo on mug (small) */}
              <text x="0" y="28" textAnchor="middle" fontSize="12" fontWeight="900"
                fill="rgba(200,163,64,0.60)" fontFamily="serif">MD</text>
              {/* Steam */}
              {phase >= 1 && [
                { dx: -6, delay: 0 }, { dx: 0, delay: 0.4 }, { dx: 6, delay: 0.8 },
              ].map((s, i) => (
                <motion.path key={i} d={`M${s.dx},-8 Q${s.dx + 4},-18 ${s.dx},-28 Q${s.dx - 4},-38 ${s.dx},-48`}
                  fill="none" stroke="rgba(200,180,140,0.30)" strokeWidth="2.5" strokeLinecap="round"
                  initial={{ opacity: 0, pathLength: 0 }} animate={{ opacity: [0, 0.7, 0], pathLength: [0, 1, 1] }}
                  transition={{ delay: s.delay, duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
              ))}
            </g>
            {/* ── Scattered papers ── */}
            <g opacity="0.60">
              <rect x="260" y="145" width="90" height="60" rx="1" fill="rgba(220,210,185,0.55)"
                style={{ transform: 'rotate(-4deg)', transformOrigin: '305px 175px' }} />
              <rect x="272" y="150" width="66" height="2" rx="1" fill="rgba(40,30,14,0.30)" />
              <rect x="272" y="157" width="55" height="2" rx="1" fill="rgba(40,30,14,0.25)" />
              <rect x="272" y="164" width="60" height="2" rx="1" fill="rgba(40,30,14,0.22)" />
              <rect x="272" y="171" width="40" height="2" rx="1" fill="rgba(200,30,30,0.30)" />
            </g>
            {/* ── Pen / pencil ── */}
            <line x1="354" y1="165" x2="375" y2="200" stroke="rgba(200,163,64,0.75)" strokeWidth="4" strokeLinecap="round"/>
            <polygon points="375,200 371,205 380,207" fill="rgba(220,210,180,0.60)" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Bookshelves on wall
function Bookshelves({ show }: { show: boolean }) {
  const books = [
    { w: 14, h: 44, col: 'rgba(150,40,40,0.82)' }, { w: 10, h: 52, col: 'rgba(40,70,160,0.80)' },
    { w: 16, h: 40, col: 'rgba(40,110,60,0.78)' }, { w: 12, h: 48, col: 'rgba(130,80,30,0.80)' },
    { w: 8,  h: 38, col: 'rgba(120,30,100,0.75)' }, { w: 14, h: 45, col: 'rgba(160,140,30,0.78)' },
    { w: 10, h: 50, col: 'rgba(30,90,140,0.80)' }, { w: 18, h: 42, col: 'rgba(80,30,30,0.82)' },
  ];
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none"
          style={{ right: '5%', top: '14%', width: '18%', height: '32%', zIndex: 5 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1.2 }}>
          <svg viewBox="0 0 200 120" width="100%" height="100%">
            {/* Shelf planks */}
            <rect x="0" y="0" width="200" height="6" rx="2" fill="rgba(50,36,16,0.90)" />
            <rect x="0" y="58" width="200" height="6" rx="2" fill="rgba(50,36,16,0.90)" />
            <rect x="0" y="114" width="200" height="6" rx="2" fill="rgba(50,36,16,0.90)" />
            {/* Left divider */}
            <rect x="0" y="0" width="5" height="120" rx="1" fill="rgba(50,36,16,0.90)" />
            <rect x="195" y="0" width="5" height="120" rx="1" fill="rgba(50,36,16,0.90)" />
            {/* Books top shelf */}
            {books.map((b, i) => {
              const x = 8 + i * 23;
              return (
                <g key={i}>
                  <rect x={x} y={6 - b.h + 52} width={b.w} height={b.h} rx="1.5" fill={b.col} />
                  {/* Page top */}
                  <rect x={x} y={6 - b.h + 52} width={b.w} height={3} rx="1" fill="rgba(230,220,200,0.45)" />
                </g>
              );
            })}
            {/* Bottom shelf — fewer, horizontal */}
            <rect x="8" y="64" width="60" height="42" rx="2" fill="rgba(30,22,10,0.80)" />
            <text x="38" y="90" textAnchor="middle" fontSize="8" fill="rgba(200,163,64,0.45)" fontFamily="monospace">ATLAS</text>
            <rect x="75" y="70" width="40" height="36" rx="1.5" fill="rgba(45,30,12,0.75)" />
            <rect x="122" y="68" width="50" height="38" rx="2" fill="rgba(28,18,8,0.80)" />
            {/* Small items */}
            <circle cx="185" cy="82" r="10" fill="rgba(30,20,10,0.80)" />
            <circle cx="185" cy="82" r="7" fill="none" stroke="rgba(200,163,64,0.30)" strokeWidth="1.5"/>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Student studying — detailed silhouette at desk
function StudentAtDesk({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none"
          style={{ left: '38%', bottom: '22%', width: '18%', height: '45%', zIndex: 13 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 180 320" width="100%" height="100%" overflow="visible">
            {/* ── Head ── slightly bowed (studying) */}
            <ellipse cx="90" cy="60" rx="32" ry="38" fill="#050510" />
            {/* Hair (dark mass on top) */}
            <ellipse cx="90" cy="40" rx="32" ry="22" fill="#040408" />
            {/* ── Neck ── */}
            <rect x="78" y="92" width="24" height="20" rx="4" fill="#050510" />
            {/* ── Shoulders & upper body — hunched forward ── */}
            <path d="M30,108 Q44,98 62,108 L70,160 Q90,168 110,160 L118,108 Q136,98 150,108 L152,140 Q90,168 28,140 Z"
              fill="#050510" />
            {/* ── Left arm — on desk, extended toward laptop ── */}
            <path d="M42,130 Q30,155 22,185 Q18,200 30,205 L80,200 Q90,196 85,180 L78,158"
              fill="#050510" />
            {/* ── Right arm — on desk, toward right ── */}
            <path d="M138,130 Q152,155 160,185 Q164,200 152,205 L110,200 Q100,196 105,180 L112,158"
              fill="#050510" />
            {/* ── Torso ── */}
            <path d="M62,155 Q90,170 118,155 L124,270 L56,270 Z" fill="#050510" />
            {/* Chair back visible behind */}
            <rect x="52" y="145" width="76" height="8" rx="4" fill="rgba(12,8,20,0.80)" />
            {/* ── Slight screen glow on face/chest ── */}
            <ellipse cx="90" cy="100" rx="38" ry="30" fill="rgba(40,80,200,0.10)" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Scene0() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 400),    // room appears
      setTimeout(() => setPhase(2), 3200),   // lamp on, dust, screen
      setTimeout(() => setPhase(3), 8000),   // clock spins
      setTimeout(() => setPhase(4), 11000),  // title reveal
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}>

      {/* ── Sky / wall background ── */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg,#020210 0%,#05061a 45%,#03040e 100%)'
      }} />

      {/* ── Stars (through window) ── */}
      <StarField count={70} show={true} />

      {/* ── Depth: bokeh out-of-focus background circles ── */}
      <Bokeh count={10} active={phase >= 1} />

      {/* ── Room wall (warm dark grey panel behind furniture) ── */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{ left: '28%', top: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg,#0c0a14 0%,#100e1a 60%,#080610 100%)' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.6 }} />

      {/* ── Bookshelves ── */}
      <Bookshelves show={phase >= 1} />

      {/* ── Night window ── */}
      <NightWindow show={phase >= 1} />

      {/* ── Wall clock (right side wall) ── */}
      <motion.div className="absolute pointer-events-none z-[5]"
        style={{ right: '5%', top: '14%', width: '6%', aspectRatio: '1' }}
        animate={{ opacity: phase >= 1 ? 0.70 : 0 }} transition={{ delay: 0.8, duration: 1.0 }}>
        <ClockFace spinning={phase >= 3} />
      </motion.div>

      {/* ── "3:14 AM" badge ── */}
      <motion.p className="absolute pointer-events-none z-[15]"
        style={{ top: '15%', left: '30%',
          fontFamily: 'monospace', fontSize: 'clamp(0.50rem,0.90vw,0.72rem)',
          color: 'rgba(200,163,64,0.45)', letterSpacing: '0.24em', textTransform: 'uppercase' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ delay: 0.3, duration: 1.0 }}>
        03:14 AM
      </motion.p>

      {/* ── Desk lamp ── */}
      <DeskLamp show={phase >= 2} />

      {/* ── Volumetric light cone from lamp ── */}
      <VolumetricLight x={83} y={30} angle={42} length={52}
        color="rgba(255,190,70,0.22)" show={phase >= 2} />

      {/* ── Desk & items ── */}
      <DeskScene show={phase >= 1} phase={phase} />

      {/* ── Student at desk ── */}
      <StudentAtDesk show={phase >= 1} />

      {/* ── Laptop screen glow on floor/desk ── */}
      <motion.div className="absolute pointer-events-none z-[6]"
        style={{ bottom: '23%', left: '42%', width: '16%', height: '4%',
          background: 'radial-gradient(ellipse,rgba(40,80,200,0.28) 0%,transparent 70%)',
          filter: 'blur(6px)' }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration: 0.9 }} />

      {/* ── Dust motes in lamplight ── */}
      <DustMotes active={phase >= 2} cx={80} width={22} />

      {/* ── Vignette, bottom, grain, bars ── */}
      <Vignette strength={0.82} />
      <BottomGrad color="2,2,10" strength={0.95} />
      <FilmGrain opacity={0.32} />

      {/* ── Chapter title ── */}
      <ChapterTitle chapter="Chapter I" title="The Call" show={phase >= 4} />

      <CinemaBars />
    </motion.div>
  );
}
