import { motion, AnimatePresence } from 'framer-motion';

export function Scene1Problem() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 1.5 } }}
      transition={{ duration: 2 }}>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1.5 }}
        className="text-[6vw] font-black text-white text-center leading-tight tracking-tight"
      >
        1st Year MBBS.
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5, duration: 2 }}
        className="text-[3vw] font-medium text-[var(--color-accent)] mt-8 text-center tracking-wide"
      >
        The hardest year of your life.
      </motion.div>
    </motion.div>
  );
}
