import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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
      timers.push(setTimeout(() => setTextPhase(2), duration - 900));
    }
    return () => timers.forEach(clearTimeout);
  }, [duration, narration]);

  return (
    <motion.div
      className="absolute inset-0 bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: fadeToBlack ? 0 : 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}frames/${image}`}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: kenBurns.scale[0], x: kenBurns.x[0], y: kenBurns.y[0] }}
        animate={{ scale: kenBurns.scale[1], x: kenBurns.x[1], y: kenBurns.y[1] }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25 pointer-events-none" />

      {fadeToBlack && (
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.0, ease: 'easeIn', delay: (duration - 2200) / 1000 }}
        />
      )}

      {narration && (
        <motion.div
          className="absolute bottom-[10%] w-full text-center px-16 z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={
            textPhase === 1 ? { opacity: 1, y: 0 } :
            textPhase === 2 ? { opacity: 0, y: -10 } :
            { opacity: 0, y: 12 }
          }
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <p
            className="text-white/92 italic tracking-widest drop-shadow-[0_2px_12px_rgba(0,0,0,1)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.2vw, 1.6rem)', lineHeight: 1.6 }}
          >
            {narration}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

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
    timers.push(setTimeout(() => setTextPhase(2), duration - 800));
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
        className="text-center px-20 text-white/85 italic tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.4vw, 1.8rem)', lineHeight: 1.7, maxWidth: '70vw' }}
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
    timers.push(setTimeout(() => setPhase(1), 400));
    if (line2) timers.push(setTimeout(() => setPhase(2), 1800));
    timers.push(setTimeout(() => setPhase(3), duration - 700));
    return () => timers.forEach(clearTimeout);
  }, [duration, line2]);

  const fontSize = large ? 'clamp(1.3rem, 3vw, 2.4rem)' : 'clamp(1rem, 2.2vw, 1.7rem)';

  return (
    <motion.div
      className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-6 px-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <motion.p
        className="text-center text-white/90 italic tracking-widest"
        style={{ fontFamily: 'var(--font-display)', fontSize, lineHeight: 1.6, maxWidth: '65vw' }}
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 1.0, ease: 'easeInOut' }}
      >
        {line1}
      </motion.p>
      {line2 && (
        <motion.p
          className="text-center text-white/80 italic tracking-widest"
          style={{ fontFamily: 'var(--font-display)', fontSize, lineHeight: 1.6, maxWidth: '65vw' }}
          initial={{ opacity: 0, y: 14 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
        >
          {line2}
        </motion.p>
      )}
    </motion.div>
  );
}
