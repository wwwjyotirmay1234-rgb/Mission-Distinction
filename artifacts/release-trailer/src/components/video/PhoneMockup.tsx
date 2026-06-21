import { motion, AnimatePresence } from 'framer-motion';

/* ─── Per-scene 3D angles ─────────────────────────────────────────────────── */
const PHONE_3D: Record<string, { rotateY: number; rotateX: number; scale: number }> = {
  problem:     { rotateY: -8,   rotateX: 8,   scale: 1.0  },
  solution:    { rotateY: 22,   rotateX: 12,  scale: 1.08 },
  reveal:      { rotateY: 0,    rotateX: 5,   scale: 1.05 },
  library:     { rotateY: 18,   rotateX: 7,   scale: 1.1  },
  quizzes:     { rotateY: -18,  rotateX: 6,   scale: 1.08 },
  community:   { rotateY: 12,   rotateX: 10,  scale: 1.04 },
  notes:       { rotateY: -20,  rotateX: 5,   scale: 1.1  },
  leaderboard: { rotateY: 14,   rotateX: 8,   scale: 1.06 },
  mission:     { rotateY: -6,   rotateX: 4,   scale: 1.0  },
  outro:       { rotateY: 0,    rotateX: 2,   scale: 0.95 },
};

export function PhoneMockup({ currentSceneKey }: { currentSceneKey: string }) {
  const angle = PHONE_3D[currentSceneKey] ?? { rotateY: 0, rotateX: 5, scale: 1 };

  return (
    <motion.div
      animate={{
        rotateY: angle.rotateY,
        rotateX: angle.rotateX,
        scale: angle.scale,
      }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformStyle: 'preserve-3d', width: 300, height: 620 }}
      className="relative flex-shrink-0"
    >
      {/* Phone body */}
      <div
        className="absolute inset-0 rounded-[42px]"
        style={{
          background: 'linear-gradient(145deg, #1e1e1e 0%, #0a0a0a 60%, #141414 100%)',
          border: '1.5px solid #2a2a2a',
          boxShadow: `
            0 0 0 6px #111111,
            0 0 0 7px #252525,
            0 60px 100px rgba(0,0,0,0.9),
            0 20px 40px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.06),
            0 0 80px rgba(124,58,237,0.18)
          `,
        }}
      />

      {/* Metallic sheen on body */}
      <div
        className="absolute inset-0 rounded-[42px] pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, rgba(255,255,255,0.02) 100%)',
        }}
      />

      {/* Screen */}
      <div
        className="absolute rounded-[36px] overflow-hidden"
        style={{
          inset: '7px',
          background: '#0d0a1c',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-white/70 text-[10px] font-semibold tracking-tight">9:41</span>
          <div className="w-14 h-[14px] bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px] items-end h-3">
              {[2, 3, 4, 5].map((h, i) => (
                <div key={i} className="w-[2.5px] bg-white/60 rounded-[1px]" style={{ height: h * 2 }} />
              ))}
            </div>
            <svg className="w-3.5 h-3.5 text-white/60" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="7" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="20" y="10" width="2" height="5" rx="1" fill="currentColor"/>
              <rect x="3.5" y="8.5" width="15" height="8" rx="1" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Dynamic content */}
        <div className="absolute top-9 inset-x-0 bottom-5 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentSceneKey === 'problem'     && <SplashUI     key="splash" />}
            {currentSceneKey === 'solution'    && <LoginUI      key="login" />}
            {currentSceneKey === 'reveal'      && <DashboardUI  key="dash" />}
            {currentSceneKey === 'library'     && <LibraryUI    key="lib" />}
            {currentSceneKey === 'quizzes'     && <QuizzesUI    key="quiz" />}
            {currentSceneKey === 'community'   && <CommunityUI  key="comm" />}
            {currentSceneKey === 'notes'       && <NotesUI      key="notes" />}
            {currentSceneKey === 'leaderboard' && <LeaderboardUI key="lb" />}
            {currentSceneKey === 'mission'     && <MissionUI    key="mission" />}
            {currentSceneKey === 'outro'       && <OutroUI      key="outro" />}
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/25 rounded-full" />
      </div>

      {/* Side buttons */}
      <div className="absolute right-[-6px] top-28 w-[4px] h-12 rounded-r-sm" style={{ background: 'linear-gradient(180deg,#222,#333,#222)' }} />
      <div className="absolute left-[-6px] top-24 w-[4px] h-8 rounded-l-sm" style={{ background: 'linear-gradient(180deg,#222,#333,#222)' }} />
      <div className="absolute left-[-6px] top-36 w-[4px] h-8 rounded-l-sm" style={{ background: 'linear-gradient(180deg,#222,#333,#222)' }} />
      <div className="absolute left-[-6px] top-[11.5rem] w-[4px] h-8 rounded-l-sm" style={{ background: 'linear-gradient(180deg,#222,#333,#222)' }} />

      {/* Glow under phone */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{ width: 180, height: 14, background: 'rgba(124,58,237,0.45)', filter: 'blur(18px)' }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

/* ─── Splash / Problem ───────────────────────────────────────────────────── */
function SplashUI() {
  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center px-6 gap-4"
      style={{ background: 'linear-gradient(160deg, #0d0a1c 0%, #150d30 60%, #0d0a1c 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Glow behind logo */}
      <motion.div
        className="absolute w-40 h-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4), transparent)', filter: 'blur(40px)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.img
        src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
        alt="Mission Distinction"
        className="w-24 h-24 rounded-2xl object-cover relative"
        style={{ boxShadow: '0 0 40px rgba(124,58,237,0.7), 0 0 80px rgba(124,58,237,0.3)' }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 12, stiffness: 100 }}
      />
      <motion.div className="text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <p className="text-white font-black text-base tracking-wider">Mission Distinction</p>
        <p className="text-purple-400 text-xs mt-1 tracking-widest uppercase">Study Smarter</p>
      </motion.div>
      {/* Pulsing ring */}
      <motion.div
        className="absolute w-36 h-36 rounded-full border border-purple-500/30"
        animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
      />
    </motion.div>
  );
}

/* ─── Login / Solution ───────────────────────────────────────────────────── */
const LOGIN_FIELDS = [
  { label: 'Email Address', value: 'priya.sharma@aiims.edu', icon: '✉' },
  { label: 'Password',      value: '••••••••••',             icon: '🔒' },
];

function LoginUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-4 pt-3"
      style={{ background: 'linear-gradient(160deg, #13102a 0%, #0d0a1c 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.p
        className="text-white font-black text-base mb-0.5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Welcome back!
      </motion.p>
      <motion.p
        className="text-white/40 text-[10px] mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Sign in to continue learning
      </motion.p>

      <div className="flex flex-col gap-3 mb-4">
        {LOGIN_FIELDS.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-white/40 text-[9px] mb-1 ml-1">{f.label}</p>
            <div
              className="w-full h-10 rounded-xl flex items-center px-3 gap-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="text-[11px]">{f.icon}</span>
              <motion.span
                className="text-white/80 text-[10px] font-medium"
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                transition={{ delay: 0.8 + i * 0.3, duration: 0.6 }}
              >
                {f.value}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-right mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <span className="text-purple-400 text-[10px]">Forgot Password?</span>
      </motion.div>

      <motion.div
        className="w-full h-11 rounded-xl flex items-center justify-center text-white text-[11px] font-bold"
        style={{ background: 'linear-gradient(90deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        Login
      </motion.div>

      <motion.p
        className="text-center text-[9px] text-white/30 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        Don't have an account? <span className="text-purple-400">Sign Up</span>
      </motion.p>

      {/* Google sign-in */}
      <motion.div
        className="mt-3 w-full h-9 rounded-xl flex items-center justify-center gap-2"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
      >
        <span className="text-[12px]">G</span>
        <span className="text-white/60 text-[10px]">Continue with Google</span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Dashboard / Reveal ─────────────────────────────────────────────────── */
const DASH_STATS = [
  { label: 'Notes Read',       value: '42',  icon: '📄', color: '#3b82f6' },
  { label: 'Quizzes Done',     value: '18',  icon: '✅', color: '#7c3aed' },
  { label: 'PDFs Saved',       value: '9',   icon: '📚', color: '#f97316' },
  { label: 'Day Streak',       value: '12🔥', icon: '🔥', color: '#ef4444' },
];

function DashboardUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-2"
      style={{ background: '#0d0a1c' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex items-center justify-between mb-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div>
          <p className="text-white font-bold text-sm">Welcome, Priya! 👋</p>
          <p className="text-white/40 text-[9px]">Ready to dominate today?</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-500/30 border border-purple-500/50 flex items-center justify-center text-[10px] font-bold text-purple-300">
          P
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {DASH_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className="rounded-xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.12, type: 'spring', damping: 16 }}
          >
            <span className="text-base">{s.icon}</span>
            <p className="text-white font-black text-base mt-0.5" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white/40 text-[8px] leading-tight">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick access */}
      <motion.p
        className="text-white/60 text-[9px] font-semibold mb-2 uppercase tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        Quick Access
      </motion.p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: '📖', label: 'Library', color: '#f97316' },
          { icon: '🧠', label: 'Quiz',    color: '#7c3aed' },
          { icon: '👥', label: 'Chat',    color: '#10b981' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="rounded-xl flex flex-col items-center py-2 gap-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 + i * 0.1, type: 'spring', damping: 14 }}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[8px] text-white/50">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Library ────────────────────────────────────────────────────────────── */
const BOOKS = [
  { title: 'Anatomy',     color: '#4c1d95', accent: '#7c3aed', icon: '🦴' },
  { title: 'Physiology',  color: '#1e3a5f', accent: '#3b82f6', icon: '❤️' },
  { title: 'Biochem',     color: '#1a3d2e', accent: '#10b981', icon: '🧪' },
  { title: "Gray's",      color: '#4a1c1c', accent: '#ef4444', icon: '📖' },
  { title: 'Guyton',      color: '#2d1a4a', accent: '#8b5cf6', icon: '📚' },
  { title: 'Lippincott',  color: '#1c3040', accent: '#06b6d4', icon: '🔬' },
];

function LibraryUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-bold text-sm">PDF Library</span>
        <span className="text-purple-400 text-[9px]">50+ books</span>
      </div>
      <div className="w-full h-8 rounded-lg bg-white/6 border border-white/10 flex items-center px-3 mb-3 gap-2">
        <svg className="w-3 h-3 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="text-white/25 text-[10px]">Search textbooks…</span>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1 overflow-hidden">
        {BOOKS.map((b, i) => (
          <motion.div
            key={b.title}
            className="rounded-xl flex flex-col items-center justify-end pb-2 pt-3 relative overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${b.color}, #0d0a1c)`, border: `1px solid ${b.accent}35` }}
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1 + 0.15, type: 'spring', damping: 14, stiffness: 120 }}
          >
            <div className="text-xl mb-1">{b.icon}</div>
            <span className="text-white/90 text-[8px] font-semibold text-center leading-tight px-1">{b.title}</span>
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: b.accent }} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Quizzes ────────────────────────────────────────────────────────────── */
const QUIZ_OPTIONS = ['Femoral nerve', 'Sciatic nerve', 'Obturator nerve', 'Common peroneal'];

function QuizzesUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-bold text-sm">Daily Quiz</span>
        <span className="text-purple-300 text-[9px] bg-purple-500/20 px-2 py-0.5 rounded-full">Q 7/10</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
          initial={{ width: '60%' }}
          animate={{ width: '70%' }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
      <motion.div
        className="rounded-xl p-3 mb-3"
        style={{ background: 'linear-gradient(135deg, #1a1233, #251848)', border: '1px solid #7c3aed40' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', damping: 18 }}
      >
        <p className="text-white/90 text-[10px] leading-relaxed font-medium">
          Which nerve supplies the adductor magnus in its lower part?
        </p>
      </motion.div>
      <div className="flex flex-col gap-2">
        {QUIZ_OPTIONS.map((opt, i) => (
          <motion.div
            key={opt}
            className="w-full h-9 rounded-lg flex items-center px-3 text-[10px] font-medium"
            style={{
              background: i === 0 ? 'rgba(124,58,237,0.25)' : i === 2 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
              border: i === 0 ? '1.5px solid #7c3aed' : i === 2 ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.07)',
              color: i === 0 ? '#c4b5fd' : i === 2 ? '#6ee7b7' : 'rgba(255,255,255,0.55)',
            }}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.12, type: 'spring', damping: 18 }}
          >
            <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
            {opt}
            {i === 2 && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Community ──────────────────────────────────────────────────────────── */
const MESSAGES = [
  { user: 'Priya S.', text: 'Can someone explain brachial plexus roots?', mine: false, time: '2m' },
  { user: 'Rahul M.', text: "C5-T1 roots! Here's a diagram 📎",           mine: false, time: '1m' },
  { user: 'You',      text: 'Thanks! That really helped 🙌',              mine: true,  time: 'now' },
];

function CommunityUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-bold text-sm">Community</span>
        <span className="text-green-400 text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          248 online
        </span>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {MESSAGES.map((msg, i) => (
          <motion.div
            key={i}
            className={`flex gap-2 items-end ${msg.mine ? 'flex-row-reverse' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3 + 0.2, type: 'spring', damping: 18 }}
          >
            {!msg.mine && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `hsl(${i * 80 + 250}, 55%, 38%)` }}
              >
                {msg.user[0]}
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-3 py-2 ${msg.mine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
              style={{
                background: msg.mine
                  ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                  : 'rgba(255,255,255,0.07)',
                border: msg.mine ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {!msg.mine && <p className="text-purple-300 text-[8px] font-semibold mb-0.5">{msg.user}</p>}
              <p className="text-white/90 text-[9px] leading-snug">{msg.text}</p>
              <p className="text-white/25 text-[7px] mt-0.5 text-right">{msg.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-2 h-9 rounded-full flex items-center px-4 gap-2"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <span className="text-white/25 text-[10px] flex-1">Ask a question…</span>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#7c3aed' }}>
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Notes ──────────────────────────────────────────────────────────────── */
const NOTE_LINES = [
  { w: '75%', text: 'Brachial Plexus — Summary', accent: true },
  { w: '90%', text: 'Roots: C5, C6, C7, C8, T1' },
  { w: '85%', text: 'Trunks → Divisions → Cords' },
  { w: '70%', text: 'Musculocutaneous: C5-C7' },
  { w: '80%', text: 'Median nerve: C6-T1' },
  { w: '60%', text: '★ RTDCB mnemonic', gold: true },
];

function NotesUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-bold text-sm">My Notes</span>
        <span className="text-purple-400 text-[9px] bg-purple-500/15 px-2 py-0.5 rounded-full">Anatomy</span>
      </div>
      <motion.div
        className="flex-1 rounded-xl p-3 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e1a2e, #13102a)', border: '1px solid rgba(124,58,237,0.2)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px)',
            backgroundPositionY: '12px',
          }}
        />
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: 'linear-gradient(180deg, #7c3aed, #a78bfa)' }} />
        <div className="relative flex flex-col gap-[7px] pl-2">
          {NOTE_LINES.map((line, i) => (
            <motion.div
              key={i}
              className="h-[2.5px] rounded-full"
              style={{
                width: line.w,
                background: (line as any).accent
                  ? 'rgba(167,139,250,0.9)'
                  : (line as any).gold
                    ? 'rgba(251,191,36,0.75)'
                    : 'rgba(255,255,255,0.38)',
              }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.15 + 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
      </motion.div>
      <div className="flex gap-1.5 mt-2">
        {['Anatomy', 'Physio', 'Biochem'].map((tag, i) => (
          <motion.span
            key={tag}
            className="text-[9px] px-2 py-1 rounded-full"
            style={{
              background: i === 0 ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
              color: i === 0 ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
              border: `1px solid ${i === 0 ? '#7c3aed55' : 'rgba(255,255,255,0.09)'}`,
            }}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + i * 0.1, type: 'spring', damping: 14 }}
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Leaderboard ────────────────────────────────────────────────────────── */
const RANKS = [
  { name: 'Ananya K.', xp: 4820, badge: '🏆', isYou: false },
  { name: 'Rohan P.',  xp: 4310, badge: '🥈', isYou: false },
  { name: 'Sneha M.',  xp: 3950, badge: '🥉', isYou: false },
  { name: 'You',       xp: 3720, badge: '⭐', isYou: true  },
  { name: 'Arjun S.',  xp: 3440, badge: '',   isYou: false },
];

function LeaderboardUI() {
  return (
    <motion.div
      className="h-full flex flex-col px-3 pt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-bold text-sm">Leaderboard</span>
        <span className="text-yellow-400 text-[9px]">Weekly XP</span>
      </div>
      {/* Podium */}
      <div className="flex items-end justify-center gap-2 mb-3 h-16">
        {[RANKS[1], RANKS[0], RANKS[2]].map((r, i) => {
          const heights = [52, 64, 44];
          const colors = ['#9ca3af', '#fbbf24', '#cd7c32'];
          return (
            <motion.div
              key={r.name}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 + 0.2, type: 'spring', damping: 14 }}
            >
              <div className="text-base mb-0.5">{r.badge}</div>
              <div
                className="w-12 rounded-t-lg flex items-center justify-center"
                style={{ height: heights[i], background: `${colors[i]}22`, border: `1px solid ${colors[i]}55` }}
              >
                <span className="text-[8px] text-white/60 font-medium px-1 text-center leading-tight">{r.name.split(' ')[0]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex flex-col gap-1.5">
        {RANKS.map((r, i) => (
          <motion.div
            key={r.name}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5"
            style={{
              background: r.isYou ? 'linear-gradient(90deg,rgba(124,58,237,0.35),rgba(124,58,237,0.1))' : 'rgba(255,255,255,0.04)',
              border: r.isYou ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
            }}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.55, type: 'spring', damping: 18 }}
          >
            <span className="text-[10px] font-bold w-4 text-center" style={{ color: i < 3 ? ['#fbbf24','#9ca3af','#cd7c32'][i] : 'rgba(255,255,255,0.35)' }}>
              {i + 1}
            </span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: r.isYou ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}>
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

/* ─── Mission ────────────────────────────────────────────────────────────── */
function MissionUI() {
  const lines = [
    { text: 'Free for every student.', delay: 0.3 },
    { text: 'No paywalls. No shortcuts.', delay: 0.6 },
    { text: 'Just pure learning.', delay: 0.9 },
  ];
  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center px-5 gap-6"
      style={{ background: 'linear-gradient(160deg, #0d0a1c, #13102a)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-16 h-16 rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 30px rgba(124,58,237,0.6)' }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', damping: 14 }}
      >
        <img src={`${import.meta.env.BASE_URL}images/logo.jpeg`} alt="logo" className="w-full h-full object-cover" />
      </motion.div>
      <div className="flex flex-col gap-3 w-full">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: l.delay, type: 'spring', damping: 16 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            <p className="text-white/85 text-[11px] font-medium">{l.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Outro ──────────────────────────────────────────────────────────────── */
function OutroUI() {
  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center px-5 gap-5"
      style={{ background: 'linear-gradient(160deg, #0d0a1c, #150d30)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-20 h-20 rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 0 50px rgba(124,58,237,0.8), 0 0 100px rgba(124,58,237,0.3)' }}
        initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', damping: 12 }}
      >
        <img src={`${import.meta.env.BASE_URL}images/logo.jpeg`} alt="logo" className="w-full h-full object-cover" />
      </motion.div>
      <div className="text-center">
        <motion.p
          className="text-white font-black text-lg tracking-wide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          Mission Distinction
        </motion.p>
        <motion.p
          className="text-purple-400 text-[10px] tracking-widest uppercase mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          Study Smarter. Score Higher.
        </motion.p>
      </div>
      <motion.div
        className="w-full h-11 rounded-xl flex items-center justify-center text-white text-[11px] font-bold"
        style={{ background: 'linear-gradient(90deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 24px rgba(124,58,237,0.55)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        🚀  Available Now — Free
      </motion.div>
      {/* Pulsing rings */}
      {[1, 2].map((n) => (
        <motion.div
          key={n}
          className="absolute rounded-full border border-purple-500/20 pointer-events-none"
          style={{ width: 140 + n * 60, height: 140 + n * 60, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
          animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: n * 0.8, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}
