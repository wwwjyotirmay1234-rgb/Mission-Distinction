import { motion } from 'framer-motion';

export function Scene10Outro() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.5 } }}
      transition={{ duration: 2 }}>
      
      <motion.div 
        className="absolute w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary), transparent)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.img 
        src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
        alt="Logo"
        className="w-[15vw] h-[15vw] rounded-3xl shadow-[0_0_80px_rgba(124,58,237,0.8)] object-cover mb-8 z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
      />
      
      <motion.h1 
        className="text-[6vw] font-black text-white leading-none tracking-tighter z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1.5 }}
      >
        MISSION DISTINCTION
      </motion.h1>

      <motion.p 
        className="text-[2vw] text-[var(--color-accent)] font-bold mt-6 tracking-widest uppercase z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4, duration: 2 }}
      >
        Study Smarter. Score Higher.
      </motion.p>

      <motion.div
        className="mt-12 px-8 py-4 bg-white text-black rounded-full font-bold text-[1.5vw] z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 7, duration: 1.5, type: 'spring' }}
      >
        Available Now
      </motion.div>
    </motion.div>
  );
}
