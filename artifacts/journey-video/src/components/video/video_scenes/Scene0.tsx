import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

// OPENING SCENE — 2:17 AM. Word-by-word anime reveal + TTS narration.
export function Scene0() {
  const [phase, setPhase] = useState(0);
  const [tick, setTick] = useState(false);

  useSceneSpeech([
    { atPhase: 3, text: 'Books scattered everywhere. Highlighters dried out. Notes incomplete. The syllabus feels endless.' },
    { atPhase: 4, text: 'Outside, rain taps against the window.' },
    { atPhase: 5, text: 'He stares at a blank page.' },
    { atPhase: 6, text: 'Exhaustion. Doubt. Fear.' },
    { atPhase: 7, text: 'A single thought echoes... What if I fail?' },
  ], phase);

  useEffect(() => {
    const tickInterval = setInterval(() => setTick(t => !t), 900);
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 5200),
      setTimeout(() => setPhase(4), 9000),
      setTimeout(() => setPhase(5), 11500),
      setTimeout(() => setPhase(6), 13500),
      setTimeout(() => setPhase(7), 15800),
      setTimeout(() => setPhase(8), 19500),
    ];
    return () => { timers.forEach(clearTimeout); clearInterval(tickInterval); };
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

      {/* Background */}
      <motion.div className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
        transition={{ duration: 3.5, ease: 'easeOut' }}>
        <img src={`${import.meta.env.BASE_URL}images/student_coldopen.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.18) contrast(1.25) brightness(0.28)' }} alt="" />
      </motion.div>
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 62% 45%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.78) 82%, rgba(0,0,0,0.97) 100%)' }} />

      {/* 2:17 AM clock stamp */}
      <motion.div className="absolute z-10 w-full flex flex-col items-center" style={{ top: '17%' }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}>
        <div className="flex items-center gap-[1.5vw]">
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.55 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
          <p className="font-mono" style={{ fontSize: '2.2vw', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.22)' }}>
            {`2${tick ? ':' : ' '}17 AM`}
          </p>
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.55 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
        </div>
        <p className="font-mono mt-2" style={{ fontSize: '0.75vw', letterSpacing: '0.55em', color: 'rgba(255,255,255,0.13)' }}>
          VIMSAR · BURLA, SAMBALPUR · HOSTEL ROOM
        </p>
      </motion.div>

      {/* Text content — word-by-word */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[10vw]">
        <div className="text-center">

          {/* Prose block 1 */}
          {phase >= 3 && (
            <div className="mb-[3.5vw]">
              <div style={{ fontSize: '2vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', lineHeight: 2.1 }}>
                <WordReveal text="Books scattered everywhere." startDelay={0} wordInterval={0.1}
                  style={{ display: 'block' }} />
                <WordReveal text="Highlighters dried out. Notes incomplete." startDelay={0.8} wordInterval={0.09}
                  style={{ display: 'block' }} />
                <WordReveal text="The syllabus feels endless." startDelay={1.8} wordInterval={0.1}
                  style={{ display: 'block' }} />
              </div>
            </div>
          )}

          {/* "Outside, rain..." */}
          {phase >= 4 && (
            <p className="mb-[3vw]" style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.12em' }}>
              <WordReveal text="Outside, rain taps against the window." startDelay={0} wordInterval={0.1} />
            </p>
          )}

          {/* "He stares..." */}
          {phase >= 5 && (
            <p className="mb-[3.5vw]" style={{ fontSize: '2.1vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }}>
              <WordReveal text="He stares at a blank page." startDelay={0} wordInterval={0.11} />
            </p>
          )}

          {/* "Exhaustion. Doubt. Fear." */}
          {phase >= 6 && (
            <div className="flex items-center justify-center gap-[3vw] mb-[3.5vw]">
              {['Exhaustion.', 'Doubt.', 'Fear.'].map((word, i) => (
                <WordReveal key={word} text={word} startDelay={i * 0.35} wordInterval={0.1}
                  style={{ fontSize: '3vw', fontWeight: 700, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.06em' }} />
              ))}
            </div>
          )}

          {/* "What if I fail?" — the haunting question */}
          {phase >= 7 && (
            <div className="overflow-visible">
              <WordReveal
                text='"What if I fail?"'
                startDelay={0.1}
                wordInterval={0.18}
                style={{
                  fontSize: '8vw',
                  fontFamily: 'var(--font-display, serif)',
                  color: '#C8A340',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 80px rgba(200,163,64,0.45)',
                  lineHeight: 1,
                  display: 'block',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Flash out */}
      <motion.div className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={phase >= 8 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.2 }} />
    </motion.div>
  );
}
