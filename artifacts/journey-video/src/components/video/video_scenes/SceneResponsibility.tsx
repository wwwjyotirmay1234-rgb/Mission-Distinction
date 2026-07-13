import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  FloatingParticles, SpeedLines, RisingSun
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE RESPONSIBILITY — 500 Was Just The Beginning   (30 500 ms)
//  Numbers grow. The weight grows. The mission grows.
// ════════════════════════════════════════════════════════════════════════

// Animated bar chart — growth over months
function GrowthChart({ show, phase }: { show: boolean; phase: number }) {
  const bars = [
    { month: 'Aug', val: 12 }, { month: 'Sep', val: 28 }, { month: 'Oct', val: 55 },
    { month: 'Nov', val: 140 }, { month: 'Dec', val: 280 }, { month: 'Jan', val: 500 },
    { month: 'Feb', val: 1200 }, { month: 'Mar', val: 2800 }, { month: 'Apr', val: 5500 },
  ];
  const max = 5500;
  const chartH = 160;
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[12]"
          style={{ left: '6%', bottom: '22%', width: '40%', height: '42%' }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <svg viewBox="0 0 380 220" width="100%" height="100%">
            {/* Axes */}
            <line x1="38" y1="10" x2="38" y2="175" stroke="rgba(200,163,64,0.30)" strokeWidth="1.5"/>
            <line x1="38" y1="175" x2="375" y2="175" stroke="rgba(200,163,64,0.30)" strokeWidth="1.5"/>
            {/* Y grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((frac, i) => (
              <g key={i}>
                <line x1="35" y1={175 - frac * chartH} x2="375" y2={175 - frac * chartH}
                  stroke="rgba(200,163,64,0.10)" strokeWidth="1" strokeDasharray="4,5"/>
                <text x="30" y={175 - frac * chartH + 4} textAnchor="end" fontSize="8"
                  fill="rgba(200,163,64,0.40)" fontFamily="monospace">
                  {frac === 1.0 ? '5.5K' : frac === 0.75 ? '4K' : frac === 0.5 ? '2.7K' : '1.4K'}
                </text>
              </g>
            ))}
            {/* Chart label */}
            <text x="200" y="210" textAnchor="middle" fontSize="9"
              fill="rgba(200,163,64,0.45)" fontFamily="monospace" letterSpacing="2">
              STUDENT GROWTH
            </text>
            {/* Bars */}
            {bars.map((b, i) => {
              const barW = 30;
              const x = 45 + i * 37;
              const barH = (b.val / max) * chartH;
              const color = phase >= 2 && b.val >= 500
                ? 'rgba(200,163,64,0.90)' : 'rgba(200,163,64,0.50)';
              return (
                <g key={i}>
                  <motion.rect x={x} y={175 - barH} width={barW} height={barH} rx="2"
                    fill={color}
                    initial={{ height: 0, y: 175 }}
                    animate={{ height: barH, y: 175 - barH }}
                    transition={{ delay: i * 0.12, duration: 0.65, ease: [0.16, 1, 0.3, 1] }} />
                  <motion.text x={x + barW / 2} y="185" textAnchor="middle" fontSize="7"
                    fill="rgba(200,163,64,0.45)" fontFamily="monospace"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.12 + 0.3, duration: 0.4 }}>
                    {b.month}
                  </motion.text>
                  {/* Value tooltip on hover-like static */}
                  {phase >= 2 && b.val >= 500 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.12 + 0.5, duration: 0.5 }}>
                      <rect x={x - 4} y={170 - barH} width={barW + 8} height={14} rx="3"
                        fill="rgba(14,10,4,0.88)" />
                      <text x={x + barW / 2} y={180 - barH} textAnchor="middle" fontSize="7.5"
                        fill="rgba(200,163,64,0.85)" fontFamily="monospace" fontWeight="700">
                        {b.val >= 1000 ? `${(b.val / 1000).toFixed(1)}K` : b.val}
                      </text>
                    </motion.g>
                  )}
                </g>
              );
            })}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Live notification feed — messages from students
const NOTIFS = [
  { txt: '📲 New install — AIIMS Delhi', col: 'rgba(100,200,140,0.75)' },
  { txt: '💬 "Cleared my Physio viva!"', col: 'rgba(200,163,64,0.75)' },
  { txt: '📲 New install — JIPMER Puducherry', col: 'rgba(100,200,140,0.75)' },
  { txt: '⭐ 5-star review received', col: 'rgba(255,200,60,0.75)' },
  { txt: '💬 "Best MBBS app, period"', col: 'rgba(200,163,64,0.75)' },
  { txt: '📲 New install — KMC Mangalore', col: 'rgba(100,200,140,0.75)' },
  { txt: '🎉 25,000 students milestone!', col: 'rgba(255,100,100,0.85)' },
];

export function SceneResponsibility() {
  const [phase, setPhase] = useState(0);
  const [growNum, setGrowNum] = useState(500);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase(1), 1800));
    ts.push(setTimeout(() => setPhase(2), 7000));
    ts.push(setTimeout(() => setPhase(3), 15000));
    ts.push(setTimeout(() => setPhase(4), 23000));
    const milestones = [500, 1100, 2400, 5200, 9800, 16500, 22000, 25368];
    milestones.forEach((v, i) =>
      ts.push(setTimeout(() => setGrowNum(v), 2200 + i * 500))
    );
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}>

      {/* Tech blue → warm sunrise for final push */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 3
          ? 'linear-gradient(155deg,#0a0420 0%,#2a0c00 32%,#6a2400 60%,#c05800 80%,#ff9000 100%)'
          : 'linear-gradient(155deg,#020c1e 0%,#030e24 50%,#020c1e 100%)' }}
        transition={{ duration: 3.0 }} />

      {/* Grid — data room feel */}
      <motion.div className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage: 'linear-gradient(rgba(60,120,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(60,120,255,0.055) 1px,transparent 1px)',
          backgroundSize: '7% 7%',
        }}
        animate={{ opacity: phase < 3 ? 1 : 0 }} transition={{ duration: 2.0 }} />

      {/* Growth chart */}
      <GrowthChart show={phase >= 1} phase={phase} />

      {/* Live counter — top right */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div className="absolute pointer-events-none z-[18]"
            style={{ top: '14%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
            <p style={{ fontSize: 'clamp(0.38rem,0.68vw,0.54rem)', letterSpacing: '0.30em',
              color: 'rgba(60,220,120,0.60)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Total Students
            </p>
            <motion.p key={growNum}
              initial={{ y: -6, opacity: 0.5 }} animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.18 }}
              style={{ fontSize: 'clamp(2.5rem,8vw,6.5rem)', fontFamily: 'monospace', fontWeight: 900,
                color: 'rgba(60,220,120,0.97)', lineHeight: 0.85,
                textShadow: '0 0 55px rgba(40,200,100,0.55), 0 2px 28px rgba(0,0,0,1)' }}>
              {growNum >= 1000 ? `${(growNum / 1000).toFixed(1)}K` : growNum}
            </motion.p>
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontSize: 'clamp(0.38rem,0.68vw,0.54rem)', color: 'rgba(40,200,100,0.55)',
                fontFamily: 'monospace', letterSpacing: '0.20em', marginTop: '2px' }}>
              ▲ LIVE
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification feed */}
      {phase >= 2 && NOTIFS.map((n, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[14]"
          style={{
            left: `${52 + (i % 3) * 16}%`,
            bottom: '-5%',
            background: 'rgba(6,12,28,0.90)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(60,120,255,0.22)',
            borderRadius: '8px 8px 8px 2px',
            padding: 'clamp(4px,0.6vw,7px) clamp(8px,1.2vw,14px)',
            maxWidth: 'clamp(130px,18vw,185px)',
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '-90vh', opacity: [0, 1, 1, 1, 0] }}
          transition={{ delay: i * 1.1, duration: 7.5, repeat: Infinity, ease: 'easeOut' }}>
          <p style={{ fontSize: 'clamp(0.48rem,0.85vw,0.68rem)',
            color: n.col, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {n.txt}
          </p>
        </motion.div>
      ))}

      {/* Sunrise for finale */}
      <RisingSun phase={(phase >= 4 ? 3 : phase >= 3 ? 2 : 0) as 0|1|2|3} />

      <FloatingParticles count={20} color="#ff9000" active={phase >= 3} />
      <FloatingParticles count={12} color="#ffd700" active={phase >= 4} />
      <SpeedLines active={phase >= 4} color="rgba(255,150,30,0.65)" count={30} cx={50} cy={44} />

      {/* Final cliffhanger text */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div className="absolute pointer-events-none z-[85]"
            style={{ bottom: '18%', right: '7%', textAlign: 'right' }}
            initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              style={{ fontSize: 'clamp(0.38rem,0.68vw,0.54rem)', letterSpacing: '0.32em',
                color: 'rgba(200,163,64,0.55)', fontFamily: 'monospace', textTransform: 'uppercase',
                marginBottom: '6px' }}>
              Epilogue
            </motion.p>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              style={{ height: '1px', background: 'linear-gradient(to left,rgba(200,163,64,0.65),transparent)',
                marginBottom: '9px', marginLeft: 'auto',
                width: 'clamp(70px,14vw,130px)', transformOrigin: 'right' }} />
            {['500 downloads was never', 'the destination.'].map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.50, duration: 0.90 }}
                style={{ fontSize: 'clamp(0.80rem,1.75vw,1.40rem)',
                  fontFamily: 'Georgia, serif', fontWeight: 300, fontStyle: 'italic',
                  color: 'rgba(235,215,180,0.90)', lineHeight: 1.5,
                  textShadow: '0 2px 28px rgba(0,0,0,1)' }}>
                {line}
              </motion.p>
            ))}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1.4, duration: 0.65 }}
              style={{ height: '1px', background: 'linear-gradient(to left,rgba(200,163,64,0.65),transparent)',
                margin: '9px 0', marginLeft: 'auto',
                width: 'clamp(70px,14vw,130px)', transformOrigin: 'right' }} />
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(1.3rem,3.0vw,2.5rem)',
                fontFamily: 'Georgia, serif', fontWeight: 900, fontStyle: 'italic',
                color: '#C8A340', lineHeight: 1.1,
                textShadow: '0 0 40px rgba(200,163,64,0.48), 0 2px 36px rgba(0,0,0,1)' }}>
              It was the beginning.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 1.0 }}
              style={{ fontSize: 'clamp(0.44rem,0.80vw,0.62rem)', fontFamily: 'monospace',
                color: 'rgba(150,165,215,0.45)', letterSpacing: '0.28em',
                textTransform: 'uppercase', marginTop: '9px',
                textShadow: '0 2px 16px rgba(0,0,0,0.98)' }}>
              The story continues.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Vignette strength={0.70} />
      <BottomGrad color="2,5,16" />
      <FilmGrain opacity={0.28} />
      <CinemaBars />
    </motion.div>
  );
}
