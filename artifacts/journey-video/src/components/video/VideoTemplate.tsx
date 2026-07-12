import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS: Record<string, number> = {
  s1_beginning: 7800,
  s2_building: 7800,
  s3_challenges: 8000,
  s4_progress: 10000,
  s5_launch: 7800,
  s6_outro: 10000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  s1_beginning: Scene1,
  s2_building: Scene2,
  s3_challenges: Scene3,
  s4_progress: Scene4,
  s5_launch: Scene5,
  s6_outro: Scene6,
};

const AMBIENT_COLORS = ['#C8A340', '#7c3aed', '#8b5cf6', '#7c3aed', '#C8A340', '#7c3aed'];
const BLOB1_SIZE_W = ['40vw', '60vw', '50vw', '30vw', '80vw', '50vw'];
const BLOB1_SIZE_H = ['40vh', '60vh', '50vh', '30vh', '80vh', '50vh'];
const BLOB1_LEFT  = ['-10vw', '50vw', '80vw', '10vw', '-20vw', '25vw'];
const BLOB1_TOP   = ['-10vh', '-20vh', '50vh', '70vh', '40vh', '25vh'];
const BLOB1_OP    = [0.15, 0.1, 0.2, 0.15, 0.2, 0.1];
const BLOB2_SIZE_W = ['30vw', '40vw', '70vw', '50vw', '60vw', '40vw'];
const BLOB2_SIZE_H = ['30vh', '40vh', '70vh', '50vh', '60vh', '40vh'];
const BLOB2_RIGHT  = ['-5vw', '10vw', '-10vw', '60vw', '-10vw', '30vw'];
const BLOB2_BOTTOM = ['-5vh', '60vh', '-10vh', '10vh', '-20vh', '30vh'];
const BLOB2_COLORS = ['#7c3aed', '#C8A340', '#0d0f1a', '#C8A340', '#7c3aed', '#C8A340'];
const BLOB2_OP     = [0.1, 0.15, 0.05, 0.2, 0.1, 0.15];

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

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Math.max(0, Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey));
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen bg-brand-navy overflow-hidden font-sans text-white">
      {/* Persistent background texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/medical-pattern.png)` }}
          animate={{ x: ['-2%', '2%', '-1%', '0%'], y: ['-2%', '0%', '2%', '-1%'] }}
          transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
        />
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-color-dodge">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/abstract-bg.png)` }}
          animate={{ scale: [1, 1.1, 1.05], rotate: [0, 5, -2, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 30, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      {/* Persistent ambient blobs */}
      <motion.div
        className="absolute rounded-full blur-[100px] pointer-events-none z-0"
        animate={{
          width: BLOB1_SIZE_W[sceneIndex],
          height: BLOB1_SIZE_H[sceneIndex],
          left: BLOB1_LEFT[sceneIndex],
          top: BLOB1_TOP[sceneIndex],
          backgroundColor: AMBIENT_COLORS[sceneIndex],
          opacity: BLOB1_OP[sceneIndex],
        }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="absolute rounded-full blur-[120px] pointer-events-none z-0"
        animate={{
          width: BLOB2_SIZE_W[sceneIndex],
          height: BLOB2_SIZE_H[sceneIndex],
          right: BLOB2_RIGHT[sceneIndex],
          bottom: BLOB2_BOTTOM[sceneIndex],
          backgroundColor: BLOB2_COLORS[sceneIndex],
          opacity: BLOB2_OP[sceneIndex],
        }}
        transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Frame border vignette */}
      <div className="absolute inset-0 border-[1vw] border-brand-navy z-50 pointer-events-none opacity-50 mix-blend-overlay" />

      {/* Scene content */}
      <div className="w-full h-full relative z-10">
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
