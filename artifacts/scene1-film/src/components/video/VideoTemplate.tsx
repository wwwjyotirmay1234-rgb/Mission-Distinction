import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { CinematicFrame, BlackScene, TextCard, SilentFrame } from './video_scenes/Frames';

// ─────────────────────────────────────────────────────────────────────────────
//  SCENE 1 — THE STRUGGLE    (10 shots, ~56 s)
//  SCENE 2 — THE DECISION    (7 shots,  ~34 s)
//  SCENE 3 — THE DISCOVERY   (10 shots, ~69 s)
//  Total runtime: ~3 min including bridges + endings
// ─────────────────────────────────────────────────────────────────────────────

export const SCENE_DURATIONS: Record<string, number> = {

  // ── Scene 1 — The Struggle ───────────────────────────────────────────────
  s1_01:   4000,   // Shot 1 — Drone: hostel at night, one window lit
  s1_02:   4000,   // Shot 2 — Rain window exterior push-in
  s1_03:   5000,   // Shot 3 — Overhead desk: books, clock 2:47 AM
  s1_04:   5000,   // Shot 4 — Close-up face: dark circles, exhausted
  s1_05:   5000,   // Shot 5 — Over-shoulder laptop: PDFs, chaos
  s1_06:   5000,   // Shot 6 — Checklist: few done, many remaining
  s1_07:   3000,   // Shot 7 — PEN DROP. Silence.
  s1_08:   6000,   // Shot 8 — Side profile: rain on window
  s1_09:   7000,   // Shot 9 — Realization: tired → thinking
  s1_10:   8000,   // Shot 10 — Eyes + notebook: "There has to be a better way"

  // ── Bridge 1 ────────────────────────────────────────────────────────────
  bridge:  4000,   // "ONE STUDENT HAD A QUESTION…"

  // ── Scene 2 — The Decision ───────────────────────────────────────────────
  s2_01:   5000,   // Canteen: three friends sitting
  s2_02:   4000,   // Friend overwhelmed by syllabus
  s2_03:   4000,   // Friend scrolling — information overload
  s2_04:   5000,   // Founder listening, the idea forming
  s2_05:   5000,   // Founder opens blank notebook
  s2_06:   6000,   // Pen writes "MD" — the name is born
  s2_07:   5000,   // All three look at notebook — determination

  // ── Bridge 2 ────────────────────────────────────────────────────────────
  bridge2: 4000,   // "BUT THE QUESTION ONLY GREW BIGGER."

  // ── Scene 3 — The Discovery ─────────────────────────────────────────────
  s3_01:   5000,   // Shot 1 — Campus walk: founder among crowd
  s3_02:   6000,   // Shot 2 — Library: everyone searching, confused
  s3_03:   6000,   // Shot 3 — "Do you have the Physiology notes?" "No."
  s3_04:   7000,   // Shot 4 — Founder observing, the weight of understanding
  s3_05:   6000,   // Shot 5 — Three friends under a tree, silent
  s3_06:   7000,   // Shot 6 — Overhead notebook: the list grows
  s3_07:   8000,   // Shot 7 — Turning point: "Then let's not do it alone."
  s3_08:   8000,   // Shot 8 — The pact: three hands on notebook, piano begins
  s3_09:  10000,   // Shot 9 — "MISSION DISTINCTION" written, music rises
  s3_10:   6000,   // Shot 10 — "For Every Student Who Struggles Alone."

  // ── Ending ───────────────────────────────────────────────────────────────
  end_card1: 5000, // "Three Students. One Problem. One Mission."
  end_title: 7000, // "One Idea Changed Everything."
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
  line3?: string;
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

  // ── Bridge 1 ──────────────────────────────────────────────────────────────
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

  // ── Bridge 2 ──────────────────────────────────────────────────────────────
  bridge2: {
    type: 'textcard',
    line1: 'BUT THE QUESTION ONLY GREW BIGGER.',
    line2: 'BECAUSE IT WASN\'T JUST HIS QUESTION.',
  },

  // ── Scene 3 — The Discovery ───────────────────────────────────────────────

  s3_01: {
    type: 'frame',
    image: 's3_01.png',
    narration: '"The next few days… a question refused to leave his mind."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_02: {
    type: 'silent',
    image: 's3_02.png',
    kenBurns: { scale: [1.0, 1.05], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s3_03: {
    type: 'frame',
    image: 's3_03.png',
    narration: '"Every student was looking for something. No one had it."',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_04: {
    type: 'frame',
    image: 's3_04.png',
    narration: '"It wasn\'t one student. It wasn\'t one classroom. It was everyone."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_05: {
    type: 'silent',
    image: 's3_05.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_06: {
    type: 'frame',
    image: 's3_06.png',
    narration: '"One person can\'t solve this."',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s3_07: {
    type: 'frame',
    image: 's3_07.png',
    narration: '"Then let\'s not do it alone."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_08: {
    type: 'silent',
    image: 's3_08.png',
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_09: {
    type: 'frame',
    image: 's3_09.png',
    narration: '"Mission Distinction."',
    fadeToBlack: false,
    kenBurns: { scale: [1.0, 1.12], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_10: {
    type: 'silent',
    image: 's3_10.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Ending ────────────────────────────────────────────────────────────────

  end_card1: {
    type: 'textcard',
    line1: 'Three Students.',
    line2: 'One Problem.',
    line3: 'One Mission.',
  },
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
        line3={sceneData.line3}
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
