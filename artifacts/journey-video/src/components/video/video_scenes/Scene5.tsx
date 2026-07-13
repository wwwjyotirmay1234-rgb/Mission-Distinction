import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

const MESSAGES = ['"Thank you."', '"This helped me."', '"I finally found everything in one place."'];

export function Scene5() {
  const [phase, setPhase] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [goldFlash, setGoldFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const builtTimers = useRef(false);

  useSceneSpeech([
    { atPhase: 2, text: 'The final button hovers on the screen.' },
    { atPhase: 4, text: 'Launch.' },
    { atPhase: 5, text: 'A trembling hand clicks.' },
    { atPhase: 6, text: 'Silence. One download. Two. Five. Ten. Twenty. The number keeps climbing.' },
    { atPhase: 7, text: 'Messages begin arriving. Thank you. This helped me. I finally found everything in one place.' },
    { atPhase: 8, text: 'The room erupts with joy. Tears. Laughter. Disbelief.' },
    { atPhase: 9, text: 'Within 24 hours...' },
    { atPhase: 10, text: '150 students join. The dream is no longer theirs alone.' },
  ], phase);

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5200),
      setTimeout(() => setPhase(5), 6800),
      setTimeout(() => setPhase(6), 8200),
      setTimeout(() => setPhase(7), 12000),
      setTimeout(() => {
        setPhase(8); setGoldFlash(true); setShake(true);
        setTimeout(() => setGoldFlash(false), 700);
        setTimeout(() => setShake(false), 600);
      }, 16000),
      setTimeout(() => setPhase(9), 18500),
      setTimeout(() => setPhase(10), 20500),
    ];
    let idx = 0;
    const mt = setInterval(() => { idx = (idx + 1) % MESSAGES.length; setMsgIdx(idx); }, 1200);
    const st = setTimeout(() => clearInterval(mt), 8000);
    return () => { timers.forEach(clearTimeout); clearInterval(mt); clearTimeout(st); };
  }, []);

  const count = useSpring(0, { stiffness: 80, damping: 22 });
  const displayCount = useTransform(count, Math.round);
  useEffect(() => { if (phase >= 6) count.set(150); }, [phase, count]);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#030210' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ scale: 1.05, opacity: 0 }} transition={{ duration: 0.8 }}>

      {/* ── CINEMATIC LAUNCH DAY ILLUSTRATION ── */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }} animate={phase >= 8 ? { scale: 1.03 } : { scale: 1 }} transition={{ duration: 18, ease: 'easeOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/char_s5_launch_moment.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.72) saturate(0.9)' }}
          alt=""
        />
      </motion.div>

      {/* Golden sunrise glow that intensifies at launch */}
      <motion.div className="absolute inset-0 pointer-events-none z-1"
        animate={phase >= 8
          ? { background: 'radial-gradient(ellipse at 25% 30%, rgba(200,163,64,0.22) 0%, rgba(0,0,0,0.82) 65%)' }
          : { background: 'radial-gradient(ellipse at 25% 30%, rgba(255,160,40,0.10) 0%, rgba(0,0,0,0.88) 65%)' }}
        transition={{ duration: 2 }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.88) 100%)' }} />

      {/* Gold flash on launch moment */}
      <motion.div className="absolute inset-0 pointer-events-none z-50"
        style={{ backgroundColor: 'rgba(200,163,64,0.3)' }}
        animate={goldFlash ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.65 }} />

      {/* Confetti particles on joy */}
      {phase >= 8 && Array.from({ length: 24 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: '50%', top: '50%', zIndex: 5, width: 3 + (i % 3), height: 3 + (i % 3),
            backgroundColor: i % 3 === 0 ? '#C8A340' : i % 3 === 1 ? '#fff' : '#a78bfa' }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: Math.cos(i * 15 * Math.PI / 180) * (80 + (i % 4) * 45),
            y: Math.sin(i * 15 * Math.PI / 180) * (80 + (i % 4) * 45),
            opacity: [0, 1, 1, 0], scale: [0, 2, 1.5, 0] }}
          transition={{ duration: 2.5, delay: (i % 5) * 0.06, ease: 'easeOut' }} />
      ))}

      <motion.div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-[10vw]"
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45 } : { duration: 0 }}>

        <motion.p className="font-mono mb-[3.5vw]"
          style={{ fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(200,163,64,0.45)' }}
          initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
          SUNRISE · 18 APRIL 2026 · LAUNCH DAY
        </motion.p>

        {phase >= 2 && (
          <div className="mb-[2.5vw]" style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em' }}>
            <WordReveal text="The final button hovers on the screen." startDelay={0} wordInterval={0.1} />
          </div>
        )}

        {phase >= 4 && phase < 6 && (
          <motion.div className="mb-[2.5vw] border" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ backgroundColor: 'rgba(200,163,64,0.06)', borderColor: 'rgba(200,163,64,0.4)', padding: '1vw 4vw', borderRadius: '0.4vw' }}>
            <div style={{ fontFamily: 'var(--font-display, serif)' }}>
              <WordReveal text="LAUNCH." startDelay={0} wordInterval={0.3}
                style={{ fontSize: '5.5vw', color: '#C8A340', letterSpacing: '0.15em', textShadow: '0 0 40px rgba(200,163,64,0.5)' }} />
            </div>
          </motion.div>
        )}

        {phase >= 5 && phase < 6 && (
          <div className="mb-[2vw]" style={{ fontSize: '2.2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em' }}>
            <WordReveal text="A trembling hand clicks." startDelay={0} wordInterval={0.14} />
          </div>
        )}

        {phase >= 6 && phase < 7 && (
          <motion.div className="text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: '1.2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.5vw' }}>
              <WordReveal text="One download. Two. Five. Ten. Twenty." startDelay={0} wordInterval={0.12} />
            </div>
            <motion.span className="font-display text-white leading-none block" style={{ fontSize: '18vw' }}>
              {displayCount}
            </motion.span>
          </motion.div>
        )}

        {phase >= 7 && phase < 8 && (
          <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <div className="mb-[2vw]" style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
              <WordReveal text="Messages begin arriving." startDelay={0} wordInterval={0.12} />
            </div>
            <motion.div key={msgIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <p style={{ fontSize: '3.8vw', fontStyle: 'italic', fontWeight: 100, color: '#C8A340', letterSpacing: '0.02em' }}>
                {MESSAGES[msgIdx]}
              </p>
            </motion.div>
          </motion.div>
        )}

        {phase >= 8 && phase < 9 && (
          <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
            <div className="flex items-center justify-center gap-[3vw]">
              {['Tears.', 'Laughter.', 'Disbelief.'].map((w, i) => (
                <WordReveal key={w} text={w} startDelay={i * 0.35} wordInterval={0.15}
                  style={{ fontSize: '4.5vw', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em',
                    fontFamily: 'var(--font-display, serif)' }} />
              ))}
            </div>
          </motion.div>
        )}

        {phase >= 9 && (
          <div className="mb-[1.5vw]" style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em' }}>
            <WordReveal text="Within 24 hours —" startDelay={0} wordInterval={0.2} />
          </div>
        )}

        {phase >= 10 && (
          <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ fontFamily: 'var(--font-display, serif)' }}>
              <WordReveal text="150 STUDENTS JOIN." startDelay={0} wordInterval={0.22}
                style={{ fontSize: '9vw', color: '#C8A340', letterSpacing: '-0.02em', textShadow: '0 0 80px rgba(200,163,64,0.45)' }} />
            </div>
            <div className="mt-[1.5vw]" style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em' }}>
              <WordReveal text="The dream is no longer theirs alone." startDelay={0.9} wordInterval={0.1} />
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
