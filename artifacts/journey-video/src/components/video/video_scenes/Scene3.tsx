import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

const MONTAGE = [
  'Pages being scanned.',
  'PDFs being organized.',
  'Diagrams being redrawn.',
  'Coffee cups piling up.',
  'Code appearing on laptop screens.',
  'Error messages.',
  'Failed uploads.',
  'Crashes.',
  'Bugs.',
  'More bugs.',
];

export function Scene3() {
  const [phase, setPhase] = useState(0);
  const [mIdx, setMIdx] = useState(0);

  useSceneSpeech([
    { atPhase: 3, text: 'The team celebrates small victories. Then faces bigger setbacks.' },
    { atPhase: 4, text: 'Sleepless nights turning into sunrises.' },
    { atPhase: 5, text: 'Days become weeks. Weeks become months.' },
    { atPhase: 6, text: 'Many times they think about giving up. But every time they remember one thing.' },
    { atPhase: 7, text: 'The struggling student sitting alone at 2 AM. Just like they once were.' },
  ], phase);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 9500),
      setTimeout(() => setPhase(4), 13000),
      setTimeout(() => setPhase(5), 16000),
      setTimeout(() => setPhase(6), 18500),
      setTimeout(() => setPhase(7), 21000),
    ];
    let idx = 0;
    const mt = setInterval(() => { idx = (idx + 1) % MONTAGE.length; setMIdx(idx); }, 700);
    const st = setTimeout(() => clearInterval(mt), 9000);
    return () => { timers.forEach(clearTimeout); clearInterval(mt); clearTimeout(st); };
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.7 }}>

      {/* ── CINEMATIC CODING MONTAGE ILLUSTRATION ── */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 20, ease: 'easeOut' }}>
        <img
          src={`${import.meta.env.BASE_URL}images/scene3_journey_montage.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.62) contrast(1.1) saturate(0.8)' }}
          alt=""
        />
      </motion.div>

      {/* Cinematic bars */}
      <div className="absolute inset-x-0 top-0 h-[6%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black z-10 pointer-events-none" />

      {/* Vignette overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.88) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.88) 100%)' }} />

      {/* Red ERROR glow pulse — from the montage panel */}
      {phase >= 2 && (
        <motion.div className="absolute pointer-events-none z-2"
          style={{
            left: '18%', bottom: '18%',
            width: '22%', height: '30%',
            background: 'radial-gradient(ellipse at 30% 70%, rgba(220,30,30,0.15) 0%, transparent 60%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.p className="absolute font-mono z-20"
        style={{ top: '9%', left: '50%', transform: 'translateX(-50%)', fontSize: '0.8vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }}
        initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
        THE JOURNEY · VIMSAR · MAR — JUN 2026
      </motion.p>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-[10vw]">

        {phase >= 2 && phase < 3 && (
          <motion.div key={mIdx} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            <p style={{ fontSize: '5vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em' }}>
              {MONTAGE[mIdx]}
            </p>
          </motion.div>
        )}

        {phase >= 3 && phase < 4 && (
          <div style={{ fontSize: '2.5vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', lineHeight: 2 }}>
            <WordReveal text="The team celebrates small victories." startDelay={0} wordInterval={0.1} style={{ display: 'block' }} />
            <WordReveal text="Then faces bigger setbacks." startDelay={1} wordInterval={0.1}
              style={{ display: 'block', color: 'rgba(255,255,255,0.35)' }} />
          </div>
        )}

        {phase >= 4 && phase < 5 && (
          <div style={{ fontSize: '2.8vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
            <WordReveal text="Sleepless nights turning into sunrises." startDelay={0} wordInterval={0.1} />
          </div>
        )}

        {phase >= 5 && phase < 6 && (
          <div style={{ fontFamily: 'var(--font-display, serif)', lineHeight: 1.1 }}>
            <WordReveal text="DAYS BECOME WEEKS." startDelay={0} wordInterval={0.18}
              style={{ display: 'block', fontSize: '6.5vw', color: '#fff', letterSpacing: '-0.02em' }} />
            <WordReveal text="WEEKS BECOME MONTHS." startDelay={0.9} wordInterval={0.18}
              style={{ display: 'block', fontSize: '6.5vw', color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.02em' }} />
          </div>
        )}

        {phase >= 6 && phase < 7 && (
          <div style={{ fontSize: '2.6vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.08em', lineHeight: 2 }}>
            <WordReveal text="Many times they think about giving up." startDelay={0} wordInterval={0.1} style={{ display: 'block' }} />
            <WordReveal text="But every time they remember one thing:" startDelay={1.2} wordInterval={0.1}
              style={{ display: 'block', color: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}

        {phase >= 7 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', lineHeight: 2.2 }}>
              <WordReveal text="The struggling student sitting alone at 2 AM." startDelay={0} wordInterval={0.1} style={{ display: 'block' }} />
              <WordReveal text="Just like they once were." startDelay={1.4} wordInterval={0.14}
                style={{ display: 'block', color: 'rgba(200,163,64,0.7)' }} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
