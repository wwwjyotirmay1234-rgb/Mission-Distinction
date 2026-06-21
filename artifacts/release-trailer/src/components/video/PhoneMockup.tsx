import { motion, AnimatePresence } from 'framer-motion';

export function PhoneMockup({ currentSceneKey }: { currentSceneKey: string }) {
  const showPhone = ['reveal', 'library', 'quizzes', 'community', 'notes', 'leaderboard'].includes(currentSceneKey);

  return (
    <AnimatePresence>
      {showPhone && (
        <motion.div
          key="phone"
          className="relative flex-shrink-0"
          style={{ width: 260, height: 530 }}
          initial={{ y: 120, scale: 0.82, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 120, scale: 0.82, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 120 }}
        >
          {/* Phone shell */}
          <div
            className="absolute inset-0 rounded-[36px] border-[6px] border-[#2a2a3a] shadow-[0_0_60px_rgba(124,58,237,0.35),0_20px_60px_rgba(0,0,0,0.8)]"
            style={{ background: '#111120' }}
          />

          {/* Screen area */}
          <div className="absolute inset-[6px] rounded-[30px] overflow-hidden" style={{ background: '#0d0a1c' }}>
            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <span className="text-white/70 text-[11px] font-semibold">9:41</span>
              <div className="w-16 h-4 bg-black rounded-full" />
              <div className="flex items-center gap-1">
                <div className="flex gap-[2px] items-end h-3">
                  {[2, 3, 4, 5].map((h, i) => (
                    <div key={i} className="w-[3px] bg-white/70 rounded-[1px]" style={{ height: h * 2 }} />
                  ))}
                </div>
                <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="7" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <rect x="20" y="10" width="2" height="5" rx="1" fill="currentColor"/>
                  <rect x="3.5" y="8.5" width="15" height="8" rx="1" fill="currentColor"/>
                </svg>
              </div>
            </div>

            {/* Dynamic screen content */}
            <div className="absolute inset-0 top-9 bottom-6">
              <AnimatePresence mode="wait">
                {currentSceneKey === 'reveal' && <RevealUI key="reveal" />}
                {currentSceneKey === 'library' && <LibraryUI key="library" />}
                {currentSceneKey === 'quizzes' && <QuizzesUI key="quizzes" />}
                {currentSceneKey === 'community' && <CommunityUI key="community" />}
                {currentSceneKey === 'notes' && <NotesUI key="notes" />}
                {currentSceneKey === 'leaderboard' && <LeaderboardUI key="leaderboard" />}
              </AnimatePresence>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Side buttons */}
          <div className="absolute right-[-8px] top-24 w-[5px] h-10 bg-[#2a2a3a] rounded-r-sm" />
          <div className="absolute left-[-8px] top-20 w-[5px] h-7 bg-[#2a2a3a] rounded-l-sm" />
          <div className="absolute left-[-8px] top-32 w-[5px] h-7 bg-[#2a2a3a] rounded-l-sm" />

          {/* Glow under phone */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-6 rounded-full blur-xl"
            style={{ background: 'rgba(124,58,237,0.5)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RevealUI() {
  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center px-5"
      style={{ background: 'linear-gradient(160deg, #1a1233 0%, #0d0a1c 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
        alt="Mission Distinction"
        className="w-28 h-28 rounded-2xl object-cover shadow-[0_0_30px_rgba(124,58,237,0.6)]"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 14 }}
      />
      <motion.p
        className="text-white font-bold text-sm mt-4 tracking-widest uppercase"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        Mission Distinction
      </motion.p>
      <motion.p
        className="text-purple-400 text-xs mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        Study Smarter. Score Higher.
      </motion.p>
      <motion.div
        className="mt-6 w-full h-10 rounded-xl flex items-center justify-center text-white text-xs font-semibold"
        style={{ background: 'linear-gradient(90deg, #7c3aed, #5b21b6)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        Get Started Free
      </motion.div>
    </motion.div>
  );
}

const BOOKS = [
  { title: 'Anatomy', color: '#4c1d95', accent: '#7c3aed', icon: '🦴' },
  { title: 'Physiology', color: '#1e3a5f', accent: '#3b82f6', icon: '❤️' },
  { title: 'Biochemistry', color: '#1a3d2e', accent: '#10b981', icon: '🧪' },
  { title: "Gray's", color: '#4a1c1c', accent: '#ef4444', icon: '📖' },
  { title: 'Guyton', color: '#2d1a4a', accent: '#8b5cf6', icon: '📚' },
  { title: 'Lippincott', color: '#1c3040', accent: '#06b6d4', icon: '🔬' },
];

function LibraryUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-bold text-sm">PDF Library</span>
        <span className="text-purple-400 text-xs">24 books</span>
      </div>
      {/* Search bar */}
      <div className="w-full h-8 rounded-lg bg-white/8 border border-white/10 flex items-center px-3 mb-3 gap-2">
        <svg className="w-3 h-3 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="text-white/30 text-[10px]">Search books...</span>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1 overflow-hidden">
        {BOOKS.map((b, i) => (
          <motion.div
            key={b.title}
            className="rounded-xl flex flex-col items-center justify-end pb-2 pt-3 overflow-hidden relative"
            style={{ background: `linear-gradient(160deg, ${b.color}, #0d0a1c)`, border: `1px solid ${b.accent}30` }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08 + 0.2 }}
          >
            <div className="text-xl mb-1">{b.icon}</div>
            <span className="text-white/90 text-[9px] font-semibold text-center leading-tight px-1">{b.title}</span>
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: b.accent }} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function QuizzesUI() {
  const options = ['Femoral nerve', 'Sciatic nerve', 'Obturator nerve', 'Common peroneal'];
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-bold text-sm">Daily Quiz</span>
        <span className="text-purple-300 text-xs bg-purple-500/20 px-2 py-0.5 rounded-full">Q 7/10</span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
          initial={{ width: '60%' }}
          animate={{ width: '70%' }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </div>
      {/* Question */}
      <motion.div
        className="rounded-xl p-3 mb-3"
        style={{ background: 'linear-gradient(135deg, #1a1233, #251848)', border: '1px solid #7c3aed40' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-white/90 text-[10px] leading-relaxed font-medium">
          Which nerve supplies the adductor magnus muscle in its lower part?
        </p>
      </motion.div>
      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <motion.div
            key={opt}
            className="w-full h-9 rounded-lg flex items-center px-3 text-[10px] font-medium"
            style={{
              background: i === 0 ? 'rgba(124,58,237,0.25)' : i === 2 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
              border: i === 0 ? '1.5px solid #7c3aed' : i === 2 ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
              color: i === 0 ? '#c4b5fd' : i === 2 ? '#6ee7b7' : 'rgba(255,255,255,0.6)',
            }}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.1 }}
          >
            <span className="mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
            {opt}
            {i === 2 && <span className="ml-auto text-emerald-400">✓</span>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const MESSAGES = [
  { user: 'Priya S.', text: 'Can someone explain the brachial plexus roots?', time: '2m', mine: false },
  { user: 'Rahul M.', text: "C5-T1 roots, here's a diagram I made 📎", time: '1m', mine: false },
  { user: 'You', text: 'Thanks! That really helped 🙌', time: 'now', mine: true },
];

function CommunityUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-bold text-sm">Community</span>
        <span className="text-green-400 text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          124 online
        </span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {MESSAGES.map((msg, i) => (
          <motion.div
            key={i}
            className={`flex gap-2 items-end ${msg.mine ? 'flex-row-reverse' : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.25 + 0.2 }}
          >
            {!msg.mine && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: `hsl(${i * 80 + 260}, 60%, 40%)` }}>
                {msg.user[0]}
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${msg.mine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
              style={{
                background: msg.mine
                  ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                  : 'rgba(255,255,255,0.07)',
                border: msg.mine ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>
              {!msg.mine && <p className="text-purple-300 text-[8px] font-semibold mb-0.5">{msg.user}</p>}
              <p className="text-white/90 text-[9px] leading-tight">{msg.text}</p>
              <p className="text-white/30 text-[7px] mt-0.5 text-right">{msg.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Input bar */}
      <motion.div
        className="mt-2 h-9 rounded-full bg-white/8 border border-white/10 flex items-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="text-white/25 text-[10px]">Ask a question...</span>
        <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: '#7c3aed' }}>
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}

const NOTE_LINES = [
  { w: '75%', bold: true, text: 'Brachial Plexus — Summary' },
  { w: '90%', text: 'Roots: C5, C6, C7, C8, T1' },
  { w: '85%', text: 'Trunks → Divisions → Cords → Branches' },
  { w: '70%', text: 'Musculocutaneous: C5-C7 (flex elbow)' },
  { w: '80%', text: 'Median: C6-T1 (hand, wrist)' },
  { w: '60%', text: '★ Mnemonic: Real Teenagers Drink Cold Beer' },
];

function NotesUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-bold text-sm">My Notes</span>
        <span className="text-purple-400 text-[9px] bg-purple-500/15 px-2 py-0.5 rounded-full">Anatomy</span>
      </div>
      <motion.div
        className="flex-1 rounded-xl p-3 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e1a2e, #13102a)', border: '1px solid rgba(124,58,237,0.2)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Ruled lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px)',
            backgroundPositionY: '12px',
          }}
        />
        <div className="relative flex flex-col gap-[6px]">
          {NOTE_LINES.map((line, i) => (
            <motion.div
              key={i}
              className="flex items-center"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 + 0.3 }}
            >
              <div
                className="h-[2px] rounded-full"
                style={{
                  width: line.w,
                  background: i === 0
                    ? 'rgba(167,139,250,0.9)'
                    : i === 5
                      ? 'rgba(251,191,36,0.7)'
                      : `rgba(255,255,255,${line.bold ? 0.65 : 0.4})`,
                  height: i === 0 ? 3 : 2,
                }}
              />
            </motion.div>
          ))}
        </div>
        {/* Side color accent */}
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ background: 'linear-gradient(180deg, #7c3aed, #a78bfa)' }} />
      </motion.div>
      <div className="flex gap-1 mt-2">
        {['Anatomy', 'Physio', 'Biochem'].map((tag, i) => (
          <motion.span
            key={tag}
            className="text-[9px] px-2 py-1 rounded-full"
            style={{ background: i === 0 ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)', color: i === 0 ? '#c4b5fd' : 'rgba(255,255,255,0.5)', border: `1px solid ${i === 0 ? '#7c3aed60' : 'rgba(255,255,255,0.1)'}` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + i * 0.1 }}
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

const RANKS = [
  { name: 'Ananya K.', xp: 4820, badge: '🏆' },
  { name: 'Rohan P.', xp: 4310, badge: '🥈' },
  { name: 'Sneha M.', xp: 3950, badge: '🥉' },
  { name: 'You', xp: 3720, badge: '⭐', isYou: true },
  { name: 'Arjun S.', xp: 3440, badge: '' },
];

function LeaderboardUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-bold text-sm">Leaderboard</span>
        <span className="text-yellow-400 text-[9px]">Weekly XP</span>
      </div>
      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-2 mb-3 h-16">
        {[RANKS[1], RANKS[0], RANKS[2]].map((r, i) => {
          const heights = [52, 64, 44];
          const colors = ['#9ca3af', '#fbbf24', '#cd7c32'];
          return (
            <motion.div
              key={r.name}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 + 0.2 }}
            >
              <div className="text-base mb-0.5">{r.badge}</div>
              <div className="w-12 rounded-t-lg flex items-center justify-center"
                style={{ height: heights[i], background: `${colors[i]}25`, border: `1px solid ${colors[i]}60` }}>
                <span className="text-[8px] text-white/70 font-medium text-center px-1 leading-tight">{r.name.split(' ')[0]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* List */}
      <div className="flex flex-col gap-1.5 flex-1">
        {RANKS.map((r, i) => (
          <motion.div
            key={r.name}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5"
            style={{
              background: (r as any).isYou ? 'linear-gradient(90deg, rgba(124,58,237,0.3), rgba(124,58,237,0.1))' : 'rgba(255,255,255,0.04)',
              border: (r as any).isYou ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
            }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.5 }}
          >
            <span className="text-[10px] font-bold w-4 text-center" style={{ color: i < 3 ? ['#fbbf24', '#9ca3af', '#cd7c32'][i] : 'rgba(255,255,255,0.4)' }}>
              {i + 1}
            </span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: (r as any).isYou ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}>
              {r.name[0]}
            </div>
            <span className="text-white/80 text-[9px] font-medium flex-1">{r.name}</span>
            <span className="text-purple-300 text-[9px] font-mono">{r.xp.toLocaleString()} XP</span>
            {r.badge && <span className="text-[10px]">{r.badge}</span>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
