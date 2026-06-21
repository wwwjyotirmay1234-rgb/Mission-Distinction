import { motion } from 'framer-motion';

export function Scene8Leaderboard() {
  return (
    <motion.div className="absolute inset-0 flex items-center pl-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.5 } }}
      transition={{ duration: 1 }}>
      
      <div className="w-[40vw]">
        <motion.h2 
          className="text-[4.5vw] font-bold text-[#f59e0b] leading-tight"
          initial={{ opacity: 0, rotateX: 90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ delay: 1, duration: 1.5, type: "spring" }}
        >
          Rise Through the Ranks
        </motion.h2>

        <motion.p 
          className="text-[2vw] text-white/70 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1.5, type: "spring" }}
        >
          Earn XP. Own the leaderboard.<br/>Consistency is rewarded.
        </motion.p>
      </div>
    </motion.div>
  );
}
