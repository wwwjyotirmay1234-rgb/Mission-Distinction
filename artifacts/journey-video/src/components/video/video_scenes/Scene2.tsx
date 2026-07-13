import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, VolumetricLight, FloatingParticles, SpeedLines
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE 2 — THE SPARK   (12 000 ms)
//  Five friends. A hostel room. One lightbulb moment.
// ════════════════════════════════════════════════════════════════════════

// Five PIXAR-style founders at table — each with unique face & expression
function FoundersAtTable({ show, lit }: { show: boolean; lit: boolean }) {
  // Each founder: position, skin, hair, shirt, eye-color, expression type
  const F = [
    { x: 112, skin:'#c07848', hair:'#1c0d04', shirt:'#6b3520', ec:'#5a3010', mood:'excited'    },
    { x: 236, skin:'#7a4a28', hair:'#130a04', shirt:'#344860', ec:'#3a2010', mood:'thoughtful' },
    { x: 372, skin:'#c89060', hair:'#1a0d06', shirt:'#1e2f4a', ec:'#4a2a14', mood:'leader'     },
    { x: 502, skin:'#b06830', hair:'#160c04', shirt:'#2a3a28', ec:'#3e2010', mood:'focused'    },
    { x: 622, skin:'#d0a070', hair:'#220e06', shirt:'#4a2030', ec:'#4c2c14', mood:'animated'   },
  ];
  const hc = 126; // head-center y

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[10]"
          style={{ left: '8%', right: '8%', bottom: '22%', height: '50%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 760 280" width="100%" height="100%">
            <defs>
              <filter id="glow2"><feGaussianBlur stdDeviation="4"/></filter>
              <filter id="softf"><feGaussianBlur stdDeviation="2"/></filter>
            </defs>

            {/* ── TABLE ── */}
            <ellipse cx="380" cy="252" rx="330" ry="28"
              fill="rgba(30,20,10,0.94)" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.80))' }} />
            <ellipse cx="380" cy="247" rx="292" ry="14" fill="rgba(55,38,18,0.60)" />
            {lit && <ellipse cx="380" cy="242" rx="130" ry="14" fill="rgba(255,200,60,0.18)" style={{ filter: 'blur(8px)' }} />}

            {/* Papers & pens */}
            {[148,262,342,442,542].map((px, i) => (
              <g key={i}>
                <rect x={px} y={220} width={66} height={44} rx="2" fill="rgba(220,210,185,0.38)"
                  style={{ transform:`rotate(${(i-2)*5}deg)`, transformOrigin:`${px+33}px 242px` }}/>
                <line x1={px+8} y1={230} x2={px+58} y2={230} stroke="rgba(40,30,14,0.22)" strokeWidth="1.5"/>
                <line x1={px+8} y1={238} x2={px+52} y2={238} stroke="rgba(40,30,14,0.18)" strokeWidth="1.4"/>
              </g>
            ))}
            <line x1="318" y1="248" x2="342" y2="260" stroke="rgba(200,163,64,0.55)" strokeWidth="3" strokeLinecap="round"/>
            <line x1="414" y1="248" x2="438" y2="258" stroke="rgba(60,120,200,0.50)" strokeWidth="3" strokeLinecap="round"/>

            {/* ── FIVE PIXAR FOUNDERS ── */}
            {F.map((f, i) => {
              const { x, skin, hair, shirt, ec, mood } = f;
              const lx = x - 8;  // left eye x
              const rx2 = x + 8; // right eye x
              const ey = hc - 6; // eye y

              // per-mood brow and mouth paths
              const brow = {
                excited:    { L: `M${x-18},${hc-22} Q${x-8},${hc-28} ${x+2},${hc-24}`,  R: `M${x+4},${hc-25} Q${x+12},${hc-30} ${x+20},${hc-22}` },
                thoughtful: { L: `M${x-18},${hc-22} Q${x-8},${hc-26} ${x+2},${hc-22}`,  R: `M${x+4},${hc-28} Q${x+12},${hc-32} ${x+20},${hc-24}` },
                leader:     { L: `M${x-18},${hc-22} Q${x-8},${hc-27} ${x+2},${hc-23}`,  R: `M${x+4},${hc-23} Q${x+12},${hc-28} ${x+20},${hc-22}` },
                focused:    { L: `M${x-18},${hc-20} Q${x-8},${hc-26} ${x+2},${hc-23}`,  R: `M${x+4},${hc-23} Q${x+12},${hc-26} ${x+20},${hc-20}` },
                animated:   { L: `M${x-18},${hc-24} Q${x-8},${hc-30} ${x+2},${hc-25}`,  R: `M${x+4},${hc-25} Q${x+12},${hc-30} ${x+20},${hc-24}` },
              }[mood];
              const mouth = {
                excited:    `M${x-10},${hc+14} Q${x},${hc+21} ${x+10},${hc+14}`,
                thoughtful: `M${x-9},${hc+15} Q${x},${hc+16} ${x+9},${hc+15}`,
                leader:     `M${x-10},${hc+14} Q${x},${hc+20} ${x+10},${hc+14}`,
                focused:    `M${x-8},${hc+15} Q${x},${hc+18} ${x+8},${hc+15}`,
                animated:   `M${x-10},${hc+13} Q${x},${hc+22} ${x+10},${hc+13}`,
              }[mood];
              const mouthOpen = mood === 'excited' || mood === 'animated';
              const lidDrop = mood === 'focused' ? 0.55 : mood === 'thoughtful' ? 0.48 : 0.35;
              const eyeW = 7.5, eyeH = 5.2;

              return (
                <motion.g key={i}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.11, duration: 0.65, ease: [0.16,1,0.3,1] }}>

                  {/* Idea glow behind each person when lit */}
                  {lit && (
                    <motion.ellipse cx={x} cy={hc} rx={32} ry={40}
                      fill={`rgba(255,200,60,0.06)`}
                      initial={{ opacity:0 }} animate={{ opacity:1 }}
                      transition={{ delay: 0.2 + i*0.09, duration:0.7 }} />
                  )}

                  {/* ── BODY (shirt) ── */}
                  <path d={`M${x-26},${hc+28} Q${x-30},${hc+34} ${x-32},${hc+60} L${x+32},${hc+60} Q${x+30},${hc+34} ${x+26},${hc+28} Z`}
                    fill={shirt}/>
                  {/* Collar */}
                  <path d={`M${x-10},${hc+22} L${x},${hc+32} L${x+10},${hc+22}`}
                    fill="rgba(0,0,0,0)" stroke={`rgba(0,0,0,0.20)`} strokeWidth="1.5"/>

                  {/* ── NECK ── */}
                  <rect x={x-6} y={hc+19} width={12} height={12} rx={5} fill={skin}/>

                  {/* ── HEAD ── */}
                  <ellipse cx={x} cy={hc} rx={21} ry={25} fill={skin}/>

                  {/* ── HAIR ── */}
                  {i === 0 && <>
                    {/* Messy creative hair */}
                    <path d={`M${x-22},${hc-14} Q${x-24},${hc-36} ${x-8},${hc-45} Q${x+2},${hc-50} ${x+14},${hc-44} Q${x+26},${hc-34} ${x+22},${hc-14}`} fill={hair}/>
                    <path d={`M${x-8},${hc-48} Q${x-6},${hc-38} ${x-4},${hc-28}`} fill={hair}/>
                    <path d={`M${x+6},${hc-48} Q${x+8},${hc-38} ${x+10},${hc-30}`} fill={hair}/>
                  </>}
                  {i === 1 && <>
                    {/* Short neat flat-top */}
                    <path d={`M${x-22},${hc-18} Q${x-22},${hc-42} ${x},${hc-46} Q${x+22},${hc-42} ${x+22},${hc-18}`} fill={hair}/>
                    <rect x={x-22} y={hc-46} width={44} height={8} rx="2" fill={hair}/>
                  </>}
                  {i === 2 && <>
                    {/* Leader — neat side-parted */}
                    <path d={`M${x-22},${hc-16} Q${x-22},${hc-44} ${x-4},${hc-48} Q${x+18},${hc-44} ${x+22},${hc-16}`} fill={hair}/>
                    <path d={`M${x-22},${hc-16} Q${x-20},${hc-46} ${x-4},${hc-48} Q${x-16},${hc-36} ${x-4},${hc-16}`} fill="rgba(0,0,0,0.12)"/>
                  </>}
                  {i === 3 && <>
                    {/* Engineer — clean cut */}
                    <path d={`M${x-21},${hc-18} Q${x-20},${hc-44} ${x},${hc-47} Q${x+20},${hc-44} ${x+21},${hc-18}`} fill={hair}/>
                  </>}
                  {i === 4 && <>
                    {/* Communicator — slightly wavy/longer */}
                    <path d={`M${x-22},${hc-12} Q${x-24},${hc-42} ${x-6},${hc-48} Q${x+8},${hc-52} ${x+22},${hc-44} Q${x+26},${hc-30} ${x+24},${hc-12}`} fill={hair}/>
                    <path d={`M${x-22},${hc-12} Q${x-24},${hc-30} ${x-22},${hc-8}`} fill={hair}/>
                  </>}

                  {/* ── EAR (right side slightly visible) ── */}
                  <ellipse cx={x+20} cy={hc+1} rx={4} ry={6} fill={`rgba(${skin.slice(1).match(/.{2}/g)!.map(h=>parseInt(h,16)).join(',')},0.80)`}/>

                  {/* ── EYE BAGS (subtle, everyone is tired from building) ── */}
                  <ellipse cx={lx} cy={ey+7} rx={8} ry={3} fill={`rgba(0,0,0,0.12)`}/>
                  <ellipse cx={rx2} cy={ey+7} rx={7} ry={2.5} fill={`rgba(0,0,0,0.10)`}/>

                  {/* ── LEFT EYE ── */}
                  <ellipse cx={lx} cy={ey} rx={eyeW} ry={eyeH} fill="rgb(248,240,228)"/>
                  <ellipse cx={lx-0.5} cy={ey+0.5} rx={4} ry={4} fill={ec}/>
                  <ellipse cx={lx-1} cy={ey+1} rx={2.3} ry={2.3} fill="#080604"/>
                  <ellipse cx={lx-2} cy={ey-1} rx={1.2} ry={1.2} fill="rgba(255,250,215,0.88)"/>
                  {/* Upper eyelid */}
                  <path d={`M${lx-eyeW},${ey} Q${lx},${ey-eyeH-1} ${lx+eyeW},${ey} Q${lx},${ey-eyeH*(1-lidDrop)} ${lx-eyeW},${ey} Z`}
                    fill={skin}/>
                  <path d={`M${lx-eyeW},${ey} Q${lx},${ey-eyeH-1} ${lx+eyeW},${ey}`}
                    stroke="#55280e" strokeWidth="1.8" fill="none"/>
                  {/* Lower lid */}
                  <path d={`M${lx-eyeW},${ey} Q${lx},${ey+eyeH+1} ${lx+eyeW},${ey}`}
                    stroke="#855030" strokeWidth="0.9" fill="none"/>

                  {/* ── RIGHT EYE ── */}
                  <ellipse cx={rx2} cy={ey} rx={eyeW-1} ry={eyeH-0.5} fill="rgb(248,240,228)"/>
                  <ellipse cx={rx2-0.5} cy={ey+0.5} rx={3.5} ry={3.5} fill={ec}/>
                  <ellipse cx={rx2-1} cy={ey+1} rx={2} ry={2} fill="#080604"/>
                  <ellipse cx={rx2-2} cy={ey-1} rx={1} ry={1} fill="rgba(255,250,215,0.85)"/>
                  <path d={`M${rx2-(eyeW-1)},${ey} Q${rx2},${ey-eyeH} ${rx2+(eyeW-1)},${ey} Q${rx2},${ey-eyeH*(1-lidDrop)} ${rx2-(eyeW-1)},${ey} Z`}
                    fill={skin}/>
                  <path d={`M${rx2-(eyeW-1)},${ey} Q${rx2},${ey-eyeH} ${rx2+(eyeW-1)},${ey}`}
                    stroke="#55280e" strokeWidth="1.6" fill="none"/>

                  {/* ── EYEBROWS ── */}
                  <path d={brow!.L} stroke="#281206" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
                  <path d={brow!.R} stroke="#281206" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

                  {/* ── NOSE (Pixar — soft nostrils) ── */}
                  <ellipse cx={x-4} cy={hc+8} rx={4} ry={2.8} fill={`rgba(0,0,0,0.14)`}/>
                  <ellipse cx={x+4} cy={hc+8} rx={4} ry={2.8} fill={`rgba(0,0,0,0.11)`}/>
                  <path d={`M${x-4},${hc+5} Q${x},${hc+10} ${x+4},${hc+5}`}
                    stroke={`rgba(0,0,0,0.20)`} strokeWidth="1.3" fill="none" strokeLinecap="round"/>

                  {/* ── MOUTH ── */}
                  <path d={mouth} stroke="#7a3820" strokeWidth="2.0" fill="none" strokeLinecap="round"/>
                  {mouthOpen && (
                    <path d={`M${x-8},${hc+15} Q${x},${hc+22} ${x+8},${hc+15} Q${x},${hc+20} ${x-8},${hc+15} Z`}
                      fill="rgba(90,40,28,0.70)"/>
                  )}
                  {(mood === 'leader' || mood === 'excited') && (
                    <path d={`M${x-7},${hc+15} Q${x},${hc+18} ${x+7},${hc+15}`}
                      stroke="rgba(230,215,200,0.55)" strokeWidth="1.2" fill="none"/>
                  )}

                  {/* ── ARMS ON TABLE ── */}
                  <path d={`M${x-20},${hc+56} Q${x-32},${hc+100} ${x-24},${hc+118}`}
                    stroke={shirt} strokeWidth="16" fill="none" strokeLinecap="round"/>
                  <path d={`M${x+20},${hc+56} Q${x+32},${hc+100} ${x+24},${hc+118}`}
                    stroke={shirt} strokeWidth="16" fill="none" strokeLinecap="round"/>
                  {/* Hands */}
                  <ellipse cx={x-24} cy={hc+122} rx={10} ry={6} fill={skin}/>
                  <ellipse cx={x+24} cy={hc+122} rx={10} ry={6} fill={skin}/>

                  {/* Lamp warmth glow on face when lit */}
                  {lit && (
                    <ellipse cx={x} cy={hc} rx={22} ry={26}
                      fill={`rgba(255,180,50,${0.06 + (i===2?0.04:0)})`}/>
                  )}
                </motion.g>
              );
            })}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hanging bare lightbulb — classic idea bulb
function LightBulb({ phase }: { phase: number }) {
  return (
    <div className="absolute pointer-events-none z-[12]"
      style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}>
      <svg viewBox="0 0 60 160" width="clamp(30px,5vw,60px)" height="clamp(80px,14vw,160px)">
        {/* Wire from ceiling */}
        <line x1="30" y1="0" x2="30" y2="50" stroke="rgba(80,60,30,0.70)" strokeWidth="2"/>
        {/* Socket */}
        <rect x="22" y="46" width="16" height="10" rx="3" fill="rgba(60,45,20,0.85)" />
        {/* Bulb glass */}
        <motion.ellipse cx="30" cy="90" rx="22" ry="30"
          fill={phase >= 2 ? 'rgba(255,235,120,0.92)' : 'rgba(30,24,14,0.80)'}
          animate={{ fill: phase >= 2 ? 'rgba(255,235,120,0.92)' : 'rgba(30,24,14,0.80)' }}
          transition={{ duration: 0.15 }}
          style={{ filter: phase >= 2 ? 'drop-shadow(0 0 20px rgba(255,200,60,0.85))' : 'none' }} />
        {/* Filament */}
        <motion.path d="M24,88 Q26,80 28,88 Q30,80 32,88 Q34,80 36,88"
          fill="none" stroke={phase >= 2 ? 'rgba(255,160,0,0.90)' : 'rgba(80,60,30,0.40)'}
          strokeWidth="1.8" strokeLinecap="round"
          animate={{ stroke: phase >= 2 ? 'rgba(255,160,0,0.90)' : 'rgba(80,60,30,0.40)' }}
          transition={{ duration: 0.15 }} />
        {/* Neck */}
        <rect x="24" y="118" width="12" height="8" rx="2" fill="rgba(60,45,20,0.80)" />
        {/* Base ring */}
        <ellipse cx="30" cy="126" rx="8" ry="3" fill="rgba(50,36,16,0.80)" />
      </svg>
    </div>
  );
}

export function Scene2() {
  const [phase, setPhase] = useState(2); // start with founders visible
  const [flash, setFlash] = useState(false);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 1800),
      setTimeout(() => {
        setFlash(true); setTimeout(() => setFlash(false), 180);
        setPhase(2);
      }, 4800),
      setTimeout(() => setPhase(3), 7500),
      setTimeout(() => setPhase(4), 9500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Hostel room — dark, late night */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 2
          ? 'linear-gradient(160deg,#100a00 0%,#1e1000 45%,#100a00 100%)'
          : 'linear-gradient(160deg,#04040c 0%,#08060e 50%,#04040c 100%)' }}
        transition={{ duration: 1.2 }} />

      {/* Room wall features — poster on wall */}
      <motion.div className="absolute pointer-events-none z-[3]"
        style={{ top: '15%', left: '6%', width: '12%', height: '18%',
          border: '2px solid rgba(60,45,20,0.50)',
          background: 'rgba(12,8,4,0.80)' }}
        animate={{ opacity: phase >= 1 ? 0.60 : 0 }} transition={{ duration: 1.2 }} />

      {/* Hanging bulb */}
      <LightBulb phase={phase} />

      {/* Warm glow pool when bulb on */}
      <VolumetricLight x={50} y={0} angle={55} length={65}
        color="rgba(255,190,60,0.20)" show={phase >= 2} />

      {/* Five founders */}
      <FoundersAtTable show={phase >= 1} lit={phase >= 2} />

      {/* Explosion ring on spark */}
      {phase >= 2 && [0, 1, 2].map(i => (
        <motion.div key={i} className="absolute pointer-events-none z-[8]"
          style={{ top: '18%', left: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%',
            border: '2px solid rgba(255,200,60,0.45)' }}
          initial={{ width: 0, height: 0, opacity: 0.9 }}
          animate={{ width: '60vmin', height: '60vmin', opacity: 0 }}
          transition={{ delay: i * 0.45, duration: 1.8, ease: 'easeOut' }} />
      ))}

      <FloatingParticles count={20} color="#ffd700" active={phase >= 2} />
      <FloatingParticles count={10} color="#ff8c00" active={phase >= 3} />
      <SpeedLines active={phase >= 4} color="rgba(255,200,50,0.65)" count={28} cx={50} cy={20} />

      <ChapterTitle chapter="Chapter II" title="The Spark" show={phase >= 4} />

      {/* White flash */}
      <motion.div className="absolute inset-0 bg-amber-100 pointer-events-none z-[95]"
        animate={{ opacity: flash ? 0.80 : 0 }} transition={{ duration: 0.05 }} />

      <Vignette strength={0.80} />
      <BottomGrad color="6,4,0" />
      <FilmGrain opacity={0.32} />
      <CinemaBars />
    </motion.div>
  );
}
