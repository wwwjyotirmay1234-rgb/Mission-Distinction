import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3Features() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center z-10"
      initial={{ opacity: 0, x: '10%' }}
      animate={{ opacity: 1, x: '0%' }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="absolute inset-0 opacity-40 z-0"
        initial={{ x: '10%', opacity: 0 }}
        animate={{ x: '0%', opacity: 0.4 }}
        transition={{ duration: 5, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}assets/dna.png`} 
          alt="DNA" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0a1e] via-[#0f0a1e]/90 to-transparent" />
      </motion.div>

      <div className="w-[50vw] pl-[10vw] relative z-10">
        <motion.h2 
          className="text-[4vw] font-bold text-white leading-tight mb-8"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Everything you need.<br/>In one place.
        </motion.h2>

        <div className="space-y-6">
          <FeatureItem 
            text="Curated PDF Library" 
            sub="Anatomy, Physiology, Biochem"
            show={phase >= 2} 
          />
          <FeatureItem 
            text="Practice Quizzes" 
            sub="Instant feedback & analytics"
            show={phase >= 3} 
          />
          <FeatureItem 
            text="Study Notes" 
            sub="High-yield flashcards"
            show={phase >= 4} 
          />
        </div>
      </div>
    </motion.div>
  );
}

function FeatureItem({ text, sub, show }: { text: string, sub: string, show: boolean }) {
  return (
    <motion.div 
      className="flex items-start gap-4"
      initial={{ opacity: 0, x: -30 }}
      animate={show ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 mt-2 border border-primary flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary-light" />
      </div>
      <div>
        <h3 className="text-[2vw] font-bold text-white">{text}</h3>
        <p className="text-[1.2vw] text-white/60 font-medium">{sub}</p>
      </div>
    </motion.div>
  );
}
