import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { useSceneSpeech } from '../../../hooks/useSceneSpeech';

type Shot = {
  src: string;
  dur: number;
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
  cutType: 'flash' | 'dissolve';
  glow: 'warm' | 'cold' | 'none';
  caption: string;
};

const SHOTS: Shot[] = [
  {
    src: 'ai_scene1.png', dur: 2800,
    initial: { scale: 1.06, y: '-1%' }, animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3.2, ease: 'easeOut' },
    cutType: 'dissolve', glow: 'warm', caption: 'The first night.',
  },
  {
    src: 'ai_scene2.png', dur: 2600,
    initial: { scale: 1.08, x: '-1%' }, animate: { scale: 1.0, x: '0%' },
    transition: { duration: 3.0, ease: 'easeOut' },
    cutType: 'dissolve', glow: 'warm', caption: 'Creating PDFs.',
  },
  {
    src: 'ai_scene3.png', dur: 2800,
    initial: { scale: 1.05, x: '1%' }, animate: { scale: 1.0, x: '0%' },
    transition: { duration: 3.2, ease: 'easeOut' },
    cutType: 'dissolve', glow: 'warm', caption: 'Resource collection.',
  },
  {
    src: 'ai_scene4.png', dur: 2600,
    initial: { scale: 1.04, y: '0.5%' }, animate: { scale: 1.08, y: '-0.5%' },
    transition: { duration: 3.0, ease: 'easeIn' },
    cutType: 'dissolve', glow: 'warm', caption: 'First app sketch.',
  },
  {
    src: 'ai_scene5.png', dur: 3000,
    initial: { scale: 1.1 }, animate: { scale: 1.0 },
    transition: { duration: 3.2, ease: [0.16, 1, 0.3, 1] },
    cutType: 'flash', glow: 'cold', caption: 'Late night coding.',
  },
  {
    src: 'ai_scene6.png', dur: 2800,
    initial: { scale: 1.05, y: '-0.5%' }, animate: { scale: 1.0, y: '0.5%' },
    transition: { duration: 3.0, ease: 'easeOut' },
    cutType: 'flash', glow: 'cold', caption: 'Progress montage.',
  },
  {
    src: 'ai_scene7.png', dur: 3000,
    initial: { scale: 1.06, x: '-0.5%' }, animate: { scale: 1.0, x: '0.5%' },
    transition: { duration: 3.5, ease: 'easeOut' },
    cutType: 'dissolve', glow: 'warm', caption: 'Sacrifice.',
  },
  {
    src: 'ai_scene8.png', dur: 2800,
    initial: { scale: 1.04, y: '1%' }, animate: { scale: 1.0, y: '0%' },
    transition: { duration: 3.2, ease: 'easeOut' },
    cutType: 'dissolve', glow: 'warm', caption: 'First working prototype.',
  },
  {
    src: 'ai_scene9.png', dur: 3500,
    initial: { scale: 1.08, y: '-1%' }, animate: { scale: 1.0, y: '0%' },
    transition: { duration: 4.5, ease: 'easeOut' },
    cutType: 'dissolve', glow: 'none', caption: 'Silent victory.',
  },
  {
    src: 'ai_scene10.png', dur: 4000,
    initial: { scale: 1.05, y: '0.5%' }, animate: { scale: 1.0, y: '0%' },
    transition: { duration: 5.0, ease: 'easeOut' },
    cutType: 'dissolve', glow: 'warm', caption: 'The beginning of Mission Distinction.',
  },
];
// Total: 29900ms

export function SceneWorkBegins() {
  const [shotIndex, setShotIndex] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const [narration, setNarration] = useState<string | null>(null);
  const builtTimers = useRef(false);

  const currentShot = SHOTS[shotIndex];

  useSceneSpeech([
    { atPhase: 0, text: 'Dreams are easy. Building is hard.' },
    { atPhase: 4, text: 'They coded through the night.' },
    { atPhase: 8, text: 'Five students. One rooftop. One mission.' },
    { atPhase: 9, text: 'The beginning of Mission Distinction.' },
  ], shotIndex);

  useEffect(() => {
    if (builtTimers.current) return;
    builtTimers.current = true;

    let cursor = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Advance shots
    SHOTS.forEach((shot, i) => {
      if (i > 0) {
        const t = cursor;
        if (shot.cutType === 'flash') {
          timers.push(setTimeout(() => {
            setFlashActive(true);
            setTimeout(() => { setFlashActive(false); setShotIndex(i); }, 80);
          }, t));
        } else {
          timers.push(setTimeout(() => setShotIndex(i), t));
        }
      }
      cursor += shot.dur;
    });

    // Narration timings (cumulative shot starts)
    const shotStart = SHOTS.reduce<number[]>((acc, s, i) => {
      acc.push(i === 0 ? 0 : acc[i - 1] + SHOTS[i - 1].dur);
      return acc;
    }, []);

    timers.push(setTimeout(() => setNarration('Dreams are easy.\nBuilding is hard.'), shotStart[0] + 800));
    timers.push(setTimeout(() => setNarration(null), shotStart[1] - 300));

    timers.push(setTimeout(() => setNarration('They coded\nthrough the night.'), shotStart[4] + 800));
    timers.push(setTimeout(() => setNarration(null), shotStart[5] - 300));

    timers.push(setTimeout(() => setNarration('Five students.\nOne rooftop. One mission.'), shotStart[8] + 1000));
    timers.push(setTimeout(() => setNarration(null), shotStart[9] - 300));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}>

      {/* ── ALL SHOTS stacked, crossfading ── */}
      {SHOTS.map((shot, i) => (
        <motion.div key={i} className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: shotIndex === i ? 1 : 0 }}
          transition={{ duration: shot.cutType === 'flash' ? 0.07 : 0.65, ease: 'easeInOut' }}>
          <motion.div className="absolute inset-0"
            initial={shot.initial}
            animate={shotIndex === i ? shot.animate : shot.initial}
            transition={shot.transition}>
            <img
              src={`${import.meta.env.BASE_URL}images/${shot.src}`}
              className="w-full h-full object-cover object-center"
              style={{
                filter: shot.glow === 'cold'
                  ? 'brightness(0.72) saturate(0.82) contrast(1.06)'
                  : 'brightness(0.7) saturate(0.9)',
              }}
              alt=""
            />
          </motion.div>
        </motion.div>
      ))}

      {/* Flash overlay for hard cuts */}
      <motion.div className="absolute inset-0 pointer-events-none z-40 bg-white"
        animate={{ opacity: flashActive ? 0.85 : 0 }}
        transition={{ duration: 0.06 }} />

      {/* Warm amber desk-lamp glow */}
      <motion.div className="absolute inset-0 pointer-events-none z-1"
        animate={{ opacity: currentShot.glow === 'warm' ? 1 : 0 }}
        transition={{ duration: 0.9 }}
        style={{ background: 'radial-gradient(ellipse at 32% 62%, rgba(200,163,64,0.14) 0%, transparent 62%)' }} />

      {/* Cold blue coding glow */}
      <motion.div className="absolute inset-0 pointer-events-none z-1"
        animate={{ opacity: currentShot.glow === 'cold' ? 1 : 0 }}
        transition={{ duration: 0.9 }}
        style={{ background: 'radial-gradient(ellipse at 60% 48%, rgba(30,80,200,0.18) 0%, transparent 65%)' }} />

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-0 z-5 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.18) 26%, transparent 52%)' }} />

      {/* Top vignette */}
      <div className="absolute inset-0 z-5 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 22%)' }} />

      {/* Chapter label — top left, visible on first 3 shots */}
      <motion.p className="absolute font-mono z-20 pointer-events-none"
        style={{
          top: '14%', left: '6vw',
          fontSize: 'clamp(0.5rem, 0.8vw, 0.7rem)',
          letterSpacing: '0.5em',
          color: 'rgba(200,163,64,0.55)',
          textTransform: 'uppercase',
        }}
        animate={{ opacity: shotIndex < 3 ? 1 : 0 }}
        transition={{ duration: 1.2 }}>
        The Work Begins
      </motion.p>

      {/* Narration text — appears at specific shots, italic serif */}
      <AnimatePresence>
        {narration && (
          <motion.p
            key={narration}
            className="absolute z-20 pointer-events-none w-full text-center"
            style={{
              bottom: '24%',
              fontFamily: 'var(--font-display, serif)',
              fontSize: 'clamp(0.85rem, 2vw, 1.45rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.82)',
              textShadow: '0 2px 28px rgba(0,0,0,0.96)',
              letterSpacing: '0.04em',
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
            }}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}>
            {narration}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Shot caption — storyboard-style subtitle, bottom center */}
      <AnimatePresence>
        <motion.p
          key={`cap-${shotIndex}`}
          className="absolute z-20 pointer-events-none w-full text-center font-mono"
          style={{
            bottom: '16%',
            fontSize: 'clamp(0.55rem, 1.05vw, 0.88rem)',
            letterSpacing: '0.34em',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            textShadow: '0 1px 14px rgba(0,0,0,0.9)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.45 }}>
          {currentShot.caption}
        </motion.p>
      </AnimatePresence>

    </motion.div>
  );
}
