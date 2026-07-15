import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { CinematicFrame, BlackScene, TextCard, SilentFrame } from './video_scenes/Frames';

// ─────────────────────────────────────────────────────────────────────────────
//  SCENE 1 — THE STRUGGLE  (10 shots, ~56 s)
//  SCENE 2 — THE DECISION  (7 shots, ~38 s)
//  Total runtime: ~2 min including endings
// ─────────────────────────────────────────────────────────────────────────────

export const SCENE_DURATIONS: Record<string, number> = {

  // ── Scene 1 — The Struggle ───────────────────────────────────────────────
  s1_01:   4000,   // Shot 1 — Drone: hostel at night, all windows dark, one lit
  s1_02:   4000,   // Shot 2 — Window approach through rain, push through glass
  s1_03:   5000,   // Shot 3 — Overhead desk: anatomy/physiology/biochem buried
  s1_04:   5000,   // Shot 4 — Close-up face: dark circles, eyes tired
  s1_05:   5000,   // Shot 5 — Over-shoulder laptop: PDFs, WhatsApp chaos
  s1_06:   5000,   // Shot 6 — Top-down checklist: few done, many remaining
  s1_07:   3000,   // Shot 7 — PEN DROP. Extreme close-up. Silence.
  s1_08:   6000,   // Shot 8 — Side profile window: city lights blurred in rain
  s1_09:   7000,   // Shot 9 — Realization: expression tired → thinking
  s1_10:   8000,   // Shot 10 — Eyes + notebook: writes "There has to be a better way"

  // ── Inter-scene bridge (black) ───────────────────────────────────────────
  bridge:  4000,   // "ONE STUDENT HAD A QUESTION…"

  // ── Scene 2 — The Decision ───────────────────────────────────────────────
  s2_01:   5000,   // Canteen: three friends sitting
  s2_02:   4000,   // Friend throws notebook in frustration
  s2_03:   4000,   // Friend scrolling WhatsApp — information overload
  s2_04:   5000,   // Founder listening, thinking
  s2_05:   5000,   // Founder opens blank notebook
  s2_06:   6000,   // Pen writes "MD" — the name is born
  s2_07:   5000,   // All three look at notebook — determination

  // ── Ending ───────────────────────────────────────────────────────────────
  end_title: 7000,  // "One Idea Changed Everything."
};

// ─────────────────────────────────────────────────────────────────────────────

interface SceneData {
  type: 'black' | 'frame' | 'textcard' | 'silent';
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

  // ── Scene 1 ──────────────────────────────────────────────────────────────

  s1_01: {
    type: 'frame',
    image: 's1_n01.png',
    narration: '"Every year, thousands of students enter medical college with a dream."',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '-1%'] },
  },
  s1_02: {
    // Silent — rain on glass, let the image breathe
    type: 'silent',
    image: 's1_n02.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_03: {
    type: 'frame',
    image: 's1_01.png',
    narration: '"The syllabus seemed endless."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s1_04: {
    type: 'frame',
    image: 's1_02.png',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_05: {
    type: 'frame',
    image: 's1_n05.png',
    narration: '"Information was everywhere. Guidance was not."',
    kenBurns: { scale: [1.05, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s1_06: {
    type: 'frame',
    image: 's1_03.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_07: {
    // THE PEN DROP — No narration. Pure silence. Most important 3 seconds.
    type: 'silent',
    image: 's1_n07.png',
    kenBurns: { scale: [1.0, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_08: {
    type: 'frame',
    image: 's1_05.png',
    narration: '"Maybe I am falling behind."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_09: {
    // Realization — silent shift in expression
    type: 'silent',
    image: 's1_n09.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_10: {
    type: 'frame',
    image: 's1_n10.png',
    narration: '"And that single thought… changed everything."',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Bridge ────────────────────────────────────────────────────────────────
  bridge: {
    type: 'textcard',
    line1: 'ONE STUDENT HAD A QUESTION.',
    line2: 'THREE STUDENTS DECIDED TO FIND AN ANSWER.',
  },

  // ── Scene 2 ──────────────────────────────────────────────────────────────

  s2_01: {
    type: 'frame',
    image: 's2_01.png',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_02: {
    type: 'frame',
    image: 's2_02.png',
    narration: '"We can\'t find proper notes. Everything is scattered."',
    kenBurns: { scale: [1.0, 1.06], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s2_03: {
    type: 'frame',
    image: 's2_03.png',
    kenBurns: { scale: [1.04, 1.04], x: ['2%', '-2%'], y: ['0%', '0%'] },
  },
  s2_04: {
    type: 'frame',
    image: 's2_04.png',
    narration: '"What if everything a student needs… was in one place?"',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_05: {
    type: 'frame',
    image: 's2_05.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_06: {
    type: 'frame',
    image: 's2_06.png',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_07: {
    type: 'frame',
    image: 's2_07.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Ending ────────────────────────────────────────────────────────────────

  end_title: {
    type: 'textcard',
    line1: 'One Idea Changed Everything.',
    large: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────

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
  const sceneData = SCENES[baseKey] ?? SCENES['s1_01'];
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
    if (sceneData.type === 'silent') {
      return (
        <SilentFrame
          key={currentSceneKey}
          duration={duration}
          image={sceneData.image!}
          kenBurns={sceneData.kenBurns!}
          fadeToBlack={sceneData.fadeToBlack}
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
