import { motion } from 'framer-motion';

// Animated whiteboard with ideas appearing
export function WhiteboardScene({ phase }: { phase: number }) {
  if (phase < 1) return null;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 4 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="lampWarm" cx="30%" cy="20%" r="60%">
            <stop offset="0%" stopColor="rgba(255,215,100,0.12)" />
            <stop offset="100%" stopColor="rgba(255,180,60,0)" />
          </radialGradient>
          <filter id="markerBlur">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Room walls (perspective) */}
        <rect x="0" y="0" width="1000" height="600" fill="rgba(8,10,28,0)" />

        {/* Warm lamp glow top-left */}
        <ellipse cx="300" cy="120" rx="380" ry="280" fill="url(#lampWarm)" />

        {/* ── WHITEBOARD ───────────────────────────── */}
        <rect x="120" y="60" width="560" height="340" rx="6"
          fill="rgba(230,232,248,0.08)" stroke="rgba(200,210,255,0.22)" strokeWidth="2" />
        {/* Board glare */}
        <path d="M 130 65 L 290 65 L 240 120 L 130 120 Z"
          fill="rgba(255,255,255,0.03)" />

        {/* ── WHITEBOARD CONTENT ── appears phase-by-phase ── */}

        {/* Phase 2: "No investors. No office." — written in marker */}
        {phase >= 2 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            {/* Marker text lines (simulated handwriting) */}
            <motion.path d="M 160 110 Q 175 105 195 108 Q 220 106 238 110"
              stroke="rgba(200,215,255,0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.1 }} />
            <motion.path d="M 160 125 Q 180 120 210 123 Q 235 122 255 126"
              stroke="rgba(200,215,255,0.4)" strokeWidth="2.2" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.3 }} />
            <motion.path d="M 160 140 Q 185 136 215 139 Q 240 138 268 142"
              stroke="rgba(200,215,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.5 }} />
          </motion.g>
        )}

        {/* Phase 3: Whiteboard fills with idea nodes */}
        {phase >= 3 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
            {/* Idea bubbles (circles with connecting lines) */}
            {[
              { cx: 240, cy: 195, r: 32, label: 'Notes', c: 'rgba(140,180,255,0.55)' },
              { cx: 360, cy: 165, r: 28, label: 'PDFs', c: 'rgba(140,200,140,0.50)' },
              { cx: 460, cy: 215, r: 30, label: 'Quiz', c: 'rgba(255,180,120,0.50)' },
              { cx: 340, cy: 280, r: 34, label: 'AI', c: 'rgba(200,140,255,0.52)' },
              { cx: 520, cy: 155, r: 24, label: 'Chat', c: 'rgba(255,220,100,0.48)' },
              { cx: 580, cy: 270, r: 26, label: 'Viva', c: 'rgba(140,200,200,0.48)' },
            ].map((node, i) => (
              <motion.g key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.18, type: 'spring', stiffness: 200 }}>
                <circle cx={node.cx} cy={node.cy} r={node.r}
                  fill="rgba(15,18,42,0.8)" stroke={node.c} strokeWidth="1.8" />
                <text x={node.cx} y={node.cy + 4}
                  textAnchor="middle" fontSize="13" fontFamily="sans-serif"
                  fill={node.c} opacity="0.9">{node.label}</text>
              </motion.g>
            ))}

            {/* Connecting lines between nodes */}
            {[
              [240, 195, 360, 165],
              [360, 165, 460, 215],
              [360, 165, 340, 280],
              [460, 215, 580, 270],
              [360, 165, 520, 155],
              [520, 155, 580, 270],
              [340, 280, 580, 270],
            ].map(([x1, y1, x2, y2], i) => (
              <motion.line key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(200,210,255,0.18)" strokeWidth="1.2" strokeDasharray="5 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 + i * 0.1 }} />
            ))}
          </motion.g>
        )}

        {/* Phase 4: THE BIG QUESTION written in bold marker */}
        {phase >= 4 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {/* Bold underline beneath question area */}
            <motion.line x1="152" y1="342" x2="658" y2="342"
              stroke="rgba(200,163,64,0.5)" strokeWidth="2.5"
              initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.3 }} />
            {/* Star/asterisk emphasis marks */}
            <motion.text x="140" y="326" fontSize="22" fill="rgba(200,163,64,0.7)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>✦</motion.text>
            <motion.text x="658" y="326" fontSize="22" fill="rgba(200,163,64,0.7)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>✦</motion.text>
          </motion.g>
        )}

        {/* ── TABLE WITH LAPTOPS ─────────────────────── */}
        {/* Table */}
        <rect x="80" y="440" width="840" height="22" rx="4"
          fill="rgba(16,19,42,0.92)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

        {/* 3 people sitting at table */}
        {[200, 500, 800].map((cx, i) => (
          <g key={i}>
            {/* Body */}
            <ellipse cx={cx} cy={490} rx={28} ry={38} fill="rgba(12,14,32,0.9)" />
            {/* Head */}
            <circle cx={cx} cy={458} r={22} fill="rgba(12,14,32,0.9)" />
            {/* Hair */}
            <path d={`M ${cx - 22} ${cx === 500 ? 452 : 454} Q ${cx} ${cx === 500 ? 432 : 434} ${cx + 22} ${cx === 500 ? 452 : 454} Q ${cx + 14} ${cx === 500 ? 440 : 442} ${cx} ${cx === 500 ? 436 : 438} Q ${cx - 14} ${cx === 500 ? 440 : 442} ${cx - 22} ${cx === 500 ? 452 : 454} Z`}
              fill="rgba(8,9,20,0.97)" />
            {/* Laptop screen */}
            <motion.rect x={cx - 40} y={402} width={80} height={38} rx={3}
              fill="rgba(8,12,30,0.95)" stroke="rgba(70,120,220,0.5)" strokeWidth="1.5"
              animate={{ opacity: [0.8, 1, 0.9, 1] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }} />
            {/* Screen glow */}
            <motion.rect x={cx - 37} y={405} width={74} height={32} rx={2}
              fill="rgba(60,100,220,0.18)"
              animate={{ opacity: [0.15, 0.35, 0.2, 0.35] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }} />
            {/* Laptop base */}
            <rect x={cx - 48} y={440} width={96} height={8} rx={2}
              fill="rgba(18,22,44,0.9)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.7" />

            {/* Notebook beside laptop */}
            <rect x={cx + 46} y={422} width={42} height={28} rx={2}
              fill="rgba(235,230,200,0.1)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
            <line x1={cx + 50} y1={430} x2={cx + 84} y2={430} stroke="rgba(255,220,70,0.28)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={cx + 50} y1={437} x2={cx + 80} y2={437} stroke="rgba(255,220,70,0.18)" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </svg>

      {/* Bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%',
        background: 'linear-gradient(to top, rgba(4,5,16,0.97), transparent)',
        pointerEvents: 'none',
      }} />
    </motion.div>
  );
}
