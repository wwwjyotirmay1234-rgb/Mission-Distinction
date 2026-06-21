import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1Hook } from './video_scenes/Scene1Hook';
import { Scene2Solution } from './video_scenes/Scene2Solution';
import { Scene3Features } from './video_scenes/Scene3Features';
import { Scene4Community } from './video_scenes/Scene4Community';
import { Scene5Free } from './video_scenes/Scene5Free';
import { Scene6Outro } from './video_scenes/Scene6Outro';

export const SCENE_DURATIONS = {
  hook: 5000,
  solution: 4000,
  features: 5000,
  community: 5000,
  free: 4000,
  outro: 6000
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook: Scene1Hook,
  solution: Scene2Solution,
  features: Scene3Features,
  community: Scene4Community,
  free: Scene5Free,
  outro: Scene6Outro,
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

      {/* Grid overlay for tech/medical feel */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      {/* sceneIndex used to suppress unused-var warning — available for future persistent elements */}
      <span data-scene-index={sceneIndex} style={{ display: 'none' }} />
    </div>
  );
}
