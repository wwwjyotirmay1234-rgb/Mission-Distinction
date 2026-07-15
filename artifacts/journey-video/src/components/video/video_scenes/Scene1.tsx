import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad, ChapterTitle,
  VolumetricLight, Rain, Lightning, CinematicCamera, AnimeText,
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE 1 — THE STRUGGLE   (55 000 ms)
//  10-shot cinematic sequence following MBBS student's breaking point.
//  Shot 1 :  0-5000   Aerial hostel exterior — one window lit in rain
//  Shot 2 :  5000-10000  Slow push through rain-streaked window
//  Shot 3 : 10000-16000  Medium shot — student buried in books
//  Shot 4 : 16000-21000  Extreme CU — exhausted eyes scanning pages
//  Shot 5 : 21000-27000  Over-shoulder — endless syllabus notebook
//  Shot 6 : 27000-32000  CU — pen drops from hand in slow motion
//  Shot 7 : 32000-38000  Side profile — leans back, stares into dark
//  Shot 8 : 38000-44000  Face CU — determination crumbles to doubt
//  Shot 9 : 44000-50000  Orbit pull-back — room swallows him
//  Shot 10: 50000-55000  Blank notebook page — lamp light, silence
// ════════════════════════════════════════════════════════════════════════

const SHOT_MS = [0, 5000, 10000, 16000, 21000, 27000, 32000, 38000, 44000, 50000];

function useShot() {
  const [shot, setShot] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = SHOT_MS.slice(1).map((t, i) => setTimeout(() => setShot(i + 1), t));
    return () => ts.forEach(clearTimeout);
  }, []);
  return shot;
}

// ─── HEAVY RAIN (multi-layer parallax) ──────────────────────────────────
function HeavyRain() {
  return (
    <>
      {/* Far layer — thin, fast */}
      <Rain intensity={55} show />
      {/* Mid layer — medium, angled */}
      <motion.div className="absolute inset-0 pointer-events-none overflow-hidden z-[9]"
        style={{ transform: 'rotate(-4deg) scale(1.1)' }}>
        <Rain intensity={35} show />
      </motion.div>
      {/* Near layer — thick, slow */}
      <motion.div className="absolute inset-0 pointer-events-none overflow-hidden z-[10]"
        style={{ transform: 'rotate(-8deg) scale(1.15)', opacity: 0.5 }}>
        <Rain intensity={20} show />
      </motion.div>
    </>
  );
}

// ─── THUNDER FLASH controller ────────────────────────────────────────────
function useThunder() {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const fire = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 80);
      setTimeout(() => { setFlash(true); setTimeout(() => setFlash(false), 60); }, 140);
    };
    fire();
    const id = setInterval(fire, 8000 + Math.random() * 6000);
    return () => clearInterval(id);
  }, []);
  return flash;
}

// ─── SHOT 1 — AERIAL HOSTEL EXTERIOR ────────────────────────────────────
function Shot1() {
  const flash = useThunder();
  return (
    <CinematicCamera zoom={[1.0, 1.06]} origin="50% 40%" duration={5}>
      {/* Night sky + storm clouds */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 0%, #1a1228 0%, #080510 55%, #020108 100%)',
      }} />
      {/* Storm cloud layers */}
      <motion.div className="absolute pointer-events-none z-[2]"
        style={{ top: 0, left: 0, right: 0, height: '38%',
          background: 'linear-gradient(180deg,#0a0614 0%,rgba(14,8,22,0.95) 60%,transparent 100%)' }}
        animate={{ y: [-4, 4, -2, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute pointer-events-none z-[2]"
        style={{ top: '4%', left: '-10%', width: '55%', height: '22%', borderRadius: '50%',
          background: 'rgba(8,4,16,0.88)', filter: 'blur(24px)' }}
        animate={{ x: [0, 8, 0], opacity: [0.8, 1, 0.85] }} transition={{ duration: 18, repeat: Infinity }} />
      <motion.div className="absolute pointer-events-none z-[2]"
        style={{ top: '2%', right: '-8%', width: '50%', height: '20%', borderRadius: '50%',
          background: 'rgba(12,6,22,0.85)', filter: 'blur(20px)' }}
        animate={{ x: [0, -6, 0], opacity: [0.85, 1, 0.8] }} transition={{ duration: 14, repeat: Infinity }} />

      {/* Hostel building SVG — aerial/slightly elevated view */}
      <div className="absolute inset-0 pointer-events-none z-[4]" style={{ display: 'flex', alignItems: 'flex-end' }}>
        <svg viewBox="0 0 900 520" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="bldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c0816" />
              <stop offset="100%" stopColor="#050310" />
            </linearGradient>
            <filter id="winGlow"><feGaussianBlur stdDeviation="3.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="rainGlow"><feGaussianBlur stdDeviation="1.2"/></filter>
          </defs>
          {/* Ground / wet road — reflective */}
          <rect x="0" y="440" width="900" height="80" fill="#06040e" />
          <rect x="0" y="440" width="900" height="4" fill="rgba(100,80,180,0.15)" />
          {/* Puddle reflections */}
          <ellipse cx="200" cy="460" rx="80" ry="8" fill="rgba(255,180,80,0.04)" filter="url(#rainGlow)" />
          <ellipse cx="680" cy="472" rx="60" ry="6" fill="rgba(255,180,80,0.03)" filter="url(#rainGlow)" />

          {/* Main hostel block */}
          <rect x="130" y="90" width="640" height="355" fill="url(#bldGrad)" rx="2" />
          {/* Darker face */}
          <rect x="130" y="90" width="640" height="355" fill="rgba(0,0,0,0.25)" />
          {/* Roof ledge */}
          <rect x="115" y="82" width="670" height="14" fill="#0a0614" rx="1" />
          {/* Roof water tank */}
          <rect x="380" y="50" width="80" height="35" fill="#080412" rx="4" />
          <rect x="390" y="38" width="60" height="14" fill="#060310" rx="2" />

          {/* Floor dividers */}
          {[172, 252, 332, 412].map(y => (
            <rect key={y} x="130" y={y} width="640" height="3" fill="rgba(0,0,0,0.50)" />
          ))}

          {/* Windows — 5 floors × 8 columns = 40 windows */}
          {[104, 184, 264, 344, 424].map((fy, fi) =>
            [0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
              const wx = 155 + col * 78;
              const isLit = fi === 2 && col === 3; // ONE window lit — floor 3, col 4
              const isDimly = fi === 1 && col === 6; // one dim blue (TV)
              return (
                <g key={`${fi}-${col}`}>
                  <rect x={wx} y={fy} width={44} height={60} rx="2" fill={isLit ? '#0a0814' : '#050310'} />
                  {isLit && (
                    <>
                      {/* The ONE lit window — warm amber glow */}
                      <rect x={wx} y={fy} width={44} height={60} rx="2" fill="rgba(255,190,80,0.22)" />
                      <rect x={wx + 1} y={fy + 1} width={42} height={58} rx="2" fill="rgba(255,200,100,0.18)" />
                      {/* Window glow halo */}
                      <rect x={wx - 12} y={fy - 10} width={68} height={80} rx="6"
                        fill="rgba(255,180,60,0.10)" filter="url(#winGlow)" />
                      {/* Desk lamp silhouette visible */}
                      <rect x={wx + 18} y={fy + 40} width={8} height={16} fill="rgba(220,160,40,0.35)" />
                      {/* Study shadow — student's head silhouette */}
                      <ellipse cx={wx + 22} cy={fy + 32} rx={8} ry={9} fill="rgba(0,0,0,0.55)" />
                    </>
                  )}
                  {isDimly && (
                    <rect x={wx} y={fy} width={44} height={60} rx="2" fill="rgba(40,60,140,0.12)" />
                  )}
                  {/* Window cross bars */}
                  <line x1={wx + 22} y1={fy} x2={wx + 22} y2={fy + 60} stroke="rgba(0,0,0,0.60)" strokeWidth="1.5" />
                  <line x1={wx} y1={fy + 30} x2={wx + 44} y2={fy + 30} stroke="rgba(0,0,0,0.60)" strokeWidth="1.5" />
                </g>
              );
            })
          )}

          {/* Ground floor entrance */}
          <rect x="390" y="370" width="120" height="75" fill="#040210" rx="2" />
          <rect x="400" y="380" width="45" height="65" fill="#030110" rx="1" />
          <rect x="455" y="380" width="45" height="65" fill="#030110" rx="1" />
          {/* Steps */}
          <rect x="360" y="440" width="180" height="6" fill="#060412" />
          <rect x="370" y="446" width="160" height="5" fill="#050310" />

          {/* Street lamp */}
          <rect x="80" y="320" width="6" height="120" fill="#080414" />
          <ellipse cx="83" cy="318" rx="18" ry="8" fill="rgba(255,220,100,0.08)" filter="url(#winGlow)" />
          <circle cx="83" cy="320" r="3" fill="rgba(255,220,100,0.30)" />
        </svg>
      </div>

      <HeavyRain />
      <Lightning flash={flash} />

      {/* Mood text */}
      <motion.div className="absolute pointer-events-none z-[30]"
        style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1.2 }}>
        <p style={{ fontSize: 'clamp(0.42rem,0.80vw,0.62rem)', letterSpacing: '0.38em',
          color: 'rgba(180,140,220,0.50)', fontFamily: 'monospace', textTransform: 'uppercase', textAlign: 'center' }}>
          3 : 14 AM &nbsp;·&nbsp; MBBS Hostel Block C
        </p>
      </motion.div>
    </CinematicCamera>
  );
}

// ─── SHOT 2 — SLOW PUSH THROUGH WINDOW ──────────────────────────────────
function Shot2() {
  return (
    <CinematicCamera zoom={[1.0, 1.18]} origin="50% 42%" duration={5}>
      {/* Inside room warm background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 52% 55%, #1a1008 0%, #0c0a04 45%, #06040c 100%)',
      }} />

      {/* Window frame — we are outside looking in */}
      <div className="absolute inset-0 pointer-events-none z-[5]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="lampCore" cx="52%" cy="55%" r="35%">
              <stop offset="0%" stopColor="rgba(255,200,80,0.28)" />
              <stop offset="60%" stopColor="rgba(255,160,40,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="glassBlur"><feGaussianBlur stdDeviation="1.8"/></filter>
          </defs>
          {/* Warm lamp glow radiating from desk area */}
          <ellipse cx="468" cy="280" rx="260" ry="200" fill="url(#lampCore)" />

          {/* Window frame — thick dark bars */}
          <rect x="0" y="0" width="900" height="500" fill="none" />
          {/* Outer frame surround (dark wall) */}
          <rect x="0" y="0" width="165" height="500" fill="rgba(4,2,10,0.97)" />
          <rect x="735" y="0" width="165" height="500" fill="rgba(4,2,10,0.97)" />
          <rect x="0" y="0" width="900" height="80" fill="rgba(4,2,10,0.97)" />
          <rect x="0" y="420" width="900" height="80" fill="rgba(4,2,10,0.97)" />
          {/* Window frame bars */}
          <rect x="160" y="75" width="580" height="350" fill="none" stroke="rgba(20,14,10,0.95)" strokeWidth="14" />
          {/* Centre divider bars */}
          <rect x="447" y="75" width="10" height="350" fill="rgba(16,10,8,0.92)" />
          <rect x="160" y="248" width="580" height="8" fill="rgba(16,10,8,0.92)" />

          {/* Rain drops on glass — streaks running down */}
          {[180, 210, 260, 310, 380, 430, 500, 560, 620, 680, 700].map((x, i) => (
            <motion.line key={i} x1={x} y1={82} x2={x - 2} y2={82 + 30 + (i % 3) * 40}
              stroke="rgba(160,200,240,0.35)" strokeWidth={0.8 + (i % 3) * 0.4}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.6, 0.4, 0.7, 0.3] }}
              transition={{ delay: i * 0.08, duration: 0.8, repeat: Infinity, repeatDelay: 1.2 + i * 0.15 }} />
          ))}
          {/* Glass droplets */}
          {[220, 280, 355, 420, 540, 610, 660].map((x, i) => (
            <motion.circle key={i} cx={x} cy={120 + (i % 4) * 55} r={3 + (i % 3)}
              fill="rgba(180,215,240,0.20)"
              animate={{ cy: [120 + (i % 4) * 55, 200 + (i % 4) * 55], opacity: [0.3, 0.6, 0.1] }}
              transition={{ delay: i * 0.3 + 0.5, duration: 2.5 + i * 0.2, repeat: Infinity }} />
          ))}

          {/* Student silhouette — hunched at desk, barely visible inside */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1.8 }}>
            {/* Desk surface dark shape */}
            <rect x="280" y="310" width="380" height="90" fill="rgba(8,6,4,0.80)" rx="2" />
            {/* Stack of books on desk */}
            <rect x="300" y="268" width="55" height="45" fill="rgba(20,10,8,0.85)" rx="1" />
            <rect x="310" y="260" width="50" height="48" fill="rgba(25,12,8,0.82)" rx="1" />
            {/* Lamp stand */}
            <rect x="550" y="240" width="8" height="72" fill="rgba(30,20,10,0.80)" rx="2" />
            <ellipse cx="554" cy="238" rx="22" ry="10" fill="rgba(40,28,10,0.80)" />
            {/* Lamp glow cone */}
            <polygon points="532,240 510,310 600,310 576,240" fill="rgba(255,200,80,0.10)" />
            {/* Student head + shoulders */}
            <ellipse cx="460" cy="262" rx="22" ry="26" fill="rgba(14,8,4,0.90)" />
            <rect x="428" y="280" width="66" height="50" fill="rgba(10,6,4,0.88)" rx="4" />
            {/* Curly hair texture suggestion */}
            <ellipse cx="460" cy="244" rx="22" ry="14" fill="rgba(8,4,2,0.95)" />
          </motion.g>
        </svg>
      </div>

      <HeavyRain />
    </CinematicCamera>
  );
}

// ─── SHOT 3 — MEDIUM SHOT, BOOKS EVERYWHERE ──────────────────────────────
function Shot3() {
  return (
    <CinematicCamera zoom={[1.0, 1.05]} panX={['0%', '-1.5%']} origin="50% 52%" duration={6}>
      {/* Room background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 62% 48%, #130e04 0%, #0c0804 40%, #060408 80%, #040208 100%)',
      }} />

      {/* Room wall — poster/calendar pinned */}
      <div className="absolute inset-0 pointer-events-none z-[3]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="deskGrad3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1004" />
              <stop offset="100%" stopColor="#0a0804" />
            </linearGradient>
            <filter id="softG"><feGaussianBlur stdDeviation="2"/></filter>
          </defs>
          {/* Back wall */}
          <rect x="0" y="0" width="900" height="310" fill="rgba(6,4,10,0.85)" />
          {/* Floor */}
          <rect x="0" y="310" width="900" height="190" fill="rgba(4,3,6,0.90)" />
          {/* Wall-floor join */}
          <rect x="0" y="305" width="900" height="6" fill="rgba(8,5,12,0.80)" />

          {/* Wall calendar — pinned top right */}
          <rect x="680" y="30" width="90" height="110" fill="rgba(22,14,8,0.88)" rx="2" />
          <rect x="680" y="30" width="90" height="22" fill="rgba(30,12,8,0.90)" rx="2" />
          <text x="725" y="47" textAnchor="middle" fill="rgba(200,160,80,0.60)" fontSize="9" fontFamily="monospace">DECEMBER</text>
          {/* Calendar grid */}
          {[0, 1, 2, 3, 4].map(row => [0, 1, 2, 3, 4, 5, 6].map(col => (
            <rect key={`${row}-${col}`} x={686 + col * 12} y={58 + row * 14} width={10} height={11}
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          )))}

          {/* Medical diagram pinned to wall */}
          <rect x="110" y="40" width="120" height="90" fill="rgba(14,10,8,0.85)" rx="2" />
          <ellipse cx="170" cy="75" rx="35" ry="42" fill="none" stroke="rgba(180,140,80,0.35)" strokeWidth="1.5" />
          <line x1="170" y1="33" x2="170" y2="38" stroke="rgba(180,140,80,0.30)" strokeWidth="1" />
          {[1,2,3,4].map(i => (
            <line key={i} x1={170 + Math.cos(i * 45 * Math.PI/180) * 35} y1={75 + Math.sin(i * 45 * Math.PI/180) * 42}
              x2={170 + Math.cos(i * 45 * Math.PI/180) * 42} y2={75 + Math.sin(i * 45 * Math.PI/180) * 50}
              stroke="rgba(180,140,80,0.22)" strokeWidth="1" />
          ))}
          <text x="170" y="115" textAnchor="middle" fill="rgba(200,160,80,0.40)" fontSize="6" fontFamily="monospace">ANATOMY</text>

          {/* Window on left — rain outside */}
          <rect x="0" y="40" width="90" height="140" fill="rgba(8,12,22,0.80)" />
          <rect x="0" y="40" width="90" height="140" fill="none" stroke="rgba(20,14,10,0.90)" strokeWidth="6" />
          <rect x="44" y="40" width="4" height="140" fill="rgba(20,14,10,0.90)" />
          <rect x="0" y="108" width="90" height="4" fill="rgba(20,14,10,0.90)" />
          {/* Rain through window */}
          {[15, 28, 55, 72].map((x, i) => (
            <motion.line key={i} x1={x} y1="44" x2={x - 1} y2="80"
              stroke="rgba(140,180,220,0.30)" strokeWidth="0.8"
              animate={{ y: [-44, 80] }} transition={{ delay: i * 0.2, duration: 0.5, repeat: Infinity, ease: 'linear' }} />
          ))}

          {/* Desk surface */}
          <rect x="50" y="290" width="800" height="60" fill="url(#deskGrad3)" />
          <rect x="50" y="290" width="800" height="4" fill="rgba(30,20,8,0.80)" />

          {/* BOOKS stacked and scattered */}
          {/* Gray's Anatomy — large, dark red cover */}
          <rect x="80" y="220" width="75" height="74" fill="rgba(80,15,12,0.90)" rx="1" />
          <rect x="80" y="220" width="75" height="74" fill="none" stroke="rgba(120,20,15,0.60)" strokeWidth="1.5" />
          <text x="117" y="258" textAnchor="middle" fill="rgba(220,180,100,0.55)" fontSize="5.5" fontFamily="serif" fontStyle="italic">Gray's</text>
          <text x="117" y="267" textAnchor="middle" fill="rgba(220,180,100,0.55)" fontSize="5.5" fontFamily="serif" fontStyle="italic">Anatomy</text>
          {/* Guyton Physiology — blue-green cover */}
          <rect x="162" y="230" width="68" height="64" fill="rgba(10,35,70,0.88)" rx="1" />
          <text x="196" y="262" textAnchor="middle" fill="rgba(160,200,240,0.50)" fontSize="5" fontFamily="serif">Guyton</text>
          <text x="196" y="270" textAnchor="middle" fill="rgba(160,200,240,0.50)" fontSize="5" fontFamily="serif">Physiology</text>
          {/* Biochemistry — open/flat */}
          <rect x="240" y="272" width="130" height="20" fill="rgba(18,14,8,0.85)" rx="1" />
          <line x1="305" y1="272" x2="305" y2="292" stroke="rgba(30,22,12,0.80)" strokeWidth="1.5" />
          {/* Notes scattered */}
          <rect x="380" y="255" width="100" height="38" fill="rgba(22,18,10,0.80)" rx="1" style={{ transform: 'rotate(-5deg)', transformOrigin: '430px 274px' }} />
          <rect x="490" y="265" width="85" height="30" fill="rgba(18,15,8,0.75)" rx="1" style={{ transform: 'rotate(3deg)', transformOrigin: '532px 280px' }} />
          <rect x="580" y="250" width="95" height="42" fill="rgba(20,16,8,0.78)" rx="1" style={{ transform: 'rotate(-2deg)', transformOrigin: '627px 271px' }} />
          {/* Highlighters */}
          <rect x="700" y="274" width="50" height="10" fill="rgba(255,220,0,0.25)" rx="5" style={{ transform: 'rotate(15deg)', transformOrigin: '725px 279px' }} />
          <rect x="720" y="268" width="45" height="9" fill="rgba(120,220,80,0.22)" rx="4" style={{ transform: 'rotate(-8deg)', transformOrigin: '742px 272px' }} />
          {/* Coffee mug */}
          <rect x="765" y="256" width="32" height="36" fill="rgba(12,8,6,0.90)" rx="4" />
          <rect x="795" y="266" width="8" height="16" fill="none" stroke="rgba(30,20,10,0.80)" strokeWidth="2" />
          <ellipse cx="781" cy="256" rx="16" ry="5" fill="rgba(16,10,6,0.85)" />
          <ellipse cx="781" cy="257" rx="12" ry="3" fill="rgba(60,35,15,0.60)" />
          {/* Steam */}
          <motion.path d="M778 252 Q775 246 778 240 Q781 234 778 228" fill="none"
            stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"
            animate={{ opacity: [0, 0.5, 0], pathLength: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />

          {/* Study lamp */}
          <rect x="660" y="190" width="10" height="105" fill="rgba(35,22,10,0.88)" rx="2" />
          <motion.ellipse cx="665" cy="187" rx="30" ry="12" fill="rgba(50,32,12,0.85)"
            animate={{ opacity: [0.85, 1, 0.90] }} transition={{ duration: 3, repeat: Infinity }} />
          {/* Lamp glow pool on desk */}
          <ellipse cx="670" cy="340" rx="100" ry="45" fill="rgba(255,200,80,0.08)" filter="url(#softG)" />

          {/* STUDENT — hunched at desk, surrounded by books */}
          {/* Chair back */}
          <rect x="400" y="260" width="8" height="80" fill="rgba(12,8,6,0.80)" rx="2" />
          <rect x="440" y="260" width="8" height="80" fill="rgba(12,8,6,0.80)" rx="2" />
          <rect x="395" y="258" width="60" height="8" fill="rgba(16,10,8,0.82)" rx="2" />
          {/* Body — dark hoodie */}
          <rect x="382" y="232" width="84" height="66" fill="rgba(14,10,12,0.92)" rx="8" />
          {/* Hood drawstring */}
          <line x1="418" y1="235" x2="415" y2="248" stroke="rgba(30,22,20,0.60)" strokeWidth="1.5" />
          <line x1="430" y1="235" x2="433" y2="248" stroke="rgba(30,22,20,0.60)" strokeWidth="1.5" />
          {/* Arms resting on desk — both forearms flat, hunched over book */}
          <rect x="355" y="278" width="55" height="16" fill="rgba(180,140,100,0.40)" rx="4" />
          <rect x="435" y="278" width="55" height="16" fill="rgba(180,140,100,0.40)" rx="4" />
          {/* Head — tilted slightly down toward book */}
          <ellipse cx="424" cy="218" rx="24" ry="27" fill="rgba(180,130,90,0.55)" />
          {/* Curly hair */}
          <ellipse cx="424" cy="198" rx="26" ry="16" fill="rgba(10,6,4,0.95)" />
          {[0,1,2,3,4,5,6].map(i => (
            <ellipse key={i} cx={404 + i * 7} cy={196 + (i % 2) * 3} rx="5" ry="4"
              fill="rgba(8,4,2,0.90)" />
          ))}
          {/* Slight beard suggestion */}
          <ellipse cx="424" cy="237" rx="14" ry="7" fill="rgba(8,4,2,0.35)" />
          {/* Face features — tired eyes, looking down */}
          <ellipse cx="415" cy="220" rx="4" ry="2.5" fill="rgba(8,4,2,0.80)" />
          <ellipse cx="433" cy="220" rx="4" ry="2.5" fill="rgba(8,4,2,0.80)" />
          {/* Heavy eyelids */}
          <path d="M411 218 Q415 215 419 218" fill="rgba(12,6,4,0.70)" />
          <path d="M429 218 Q433 215 437 218" fill="rgba(12,6,4,0.70)" />
          {/* Open book in front of student */}
          <rect x="375" y="284" width="100" height="14" fill="rgba(22,18,10,0.85)" rx="1" />
          <line x1="425" y1="284" x2="425" y2="298" stroke="rgba(30,22,12,0.70)" strokeWidth="1" />
          {/* Lines of text on open book page */}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={380} y={287 + i * 2} width={40} height={0.8} fill="rgba(200,180,140,0.25)" />
          ))}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={430} y={287 + i * 2} width={38} height={0.8} fill="rgba(200,180,140,0.25)" />
          ))}
        </svg>
      </div>

      {/* Volumetric lamp light */}
      <VolumetricLight x={73} y={38} angle={32} length={52} color="rgba(255,190,60,0.12)" show />
    </CinematicCamera>
  );
}

// ─── SHOT 4 — EXTREME CLOSE-UP: TIRED EYES ───────────────────────────────
function Shot4() {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const fire = () => {
      setBlink(true); setTimeout(() => setBlink(false), 120);
    };
    const id1 = setTimeout(fire, 1200);
    const id2 = setInterval(fire, 3800 + Math.random() * 2000);
    return () => { clearTimeout(id1); clearInterval(id2); }
  }, []);

  return (
    <CinematicCamera zoom={[1.0, 1.08]} origin="50% 48%" duration={5}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 48%, #100a04 0%, #060404 50%, #020202 100%)',
      }} />

      {/* Huge close-up face — only eye region visible */}
      <div className="absolute inset-0 pointer-events-none z-[4]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="irisGrad" cx="50%" cy="42%" r="50%">
              <stop offset="0%" stopColor="#5a3a18" />
              <stop offset="40%" stopColor="#3a2010" />
              <stop offset="100%" stopColor="#180e06" />
            </radialGradient>
            <radialGradient id="pupilGrad" cx="42%" cy="38%" r="48%">
              <stop offset="0%" stopColor="#1a0e06" />
              <stop offset="100%" stopColor="#080402" />
            </radialGradient>
            <filter id="eyeGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="skinBlur"><feGaussianBlur stdDeviation="0.6"/></filter>
          </defs>

          {/* Skin — forehead and cheek areas, fill frame */}
          <rect x="0" y="0" width="900" height="500" fill="rgba(170,118,75,0.35)" />

          {/* Dark under-eye circles — sleep deprivation */}
          <ellipse cx="270" cy="285" rx="100" ry="35" fill="rgba(8,4,2,0.55)" />
          <ellipse cx="630" cy="285" rx="100" ry="35" fill="rgba(8,4,2,0.55)" />

          {/* Nose bridge suggestion */}
          <line x1="450" y1="220" x2="448" y2="350" stroke="rgba(120,80,50,0.20)" strokeWidth="8" />

          {/* LEFT EYE */}
          <ellipse cx="268" cy="250" rx="115" ry="52" fill="rgba(240,225,200,0.88)" />
          <circle cx="268" cy="252" r="42" fill="url(#irisGrad)" />
          {/* Iris texture rings */}
          {[28, 35, 40].map(r => (
            <circle key={r} cx="268" cy="252" r={r} fill="none" stroke="rgba(60,35,15,0.30)" strokeWidth="0.8" />
          ))}
          {/* Pupil */}
          <circle cx="268" cy="252" r="20" fill="url(#pupilGrad)" />
          {/* Specular highlight — lamp reflection */}
          <ellipse cx="280" cy="242" rx="7" ry="5" fill="rgba(255,210,100,0.65)" />
          <ellipse cx="255" cy="258" rx="3" ry="2" fill="rgba(255,240,220,0.30)" />
          {/* Upper eyelid — heavy, drooping */}
          <motion.path d={blink
            ? "M153 250 Q268 302 383 250"
            : "M153 220 Q268 195 383 220"}
            fill="rgba(155,105,68,0.95)"
            transition={{ duration: blink ? 0.08 : 0.12 }} />
          {/* Eyelid fold shadow */}
          {!blink && <path d="M153 226 Q268 202 383 226" fill="none" stroke="rgba(100,60,35,0.45)" strokeWidth="3" />}
          {/* Lower eyelid */}
          <path d="M153 278 Q268 295 383 278" fill="rgba(155,105,68,0.90)" />
          {/* Eyelashes top */}
          {!blink && [165,200,235,268,300,335,370].map(x => (
            <line key={x} x1={x} y1={x < 268 ? 220 + (268-x)*0.04 : 220 + (x-268)*0.04}
              x2={x - 2} y2={x < 268 ? 208 + (268-x)*0.03 : 208 + (x-268)*0.03}
              stroke="rgba(10,6,4,0.90)" strokeWidth="2.5" />
          ))}
          {/* Bloodshot lines */}
          {[[-15,8],[12,-6],[-8,-12],[18,10],[5,14]].map(([dx,dy], i) => (
            <line key={i} x1={268 + dx} y1={252 + dy}
              x2={268 + dx + dx * 1.4} y2={252 + dy + dy * 1.2}
              stroke="rgba(200,50,50,0.28)" strokeWidth="0.8" />
          ))}

          {/* RIGHT EYE */}
          <ellipse cx="632" cy="250" rx="115" ry="52" fill="rgba(240,225,200,0.88)" />
          <circle cx="632" cy="252" r="42" fill="url(#irisGrad)" />
          {[28, 35, 40].map(r => (
            <circle key={r} cx="632" cy="252" r={r} fill="none" stroke="rgba(60,35,15,0.30)" strokeWidth="0.8" />
          ))}
          <circle cx="632" cy="252" r="20" fill="url(#pupilGrad)" />
          <ellipse cx="644" cy="242" rx="7" ry="5" fill="rgba(255,210,100,0.65)" />
          <ellipse cx="619" cy="258" rx="3" ry="2" fill="rgba(255,240,220,0.30)" />
          <motion.path d={blink
            ? "M517 250 Q632 302 747 250"
            : "M517 220 Q632 195 747 220"}
            fill="rgba(155,105,68,0.95)"
            transition={{ duration: blink ? 0.08 : 0.12 }} />
          {!blink && <path d="M517 226 Q632 202 747 226" fill="none" stroke="rgba(100,60,35,0.45)" strokeWidth="3" />}
          <path d="M517 278 Q632 295 747 278" fill="rgba(155,105,68,0.90)" />
          {!blink && [529,564,599,632,664,699,734].map(x => (
            <line key={x} x1={x} y1={x < 632 ? 220 + (632-x)*0.04 : 220 + (x-632)*0.04}
              x2={x - 2} y2={x < 632 ? 208 + (632-x)*0.03 : 208 + (x-632)*0.03}
              stroke="rgba(10,6,4,0.90)" strokeWidth="2.5" />
          ))}
          {[[-15,8],[12,-6],[-8,-12],[18,10],[5,14]].map(([dx,dy], i) => (
            <line key={i} x1={632 + dx} y1={252 + dy}
              x2={632 + dx + dx * 1.4} y2={252 + dy + dy * 1.2}
              stroke="rgba(200,50,50,0.28)" strokeWidth="0.8" />
          ))}

          {/* Eyebrows — furrowed, sleep-deprived */}
          <path d="M150 180 Q268 165 385 175" fill="none" stroke="rgba(8,4,2,0.85)" strokeWidth="10" strokeLinecap="round" />
          <path d="M515 175 Q632 165 748 180" fill="none" stroke="rgba(8,4,2,0.85)" strokeWidth="10" strokeLinecap="round" />
          {/* Eyebrow furrow line */}
          <path d="M385 180 Q415 170 420 175" fill="none" stroke="rgba(8,4,2,0.50)" strokeWidth="5" strokeLinecap="round" />
          <path d="M480 175 Q490 170 515 180" fill="none" stroke="rgba(8,4,2,0.50)" strokeWidth="5" strokeLinecap="round" />

          {/* Moving eyes — scanning text, then look up slightly */}
          <motion.g animate={{ x: [-6, 4, -3, 6, -4, 0], y: [2, -1, 3, 0, -2, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
            {/* Subtle pupil shift overlay */}
            <circle cx="268" cy="252" r="5" fill="rgba(0,0,0,0.20)" />
            <circle cx="632" cy="252" r="5" fill="rgba(0,0,0,0.20)" />
          </motion.g>
        </svg>
      </div>

      {/* Extreme vignette — only eyes visible */}
      <div className="absolute inset-0 pointer-events-none z-[12]" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.92) 100%)',
      }} />
    </CinematicCamera>
  );
}

// ─── SHOT 5 — OVER-SHOULDER: NOTEBOOK SYLLABUS ───────────────────────────
function Shot5() {
  const topics = [
    'Upper Limb – Complete', 'Lower Limb – Complete', 'Thorax & Mediastinum',
    'Abdomen & Pelvis', 'Head & Neck', 'Neuroanatomy',
    'Cardiovascular Physiology', 'Renal Physiology', 'Respiratory Physiology',
    'Endocrinology', 'GIT Physiology', 'Biochemistry – Metabolism',
    'Enzymes & Vitamins', 'Molecular Biology', 'Immunology basics',
    'Microbiology – Bacteriology', 'Parasitology', 'Virology →',
  ];
  return (
    <CinematicCamera zoom={[1.0, 1.09]} origin="55% 60%" duration={6}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 55% 60%, #120e04 0%, #080604 55%, #030204 100%)',
      }} />

      <div className="absolute inset-0 pointer-events-none z-[4]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="pageGlow"><feGaussianBlur stdDeviation="1.5"/></filter>
          </defs>
          {/* Student body — over-shoulder view, we see their back */}
          {/* Dark hoodie back */}
          <ellipse cx="280" cy="420" rx="110" ry="80" fill="rgba(12,8,10,0.92)" />
          <ellipse cx="280" cy="340" rx="65" ry="72" fill="rgba(14,10,12,0.90)" />
          {/* Head */}
          <ellipse cx="280" cy="255" rx="50" ry="56" fill="rgba(170,120,80,0.50)" />
          {/* Curly hair from behind */}
          <ellipse cx="280" cy="218" rx="52" ry="36" fill="rgba(8,4,2,0.96)" />
          {[0,1,2,3,4,5,6,7].map(i => (
            <ellipse key={i} cx={246 + i * 9} cy={215 + (i % 3) * 4} rx="6" ry="5" fill="rgba(6,2,2,0.92)" />
          ))}
          {/* Shoulder slope */}
          <path d="M170 350 Q200 310 280 295 Q360 310 390 350" fill="rgba(14,10,12,0.88)" />

          {/* Right arm extended forward to write */}
          <path d="M370 350 Q460 360 530 370" fill="none" stroke="rgba(14,10,12,0.85)" strokeWidth="32" strokeLinecap="round" />
          {/* Hand holding pen */}
          <ellipse cx="530" cy="370" rx="18" ry="12" fill="rgba(170,120,80,0.55)" />
          {/* Pen */}
          <rect x="532" y="352" width="3" height="38" fill="rgba(20,12,8,0.90)" rx="1.5" style={{ transform: 'rotate(12deg)', transformOrigin: '534px 368px' }} />

          {/* NOTEBOOK — large, center-right, lamp-lit */}
          {/* Notebook body */}
          <rect x="430" y="185" width="380" height="280" fill="rgba(235,228,210,0.92)" rx="3" />
          {/* Notebook spine */}
          <rect x="430" y="185" width="22" height="280" fill="rgba(180,140,80,0.70)" rx="2" />
          {/* Spiral rings */}
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <ellipse key={i} cx="441" cy={205 + i * 28} rx="8" ry="6"
              fill="none" stroke="rgba(100,70,30,0.60)" strokeWidth="2" />
          ))}
          {/* Red margin line */}
          <line x1="498" y1="190" x2="498" y2="460" stroke="rgba(200,60,60,0.40)" strokeWidth="1.5" />
          {/* Blue lines */}
          {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <line key={i} x1="456" y1={210 + i * 18} x2="800" y2={210 + i * 18}
              stroke="rgba(140,160,220,0.25)" strokeWidth="0.8" />
          ))}

          {/* Syllabus topic list — handwritten style */}
          {topics.map((topic, i) => {
            const isChecked = i < 3;
            const isCurrent = i === 3;
            return (
              <motion.g key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.12, duration: 0.4 }}>
                {/* Checkbox */}
                <rect x={505} y={202 + i * 14} width={8} height={8} fill="none"
                  stroke="rgba(30,20,10,0.60)" strokeWidth="1" />
                {isChecked && (
                  <path d={`M507 ${207 + i * 14} L510 ${211 + i * 14} L514 ${203 + i * 14}`}
                    fill="none" stroke="rgba(40,140,40,0.65)" strokeWidth="1.5" />
                )}
                {/* Topic text */}
                <text x={520} y={210 + i * 14} fill={isChecked ? 'rgba(40,140,40,0.50)' : isCurrent ? 'rgba(20,10,5,0.85)' : 'rgba(20,10,5,0.70)'}
                  fontSize={isCurrent ? "7.5" : "7"} fontFamily="Georgia, serif"
                  style={isChecked ? { textDecoration: 'line-through' } : {}}>
                  {topic}
                </text>
                {/* Current item highlight */}
                {isCurrent && (
                  <rect x={502} y={200 + i * 14} width={298} height={12}
                    fill="rgba(255,200,80,0.12)" />
                )}
              </motion.g>
            );
          })}

          {/* "…and 40 more pages" overflow note */}
          <motion.text x="680" y="442" fill="rgba(180,40,40,0.55)" fontSize="7" fontFamily="Georgia,serif" fontStyle="italic"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.8 }}>
            …and 40 more pages
          </motion.text>

          {/* Lamp glow on notebook */}
          <ellipse cx="615" cy="310" rx="200" ry="130" fill="rgba(255,200,80,0.06)" filter="url(#pageGlow)" />
        </svg>
      </div>

      <VolumetricLight x={70} y={20} angle={28} length={55} color="rgba(255,190,60,0.10)" show />
    </CinematicCamera>
  );
}

// ─── SHOT 6 — PEN DROPS ──────────────────────────────────────────────────
function Shot6() {
  const [dropped, setDropped] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDropped(true), 1800); return () => clearTimeout(t); }, []);
  return (
    <CinematicCamera zoom={[1.02, 1.10]} origin="50% 58%" duration={5}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 62%, #130e04 0%, #080604 55%, #030204 100%)',
      }} />

      <div className="absolute inset-0 pointer-events-none z-[4]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="deskBlur"><feGaussianBlur stdDeviation="2"/></filter>
          </defs>
          {/* Desk surface close up */}
          <rect x="0" y="330" width="900" height="170" fill="rgba(18,12,4,0.92)" />
          <rect x="0" y="330" width="900" height="4" fill="rgba(30,20,8,0.70)" />
          {/* Lamp glow pool on desk */}
          <ellipse cx="450" cy="390" rx="280" ry="80" fill="rgba(255,200,80,0.08)" filter="url(#deskBlur)" />

          {/* Notebook page — close up, lamp-lit */}
          <rect x="200" y="160" width="500" height="340" fill="rgba(232,225,208,0.90)" rx="2" />
          {/* Page lines */}
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <line key={i} x1="215" y1={195 + i * 22} x2="690" y2={195 + i * 22}
              stroke="rgba(140,160,220,0.22)" strokeWidth="0.8" />
          ))}
          {/* Red margin */}
          <line x1="255" y1="162" x2="255" y2="498" stroke="rgba(200,60,60,0.35)" strokeWidth="1.2" />
          {/* Partially written text — then stops */}
          <text x="265" y="220" fill="rgba(20,10,5,0.65)" fontSize="9" fontFamily="Georgia,serif">Brachial plexus — C5, C6, C7, C8, T1</text>
          <text x="265" y="242" fill="rgba(20,10,5,0.65)" fontSize="9" fontFamily="Georgia,serif">Roots → Trunks → Divisions → Cords → Branch</text>
          <text x="265" y="264" fill="rgba(20,10,5,0.60)" fontSize="9" fontFamily="Georgia,serif">Musculocutaneous nerve — C5,C6 — flexor</text>
          <text x="265" y="286" fill="rgba(20,10,5,0.55)" fontSize="9" fontFamily="Georgia,serif">Median nerve — C6,C7,C8,T1 — </text>
          {/* Sentence trails off here — pen dropped */}

          {/* HAND holding pen — then releasing */}
          <motion.g animate={dropped ? { y: 0, opacity: 0.4 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}>
            {/* Palm */}
            <ellipse cx="450" cy="310" rx="38" ry="28" fill="rgba(170,120,80,0.55)" />
            {/* Fingers */}
            {[0,1,2,3].map(i => (
              <rect key={i} x={415 + i * 14} y={282} width={10} height={30}
                fill="rgba(170,120,80,0.50)" rx="5"
                style={dropped ? { transform: `rotate(${(i-1.5)*12}deg) translateY(8px)`, transformOrigin: `${415 + i * 14 + 5}px 312px` } : {}} />
            ))}
            {/* Thumb */}
            <ellipse cx="488" cy="302" rx="10" ry="18" fill="rgba(170,120,80,0.50)" />
          </motion.g>

          {/* PEN — falls with slow rotation */}
          <motion.g
            animate={dropped
              ? { y: [0, 40, 95], rotate: [0, 25, 55], opacity: [1, 1, 0.8] }
              : { y: 0, rotate: 0, opacity: 1 }}
            transition={dropped ? { duration: 1.2, ease: [0.25, 0.1, 0.35, 1] } : {}}
            style={{ transformOrigin: '450px 300px' }}>
            {/* Pen body */}
            <rect x="447" y="265" width="6" height="55" fill="rgba(20,14,10,0.92)" rx="3" />
            {/* Pen clip */}
            <rect x="450" y="268" width="2" height="42" fill="rgba(35,24,12,0.80)" rx="1" />
            {/* Pen tip */}
            <polygon points="447,320 453,320 450,332" fill="rgba(10,6,4,0.95)" />
            {/* Ink dot */}
            <circle cx="450" cy="333" r="2" fill="rgba(30,20,60,0.70)" />
          </motion.g>

          {/* Pen hitting desk — ink splat */}
          {dropped && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0.4] }}
              transition={{ delay: 1.1, duration: 0.5 }}>
              <circle cx="450" cy="425" r="3" fill="rgba(30,20,60,0.50)" />
              <ellipse cx="455" cy="425" rx="6" ry="2" fill="rgba(30,20,60,0.25)" style={{ transform: 'rotate(20deg)', transformOrigin: '450px 425px' }} />
            </motion.g>
          )}
        </svg>
      </div>

      {/* Slow mo depth of field blur — edges */}
      <div className="absolute inset-0 pointer-events-none z-[12]" style={{
        background: 'radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.75) 100%)',
      }} />
    </CinematicCamera>
  );
}

// ─── SHOT 7 — SIDE PROFILE: LEANS BACK ───────────────────────────────────
function Shot7() {
  const [leanedBack, setLeanedBack] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLeanedBack(true), 1500); return () => clearTimeout(t); }, []);
  return (
    <CinematicCamera zoom={[1.0, 1.06]} panX={['0%', '1.5%']} origin="48% 50%" duration={6}>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(165deg, #0a0810 0%, #060408 55%, #020206 100%)',
      }} />

      <div className="absolute inset-0 pointer-events-none z-[4]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="lampSide" cx="78%" cy="35%" r="28%">
              <stop offset="0%" stopColor="rgba(255,190,60,0.22)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="sideSoft"><feGaussianBlur stdDeviation="2.5"/></filter>
          </defs>
          {/* Room wall background */}
          <rect x="0" y="0" width="900" height="330" fill="rgba(6,4,10,0.90)" />
          <rect x="0" y="330" width="900" height="170" fill="rgba(4,3,7,0.95)" />

          {/* Lamp glow — side */}
          <ellipse cx="700" cy="180" rx="220" ry="160" fill="url(#lampSide)" />

          {/* Books visible on desk — side view */}
          <rect x="0" y="305" width="900" height="30" fill="rgba(16,12,4,0.88)" />
          {/* Book spines — side-on */}
          {[[80,55,260,'rgba(80,15,12,0.80)'],[140,48,255,'rgba(10,35,70,0.80)'],[192,52,258,'rgba(30,55,10,0.75)'],[246,60,252,'rgba(14,10,8,0.80)']].map(([x,w,y,c],i) => (
            <rect key={i} x={x as number} y={y as number} width={w as number} height={55} fill={c as string} rx="1" />
          ))}

          {/* STUDENT — pure side profile */}
          <motion.g
            animate={leanedBack ? { y: [-18], rotate: [0] } : { y: [0] }}
            transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}>
            {/* Chair */}
            <rect x="320" y="295" width="160" height="12" fill="rgba(14,10,8,0.85)" rx="2" />
            {/* Chair back */}
            <motion.rect x="466" y="230" width="10" height="78" fill="rgba(14,10,8,0.85)" rx="2"
              animate={leanedBack ? { rotate: 15 } : { rotate: 0 }}
              style={{ transformOrigin: '471px 305px' }}
              transition={{ duration: 1.4 }} />
            {/* Body — dark hoodie, side view */}
            <motion.g
              animate={leanedBack ? { rotate: 14 } : { rotate: 0 }}
              style={{ transformOrigin: '400px 295px' }}
              transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}>
              {/* Torso */}
              <path d="M370 235 Q375 225 390 220 L430 220 Q445 225 448 240 L448 295 L368 295 Z" fill="rgba(14,10,12,0.92)" />
              {/* Upper arm */}
              <path d="M370 235 Q345 258 335 285 L355 290 Q360 268 380 248 Z" fill="rgba(14,10,12,0.88)" />
              {/* Forearm resting on desk */}
              <rect x="300" y="290" width="80" height="18" fill="rgba(170,120,80,0.42)" rx="5" />
              {/* Head + neck */}
              <ellipse cx="408" cy="198" rx="40" ry="45" fill="rgba(175,125,82,0.55)" />
              {/* Hair — profile, curly top */}
              <path d="M370 180 Q380 155 408 148 Q436 148 444 165 Q448 172 446 180" fill="rgba(8,4,2,0.95)" />
              {[0,1,2,3,4].map(i => (
                <ellipse key={i} cx={375 + i * 14} cy={162 + (i === 2 ? -4 : 0)} rx="9" ry="7" fill="rgba(6,3,2,0.92)" />
              ))}
              {/* Nose profile */}
              <path d="M444 195 Q452 198 448 208 L444 210" fill="none" stroke="rgba(130,90,58,0.40)" strokeWidth="3" strokeLinecap="round" />
              {/* Chin */}
              <path d="M440 220 Q444 228 440 232 Q434 236 426 232" fill="none" stroke="rgba(130,90,58,0.30)" strokeWidth="2" />
              {/* Eye — side view, just one visible */}
              <ellipse cx="438" cy="194" rx="8" ry="5.5" fill="rgba(8,4,2,0.80)" />
              <ellipse cx="440" cy="194" rx="4" ry="4" fill="rgba(50,30,15,0.85)" />
              <ellipse cx="440" cy="194" rx="2" ry="2" fill="rgba(4,2,1,0.95)" />
              {/* Slight beard stubble — profile */}
              <ellipse cx="432" cy="222" rx="18" ry="8" fill="rgba(6,3,2,0.40)" />
              {/* Neck */}
              <rect x="395" y="232" width="28" height="22" fill="rgba(165,118,78,0.50)" />
            </motion.g>
          </motion.g>

          {/* Empty space beside student — emphasizes isolation */}
          {/* Rain reflection in eyes (light ripple on wall) */}
          <motion.div style={{ position: 'absolute', left: '30%', top: '25%',
            width: 120, height: 80, borderRadius: '50%', pointerEvents: 'none',
            background: 'rgba(140,180,220,0.04)', filter: 'blur(8px)' }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        </svg>
      </div>

      {/* Window with rain behind student */}
      <motion.div className="absolute pointer-events-none z-[2]"
        style={{ left: '2%', top: '8%', width: '12%', height: '35%',
          background: 'rgba(8,12,22,0.75)',
          border: '6px solid rgba(16,10,8,0.85)', borderRadius: 2 }}>
        <Rain intensity={18} show />
      </motion.div>
    </CinematicCamera>
  );
}

// ─── SHOT 8 — FACE CU: DETERMINATION → DOUBT ─────────────────────────────
function Shot8() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1600);
    const t2 = setTimeout(() => setPhase(2), 3600);
    const t3 = setTimeout(() => setPhase(3), 5400);
    return () => [t1,t2,t3].forEach(clearTimeout);
  }, []);
  return (
    <CinematicCamera zoom={[1.0, 1.05]} origin="50% 45%" duration={6}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 42%, #120e04 0%, #080604 50%, #030204 100%)',
      }} />

      <div className="absolute inset-0 pointer-events-none z-[4]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="faceLight8" cx="50%" cy="42%" r="50%">
              <stop offset="0%" stopColor="rgba(255,195,70,0.25)" />
              <stop offset="70%" stopColor="rgba(255,180,50,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="faceBlur8"><feGaussianBlur stdDeviation="1.2"/></filter>
          </defs>
          {/* Lamp warm glow on face */}
          <ellipse cx="450" cy="250" rx="320" ry="250" fill="url(#faceLight8)" />

          {/* FACE — full frontal close-up */}
          {/* Neck */}
          <rect x="415" y="350" width="70" height="80" fill="rgba(168,118,78,0.50)" rx="4" />
          {/* Jaw / face shape */}
          <ellipse cx="450" cy="260" rx="130" ry="155" fill="rgba(172,122,80,0.55)" />
          {/* Ears */}
          <ellipse cx="320" cy="258" rx="18" ry="26" fill="rgba(168,118,78,0.50)" />
          <ellipse cx="580" cy="258" rx="18" ry="26" fill="rgba(168,118,78,0.50)" />

          {/* Hair — curly, filling top of frame */}
          <ellipse cx="450" cy="140" rx="140" ry="80" fill="rgba(8,4,2,0.96)" />
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <ellipse key={i} cx={320 + i * 26} cy={142 + Math.abs(i-4.5) * 5} rx="16" ry="13"
              fill="rgba(6,3,2,0.95)" />
          ))}
          {/* Hair sides */}
          <ellipse cx="330" cy="200" rx="22" ry="42" fill="rgba(8,4,2,0.90)" />
          <ellipse cx="570" cy="200" rx="22" ry="42" fill="rgba(8,4,2,0.90)" />

          {/* EYEBROWS — phase 0: set, confident; phase 2: furrowed and falling */}
          <motion.path
            animate={phase >= 2
              ? { d: "M340 195 Q390 198 420 205" }
              : { d: "M340 192 Q390 188 420 194" }}
            fill="none" stroke="rgba(8,4,2,0.88)" strokeWidth="9" strokeLinecap="round"
            transition={{ duration: 0.9 }} />
          <motion.path
            animate={phase >= 2
              ? { d: "M480 205 Q510 198 560 195" }
              : { d: "M480 194 Q510 188 560 192" }}
            fill="none" stroke="rgba(8,4,2,0.88)" strokeWidth="9" strokeLinecap="round"
            transition={{ duration: 0.9 }} />
          {/* Worry furrow between brows */}
          <motion.path
            animate={{ opacity: phase >= 2 ? 1 : 0, d: phase >= 2 ? "M425 202 Q435 196 445 200 Q455 204 465 200 Q475 196 480 202" : "M440 202 Q450 200 460 202" }}
            fill="none" stroke="rgba(8,4,2,0.40)" strokeWidth="4" strokeLinecap="round"
            transition={{ duration: 0.8 }} />

          {/* LEFT EYE */}
          <ellipse cx="385" cy="248" rx="55" ry="28" fill="rgba(240,225,200,0.85)" />
          <circle cx="385" cy="248" r="22" fill="rgba(50,30,14,0.90)" />
          <circle cx="385" cy="248" r="12" fill="rgba(6,3,2,0.95)" />
          <ellipse cx="394" cy="240" rx="5" ry="3.5" fill="rgba(255,215,110,0.60)" />
          {/* Eyelid droopiness increases with phase */}
          <motion.path
            animate={phase >= 1
              ? { d: "M330 235 Q385 218 440 235" }
              : { d: "M330 228 Q385 210 440 228" }}
            fill="rgba(162,112,72,0.96)"
            transition={{ duration: 1.0 }} />

          {/* RIGHT EYE */}
          <ellipse cx="515" cy="248" rx="55" ry="28" fill="rgba(240,225,200,0.85)" />
          <circle cx="515" cy="248" r="22" fill="rgba(50,30,14,0.90)" />
          <circle cx="515" cy="248" r="12" fill="rgba(6,3,2,0.95)" />
          <ellipse cx="524" cy="240" rx="5" ry="3.5" fill="rgba(255,215,110,0.60)" />
          <motion.path
            animate={phase >= 1
              ? { d: "M460 235 Q515 218 570 235" }
              : { d: "M460 228 Q515 210 570 228" }}
            fill="rgba(162,112,72,0.96)"
            transition={{ duration: 1.0 }} />

          {/* Nose */}
          <path d="M440 265 Q434 290 437 302 Q443 308 450 308 Q457 308 463 302 Q466 290 460 265" fill="none" stroke="rgba(130,88,55,0.30)" strokeWidth="3" />
          {/* Nostrils */}
          <ellipse cx="441" cy="304" rx="7" ry="4" fill="rgba(140,95,60,0.30)" />
          <ellipse cx="459" cy="304" rx="7" ry="4" fill="rgba(140,95,60,0.30)" />

          {/* MOUTH — phase 0: slightly set/determined; phase 2: corners drop */}
          <motion.path
            animate={phase >= 2
              ? { d: "M400 338 Q420 335 450 338 Q480 335 500 338" }
              : phase >= 1
              ? { d: "M400 335 Q425 340 450 338 Q475 340 500 335" }
              : { d: "M400 332 Q425 335 450 332 Q475 335 500 332" }}
            fill="none" stroke="rgba(120,78,48,0.55)" strokeWidth="4" strokeLinecap="round"
            transition={{ duration: 1.0 }} />
          {/* Slight beard */}
          <ellipse cx="450" cy="332" rx="65" ry="22" fill="rgba(6,3,2,0.28)" />

          {/* Phase 3 — tears forming in eyes */}
          {phase >= 3 && (
            <>
              <motion.ellipse cx="380" cy="268" rx="6" ry="4" fill="rgba(180,210,240,0.45)"
                initial={{ opacity: 0, ry: 1 }} animate={{ opacity: 0.8, ry: 4 }}
                transition={{ duration: 0.8 }} />
              <motion.ellipse cx="510" cy="268" rx="6" ry="4" fill="rgba(180,210,240,0.45)"
                initial={{ opacity: 0, ry: 1 }} animate={{ opacity: 0.8, ry: 4 }}
                transition={{ duration: 0.8, delay: 0.3 }} />
            </>
          )}
        </svg>
      </div>

      {/* Stage label */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div className="absolute pointer-events-none z-[30]"
            style={{ top: '14%', right: '8%' }}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}>
            <p style={{ fontSize: 'clamp(0.40rem,0.72vw,0.58rem)', letterSpacing: '0.32em',
              color: 'rgba(200,163,64,0.45)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Am I good enough?
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </CinematicCamera>
  );
}

// ─── SHOT 9 — SLOW ORBIT, ROOM GROWS ─────────────────────────────────────
function Shot9() {
  return (
    <motion.div className="absolute inset-0"
      animate={{ scale: [1.0, 0.88], rotateY: [0, 6], perspective: 900 }}
      transition={{ duration: 6, ease: [0.25, 0.1, 0.35, 1] }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 45% 55%, #0e0c06 0%, #060408 40%, #020208 100%)',
      }} />

      {/* Wide room — student small in frame */}
      <div className="absolute inset-0 pointer-events-none z-[4]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="roomSoft"><feGaussianBlur stdDeviation="1.5"/></filter>
            <radialGradient id="lampRoom" cx="65%" cy="48%" r="30%">
              <stop offset="0%" stopColor="rgba(255,190,60,0.20)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          {/* Room walls — wider, more oppressive */}
          <rect x="0" y="0" width="900" height="340" fill="rgba(5,3,8,0.92)" />
          <rect x="0" y="340" width="900" height="160" fill="rgba(3,2,6,0.96)" />
          {/* Room corner lines — converging perspective */}
          <line x1="0" y1="0" x2="180" y2="340" stroke="rgba(20,12,30,0.50)" strokeWidth="1.5" />
          <line x1="900" y1="0" x2="720" y2="340" stroke="rgba(20,12,30,0.50)" strokeWidth="1.5" />

          {/* Ceiling light strips — cold fluorescent, mostly off */}
          {[0.20, 0.50, 0.78].map((x, i) => (
            <motion.rect key={i} x={`${x * 900 - 60}`} y="8" width="120" height="3"
              fill={i === 1 ? "rgba(180,160,220,0.15)" : "rgba(30,20,40,0.20)"}
              animate={{ opacity: i === 1 ? [0.1, 0.2, 0.1] : 0.05 }}
              transition={{ duration: 4, repeat: Infinity }} />
          ))}

          {/* Lamp glow — distant, small */}
          <ellipse cx="585" cy="250" rx="160" ry="110" fill="url(#lampRoom)" />

          {/* Books on floor, scattered */}
          {[[80,340,90,28,'rgba(80,15,12,0.70)'],[190,345,75,22,'rgba(10,35,70,0.65)'],[700,342,85,26,'rgba(30,55,10,0.60)'],[780,350,65,18,'rgba(60,40,10,0.65)']].map(([x,y,w,h,c],i) => (
            <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} fill={c as string} rx="1" />
          ))}

          {/* Desk — small, far in frame */}
          <rect x="400" y="300" width="310" height="42" fill="rgba(18,12,4,0.85)" />

          {/* STUDENT — small, isolated in large room */}
          <motion.g animate={{ scale: [1, 0.94] }} style={{ transformOrigin: '545px 295px' }}
            transition={{ duration: 6, ease: 'easeOut' }}>
            {/* Chair */}
            <rect x="498" y="310" width="96" height="8" fill="rgba(14,10,8,0.80)" rx="2" />
            <rect x="580" y="258" width="8" height="60" fill="rgba(14,10,8,0.80)" rx="2" />
            {/* Body */}
            <rect x="505" y="260" width="56" height="55" fill="rgba(14,10,12,0.88)" rx="5" />
            {/* Head */}
            <ellipse cx="533" cy="246" rx="26" ry="30" fill="rgba(172,122,80,0.52)" />
            {/* Hair */}
            <ellipse cx="533" cy="225" rx="28" ry="18" fill="rgba(8,4,2,0.94)" />
            {/* Lamp */}
            <rect x="640" y="238" width="7" height="65" fill="rgba(30,20,10,0.80)" rx="2" />
            <ellipse cx="644" cy="236" rx="20" ry="8" fill="rgba(44,28,10,0.80)" />
          </motion.g>

          {/* Empty chair / space — amplifies isolation */}
          <rect x="130" y="310" width="90" height="8" fill="rgba(12,8,6,0.50)" rx="2" />
          <rect x="215" y="268" width="7" height="50" fill="rgba(12,8,6,0.50)" rx="2" />

          {/* Room dimensions text — invisible to viewer but felt */}
          {/* Cobwebs / neglect in corners */}
          <path d="M0 0 L40 30 M0 0 L20 45 M0 0 L50 10" stroke="rgba(40,30,50,0.25)" strokeWidth="0.5" />
          <path d="M900 0 L860 30 M900 0 L880 45 M900 0 L850 10" stroke="rgba(40,30,50,0.25)" strokeWidth="0.5" />
        </svg>
      </div>
    </motion.div>
  );
}

// ─── SHOT 10 — BLANK NOTEBOOK PAGE ──────────────────────────────────────
function Shot10() {
  return (
    <CinematicCamera zoom={[1.0, 1.04]} origin="50% 55%" duration={5}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 60%, #100c04 0%, #060404 55%, #020202 100%)',
      }} />

      <div className="absolute inset-0 pointer-events-none z-[4]">
        <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="pageGlow10"><feGaussianBlur stdDeviation="2.5"/></filter>
            <radialGradient id="lampPage" cx="50%" cy="42%" r="48%">
              <stop offset="0%" stopColor="rgba(255,200,80,0.18)" />
              <stop offset="70%" stopColor="rgba(255,180,50,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          {/* Desk surface */}
          <rect x="0" y="340" width="900" height="160" fill="rgba(14,10,4,0.90)" />
          <rect x="0" y="340" width="900" height="3" fill="rgba(28,18,8,0.70)" />

          {/* Lamp glow on desk */}
          <ellipse cx="450" cy="380" rx="300" ry="90" fill="url(#lampPage)" />

          {/* BLANK NOTEBOOK — center stage */}
          <rect x="210" y="130" width="480" height="340" fill="rgba(235,228,210,0.93)" rx="3" />
          {/* Spiral binding */}
          <rect x="210" y="130" width="26" height="340" fill="rgba(185,145,85,0.70)" rx="2" />
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
            <ellipse key={i} cx="223" cy={150 + i * 28} rx="10" ry="7"
              fill="none" stroke="rgba(100,70,30,0.60)" strokeWidth="2" />
          ))}
          {/* Red margin line */}
          <line x1="272" y1="135" x2="272" y2="465" stroke="rgba(200,60,60,0.38)" strokeWidth="1.5" />
          {/* Ruled lines — blue */}
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
            <line key={i} x1="242" y1={162 + i * 22} x2="678" y2={162 + i * 22}
              stroke="rgba(140,160,220,0.22)" strokeWidth="0.8" />
          ))}

          {/* THE PAGE IS BLANK */}
          {/* Just the lamp light playing across it */}
          <motion.ellipse cx="450" cy="300" rx="180" ry="120" fill="rgba(255,210,90,0.05)"
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3.5, repeat: Infinity }} />

          {/* Student's shadow — hand resting but not writing */}
          <ellipse cx="360" cy="440" rx="70" ry="18" fill="rgba(0,0,0,0.35)" filter="url(#pageGlow10)" />
          <rect x="300" y="420" width="120" height="22" fill="rgba(165,118,78,0.35)" rx="6" />

          {/* Pen — lying untouched beside notebook */}
          <rect x="700" y="370" width="5" height="54" fill="rgba(20,14,10,0.75)" rx="2.5"
            style={{ transform: 'rotate(-12deg)', transformOrigin: '702px 395px' }} />

          {/* Lamp */}
          <rect x="742" y="175" width="9" height="170" fill="rgba(32,20,10,0.80)" rx="2" />
          <ellipse cx="746" cy="172" rx="28" ry="11" fill="rgba(44,28,10,0.80)" />
          <motion.ellipse cx="746" cy="172" rx="28" ry="11" fill="rgba(255,200,80,0.18)"
            animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }} />
        </svg>
      </div>

      {/* Extreme vignette — feels final, heavy */}
      <div className="absolute inset-0 pointer-events-none z-[12]" style={{
        background: 'radial-gradient(ellipse at 50% 58%, transparent 28%, rgba(0,0,0,0.45) 58%, rgba(0,0,0,0.88) 100%)',
      }} />

      {/* Voiceover text */}
      <AnimeText
        lines={["Sometimes…", "you begin to wonder if you're falling behind."]}
        show accent="rgba(200,163,64,0.75)"
        sub bottom="20%"
      />
    </CinematicCamera>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════

const SHOTS = [Shot1, Shot2, Shot3, Shot4, Shot5, Shot6, Shot7, Shot8, Shot9, Shot10];

export function Scene1() {
  const shot = useShot();
  const ShotComponent = SHOTS[shot];

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}>

      {/* Shot cross-dissolve */}
      <AnimatePresence mode="sync">
        <motion.div key={`shot-${shot}`} className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}>
          <ShotComponent />
        </motion.div>
      </AnimatePresence>

      {/* Shot number counter — tiny, cinematic */}
      <motion.div className="absolute pointer-events-none z-[80]"
        style={{ top: '14%', left: '7%' }}
        key={`counter-${shot}`}
        initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}>
        <p style={{ fontSize: 'clamp(0.38rem,0.65vw,0.52rem)', letterSpacing: '0.28em',
          color: 'rgba(200,163,64,0.70)', fontFamily: 'monospace' }}>
          {String(shot + 1).padStart(2, '0')} / 10
        </p>
      </motion.div>

      {/* Chapter title — appears on shot 1 */}
      <ChapterTitle chapter="Scene I" title="The Struggle" show={shot === 0} />

      {/* ── Persistent overlays ── */}
      <Vignette strength={0.85} />
      <BottomGrad color="2,1,6" />
      <FilmGrain opacity={0.32} />
      <CinemaBars />
    </motion.div>
  );
}
