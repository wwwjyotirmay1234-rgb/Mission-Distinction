import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilmGrain, CinemaBars, Vignette, BottomGrad,
  ChapterTitle, RisingSun, FloatingParticles, SpeedLines, StarField, CityLights
} from '../../../anime/index';

// ════════════════════════════════════════════════════════════════════════
//  SCENE: THE COMEBACK   (29 600 ms)
//  They didn't quit. They rebuilt. Dawn breaks.
// ════════════════════════════════════════════════════════════════════════

// Five PIXAR-style founders at rooftop — facing sunrise, profile/3-quarter faces visible
function FoundersAtDawn({ show, phase }: { show: boolean; phase: number }) {
  // Each person: position, skin, hair, jacket, facing direction (left toward sunrise = -1, right = 1)
  const founders = [
    { x:'22%', skin:'#c07848', hair:'#1c0d04', jacket:'#2a1e3a', face: 1,  isLeader: false, delay:0.12 },
    { x:'33%', skin:'#7a4a28', hair:'#130a04', jacket:'#1a2838', face: 1,  isLeader: false, delay:0.20 },
    { x:'50%', skin:'#c89060', hair:'#1a0d06', jacket:'#1e2f4a', face: 0,  isLeader: true,  delay:0.00 },
    { x:'67%', skin:'#b06830', hair:'#160c04', jacket:'#2a2818', face:-1,  isLeader: false, delay:0.20 },
    { x:'78%', skin:'#d0a070', hair:'#220e06', jacket:'#3a1828', face:-1,  isLeader: false, delay:0.12 },
  ];
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute pointer-events-none z-[11]">
          {founders.map((p, i) => {
            const { skin, hair, jacket, face, isLeader } = p;
            const W = isLeader ? 80 : 68;
            const H = isLeader ? 195 : 164;
            // head center in viewBox 0 0 70 200
            const hx = 35, hy = 34;
            const hr = isLeader ? 20 : 17;
            // eye position depends on face direction
            const eyeX = face === 0 ? hx : face === 1 ? hx - 4 : hx + 4;
            const eyeY = hy + 2;
            // sunrise rim color
            const rimColor = phase >= 3 ? 'rgba(255,130,30,0.55)' : 'rgba(255,130,30,0.0)';
            const rimColor2 = phase >= 3 ? 'rgba(255,80,10,0.28)' : 'rgba(255,80,10,0.0)';

            return (
              <motion.div key={i} className="absolute"
                style={{ left: p.x, bottom: '18%',
                  width: `${W}px`, height: `${H}px`,
                  transform: 'translateX(-50%)' }}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: p.delay + 0.2, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}>
                <svg viewBox="0 0 70 200" width="100%" height="100%" overflow="visible">

                  {/* ── JACKET / BODY ── */}
                  <path d="M12,60 Q18,54 52,60 L56,136 Q35,145 14,136 Z" fill={jacket}/>
                  {/* Jacket collar detail */}
                  <path d="M28,58 L35,70 L42,58" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5"/>

                  {/* ── NECK ── */}
                  <rect x="29" y="54" width="12" height="10" rx="4" fill={skin}/>

                  {/* ── HEAD ── */}
                  <ellipse cx={hx} cy={hy} rx={hr} ry={hr+4} fill={skin}/>

                  {/* ── HAIR ── */}
                  <path d={`M${hx-hr},${hy-6} Q${hx-hr+2},${hy-hr-12} ${hx},${hy-hr-16} Q${hx+hr-2},${hy-hr-12} ${hx+hr},${hy-6}`}
                    fill={hair}/>

                  {/* ── PROFILE FACE (facing sunrise or viewer) ── */}
                  {face !== 0 ? (
                    /* Profile faces (left or right facing) */
                    <>
                      {/* Ear on opposite side */}
                      <ellipse cx={face === 1 ? hx+hr-1 : hx-hr+1} cy={hy+2} rx="3.5" ry="5"
                        fill={`rgba(${parseInt(skin.slice(1,3),16)},${parseInt(skin.slice(3,5),16)},${parseInt(skin.slice(5,7),16)},0.80)`}/>
                      {/* Eye (one visible, facing side) */}
                      <ellipse cx={eyeX} cy={eyeY} rx="6" ry="4.5" fill="rgb(245,236,222)"/>
                      <ellipse cx={eyeX+(face*0.5)} cy={eyeY+0.5} rx="3.2" ry="3.2" fill="#4a2810"/>
                      <ellipse cx={eyeX+(face*0.5)} cy={eyeY+0.5} rx="1.8" ry="1.8" fill="#080604"/>
                      <ellipse cx={eyeX-(face*0.8)} cy={eyeY-1} rx="1" ry="1" fill="rgba(255,248,210,0.88)"/>
                      {/* eyelid */}
                      <path d={`M${eyeX-6},${eyeY} Q${eyeX},${eyeY-6} ${eyeX+6},${eyeY}`}
                        stroke="#552810" strokeWidth="1.8" fill="none"/>
                      {/* Eyebrow — determined/hopeful */}
                      <path d={`M${eyeX-7},${eyeY-9} Q${eyeX},${eyeY-13} ${eyeX+6},${eyeY-9}`}
                        stroke={hair} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      {/* Nose profile bump */}
                      <path d={`M${face===1?hx+2:hx-2},${hy+8} Q${face===1?hx+10:hx-10},${hy+12} ${face===1?hx+7:hx-7},${hy+18}`}
                        stroke={`rgba(0,0,0,0.22)`} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                      {/* Mouth — slight hopeful upturn */}
                      <path d={`M${face===1?hx-3:hx+3},${hy+22} Q${face===1?hx+5:hx-5},${hy+26} ${face===1?hx+10:hx-10},${hy+23}`}
                        stroke="#7a3820" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                    </>
                  ) : (
                    /* Leader faces viewer — 3/4 frontal, hopeful/determined expression */
                    <>
                      {/* Ear */}
                      <ellipse cx={hx+hr} cy={hy+2} rx="4" ry="6" fill={`rgba(${parseInt(skin.slice(1,3),16)},${parseInt(skin.slice(3,5),16)},${parseInt(skin.slice(5,7),16)},0.80)`}/>
                      {/* Left eye */}
                      <ellipse cx={hx-7} cy={hy} rx="7" ry="5" fill="rgb(245,236,222)"/>
                      <ellipse cx={hx-7.5} cy={hy+0.5} rx="4" ry="4" fill="#4a2810"/>
                      <ellipse cx={hx-8} cy={hy+0.5} rx="2.2" ry="2.2" fill="#080604"/>
                      <ellipse cx={hx-9} cy={hy-1.5} rx="1.2" ry="1.2" fill="rgba(255,248,210,0.90)"/>
                      {/* Right eye */}
                      <ellipse cx={hx+7} cy={hy} rx="6" ry="4.5" fill="rgb(245,236,222)"/>
                      <ellipse cx={hx+6.5} cy={hy+0.5} rx="3.5" ry="3.5" fill="#4a2810"/>
                      <ellipse cx={hx+6} cy={hy+0.5} rx="2" ry="2" fill="#080604"/>
                      <ellipse cx={hx+5} cy={hy-1.5} rx="1" ry="1" fill="rgba(255,248,210,0.85)"/>
                      {/* Eyelids */}
                      <path d={`M${hx-14},${hy} Q${hx-7},${hy-7} ${hx},${hy}`} stroke="#552810" strokeWidth="1.8" fill="none"/>
                      <path d={`M${hx},${hy} Q${hx+7},${hy-6} ${hx+13},${hy}`} stroke="#552810" strokeWidth="1.6" fill="none"/>
                      {/* Eyebrows — hopeful, slightly raised inner corners */}
                      <path d={`M${hx-16},${hy-11} Q${hx-7},${hy-16} ${hx-1},${hy-13}`}
                        stroke={hair} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
                      <path d={`M${hx+1},${hy-13} Q${hx+8},${hy-16} ${hx+16},${hy-11}`}
                        stroke={hair} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      {/* Nose */}
                      <ellipse cx={hx-3} cy={hy+10} rx="3.5" ry="2.5" fill="rgba(0,0,0,0.14)"/>
                      <ellipse cx={hx+3} cy={hy+10} rx="3.5" ry="2.5" fill="rgba(0,0,0,0.11)"/>
                      {/* Mouth — proud determined smile */}
                      <path d={`M${hx-10},${hy+18} Q${hx},${hy+24} ${hx+10},${hy+18}`}
                        stroke="#7a3820" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                      <path d={`M${hx-8},${hy+18} Q${hx},${hy+22} ${hx+8},${hy+18}`}
                        stroke="rgba(230,210,190,0.45)" strokeWidth="1.2" fill="none"/>
                    </>
                  )}

                  {/* ── SUNRISE RIM LIGHT on face edge ── */}
                  <motion.path d={`M${hx-(face===1?hr:-hr)},${hy-hr} Q${hx-(face===1?hr+2:-hr-2)},${hy+10} ${hx-(face===1?hr:(-hr))},${hy+hr+4}`}
                    fill={rimColor} animate={{ fill: rimColor }} transition={{ duration: 1.0 }}/>

                  {/* ── ARMS (slightly raised — hopeful stance) ── */}
                  <path d="M14,80 Q6,108 4,128" stroke={jacket} strokeWidth="16" fill="none" strokeLinecap="round"/>
                  <path d="M56,80 Q64,108 66,128" stroke={jacket} strokeWidth="16" fill="none" strokeLinecap="round"/>
                  {/* Hands */}
                  <ellipse cx="6" cy="130" rx="8" ry="5" fill={skin}/>
                  <ellipse cx="64" cy="130" rx="8" ry="5" fill={skin}/>

                  {/* ── LEGS ── */}
                  <path d="M24,136 L20,200" stroke={jacket} strokeWidth="14" strokeLinecap="round"/>
                  <path d="M46,136 L50,200" stroke={jacket} strokeWidth="14" strokeLinecap="round"/>

                  {/* Dawn light rim on entire figure */}
                  <motion.path d="M12,60 Q4,90 4,136 L20,200 L24,136 Z"
                    fill={rimColor2} animate={{ fill: rimColor2 }} transition={{ duration: 1.2 }}/>
                </svg>
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

// Railing / rooftop edge
function Rooftop({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute pointer-events-none z-[9]"
          style={{ bottom: '15%', left: 0, right: 0, height: '6%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.0 }}>
          <svg viewBox="0 0 1000 40" width="100%" height="100%" preserveAspectRatio="none">
            {/* Parapet top */}
            <rect x="0" y="8" width="1000" height="8" fill="rgba(24,16,10,0.95)" />
            {/* Railing posts */}
            {Array.from({ length: 20 }, (_, i) => (
              <rect key={i} x={25 + i * 50} y="0" width="4" height="8" rx="1"
                fill="rgba(30,20,12,0.88)" />
            ))}
            {/* Parapet base */}
            <rect x="0" y="16" width="1000" height="24" fill="rgba(20,14,8,0.98)" />
            {/* Subtle concrete texture lines */}
            <line x1="0" y1="20" x2="1000" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="30" x2="1000" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SceneComeback() {
  const [phase, setPhase] = useState(0);
  const built = useRef(false);
  useEffect(() => {
    if (built.current) return; built.current = true;
    const ts = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 7000),
      setTimeout(() => setPhase(3), 13000),
      setTimeout(() => setPhase(4), 20000),
      setTimeout(() => setPhase(5), 25000),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const sunPhase = (phase >= 4 ? 3 : phase >= 3 ? 2 : phase >= 2 ? 1 : 0) as 0 | 1 | 2 | 3;

  return (
    <motion.div className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}>

      {/* Sky — shifts from near-black to pre-dawn indigo to amber */}
      <motion.div className="absolute inset-0"
        animate={{ background: phase >= 4
          ? 'linear-gradient(180deg,#0e0520 0%,#4a1200 28%,#aa3800 55%,#e86000 78%,#ffa000 100%)'
          : phase >= 2
            ? 'linear-gradient(180deg,#08031a 0%,#1e0828 40%,#4a1800 68%,#7a3000 100%)'
            : 'linear-gradient(180deg,#020210 0%,#060318 50%,#080520 100%)' }}
        transition={{ duration: 3.0 }} />

      {/* Stars fade as dawn rises */}
      <StarField count={80} show={phase < 3} />

      {/* City skyline in distance */}
      <CityLights count={80} opacity={0.55} color="#ff9040" />

      {/* Horizon glow line */}
      <motion.div className="absolute pointer-events-none z-[4]"
        style={{ bottom: '22%', left: 0, right: 0, height: '3px',
          background: 'linear-gradient(to right,transparent 5%,rgba(255,110,20,0.80) 50%,transparent 95%)' }}
        animate={{ opacity: phase >= 2 ? 1 : 0, scaleX: phase >= 2 ? 1 : 0.4 }}
        transition={{ duration: 2.2 }} />

      {/* Sunrise */}
      <RisingSun phase={sunPhase} />

      {/* Atmospheric light rays from sun */}
      {phase >= 3 && [42, 48, 52, 56, 62].map((x, i) => (
        <motion.div key={i} className="absolute pointer-events-none z-[3]"
          style={{ bottom: '22%', left: `${x}%`, width: '1px', height: '50%',
            background: `linear-gradient(to top,rgba(255,${100 + i * 10},20,0.30),transparent)`,
            transformOrigin: 'bottom center',
            transform: `rotate(${(x - 52) * 2}deg)`,
            filter: 'blur(4px)' }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: i * 0.22, duration: 2.0, ease: 'easeOut' }} />
      ))}

      {/* Rooftop */}
      <Rooftop show={phase >= 1} />

      {/* Five founders — silhouetted against dawn */}
      <FoundersAtDawn show={phase >= 2} phase={phase} />

      <FloatingParticles count={18} color="#ff8c00" active={phase >= 3} />
      <FloatingParticles count={10} color="#ffd700" active={phase >= 4} />
      <SpeedLines active={phase >= 5} color="rgba(255,160,30,0.65)" count={30} cx={50} cy={55} />

      <ChapterTitle chapter="Chapter V" title="The Rise" show={phase >= 5} />

      <Vignette strength={0.70} />
      <BottomGrad color="8,3,0" />
      <FilmGrain opacity={0.30} />
      <CinemaBars />
    </motion.div>
  );
}
