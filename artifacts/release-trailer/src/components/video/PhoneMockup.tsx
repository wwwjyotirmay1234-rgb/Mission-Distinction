import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function PhoneMockup({ currentSceneKey }: { currentSceneKey: string }) {
  const showPhone = ['reveal', 'library', 'quizzes', 'community', 'notes', 'leaderboard'].includes(currentSceneKey);
  
  return (
    <AnimatePresence>
      {showPhone && (
        <motion.div
          className="w-[22vw] h-[45vw] bg-[#0f0a1e] rounded-[3vw] border-[4px] border-[#333] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col"
          initial={{ y: '100vh', scale: 0.8, rotate: 10 }}
          animate={{ y: 0, scale: 1, rotate: 0 }}
          exit={{ y: '100vh', scale: 0.8, rotate: -10 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          {/* Status bar mock */}
          <div className="absolute top-0 inset-x-0 h-[2vw] flex justify-between items-center px-6 z-50">
            <div className="text-white text-[0.8vw] font-medium">9:41</div>
            <div className="flex gap-1">
              <div className="w-[1vw] h-[0.8vw] bg-white rounded-sm" />
              <div className="w-[1.2vw] h-[0.8vw] bg-white rounded-sm" />
            </div>
          </div>
          
          {/* Dynamic Screen Content */}
          <div className="flex-1 pt-[3vw] pb-[2vw] relative">
             <ScreenContent scene={currentSceneKey} />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-[0.5vw] left-1/2 -translate-x-1/2 w-[8vw] h-[0.4vw] bg-white/50 rounded-full" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScreenContent({ scene }: { scene: string }) {
  return (
    <AnimatePresence mode="wait">
      {scene === 'reveal' && <RevealUI key="reveal" />}
      {scene === 'library' && <LibraryUI key="library" />}
      {scene === 'quizzes' && <QuizzesUI key="quizzes" />}
      {scene === 'community' && <CommunityUI key="community" />}
      {scene === 'notes' && <NotesUI key="notes" />}
      {scene === 'leaderboard' && <LeaderboardUI key="leaderboard" />}
    </AnimatePresence>
  );
}

function RevealUI() {
  return (
    <motion.div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1a1233] to-[#0f0a1e]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.img 
        src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
        alt="Logo"
        className="w-[10vw] h-[10vw] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.4)] object-cover"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      />
      <motion.div 
        className="w-[12vw] h-[1vw] bg-white/20 rounded-full mt-8"
        initial={{ width: 0 }}
        animate={{ width: '12vw' }}
        transition={{ delay: 1, duration: 1 }}
      />
      <motion.div 
        className="w-[8vw] h-[1vw] bg-white/10 rounded-full mt-4"
        initial={{ width: 0 }}
        animate={{ width: '8vw' }}
        transition={{ delay: 1.2, duration: 1 }}
      />
    </motion.div>
  );
}

function LibraryUI() {
  return (
    <motion.div className="h-full p-4 flex flex-col gap-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="w-[8vw] h-[1.5vw] bg-white/80 rounded-md" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[1,2,3,4,5,6].map((i) => (
          <motion.div 
            key={i}
            className="aspect-[3/4] bg-[#2a1d4a] rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function QuizzesUI() {
  return (
    <motion.div className="h-full p-4 flex flex-col gap-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="w-full h-[1vw] bg-white/20 rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1 }} />
      </div>
      <div className="w-full h-[6vw] bg-[#2a1d4a] rounded-xl mt-4 p-3 flex flex-col gap-2">
        <div className="w-full h-[1vw] bg-white/40 rounded-sm" />
        <div className="w-[70%] h-[1vw] bg-white/40 rounded-sm" />
      </div>
      
      <div className="flex flex-col gap-3 mt-4">
        {[1,2,3,4].map((i) => (
          <motion.div 
            key={i}
            className={`w-full h-[3vw] rounded-lg border-2 ${i === 2 ? 'border-primary bg-primary/20' : 'border-white/10'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function CommunityUI() {
  return (
    <motion.div className="h-full p-4 flex flex-col gap-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="w-[8vw] h-[1.5vw] bg-white/80 rounded-md mb-2" />
      {[1,2,3].map((i) => (
        <motion.div 
          key={i}
          className="flex gap-3 items-start"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.3 }}
        >
          <div className="w-[3vw] h-[3vw] rounded-full bg-primary/40 shrink-0" />
          <div className="flex-1 bg-[#2a1d4a] rounded-2xl rounded-tl-none p-3 min-h-[4vw]">
            <div className="w-[60%] h-[0.8vw] bg-white/40 rounded-sm" />
            <div className="w-[40%] h-[0.8vw] bg-white/20 rounded-sm mt-2" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function NotesUI() {
  return (
    <motion.div className="h-full p-4 flex flex-col gap-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="w-full flex-1 bg-[#fdfbf7] rounded-xl shadow-inner p-4 relative overflow-hidden">
        {/* Lined paper effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(0,0,0,0.1)_100%)] bg-[length:100%_2vw]" />
        <motion.div className="w-[50%] h-[1vw] bg-black/80 rounded-sm mt-2" initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ duration: 1 }} />
        <motion.div className="w-[80%] h-[1vw] bg-black/40 rounded-sm mt-4" initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 1, delay: 0.2 }} />
        <motion.div className="w-[70%] h-[1vw] bg-black/40 rounded-sm mt-4" initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1, delay: 0.4 }} />
        <motion.div className="w-[85%] h-[1vw] bg-black/40 rounded-sm mt-4" initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1, delay: 0.6 }} />
      </div>
    </motion.div>
  );
}

function LeaderboardUI() {
  return (
    <motion.div className="h-full p-4 flex flex-col gap-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="w-[10vw] h-[1.5vw] bg-white/80 rounded-md mx-auto mt-4" />
      
      <div className="flex flex-col gap-2 mt-6">
        {[1,2,3,4,5].map((i) => (
          <motion.div 
            key={i}
            className={`w-full h-[4vw] rounded-xl flex items-center px-3 gap-3 ${i === 1 ? 'bg-gradient-to-r from-yellow-500/40 to-yellow-600/20 border border-yellow-500/50' : 'bg-[#2a1d4a]'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            <div className={`w-[2vw] text-center font-bold ${i === 1 ? 'text-yellow-400' : 'text-white/40'}`}>{i}</div>
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-white/10" />
            <div className="flex-1 h-[1vw] bg-white/20 rounded-sm" />
            <div className="w-[3vw] h-[1vw] bg-primary/40 rounded-sm" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
