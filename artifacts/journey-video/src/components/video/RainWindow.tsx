import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COUNT = 55;

export function RainWindow({ visible }: { visible: boolean }) {
  const drops = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      x: 2 + (i * 1.82 % 96),
      delay: (i * 0.19) % 3.2,
      dur: 0.38 + (i % 6) * 0.11,
      opacity: 0.10 + (i % 7) * 0.055,
      h: 9 + (i % 5) * 7,
    })), []);

  const streaks = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 4 + (i * 5.3 % 92),
      y: 20 + (i * 4.7 % 75),
      len: 15 + (i % 4) * 12,
      opacity: 0.04 + (i % 3) * 0.03,
    })), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 2.5 }}
      style={{
        position: 'absolute',
        right: '5%',
        top: '7%',
        width: '24%',
        height: '52%',
        zIndex: 4,
        pointerEvents: 'none',
      }}
    >
      {/* Outer window sill/frame */}
      <div style={{
        position: 'absolute', inset: 0,
        border: '3px solid rgba(140,165,210,0.18)',
        borderRadius: '4px',
        boxShadow: 'inset 0 0 40px rgba(10,15,50,0.6), 0 0 20px rgba(10,15,50,0.4)',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(8,12,35,0.75) 0%, rgba(4,7,22,0.88) 100%)',
      }}>
        {/* Window cross divider */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(140,165,210,0.12)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'rgba(140,165,210,0.12)' }} />

        {/* Slow trailing streaks on glass */}
        {streaks.map(s => (
          <div key={s.id} style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: '1px',
            height: s.len,
            background: `rgba(140,180,240,${s.opacity})`,
          }} />
        ))}

        {/* Animated falling drops */}
        {drops.map(d => (
          <motion.div
            key={d.id}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: 0,
              width: '1.5px',
              height: d.h,
              background: `rgba(160,205,255,${d.opacity})`,
              borderRadius: '50% 50% 60% 60%',
            }}
            animate={{ y: ['0%', '115%'] }}
            transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}

        {/* Fogged-up bottom condensation */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%',
          background: 'linear-gradient(0deg, rgba(100,140,200,0.14), transparent)',
        }} />

        {/* Dark rooftop silhouette outside */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%',
          background: 'rgba(3,5,18,0.7)',
          clipPath: 'polygon(0% 100%, 0% 55%, 8% 55%, 8% 30%, 22% 30%, 22% 55%, 40% 55%, 40% 40%, 60% 40%, 60% 55%, 78% 55%, 78% 35%, 92% 35%, 92% 55%, 100% 55%, 100% 100%)',
        }} />

        {/* Distant window lights in background buildings */}
        {[{ l: '12%', t: '62%' }, { l: '30%', t: '58%' }, { l: '68%', t: '60%' }, { l: '82%', t: '64%' }].map((pos, i) => (
          <motion.div key={i} style={{
            position: 'absolute', left: pos.l, top: pos.t,
            width: 5, height: 5,
            background: 'rgba(255,230,150,0.55)',
            borderRadius: '1px',
          }}
            animate={{ opacity: [0.55, 0.35, 0.55] }}
            transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
