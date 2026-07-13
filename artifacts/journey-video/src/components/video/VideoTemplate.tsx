import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene0 } from './video_scenes/Scene0';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { SceneFall } from './video_scenes/SceneFall';
import { SceneComeback } from './video_scenes/SceneComeback';
import { SceneLaunchDay } from './video_scenes/SceneLaunchDay';
import { SceneMovement } from './video_scenes/SceneMovement';
import { SceneLegacy } from './video_scenes/SceneLegacy';
import { SceneWorkBegins } from './video_scenes/SceneWorkBegins';
import { SceneDoctorDream } from './video_scenes/SceneDoctorDream';
import { SceneNextDreamer } from './video_scenes/SceneNextDreamer';

export const SCENE_DURATIONS: Record<string, number> = {
  s0_coldopen:    15000,  // Opening — 3 shots × 5s: clock → student alone → phone
  s1_beginning:   10000,  // The Realization — lecture hall, not alone
  s2_building:    12000,  // The Spark — 5 students, the whiteboard
  s2_workbegins:  15000,  // The Work Begins — fast montage 10 frames
  s3_darknight:   31100,  // Scene 5 — The Fall (10 frames × 2.5–5s)
  s4_progress:    29600,  // Scene 6 — The Comeback (10 frames)
  s5_launch:      30000,  // Scene 7 — Launch Day (10 frames)
  s6_climb:       30500,  // Scene 8 — The Movement (10 frames)
  s7_foryou:      30000,  // Scene 9 — The Legacy (10 frames)
  s8_outro:       30500,  // Scene 10 — The Doctor They Dreamed To Be (10 frames)
  s9_nextdreamer: 30500,  // Scene 11 — The Next Dreamer (post-credit, cinematic circle)
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  s0_coldopen:    Scene0,
  s1_beginning:   Scene1,
  s2_building:    Scene2,
  s2_workbegins:  SceneWorkBegins,
  s3_darknight:   SceneFall,
  s4_progress:    SceneComeback,
  s5_launch:      SceneLaunchDay,
  s6_climb:       SceneMovement,
  s7_foryou:      SceneLegacy,
  s8_outro:       SceneDoctorDream,
  s9_nextdreamer: SceneNextDreamer,
};

// 11 values — one per scene (s2_workbegins inserted at index 3; s9_nextdreamer at index 10)
const AMBIENT_COLORS = ['#1a1030', '#C8A340', '#7c3aed', '#C8A340', '#3b0000', '#7c3aed', '#C8A340', '#C8A340', '#7c3aed', '#7c3aed', '#0d0f20'];
const BLOB1_SIZE_W   = ['15vw', '40vw', '60vw', '50vw', '25vw', '50vw', '30vw', '80vw', '45vw', '50vw', '18vw'];
const BLOB1_SIZE_H   = ['15vh', '40vh', '60vh', '50vh', '25vh', '50vh', '30vh', '80vh', '45vh', '50vh', '18vh'];
const BLOB1_LEFT     = ['42vw', '-10vw', '50vw', '20vw', '5vw',  '10vw', '-20vw', '-20vw', '20vw', '25vw', '40vw'];
const BLOB1_TOP      = ['42vh', '-10vh', '-20vh', '-5vh', '5vh', '70vh',  '40vh',  '40vh', '20vh', '25vh', '40vh'];
const BLOB1_OP       = [0.04,   0.15,    0.1,    0.16,   0.1,   0.15,    0.2,     0.25,   0.12,   0.1,    0.05];
const BLOB2_SIZE_W   = ['12vw', '30vw', '40vw', '40vw', '35vw', '50vw', '60vw', '55vw', '40vw', '40vw', '14vw'];
const BLOB2_SIZE_H   = ['12vh', '30vh', '40vh', '40vh', '35vh', '50vh', '60vh', '55vh', '40vh', '40vh', '14vh'];
const BLOB2_RIGHT    = ['42vw', '-5vw', '10vw', '-8vw', '45vw', '60vw', '-10vw', '-5vw', '25vw', '30vw', '40vw'];
const BLOB2_BOTTOM   = ['42vh', '-5vh', '60vh', '25vh', '55vh', '10vh',  '-20vh', '-5vh', '25vh', '30vh', '40vh'];
const BLOB2_COLORS   = ['#0d0f1a', '#7c3aed', '#C8A340', '#7c3aed', '#1a0000', '#C8A340', '#7c3aed', '#C8A340', '#7c3aed', '#C8A340', '#0d1020'];
const BLOB2_OP       = [0.02, 0.1, 0.15, 0.1, 0.06, 0.2, 0.1, 0.15, 0.12, 0.15, 0.03];

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

      {/* Cinematic letterbox bars — 2.39:1 aspect */}
      <div className="absolute top-0 left-0 right-0 z-[60] pointer-events-none bg-black" style={{ height: '12%' }} />
      <div className="absolute bottom-0 left-0 right-0 z-[60] pointer-events-none bg-black" style={{ height: '12%' }} />
    </div>
  );
}
