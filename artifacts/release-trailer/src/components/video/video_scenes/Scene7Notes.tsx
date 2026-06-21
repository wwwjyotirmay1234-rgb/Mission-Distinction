import { motion } from 'framer-motion';

export function Scene7Notes() {
  return (
    <motion.div className="absolute inset-0 flex items-center pl-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.5 } }}
      transition={{ duration: 1 }}>
      
      <div className="w-[40vw]">
        <motion.h2 
          className="text-[4.5vw] font-bold text-white leading-tight"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 1.5, type: "spring" }}
        >
          Your Notes. Amplified.
        </motion.h2>

        <motion.p 
          className="text-[2vw] text-white/70 mt-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3, duration: 1.5, type: "spring" }}
        >
          Capture insights. Review anywhere.<br/>Flashcards generated automatically.
        </motion.p>
      </div>
    </motion.div>
  );
}
