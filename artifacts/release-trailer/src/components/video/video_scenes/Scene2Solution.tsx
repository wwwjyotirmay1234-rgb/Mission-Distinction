import { motion } from 'framer-motion';

export function Scene2Solution() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 1.5 } }}
      transition={{ duration: 1 }}>
      
      <motion.img 
        src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
        alt="Logo"
        className="w-[20vw] h-[20vw] rounded-3xl shadow-[0_0_80px_rgba(124,58,237,0.5)] object-cover"
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
      />
      
      <motion.h1 
        className="text-[5vw] font-bold text-white mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1 }}
      >
        Mission Distinction
      </motion.h1>

      <motion.p 
        className="text-[2vw] text-[var(--color-accent)] mt-4 tracking-widest uppercase"
        initial={{ opacity: 0, letterSpacing: '0em' }}
        animate={{ opacity: 1, letterSpacing: '0.1em' }}
        transition={{ delay: 4.5, duration: 2 }}
      >
        Your edge. Your weapon.
      </motion.p>
    </motion.div>
  );
}
