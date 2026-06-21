import { motion } from 'framer-motion';

export function Scene3Reveal() {
  return (
    <motion.div className="absolute inset-0 flex items-center pl-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.5 } }}
      transition={{ duration: 1 }}>
      
      <div className="w-[40vw]">
        <motion.h2 
          className="text-[4.5vw] font-bold text-white leading-tight"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2, duration: 1.5, type: "spring" }}
        >
          Everything you need.
        </motion.h2>

        <motion.p 
          className="text-[3vw] text-[var(--color-accent)] mt-4 font-semibold tracking-wide"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 4, duration: 1.5, type: "spring" }}
        >
          One app.
        </motion.p>
      </div>
    </motion.div>
  );
}
