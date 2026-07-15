import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  CinematicFrame — Ken Burns + narration subtitle
// ─────────────────────────────────────────────────────────────────────────────

interface CinematicFrameProps {
  image: string;
  duration: number;
  narration?: string;
  kenBurns: { scale: number[]; x: string[]; y: string[] };
  fadeToBlack?: boolean;
}

export function CinematicFrame({ image, duration, narration, kenBurns, fadeToBlack }: CinematicFrameProps) {
  const [textPhase, setTextPhase] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (narration) {
      timers.push(setTimeout(() => setTextPhase(1), 900));
      timers.push(setTimeout(() => setTextPhase(2), duration - 1100));
    }
    return () => timers.forEach(clearTimeout);
  }, [duration, narration]);

  return (
    <motion.div
      className="absolute inset-0 bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* Image with Ken Burns */}
      <motion.img
        src={`${import.meta.env.BASE_URL}frames/${image}`}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: kenBurns.scale[0], x: kenBurns.x[0], y: kenBurns.y[0] }}
        animate={{ scale: kenBurns.scale[1], x: kenBurns.x[1], y: kenBurns.y[1] }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />

      {/* Cinematic letterbox vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

      {/* Fade to black overlay */}
      {fadeToBlack && (
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, ease: 'easeIn', delay: (duration - 2400) / 1000 }}
        />
      )}

      {/* Narration subtitle */}
      {narration && (
        <motion.div
          className="absolute bottom-[10%] w-full text-center px-16 z-10"
          initial={{ opacity: 0, y: 14 }}
          animate={
            textPhase === 1 ? { opacity: 1, y: 0 } :
            textPhase === 2 ? { opacity: 0, y: -8 } :
            { opacity: 0, y: 14 }
          }
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <p
            className="text-white/90 italic tracking-widest drop-shadow-[0_2px_16px_rgba(0,0,0,1)]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1rem, 2.2vw, 1.55rem)',
              lineHeight: 1.65,
            }}
          >
            {narration}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SilentFrame — Ken Burns, NO narration. Used for pen drop, realization, etc.
//  The silence IS the story.
// ─────────────────────────────────────────────────────────────────────────────

interface SilentFrameProps {
  image: string;
  duration: number;
  kenBurns: { scale: number[]; x: string[]; y: string[] };
  fadeToBlack?: boolean;
}

export function SilentFrame({ image, duration, kenBurns, fadeToBlack }: SilentFrameProps) {
  return (
    <motion.div
      className="absolute inset-0 bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: 'easeInOut' }}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}frames/${image}`}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: kenBurns.scale[0], x: kenBurns.x[0], y: kenBurns.y[0] }}
        animate={{ scale: kenBurns.scale[1], x: kenBurns.x[1], y: kenBurns.y[1] }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25 pointer-events-none" />

      {fadeToBlack && (
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, ease: 'easeIn', delay: (duration - 2400) / 1000 }}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BlackScene — pure black + centred narration
// ─────────────────────────────────────────────────────────────────────────────

interface BlackSceneProps {
  duration: number;
  narration: string;
  fadeIn?: boolean;
}

export function BlackScene({ duration, narration, fadeIn }: BlackSceneProps) {
  const [textPhase, setTextPhase] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setTextPhase(1), fadeIn ? 1200 : 600));
    timers.push(setTimeout(() => setTextPhase(2), duration - 900));
    return () => timers.forEach(clearTimeout);
  }, [duration, fadeIn]);

  return (
    <motion.div
      className="absolute inset-0 bg-black flex items-center justify-center"
      initial={{ opacity: fadeIn ? 0 : 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: fadeIn ? 1.5 : 0.6, ease: 'easeInOut' }}
    >
      <motion.p
        className="text-center px-20 text-white/88 italic tracking-widest"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1rem, 2.4vw, 1.8rem)',
          lineHeight: 1.7,
          maxWidth: '70vw',
          textShadow: '0 2px 24px rgba(0,0,0,1)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={
          textPhase === 1 ? { opacity: 1, y: 0 } :
          textPhase === 2 ? { opacity: 0, y: -10 } :
          { opacity: 0, y: 16 }
        }
        transition={{ duration: 1.0, ease: 'easeInOut' }}
      >
        {narration}
      </motion.p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TextCard — used for inter-scene title cards and ending
// ─────────────────────────────────────────────────────────────────────────────

interface TextCardProps {
  duration: number;
  line1: string;
  line2?: string;
  large?: boolean;
}

export function TextCard({ duration, line1, line2, large }: TextCardProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 500));
    if (line2) timers.push(setTimeout(() => setPhase(2), 2000));
    timers.push(setTimeout(() => setPhase(3), duration - 800));
    return () => timers.forEach(clearTimeout);
  }, [duration, line2]);

  // Bridge cards use uppercase tracking style; ending uses italic large
  const isBridge = !large;
  const fontSize1 = large
    ? 'clamp(1.4rem, 3.2vw, 2.6rem)'
    : 'clamp(0.85rem, 1.8vw, 1.4rem)';
  const fontSize2 = large
    ? 'clamp(1.1rem, 2.4vw, 1.9rem)'
    : 'clamp(0.85rem, 1.8vw, 1.4rem)';

  return (
    <motion.div
      className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-7 px-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: 'easeInOut' }}
    >
      <motion.p
        className={isBridge
          ? "text-center text-white/95 font-light tracking-[0.3em] uppercase"
          : "text-center text-white/92 italic tracking-widest"}
        style={{
          fontFamily: isBridge ? 'var(--font-body, sans-serif)' : 'var(--font-display)',
          fontSize: fontSize1,
          lineHeight: 1.5,
          maxWidth: '70vw',
          textShadow: '0 2px 20px rgba(0,0,0,0.9)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      >
        {line1}
      </motion.p>

      {line2 && (
        <>
          {/* Thin divider between the two lines */}
          <motion.div
            className="w-16 h-px bg-white/30"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={phase >= 2 ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <motion.p
            className={isBridge
              ? "text-center text-white/80 font-light tracking-[0.2em] uppercase"
              : "text-center text-white/75 italic tracking-widest"}
            style={{
              fontFamily: isBridge ? 'var(--font-body, sans-serif)' : 'var(--font-display)',
              fontSize: fontSize2,
              lineHeight: 1.5,
              maxWidth: '70vw',
              textShadow: '0 2px 20px rgba(0,0,0,0.9)',
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          >
            {line2}
          </motion.p>
        </>
      )}
    </motion.div>
  );
}
