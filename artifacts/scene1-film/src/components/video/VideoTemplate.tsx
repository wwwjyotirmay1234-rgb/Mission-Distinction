import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { CinematicFrame } from './video_scenes/Frames';

export const SCENE_DURATIONS: Record<string, number> = {
  s1: 6000,
  s2: 5000,
  s3: 6000,
  s4: 5000,
  s5: 5000,
  s6: 6000,
  s7: 5000,
  s8: 6000,
  s9: 5000,
  s10: 6000,
};

const FRAMES = [
  {
    id: 's1',
    image: 'frame_01.png',
    text: "Every year, thousands of MBBS students begin their journey with dreams.",
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
    isFirst: true,
  },
  {
    id: 's2',
    image: 'frame_02.png',
    text: "Every year, thousands of MBBS students begin their journey with dreams.",
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  {
    id: 's3',
    image: 'frame_03.png',
    text: "But dreams alone do not make the syllabus smaller.",
    kenBurns: { scale: [1.05, 1.05], x: ['-2%', '2%'], y: ['0%', '0%'] },
  },
  {
    id: 's4',
    image: 'frame_04.png',
    text: "But dreams alone do not make the syllabus smaller.",
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  {
    id: 's5',
    image: 'frame_05.png',
    text: "The books grow. The pressure grows.",
    kenBurns: { scale: [1.05, 1.05], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  {
    id: 's6',
    image: 'frame_06.png',
    text: "The books grow. The pressure grows.",
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  {
    id: 's7',
    image: 'frame_07.png',
    text: "And sometimes… you begin to wonder if you're falling behind.",
    kenBurns: { scale: [1.05, 1.05], x: ['2%', '-2%'], y: ['0%', '0%'] },
  },
  {
    id: 's8',
    image: 'frame_08.png',
    text: "And sometimes… you begin to wonder if you're falling behind.",
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  {
    id: 's9',
    image: 'frame_09.png',
    text: "One student felt exactly the same.",
    kenBurns: { scale: [1.1, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  {
    id: 's10',
    image: 'frame_10.png',
    text: "",
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
    isLast: true,
  },
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
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const baseIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const frameData = FRAMES[baseIndex >= 0 ? baseIndex : 0];
  const duration = durations[currentSceneKey] ?? 5000;

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      <AnimatePresence mode="sync">
        <CinematicFrame
          key={currentSceneKey}
          duration={duration}
          {...frameData}
        />
      </AnimatePresence>
    </div>
  );
}
