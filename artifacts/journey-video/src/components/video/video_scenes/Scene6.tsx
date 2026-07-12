import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface Milestone {
  value: number;
  headline: string;
  sub: string;
  color: string;
}

const MILESTONES: Milestone[] = [
  { value: 100, headline: '24 HOURS.', sub: '100 BELIEVERS.', color: '#C8A340' },
  { value: 200, headline: 'ONE WEEK.', sub: 'THE WORD SPREAD.', color: '#a78bfa' },
  { value: 500, headline: '3 WEEKS.', sub: '500 DREAMS.', color: '#C8A340' },
];

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const [milestoneIdx, setMilestoneIdx] = useState(-1);
  const [shake, setShake] = useState(false);
  const [goldFlash, setGoldFlash] = useState(false);
  const [finalReveal, setFinalReveal] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),

      // 100 milestone
      setTimeout(() => {
        setMilestoneIdx(0);
        setPhase(2);
        triggerShake();
      }, 1500),

      // 200 milestone
      setTimeout(() => {
        setMilestoneIdx(1);
        setPhase(3);
        triggerShake();
      }, 3800),

      // 500 MILESTONE — EXPLOSION
      setTimeout(() => {
        setMilestoneIdx(2);
        setPhase(4);
        triggerShake();
        setTimeout(() => {
          setGoldFlash(true);
          setTimeout(() => setGoldFlash(false), 600);
        }, 200);
      }, 6000),

      // Final quiet reveal
      setTimeout(() => setFinalReveal(true), 7800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const count = useSpring(0, { stiffness: 22, damping: 15 });
  const displayCount = useTransform(count, Math.round);

  useEffect(() => {
    if (milestoneIdx === 0) count.set(100);
    if (milestoneIdx === 1) count.set(200);
    if (milestoneIdx === 2) count.set(500);
  }, [milestoneIdx, count]);

  const currentMilestone = milestoneIdx >= 0 ? MILESTONES[milestoneIdx] : null;

  return (
    <motion.div
      className="absolute inset-0 bg-black overflow-hidden flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Deep radial — gets warmer on 500 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={phase >= 4
          ? { background: 'radial-gradient(ellipse at center, rgba(200,163,64,0.18) 0%, rgba(0,0,0,1) 60%)' }
          : milestoneIdx === 1
            ? { background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, rgba(0,0,0,1) 60%)' }
            : { background: 'radial-gradient(ellipse at center, rgba(10,10,10,0) 0%, rgba(0,0,0,1) 60%)' }
        }
        transition={{ duration: 1.2 }}
      />

      {/* Gold explosion particles — fire on 500 */}
      {phase >= 4 && Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: '50%', top: '50%',
            width: 2 + (i % 4),
            height: 2 + (i % 4),
            backgroundColor: i % 3 === 0 ? '#C8A340' : i % 3 === 1 ? '#fff' : '#f97316',
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: Math.cos(i * 12 * Math.PI / 180) * (100 + (i % 5) * 50),
            y: Math.sin(i * 12 * Math.PI / 180) * (100 + (i % 5) * 50),
            opacity: [0, 1, 1, 0],
            scale: [0, 2, 1.5, 0],
          }}
          transition={{ duration: 2.8, delay: (i % 6) * 0.05, ease: 'easeOut' }}
        />
      ))}

      {/* Gold full-screen flash on 500 */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-50"
        style={{ backgroundColor: 'rgba(200,163,64,0.35)' }}
        animate={goldFlash ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.55 }}
      />

      {/* COUNTER — screen shakes on hit */}
      <motion.div
        className="relative z-10 text-center flex flex-col items-center"
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45 } : { duration: 0 }}
      >
        <motion.p
          className="font-mono text-center mb-[1.5vw]"
          style={{ fontSize: '1.1vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.2)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          THE CLIMB
        </motion.p>

        {/* MASSIVE counter — fills the frame */}
        {!finalReveal && (
          <motion.span
            className="font-display text-white leading-none tracking-tighter block"
            style={{ fontSize: '25vw', textShadow: '0 0 120px rgba(255,255,255,0.08)' }}
            animate={milestoneIdx === 2 ? { scale: 1.08 } : { scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
          >
            {displayCount}
          </motion.span>
        )}

        {/* Milestone headline — big, punchy */}
        {currentMilestone && !finalReveal && (
          <motion.div
            className="text-center mt-[1vw]"
            key={milestoneIdx}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="font-display uppercase tracking-wide"
              style={{ fontSize: '3.5vw', color: currentMilestone.color, textShadow: `0 0 40px ${currentMilestone.color}66` }}
            >
              {currentMilestone.headline}
            </div>
            <div
              className="font-sans tracking-[0.3em] uppercase mt-1"
              style={{ fontSize: '1.6vw', color: 'rgba(255,255,255,0.5)' }}
            >
              {currentMilestone.sub}
            </div>
          </motion.div>
        )}

        {/* FINAL QUIET REVEAL — after the explosion */}
        {finalReveal && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="font-display text-white leading-none"
              style={{ fontSize: '10vw', textShadow: '0 0 60px rgba(200,163,64,0.4)' }}
            >
              500
            </div>
            <motion.div
              className="h-[1px] bg-brand-gold/40 mx-auto mt-[2vw] mb-[2vw]"
              initial={{ width: 0 }}
              animate={{ width: '28vw' }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <div
              className="font-display text-brand-gold tracking-widest uppercase"
              style={{ fontSize: '3vw' }}
            >
              3 Weeks. 500 Dreams.
            </div>
            <p
              className="font-mono mt-[1.5vw]"
              style={{ fontSize: '1.1vw', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)' }}
            >
              12 JULY 2026 · VIMSAR, ODISHA
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
