import { motion } from 'framer-motion';

export function Scene5Quizzes() {
  return (
    <motion.div className="absolute inset-0 flex items-center pl-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.5 } }}
      transition={{ duration: 1 }}>
      
      <div className="w-[40vw]">
        <motion.h2 
          className="text-[4.5vw] font-bold text-white leading-tight"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 1.5, type: "spring" }}
        >
          Test Your Knowledge
        </motion.h2>

        <motion.p 
          className="text-[2vw] text-white/70 mt-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3, duration: 1.5, type: "spring" }}
        >
          Daily quizzes. Instant feedback.<br/>Master the high-yield concepts.
        </motion.p>
      </div>
    </motion.div>
  );
}
