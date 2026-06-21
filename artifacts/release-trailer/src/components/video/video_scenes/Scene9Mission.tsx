import { motion } from 'framer-motion';

export function Scene9Mission() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-dark)] z-20"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', transition: { duration: 1.5 } }}
      transition={{ duration: 1.5 }}>
      
      <motion.h2 
        className="text-[8vw] font-black text-white leading-none tracking-tighter"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 2, type: "spring", bounce: 0.2 }}
        style={{ textShadow: '0 0 40px rgba(124,58,237,0.8)' }}
      >
        Completely Free.
      </motion.h2>

      <motion.div 
        className="flex flex-col items-center gap-4 mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4, duration: 2 }}
      >
        <p className="text-[3vw] font-bold text-[var(--color-accent)] tracking-widest uppercase">No subscriptions.</p>
        <p className="text-[3vw] font-bold text-[var(--color-accent)] tracking-widest uppercase">No paywalls.</p>
        <p className="text-[3vw] font-bold text-white tracking-widest uppercase mt-4">No excuses.</p>
      </motion.div>

    </motion.div>
  );
}
