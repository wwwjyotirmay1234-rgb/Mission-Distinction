import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { PhoneMockup } from './PhoneMockup';

export const SCENE_DURATIONS = {
  problem: 7000,
  solution: 8000,
  reveal: 8000,
  library: 8000,
  quizzes: 8000,
  community: 8000,
  notes: 8000,
  leaderboard: 8000,
  mission: 7000,
  outro: 9000,
};

const SCENE_TEXT: Record<string, { label: string; title: string }> = {
  problem:     { label: '1st Year MBBS',       title: 'The hardest year of your life.' },
  solution:    { label: 'Mission Distinction',  title: 'Your edge. Your weapon.' },
  reveal:      { label: 'Dashboard',            title: 'Everything you need. One app.' },
  library:     { label: 'PDF Library',          title: '50+ textbooks, instantly.' },
  quizzes:     { label: 'Daily Quizzes',        title: 'Test yourself. Every day.' },
  community:   { label: 'Community',            title: 'Study together. Grow together.' },
  notes:       { label: 'Smart Notes',          title: 'Capture knowledge. Own it.' },
  leaderboard: { label: 'Leaderboard',          title: 'Compete. Rise. Dominate.' },
  mission:     { label: 'Our Mission',          title: 'Free. Forever. For every student.' },
  outro:       { label: 'Available Now',        title: 'Study Smarter. Score Higher.' },
};

const BOKEH = [
  { w: 600, h: 600, x: '-5%', y: '-10%', color: '#7c3aed', opacity: 0.12, blur: 140, dur: 18 },
  { w: 500, h: 500, x: '55%', y: '30%',  color: '#4f46e5', opacity: 0.09, blur: 120, dur: 22 },
  { w: 400, h: 400, x: '20%', y: '55%',  color: '#7c3aed', opacity: 0.07, blur: 130, dur: 15 },
  { w: 350, h: 350, x: '70%', y: '-5%',  color: '#0d9488', opacity: 0.06, blur: 110, dur: 25 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const sceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(sceneKey);
  const text = SCENE_TEXT[sceneKey] ?? { label: '', title: '' };

  return (
    <div
      className="w-full h-screen overflow-hidden relative flex flex-col items-center justify-center"
      style={{ background: '#080810' }}
    >
      {/* Bokeh background */}
      {BOKEH.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.w,
            height: b.h,
            left: b.x,
            top: b.y,
            background: b.color,
            opacity: b.opacity,
            filter: `blur(${b.blur}px)`,
          }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.92, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 3 }}
        />
      ))}

      {/* Subtle grid noise */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Phone — centered hero */}
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: '1400px', perspectiveOrigin: '50% 45%' }}
      >
        <PhoneMockup currentSceneKey={sceneKey} />
      </div>

      {/* Minimal text overlay — below phone */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneKey + '_text'}
          className="absolute bottom-[7%] left-0 right-0 flex flex-col items-center gap-2 pointer-events-none px-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          <span
            className="text-[11px] font-bold tracking-[0.25em] uppercase"
            style={{ color: '#a78bfa' }}
          >
            {text.label}
          </span>
          <p
            className="text-center font-bold leading-tight max-w-[380px]"
            style={{ fontSize: 'clamp(15px, 2.2vw, 22px)', color: 'rgba(255,255,255,0.88)' }}
          >
            {text.title}
          </p>
        </motion.div>
      </AnimatePresence>

      <span data-scene-index={sceneIndex} style={{ display: 'none' }} />
    </div>
  );
}
