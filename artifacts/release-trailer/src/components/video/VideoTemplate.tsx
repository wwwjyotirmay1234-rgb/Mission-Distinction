import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1Problem } from './video_scenes/Scene1Problem';
import { Scene2Solution } from './video_scenes/Scene2Solution';
import { Scene3Reveal } from './video_scenes/Scene3Reveal';
import { Scene4Library } from './video_scenes/Scene4Library';
import { Scene5Quizzes } from './video_scenes/Scene5Quizzes';
import { Scene6Community } from './video_scenes/Scene6Community';
import { Scene7Notes } from './video_scenes/Scene7Notes';
import { Scene8Leaderboard } from './video_scenes/Scene8Leaderboard';
import { Scene9Mission } from './video_scenes/Scene9Mission';
import { Scene10Outro } from './video_scenes/Scene10Outro';
import { PhoneMockup } from './PhoneMockup';

export const SCENE_DURATIONS = {
  problem: 12000,
  solution: 12000,
  reveal: 12000,
  library: 12000,
  quizzes: 12000,
  community: 12000,
  notes: 12000,
  leaderboard: 12000,
  mission: 12000,
  outro: 12000
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  problem: Scene1Problem,
  solution: Scene2Solution,
  reveal: Scene3Reveal,
  library: Scene4Library,
  quizzes: Scene5Quizzes,
  community: Scene6Community,
  notes: Scene7Notes,
  leaderboard: Scene8Leaderboard,
  mission: Scene9Mission,
  outro: Scene10Outro,
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

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 mix-blend-screen"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent)' }}
          animate={{
            x: ['-20%', '40%', '-10%'],
            y: ['0%', '30%', '-20%'],
            scale: [1, 1.2, 0.9],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-20 right-0 bottom-0 mix-blend-screen"
          style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)' }}
          animate={{
            x: ['10%', '-30%', '20%'],
            y: ['10%', '-20%', '10%'],
            scale: [0.8, 1.3, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Persistent Phone Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-end px-[15vw]">
        <PhoneMockup currentSceneKey={baseSceneKey} />
      </div>

      {/* Text Scenes */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>

      <span data-scene-index={sceneIndex} style={{ display: 'none' }} />
    </div>
  );
}
