import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { CinematicFrame, BlackScene, TextCard } from './video_scenes/Frames';

export const SCENE_DURATIONS: Record<string, number> = {
  // ── Opening ──────────────────────────────────────────
  opening:      5000,

  // ── Scene 1 — The Struggle ───────────────────────────
  s1_f1:        5000,   // wide shot, 2:17 AM desk
  s1_f2:        5000,   // medium shot, reading
  s1_f3:        5000,   // over-shoulder checklist
  s1_f4:        4000,   // extreme close-up eyes
  s1_f5:        6000,   // looks toward window → fade to black

  // ── Scene 2 — The Decision ───────────────────────────
  s2_s1:        5000,   // canteen, three friends sitting
  s2_s2:        4000,   // friend throws notebook
  s2_s3:        4000,   // friend scrolls WhatsApp
  s2_s4:        5000,   // founder listening, thinking
  s2_s5:        5000,   // founder opens notebook
  s2_s6:        6000,   // pen writes "MD"
  s2_s7:        5000,   // all three look at notebook — determination

  // ── Ending ───────────────────────────────────────────
  end_text:     5000,   // "An idea was born."
  end_title:    6000,   // "One Idea Changed Everything."
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
    narration: '"Every year, thousands of students enter medical college with a dream. A dream to become a doctor."',
  },

  // Scene 1
  s1_f1: {
    type: 'frame',
    image: 's1_01.png',
    narration: '"But dreams meet reality."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '-2%'] },
  },
  s1_f2: {
    type: 'frame',
    image: 's1_02.png',
    kenBurns: { scale: [1.05, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s1_f3: {
    type: 'frame',
    image: 's1_03.png',
    narration: '"The syllabus seemed endless."',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_f4: {
    type: 'frame',
    image: 's1_04.png',
    narration: '"The pressure kept growing."',
    kenBurns: { scale: [1.0, 1.09], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_f5: {
    type: 'frame',
    image: 's1_05.png',
    narration: '"And sometimes… he wondered if he was already falling behind."',
    fadeToBlack: true,
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // Scene 2
  s2_s1: {
    type: 'frame',
    image: 's2_01.png',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_s2: {
    type: 'frame',
    image: 's2_02.png',
    narration: '"I can\'t find proper notes."',
    kenBurns: { scale: [1.0, 1.06], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s2_s3: {
    type: 'frame',
    image: 's2_03.png',
    narration: '"Everything is scattered."',
    kenBurns: { scale: [1.04, 1.04], x: ['2%', '-2%'], y: ['0%', '0%'] },
  },
  s2_s4: {
    type: 'frame',
    image: 's2_04.png',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_s5: {
    type: 'frame',
    image: 's2_05.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_s6: {
    type: 'frame',
    image: 's2_06.png',
    narration: '"What if everything students needed was in one place?"',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_s7: {
    type: 'frame',
    image: 's2_07.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // Ending
  end_text: {
    type: 'textcard',
    line1: '"An idea was born."',
  },
  end_title: {
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
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

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
