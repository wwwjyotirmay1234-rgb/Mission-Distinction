import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { CinematicFrame, BlackScene, TextCard } from './video_scenes/Frames';

export const SCENE_DURATIONS: Record<string, number> = {
  opening:    5000,
  s1:         4000,
  s2:         5000,
  s3:         5000,
  s4:         4000,
  s5:         4000,
  s6:         5000,
  s7:         3000,
  s8:         6000,
  s9:         5000,
  s10:        6000,
  final:      7000,
  text1:      5000,
  text2:      5000,
  transition: 5000,
};

interface SceneData {
  type: 'black' | 'frame' | 'textcard';
  image?: string;
  narration?: string;
  kenBurns?: { scale: number[]; x: string[]; y: string[] };
  fadeToBlack?: boolean;
  fadeIn?: boolean;
  line1?: string;
  line2?: string;
  large?: boolean;
}

const SCENES: Record<string, SceneData> = {
  opening: {
    type: 'black',
    fadeIn: true,
    narration: '"Every year, thousands of students enter medical college with a dream.\n\nA dream to become a doctor."',
  },
  s1: {
    type: 'frame',
    image: 'frame_01.png',
    narration: '"But dreams meet reality."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '-2%'] },
  },
  s2: {
    type: 'frame',
    image: 'frame_02b.png',
    kenBurns: { scale: [1.06, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s3: {
    type: 'frame',
    image: 'frame_03b.png',
    narration: '"The syllabus seemed endless."',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s4: {
    type: 'frame',
    image: 'frame_04b.png',
    narration: '"The books kept growing."',
    kenBurns: { scale: [1.05, 1.05], x: ['-2%', '2%'], y: ['0%', '0%'] },
  },
  s5: {
    type: 'frame',
    image: 'frame_02.png',
    narration: '"The pressure kept growing."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6: {
    type: 'frame',
    image: 'frame_03.png',
    kenBurns: { scale: [1.05, 1.05], x: ['2%', '-2%'], y: ['0%', '0%'] },
  },
  s7: {
    type: 'frame',
    image: 'frame_05.png',
    kenBurns: { scale: [1.04, 1.08], x: ['0%', '0%'], y: ['1%', '-1%'] },
  },
  s8: {
    type: 'frame',
    image: 'frame_06.png',
    narration: '"And sometimes… he wondered if he was already falling behind."',
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9: {
    type: 'frame',
    image: 'frame_09b.png',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10: {
    type: 'frame',
    image: 'frame_09.png',
    narration: '"He wasn\'t the only one. Across Odisha… hundreds of students felt exactly the same."',
    kenBurns: { scale: [1.1, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  final: {
    type: 'frame',
    image: 'frame_10.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  text1: {
    type: 'textcard',
    line1: '"What if the problem wasn\'t the students…"',
    line2: '"What if the problem was the lack of guidance?"',
  },
  text2: {
    type: 'textcard',
    line1: '"What if the problem was the lack of guidance?"',
  },
  transition: {
    type: 'textcard',
    line1: 'One Idea Changed Everything.',
    large: true,
  },
};

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

  const baseKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneData = SCENES[baseKey] ?? SCENES['opening'];
  const duration = durations[currentSceneKey] ?? 5000;

  const renderScene = () => {
    if (sceneData.type === 'black') {
      return (
        <BlackScene
          key={currentSceneKey}
          duration={duration}
          narration={sceneData.narration ?? ''}
          fadeIn={sceneData.fadeIn}
        />
      );
    }
    if (sceneData.type === 'frame') {
      return (
        <CinematicFrame
          key={currentSceneKey}
          duration={duration}
          image={sceneData.image!}
          narration={sceneData.narration}
          kenBurns={sceneData.kenBurns!}
          fadeToBlack={sceneData.fadeToBlack}
        />
      );
    }
    return (
      <TextCard
        key={currentSceneKey}
        duration={duration}
        line1={sceneData.line1!}
        line2={sceneData.line2}
        large={sceneData.large}
      />
    );
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      <AnimatePresence mode="sync">
        {renderScene()}
      </AnimatePresence>
    </div>
  );
}
