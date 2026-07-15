import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FrameProps {
  image: string;
  duration: number;
  text?: string;
  kenBurns: {
    scale: number[];
    x: string[];
    y: string[];
  };
  isFirst?: boolean;
  isLast?: boolean;
}

export function CinematicFrame({ image, duration, text, kenBurns, isFirst, isLast }: FrameProps) {
  const [textPhase, setTextPhase] = useState(0);

  useEffect(() => {
    let timers: NodeJS.Timeout[] = [];
    
    if (text) {
      timers.push(setTimeout(() => setTextPhase(1), 1000));
      timers.push(setTimeout(() => setTextPhase(2), duration - 800));
    }
    
    return () => timers.forEach(clearTimeout);
  }, [duration, text]);

  return (
    <motion.div 
      className="absolute inset-0 bg-black overflow-hidden flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}frames/${image}`}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ 
          scale: kenBurns.scale[0], 
          x: kenBurns.x[0], 
          y: kenBurns.y[0]
        }}
        animate={{ 
          scale: kenBurns.scale[1], 
          x: kenBurns.x[1], 
          y: kenBurns.y[1]
        }}
        transition={{ 
          duration: duration / 1000, 
          ease: "linear"
        }}
      />
      
      {/* Subtle vignette/gradient overlay for text legibility and mood */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
      
      {text && (
        <motion.div 
          className="absolute bottom-[12%] w-full text-center px-12 z-10"
          initial={{ opacity: 0, y: 15 }}
          animate={
            textPhase === 1 ? { opacity: 1, y: 0 } :
            textPhase === 2 ? { opacity: 0, y: -15 } :
            { opacity: 0, y: 15 }
          }
          transition={{ duration: 1.0, ease: "easeInOut" }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white/90 italic tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: 'var(--font-display)' }}>
            {text}
          </h2>
        </motion.div>
      )}
    </motion.div>
  );
}
