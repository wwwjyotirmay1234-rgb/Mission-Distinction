import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WordReveal } from '../WordReveal';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';
import { RainWindow } from '../RainWindow';
import { HostelDeskScene } from '../HostelDeskScene';

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
    <motion.div className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: '#07091a' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

      {/* Dark gradient background — no video, pure illustrated scene */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(18,22,55,0.95) 0%, rgba(4,5,16,1) 100%)' }} />

      {/* Subtle floor/wall texture lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.012) 60px)' }} />

      {/* ── ILLUSTRATED SCENE ELEMENTS ─────────────── */}
      {/* Rain window — top right */}
      <RainWindow visible={phase >= 1} />

      {/* Anime boy at hostel desk — bottom left/center */}
      <HostelDeskScene phase={phase} />

      {/* Scattered paper on floor — bottom area */}
      {phase >= 1 && (
        <>
          {/* Paper 1 */}
          <motion.div
            initial={{ opacity: 0, rotate: -22, y: 15 }}
            animate={{ opacity: 0.55, rotate: -19, y: 0 }}
            transition={{ duration: 2, delay: 0.4 }}
            style={{
              position: 'absolute', bottom: '6%', left: '8%',
              width: '9%', height: '6.5%',
              background: 'rgba(235,230,200,0.08)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '2px',
              zIndex: 3,
            }}
          >
            <div style={{ position: 'absolute', top: '22%', left: '10%', right: '10%', height: '3px', background: 'rgba(255,215,60,0.3)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', top: '46%', left: '10%', right: '25%', height: '2.5px', background: 'rgba(255,215,60,0.18)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', top: '68%', left: '10%', right: '15%', height: '2.5px', background: 'rgba(100,175,255,0.18)', borderRadius: '2px' }} />
          </motion.div>
          {/* Paper 2 */}
          <motion.div
            initial={{ opacity: 0, rotate: 12, y: 10 }}
            animate={{ opacity: 0.45, rotate: 10, y: 0 }}
            transition={{ duration: 2, delay: 0.7 }}
            style={{
              position: 'absolute', bottom: '8%', left: '18%',
              width: '8%', height: '5.5%',
              background: 'rgba(235,230,200,0.07)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '2px',
              zIndex: 3,
            }}
          >
            <div style={{ position: 'absolute', top: '30%', left: '8%', right: '8%', height: '2.5px', background: 'rgba(255,215,60,0.22)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', top: '60%', left: '8%', right: '20%', height: '2.5px', background: 'rgba(255,215,60,0.14)', borderRadius: '2px' }} />
          </motion.div>
          {/* Open book on right edge */}
          <motion.div
            initial={{ opacity: 0, rotate: -6 }}
            animate={{ opacity: 0.5, rotate: -5 }}
            transition={{ duration: 2, delay: 0.5 }}
            style={{
              position: 'absolute', bottom: '18%', right: '32%',
              width: '12%', height: '5%',
              background: 'rgba(235,230,200,0.09)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              zIndex: 3,
            }}
          >
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', top: '25%', left: '5%', width: '40%', height: '2px', background: 'rgba(255,215,60,0.28)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', top: '50%', left: '5%', width: '38%', height: '2px', background: 'rgba(255,215,60,0.18)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', top: '25%', right: '5%', width: '38%', height: '2px', background: 'rgba(100,175,255,0.22)', borderRadius: '2px' }} />
          </motion.div>
        </>
      )}

      {/* Books highlight glow when "Books scattered everywhere" line appears */}
      {phase >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.3] }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'absolute',
            bottom: '16%', left: '4%',
            width: '28%', height: '30%',
            background: 'radial-gradient(ellipse at 20% 80%, rgba(255,180,50,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}

      {/* Rain glow on window when "rain taps against window" appears */}
      {phase >= 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'absolute',
            right: '3%', top: '5%',
            width: '30%', height: '62%',
            background: 'radial-gradient(ellipse at 50% 30%, rgba(100,150,255,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}

      {/* ── 2:17 AM CLOCK ─────────────────────────── */}
      <motion.div className="absolute z-10 w-full flex flex-col items-center" style={{ top: '8%' }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5 }}>
        <div className="flex items-center gap-[1.5vw]">
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.55 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
          <p className="font-mono"
            style={{ fontSize: '2.2vw', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.22)' }}>
            {`2${tick ? ':' : ' '}17 AM`}
          </p>
          <motion.div className="w-[5px] h-[5px] rounded-full bg-white/20"
            animate={tick ? { scale: 2, opacity: 0.55 } : { scale: 1, opacity: 0.2 }} transition={{ duration: 0.1 }} />
        </div>
        <p className="font-mono mt-2"
          style={{ fontSize: '0.75vw', letterSpacing: '0.55em', color: 'rgba(255,255,255,0.13)' }}>
          VIMSAR · BURLA, SAMBALPUR · HOSTEL ROOM
        </p>
      </motion.div>

      {/* ── TEXT OVERLAYS ──────────────────────────── */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-[12%] px-[10vw]">
        <div className="text-center w-full">

          {phase >= 3 && (
            <div className="mb-[2.5vw]">
              <div style={{ fontSize: '1.9vw', fontWeight: 100, fontStyle: 'italic', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.48)', lineHeight: 2.1 }}>
                <WordReveal text="Books scattered everywhere." startDelay={0} wordInterval={0.1} style={{ display: 'block' }} />
                <WordReveal text="Highlighters dried out. Notes incomplete." startDelay={0.8} wordInterval={0.09} style={{ display: 'block' }} />
                <WordReveal text="The syllabus feels endless." startDelay={1.8} wordInterval={0.1} style={{ display: 'block' }} />
              </div>
            </div>
          )}

          {phase >= 4 && (
            <p className="mb-[2vw]"
              style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(160,200,255,0.55)', letterSpacing: '0.12em' }}>
              <WordReveal text="Outside, rain taps against the window." startDelay={0} wordInterval={0.1} />
            </p>
          )}

          {phase >= 5 && (
            <p className="mb-[2.5vw]"
              style={{ fontSize: '2vw', fontStyle: 'italic', fontWeight: 100, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em' }}>
              <WordReveal text="He stares at a blank page." startDelay={0} wordInterval={0.11} />
            </p>
          )}

          {phase >= 6 && (
            <div className="flex items-center justify-center gap-[3vw] mb-[2.5vw]">
              {['Exhaustion.', 'Doubt.', 'Fear.'].map((word, i) => (
                <WordReveal key={word} text={word} startDelay={i * 0.35} wordInterval={0.1}
                  style={{ fontSize: '3vw', fontWeight: 700, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.06em' }} />
              ))}
            </div>
          )}

          {phase >= 7 && (
            <div className="overflow-visible">
              <WordReveal text='"What if I fail?"' startDelay={0.1} wordInterval={0.18}
                style={{
                  fontSize: '7.5vw',
                  fontFamily: 'var(--font-display, serif)',
                  color: '#C8A340',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 80px rgba(200,163,64,0.45)',
                  lineHeight: 1,
                  display: 'block',
                }} />
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
