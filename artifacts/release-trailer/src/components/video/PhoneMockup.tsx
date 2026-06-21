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

/* ─── Shared mini design tokens (match real app) ─────────────────────────── */
const card = 'rgba(255,255,255,0.05)';
const cardBorder = 'rgba(255,255,255,0.09)';
const primary = '#7c3aed';
const muted = 'rgba(255,255,255,0.45)';
const screenBg = '#0c0a1e';

export function PhoneMockup({ currentSceneKey }: { currentSceneKey: string }) {
  const angle = PHONE_3D[currentSceneKey] ?? { rotateY: 0, rotateX: 5, scale: 1 };

  return (
    <motion.div
      animate={{ rotateY: angle.rotateY, rotateX: angle.rotateX, scale: angle.scale }}
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
          boxShadow: `0 0 0 6px #111111, 0 0 0 7px #252525,
            0 60px 100px rgba(0,0,0,0.9), 0 20px 40px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.06), 0 0 80px rgba(124,58,237,0.18)`,
        }}
      />
      {/* Metallic sheen */}
      <div className="absolute inset-0 rounded-[42px] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, rgba(255,255,255,0.02) 100%)' }} />

      {/* Screen */}
      <div className="absolute rounded-[36px] overflow-hidden"
        style={{ inset: '7px', background: screenBg, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-white/70 text-[10px] font-semibold tracking-tight">9:41</span>
          <div className="w-14 h-[14px] bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px] items-end h-3">
              {[2,3,4,5].map((h,i) => (
                <div key={i} className="w-[2.5px] bg-white/60 rounded-[1px]" style={{ height: h*2 }} />
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
            {currentSceneKey === 'problem'     && <SplashUI      key="splash"   />}
            {currentSceneKey === 'solution'    && <LoginUI       key="login"    />}
            {currentSceneKey === 'reveal'      && <DashboardUI   key="dash"     />}
            {currentSceneKey === 'library'     && <LibraryUI     key="lib"      />}
            {currentSceneKey === 'quizzes'     && <QuizzesUI     key="quiz"     />}
            {currentSceneKey === 'community'   && <CommunityUI   key="comm"     />}
            {currentSceneKey === 'notes'       && <NotesUI       key="notes"    />}
            {currentSceneKey === 'leaderboard' && <LeaderboardUI key="lb"       />}
            {currentSceneKey === 'mission'     && <MissionUI     key="mission"  />}
            {currentSceneKey === 'outro'       && <OutroUI       key="outro"    />}
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/25 rounded-full" />
      </div>

      {/* Side buttons */}
      <div className="absolute right-[-6px] top-28 w-[4px] h-12 rounded-r-sm"
        style={{ background: 'linear-gradient(180deg,#222,#333,#222)' }} />
      <div className="absolute left-[-6px] top-24 w-[4px] h-8 rounded-l-sm"
        style={{ background: 'linear-gradient(180deg,#222,#333,#222)' }} />
      <div className="absolute left-[-6px] top-36 w-[4px] h-8 rounded-l-sm"
        style={{ background: 'linear-gradient(180deg,#222,#333,#222)' }} />

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

/* ─── SPLASH ─────────────────────────────────────────────────────────────── */
function SplashUI() {
  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0c0a1e 0%, #150d30 60%, #0c0a1e 100%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{ left: `${15 + i*10}%`, top: `${10 + (i%3)*25}%` }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + i*0.4, repeat: Infinity, delay: i*0.3 }}
        />
      ))}
      {/* Purple glow halo */}
      <motion.div className="absolute w-52 h-52 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent)', filter: 'blur(50px)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Real logo */}
      <motion.img
        src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
        alt="Mission Distinction"
        className="w-28 h-28 rounded-3xl object-cover relative z-10"
        style={{ boxShadow: '0 0 50px rgba(124,58,237,0.8), 0 0 100px rgba(124,58,237,0.35)' }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 12, stiffness: 90 }}
      />
      <motion.div className="text-center mt-5 relative z-10 px-4"
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <p className="text-white font-black text-lg tracking-wide">Mission Distinction</p>
        <p className="text-[11px] mt-1.5 italic" style={{ color: '#d4a553' }}>
          ज्ञानेन आरोग्यं, आरोग्येन सेवा
        </p>
        <p className="text-white/40 text-[9px] mt-1">Study Smarter · Score Higher</p>
      </motion.div>
      {/* Pulsing ring */}
      <motion.div className="absolute w-40 h-40 rounded-full border pointer-events-none"
        style={{ borderColor: 'rgba(124,58,237,0.25)' }}
        animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 1.3 }}
      />
    </motion.div>
  );
}

/* ─── LOGIN — real app iframe ─────────────────────────────────────────────── */
function LoginUI() {
  const SCALE = 286 / 390;
  const iframeH = Math.ceil(570 / SCALE);
  return (
    <motion.div className="h-full w-full overflow-hidden relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}>
      <iframe
        src="/"
        title="Mission Distinction Login"
        style={{
          width: 390,
          height: iframeH,
          border: 'none',
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          display: 'block',
        }}
      />
    </motion.div>
  );
}

/* ─── DASHBOARD — real layout ─────────────────────────────────────────────── */
const QUICK = [
  { icon: '✅', label: 'Take Quiz',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { icon: '📄', label: 'My Notes',     color: '#a78bfa', bg: 'rgba(124,58,237,0.12)' },
  { icon: '📚', label: 'PDF Library',  color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { icon: '🔖', label: 'Bookmarks',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  { icon: '🔥', label: 'Progress',     color: '#eab308', bg: 'rgba(234,179,8,0.12)'  },
  { icon: '📅', label: 'Calendar',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
];

const ACTIVITY = [
  { type: 'quiz', icon: '✅', color: '#a78bfa', label: 'Completed Anatomy MCQ',      badge: 'quiz',     time: '2h ago' },
  { type: 'pdf',  icon: '📚', color: '#f97316', label: 'Downloaded Gray\'s Anatomy', badge: 'pdf',      time: '5h ago' },
  { type: 'note', icon: '📄', color: '#3b82f6', label: 'Read Brachial Plexus notes', badge: 'note',     time: '1d ago' },
];

function DashboardUI() {
  const STATS = [
    { label: 'Notes Read',         value: '42', icon: '📄', color: '#3b82f6' },
    { label: 'PDFs Downloaded',    value: '9',  icon: '📚', color: '#f97316' },
    { label: 'Quizzes Attempted',  value: '18', icon: '✅', color: primary    },
    { label: 'Study Streak',       value: '12🔥', icon: '🔥', color: '#f97316', gradient: true },
  ];
  return (
    <motion.div className="h-full flex flex-col px-3 pt-2 overflow-hidden"
      style={{ background: screenBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <motion.div className="flex items-center justify-between mb-2.5"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div>
          <p className="text-white font-bold text-sm leading-none">Welcome, Priya! 👋</p>
          <p className="text-[9px] mt-0.5" style={{ color: muted }}>Ready to conquer today?</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] px-2 py-0.5 rounded-full border font-medium" style={{ borderColor: cardBorder, color: muted }}>1st Year</span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-purple-300"
            style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}>P</div>
        </div>
      </motion.div>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        {STATS.map((s, i) => (
          <motion.div key={s.label} className="rounded-xl p-2.5 relative overflow-hidden"
            style={{ background: card, border: `1px solid ${cardBorder}` }}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, type: 'spring', damping: 16 }}>
            {s.gradient && <div className="absolute -right-2 -top-2 w-10 h-10 rounded-full blur-xl" style={{ background: 'rgba(249,115,22,0.15)' }} />}
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8px] font-medium" style={{ color: muted }}>{s.label}</p>
              <span className="text-[10px]">{s.icon}</span>
            </div>
            <p className={`text-base font-black ${s.gradient ? 'text-transparent bg-clip-text' : ''}`}
              style={s.gradient
                ? { backgroundImage: 'linear-gradient(90deg, #fb923c, #ef4444)' }
                : { color: s.color }}>
              {s.value}
            </p>
            <p className="text-[7px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>total</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Access */}
      <motion.p className="text-[8px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: muted }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
        Quick Access
      </motion.p>
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {QUICK.map((q, i) => (
          <motion.div key={q.label}
            className="flex flex-col items-center justify-center rounded-xl py-2 gap-1"
            style={{ background: card, border: `1px solid ${cardBorder}` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.85 + i * 0.07, type: 'spring', damping: 14 }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: q.bg }}>
              {q.icon}
            </div>
            <span className="text-[7px] font-medium text-center leading-tight" style={{ color: muted }}>{q.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.p className="text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ color: muted }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.35 }}>
        Recent Activity
      </motion.p>
      <div className="flex flex-col gap-1">
        {ACTIVITY.map((a, i) => (
          <motion.div key={i} className="flex items-center gap-2 p-1.5 rounded-lg"
            style={{ background: card, border: `1px solid ${cardBorder}` }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.45 + i * 0.1 }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-medium text-white/80 truncate">{a.label}</p>
              <div className="flex gap-1 mt-0.5">
                <span className="text-[6px] px-1 py-0.5 rounded border capitalize" style={{ borderColor: cardBorder, color: muted }}>{a.badge}</span>
                <span className="text-[6px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── LIBRARY — real app style ────────────────────────────────────────────── */
const PDFS = [
  { title: "Gray's Anatomy",          subject: 'Anatomy',      pages: 1584, prof: 'Drake' },
  { title: 'Guyton & Hall Physiology', subject: 'Physiology',   pages: 1168, prof: 'Hall' },
  { title: "Lippincott's Biochem",    subject: 'Biochemistry', pages: 912,  prof: 'Bhagavan' },
  { title: 'Snell Clinical Anatomy',  subject: 'Anatomy',      pages: 800,  prof: 'Snell' },
  { title: 'Ganong Physiology',       subject: 'Physiology',   pages: 752,  prof: 'Ganong' },
];
const SUBJECT_COLORS: Record<string, string> = {
  Anatomy: '#7c3aed', Physiology: '#3b82f6', Biochemistry: '#10b981',
};

function LibraryUI() {
  const tabs = ['All', 'Anatomy', 'Physiology', 'Biochemistry'];
  return (
    <motion.div className="h-full flex flex-col px-3 pt-2"
      style={{ background: screenBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <motion.div className="flex items-center justify-between mb-2"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <span className="text-white font-bold text-sm">PDF Library</span>
        <span className="text-[9px]" style={{ color: primary }}>50+ books</span>
      </motion.div>
      {/* Search */}
      <motion.div className="flex items-center gap-2 h-8 rounded-xl px-3 mb-2"
        style={{ background: card, border: `1px solid ${cardBorder}` }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <svg className="w-3 h-3 shrink-0" style={{ color: muted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Search textbooks…</span>
      </motion.div>
      {/* Subject filter tabs */}
      <motion.div className="flex gap-1 mb-2.5 overflow-x-hidden"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        {tabs.map((t, i) => (
          <span key={t} className="shrink-0 text-[8px] font-semibold px-2 py-1 rounded-full"
            style={i === 0
              ? { background: primary, color: 'white' }
              : { background: card, color: muted, border: `1px solid ${cardBorder}` }}>
            {t}
          </span>
        ))}
      </motion.div>
      {/* PDF list */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        {PDFS.map((p, i) => (
          <motion.div key={p.title}
            className="flex items-center gap-2.5 p-2.5 rounded-xl"
            style={{ background: card, border: `1px solid ${cardBorder}` }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.1, type: 'spring', damping: 18 }}>
            {/* Icon */}
            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-base"
              style={{ background: `${SUBJECT_COLORS[p.subject] ?? primary}20`, border: `1px solid ${SUBJECT_COLORS[p.subject] ?? primary}40` }}>
              📖
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-white leading-tight truncate">{p.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[7px] px-1 py-0.5 rounded font-medium"
                  style={{ background: `${SUBJECT_COLORS[p.subject] ?? primary}20`, color: SUBJECT_COLORS[p.subject] ?? primary }}>
                  {p.subject}
                </span>
                <span className="text-[6px]" style={{ color: muted }}>{p.prof} · {p.pages}p</span>
              </div>
            </div>
            {/* Download icon */}
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: muted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── QUIZZES — real app style ────────────────────────────────────────────── */
const QUIZ_LIST = [
  { title: 'Anatomy MCQ Set 1',        subject: 'Anatomy',      diff: 'medium', q: 10, mins: 10 },
  { title: 'Physiology Short Notes',   subject: 'Physiology',   diff: 'easy',   q: 15, mins: 15 },
  { title: 'Biochemistry Challenge',   subject: 'Biochemistry', diff: 'hard',   q: 20, mins: 25 },
];
const DIFF_COLOR: Record<string, string> = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const QUIZ_OPTIONS = ['Femoral nerve', 'Sciatic nerve', 'Obturator nerve', 'Common peroneal'];

function QuizzesUI() {
  return (
    <motion.div className="h-full flex flex-col px-3 pt-2"
      style={{ background: screenBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header + tab */}
      <motion.div className="flex items-center justify-between mb-2"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <span className="text-white font-bold text-sm">Quizzes</span>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: cardBorder }}>
          {['All', 'Anatomy', 'Physio', 'Biochem'].map((t, i) => (
            <span key={t} className="text-[7px] px-1.5 py-1 font-medium"
              style={i === 0 ? { background: primary, color: 'white' } : { color: muted }}>
              {t}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Quiz cards */}
      <div className="flex flex-col gap-2 mb-3">
        {QUIZ_LIST.map((q, i) => (
          <motion.div key={q.title}
            className="rounded-xl p-2.5"
            style={{ background: card, border: `1px solid ${cardBorder}` }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.12, type: 'spring', damping: 16 }}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-[9px] font-semibold text-white leading-snug flex-1">{q.title}</p>
              <span className="text-[7px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 capitalize"
                style={{ background: `${DIFF_COLOR[q.diff]}20`, color: DIFF_COLOR[q.diff] }}>
                {q.diff}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[7px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: `${SUBJECT_COLORS[q.subject] ?? primary}20`, color: SUBJECT_COLORS[q.subject] ?? primary }}>
                {q.subject}
              </span>
              <span className="text-[7px]" style={{ color: muted }}>⏱ {q.mins}m</span>
              <span className="text-[7px]" style={{ color: muted }}>❓ {q.q} Qs</span>
              <span className="ml-auto text-[7px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${primary}25`, color: '#c4b5fd' }}>
                ▶ Start
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active question preview */}
      <div className="rounded-xl p-2.5" style={{ background: 'rgba(124,58,237,0.08)', border: `1px solid ${primary}30` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] font-bold text-white/80">Live — Q7/10</span>
          <span className="text-[8px] font-mono" style={{ color: '#f97316' }}>04:23</span>
        </div>
        <p className="text-[9px] text-white/85 font-medium leading-snug mb-2">
          Which nerve supplies the adductor magnus in its lower part?
        </p>
        <div className="flex flex-col gap-1">
          {QUIZ_OPTIONS.map((opt, i) => (
            <motion.div key={opt}
              className="h-7 rounded-lg flex items-center px-2.5 text-[8px] font-medium"
              style={{
                background: i === 2 ? 'rgba(16,185,129,0.18)' : i === 0 ? `rgba(124,58,237,0.22)` : 'rgba(255,255,255,0.04)',
                border: i === 2 ? '1px solid #10b981' : i === 0 ? `1px solid ${primary}` : `1px solid ${cardBorder}`,
                color: i === 2 ? '#6ee7b7' : i === 0 ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + i * 0.1, type: 'spring', damping: 18 }}>
              <span className="mr-1.5 opacity-50">{String.fromCharCode(65+i)}.</span>
              {opt}
              {i === 2 && <span className="ml-auto text-[10px]">✓</span>}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── COMMUNITY — real app style ─────────────────────────────────────────── */
const GROUPS = [
  { name: 'Anatomy Study Room',    subject: 'Anatomy',      members: 142, last: 'Gray\'s Chapter 3 doubts?' },
  { name: 'Physiology Crew',       subject: 'Physiology',   members: 98,  last: 'Anyone done Guyton MCQs?' },
  { name: 'Biochemistry Hub',      subject: 'Biochemistry', members: 76,  last: 'Enzyme kinetics notes 📎' },
];
const MESSAGES = [
  { name: 'Priya S.',  text: 'Can someone explain brachial plexus roots?', mine: false },
  { name: 'Rahul M.', text: "C5–T1 roots! Here's my notes 📎",            mine: false },
  { name: 'You',      text: 'Thanks! That really helped 🙌',              mine: true  },
];

function CommunityUI() {
  return (
    <motion.div className="h-full flex flex-col px-3 pt-2"
      style={{ background: screenBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <motion.div className="flex items-center justify-between mb-2"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <span className="text-white font-bold text-sm">Community</span>
        <span className="text-[9px] flex items-center gap-1" style={{ color: '#22c55e' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />248 online
        </span>
      </motion.div>

      {/* Groups */}
      <div className="flex flex-col gap-1.5 mb-3">
        {GROUPS.map((g, i) => (
          <motion.div key={g.name}
            className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background: card, border: `1px solid ${cardBorder}` }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.12, type: 'spring', damping: 18 }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
              style={{ background: `${SUBJECT_COLORS[g.subject] ?? primary}18`, border: `1px solid ${SUBJECT_COLORS[g.subject] ?? primary}30` }}>
              👥
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-white truncate">{g.name}</p>
              <p className="text-[7px] truncate mt-0.5" style={{ color: muted }}>{g.last}</p>
            </div>
            <span className="text-[7px] shrink-0" style={{ color: muted }}>{g.members}</span>
          </motion.div>
        ))}
      </div>

      {/* Active chat */}
      <div className="rounded-xl p-2.5 flex flex-col gap-2" style={{ background: card, border: `1px solid ${cardBorder}` }}>
        <p className="text-[8px] font-bold text-white/70">Anatomy Study Room</p>
        {MESSAGES.map((msg, i) => (
          <motion.div key={i}
            className={`flex gap-1.5 items-end ${msg.mine ? 'flex-row-reverse' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.25, type: 'spring', damping: 18 }}>
            {!msg.mine && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
                style={{ background: `hsl(${i*80+250},55%,38%)` }}>
                {msg.name[0]}
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-2 py-1.5 ${msg.mine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
              style={{
                background: msg.mine ? `linear-gradient(135deg, ${primary}, #5b21b6)` : 'rgba(255,255,255,0.07)',
                border: msg.mine ? 'none' : `1px solid ${cardBorder}`,
              }}>
              {!msg.mine && <p className="text-purple-300 text-[7px] font-semibold mb-0.5">{msg.name}</p>}
              <p className="text-white/90 text-[8px] leading-snug">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {/* Input */}
        <motion.div className="flex items-center gap-1.5 mt-1 h-7 rounded-full px-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${cardBorder}` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}>
          <span className="text-[8px] flex-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Ask a question…</span>
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: primary }}>
            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── NOTES — real app style ──────────────────────────────────────────────── */
const NOTE_CARDS = [
  { title: 'Brachial Plexus Summary',   subject: 'Anatomy',      lines: 12, time: '2h ago' },
  { title: 'Cardiac Cycle — Step Guide', subject: 'Physiology',   lines: 8,  time: '1d ago' },
  { title: 'Glycolysis Pathway',         subject: 'Biochemistry', lines: 15, time: '3d ago' },
];
const NOTE_LINES = [
  { w: '75%', accent: true },
  { w: '90%' },
  { w: '85%' },
  { w: '70%' },
  { w: '80%' },
  { w: '60%', gold: true },
  { w: '88%' },
];

function NotesUI() {
  return (
    <motion.div className="h-full flex flex-col px-3 pt-2"
      style={{ background: screenBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <motion.div className="flex items-center justify-between mb-2"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <span className="text-white font-bold text-sm">My Notes</span>
        <span className="text-[8px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${primary}20`, color: '#c4b5fd', border: `1px solid ${primary}35` }}>
          + New Note
        </span>
      </motion.div>

      {/* Note cards */}
      <div className="flex flex-col gap-2 mb-2.5">
        {NOTE_CARDS.map((n, i) => (
          <motion.div key={n.title}
            className="rounded-xl p-2.5"
            style={{ background: card, border: `1px solid ${cardBorder}` }}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.12, type: 'spring', damping: 18 }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[9px] font-semibold text-white leading-tight flex-1">{n.title}</p>
              <span className="text-[6px]" style={{ color: muted }}>{n.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[7px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: `${SUBJECT_COLORS[n.subject] ?? primary}18`, color: SUBJECT_COLORS[n.subject] ?? primary }}>
                {n.subject}
              </span>
              <span className="text-[7px]" style={{ color: muted }}>{n.lines} lines</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Open note */}
      <motion.div className="flex-1 rounded-xl p-2.5 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e1a2e, #13102a)', border: `1px solid ${primary}25` }}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }}>
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ background: 'linear-gradient(180deg, #7c3aed, #a78bfa)' }} />
        <div className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 15px, rgba(255,255,255,1) 15px, rgba(255,255,255,1) 16px)',
            backgroundPositionY: '8px',
          }} />
        <p className="text-[8px] font-bold text-purple-300 mb-2 ml-2">Brachial Plexus Summary</p>
        <div className="flex flex-col gap-[6px] pl-2">
          {NOTE_LINES.map((line, i) => (
            <motion.div key={i} className="h-[2px] rounded-full"
              style={{
                width: line.w,
                background: (line as any).accent
                  ? 'rgba(167,139,250,0.9)'
                  : (line as any).gold
                    ? 'rgba(251,191,36,0.7)'
                    : 'rgba(255,255,255,0.35)',
              }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.4, ease: [0.16,1,0.3,1] }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── LEADERBOARD — real app style ───────────────────────────────────────── */
const XP_ENTRIES = [
  { name: 'Ananya K.',   college: 'MKCG Medical',     xp: 4820, streak: 18, rank: 'Scholar',  medal: '🥇' },
  { name: 'Rohan P.',    college: 'SCB Medical',      xp: 4310, streak: 14, rank: 'Expert',   medal: '🥈' },
  { name: 'Sneha M.',    college: 'Hi-Tech Medical',  xp: 3950, streak: 12, rank: 'Expert',   medal: '🥉' },
  { name: 'Priya S.',    college: 'AIIMS Bhubaneswar', xp: 3720, streak: 12, rank: 'Scholar',  medal: '⭐', isYou: true },
  { name: 'Arjun S.',    college: 'VSS Medical',      xp: 3440, streak: 9,  rank: 'Learner',  medal: '' },
];

function LeaderboardUI() {
  return (
    <motion.div className="h-full flex flex-col px-3 pt-2"
      style={{ background: screenBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <motion.div className="flex items-center justify-between mb-2"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <span className="text-white font-bold text-sm">Leaderboard</span>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: cardBorder }}>
          {['XP', 'Score', 'Streak'].map((t, i) => (
            <span key={t} className="text-[7px] px-1.5 py-1 font-semibold"
              style={i === 0 ? { background: primary, color: 'white' } : { color: muted }}>
              {t}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-2 mb-3 h-16">
        {[XP_ENTRIES[1], XP_ENTRIES[0], XP_ENTRIES[2]].map((e, i) => {
          const heights = [52, 64, 44];
          const colors = ['#9ca3af', '#fbbf24', '#cd7c32'];
          return (
            <motion.div key={e.name} className="flex flex-col items-center"
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i*0.15, type: 'spring', damping: 14 }}>
              <div className="text-base mb-0.5">{e.medal}</div>
              <div className="w-12 rounded-t-xl flex flex-col items-center justify-center gap-0.5"
                style={{ height: heights[i], background: `${colors[i]}20`, border: `1px solid ${colors[i]}50` }}>
                <span className="text-[7px] text-white/70 font-medium text-center px-1 leading-tight">{e.name.split(' ')[0]}</span>
                <span className="text-[6px] font-mono" style={{ color: colors[i] }}>{(e.xp/1000).toFixed(1)}k</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        {XP_ENTRIES.map((e, i) => (
          <motion.div key={e.name}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
            style={{
              background: e.isYou ? `linear-gradient(90deg, rgba(124,58,237,0.3), rgba(124,58,237,0.08))` : card,
              border: e.isYou ? `1px solid ${primary}55` : `1px solid ${cardBorder}`,
            }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i*0.1, type: 'spring', damping: 18 }}>
            <span className="text-sm w-5 text-center shrink-0">
              {i < 3 ? ['🥇','🥈','🥉'][i] : <span className="text-[9px] font-bold" style={{ color: muted }}>#{i+1}</span>}
            </span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: e.isYou ? primary : 'rgba(255,255,255,0.1)', color: 'white' }}>
              {e.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-semibold text-white truncate">{e.isYou ? 'You' : e.name}</p>
              <p className="text-[6px] truncate" style={{ color: muted }}>{e.college}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8px] font-mono font-bold" style={{ color: '#c4b5fd' }}>{e.xp.toLocaleString()} XP</p>
              <p className="text-[6px]" style={{ color: '#f97316' }}>🔥 {e.streak}d</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── MISSION ─────────────────────────────────────────────────────────────── */
function MissionUI() {
  const lines = [
    { text: 'Free for every student.',    delay: 0.3 },
    { text: 'No paywalls. No shortcuts.', delay: 0.6 },
    { text: 'Just pure learning.',        delay: 0.9 },
  ];
  return (
    <motion.div className="h-full flex flex-col items-center justify-center px-5 gap-6"
      style={{ background: 'linear-gradient(160deg, #0c0a1e, #150d30)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-16 h-16 rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 30px rgba(124,58,237,0.65)' }}
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', damping: 14 }}>
        <img src={`${import.meta.env.BASE_URL}images/logo.jpeg`} alt="logo" className="w-full h-full object-cover" />
      </motion.div>
      <div className="flex flex-col gap-2.5 w-full">
        {lines.map((l, i) => (
          <motion.div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: `rgba(124,58,237,0.1)`, border: `1px solid rgba(124,58,237,0.22)` }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: l.delay, type: 'spring', damping: 16 }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#a78bfa' }} />
            <p className="text-white/85 text-[10px] font-medium">{l.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── OUTRO ───────────────────────────────────────────────────────────────── */
function OutroUI() {
  return (
    <motion.div className="h-full flex flex-col items-center justify-center px-5 gap-5"
      style={{ background: 'linear-gradient(160deg, #0c0a1e, #150d30)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-20 h-20 rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 0 50px rgba(124,58,237,0.8), 0 0 100px rgba(124,58,237,0.3)' }}
        initial={{ scale: 0.3, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', damping: 12 }}>
        <img src={`${import.meta.env.BASE_URL}images/logo.jpeg`} alt="logo" className="w-full h-full object-cover" />
      </motion.div>
      <div className="text-center">
        <motion.p className="text-white font-black text-lg tracking-wide"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          Mission Distinction
        </motion.p>
        <motion.p className="text-[10px] tracking-widest uppercase mt-1" style={{ color: primary }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
          Study Smarter. Score Higher.
        </motion.p>
      </div>
      <motion.div className="w-full h-11 rounded-xl flex items-center justify-center text-white text-[11px] font-bold"
        style={{ background: `linear-gradient(90deg, ${primary}, #5b21b6)`, boxShadow: '0 4px 24px rgba(124,58,237,0.55)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
        🚀  Available Now — Free
      </motion.div>
      {[1,2].map((n) => (
        <motion.div key={n} className="absolute rounded-full border pointer-events-none"
          style={{ width: 140+n*60, height: 140+n*60, top:'50%', left:'50%', x:'-50%', y:'-50%', borderColor: 'rgba(124,58,237,0.2)' }}
          animate={{ scale:[1,1.4], opacity:[0.4,0] }}
          transition={{ duration:2.5, repeat:Infinity, delay:n*0.8, ease:'easeOut' }}
        />
      ))}
    </motion.div>
  );
}
