import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

const MILESTONES = [
  { value: 100, label: '24 HOURS AFTER LAUNCH', date: '30 June 2026', color: '#C8A340' },
  { value: 200, label: 'FIRST WEEK', date: 'Early July 2026', color: '#a78bfa' },
  { value: 500, label: '3 WEEKS · TODAY', date: '12 July 2026', color: '#C8A340' },
];

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const [milestone, setMilestone] = useState(-1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => { setPhase(2); setMilestone(0); }, 1800),
      setTimeout(() => { setPhase(3); setMilestone(1); }, 4000),
      setTimeout(() => { setPhase(4); setMilestone(2); }, 6000),
      setTimeout(() => setPhase(5), 7800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 28, damping: 16 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (milestone === 0) count.set(100);
    if (milestone === 1) count.set(200);
    if (milestone === 2) count.set(500);
  }, [milestone, count]);

  const currentMilestone = milestone >= 0 ? MILESTONES[milestone] : null;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.6 }}
    >
      {/* Radial glow — pulses on each milestone */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={milestone === 2
          ? { background: 'radial-gradient(ellipse at center, rgba(200,163,64,0.22) 0%, rgba(0,0,0,1) 65%)' }
          : milestone >= 0
            ? { background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, rgba(0,0,0,1) 65%)' }
            : { background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 65%)' }
        }
        transition={{ duration: 1.2 }}
      />

      {/* Gold particles — explode on 500 */}
      {phase >= 4 && Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[3px] h-[3px] bg-brand-gold rounded-full"
          style={{ left: '50%', top: '50%' }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: Math.cos(i * 18 * Math.PI / 180) * (80 + (i % 4) * 40),
            y: Math.sin(i * 18 * Math.PI / 180) * (80 + (i % 4) * 40),
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1, 0],
          }}
          transition={{ duration: 2.5, delay: (i % 5) * 0.08, ease: 'easeOut' }}
        />
      ))}

      <div className="relative z-10 text-center">
        {/* Section header */}
        <motion.p
          className="text-[1.2vw] font-mono tracking-[0.45em] mb-[2vw]"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          THE CLIMB
        </motion.p>

        {/* Counter */}
        <motion.div
          className="flex items-end justify-center leading-none"
          animate={milestone === 2 ? { scale: 1.15 } : { scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <motion.span
            className="font-display text-white"
            style={{ fontSize: '20vw', lineHeight: 1 }}
          >
            {displayCount}
          </motion.span>
        </motion.div>

        {/* Milestone label */}
        <AnimateMilestoneLabel milestone={currentMilestone} key={milestone} />

        {/* Final reveal */}
        <motion.div
          className="mt-[3vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="h-[1px] bg-brand-gold/40 mx-auto mb-4" style={{ width: '30vw' }} />
          <p className="text-[2.5vw] font-display text-brand-gold tracking-widest uppercase">
            3 Weeks. 500 Dreams.
          </p>
          <p className="text-[1.2vw] font-sans mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            12 July 2026 · VIMSAR, Odisha
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AnimateMilestoneLabel({ milestone }: { milestone: typeof MILESTONES[number] | null }) {
  if (!milestone) return null;
  return (
    <motion.div
      className="mt-[1.5vw]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="text-[1.8vw] font-sans font-semibold tracking-[0.2em] uppercase"
        style={{ color: milestone.color }}
      >
        {milestone.label}
      </div>
      <div className="text-[1.1vw] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {milestone.date}
      </div>
    </motion.div>
  );
}
