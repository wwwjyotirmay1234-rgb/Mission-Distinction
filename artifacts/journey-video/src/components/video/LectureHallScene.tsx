import { motion } from 'framer-motion';

const ROWS = [
  { y: 72, count: 9, scale: 0.62, opacity: 0.32 },
  { y: 56, count: 8, scale: 0.72, opacity: 0.38 },
  { y: 38, count: 7, scale: 0.85, opacity: 0.46 },
  { y: 20, count: 6, scale: 1.00, opacity: 0.56 },
];

// Animated typing / note-copying motion for stressed students
function StudentSilhouette({ x, y, scale, delay, anim }: {
  x: number; y: number; scale: number; delay: number;
  anim: 'copy' | 'still' | 'look' | 'smile'
}) {
  const col = anim === 'smile' ? 'rgba(200,210,255,0.85)' : 'rgba(180,195,240,0.75)';
  return (
    <motion.g
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay }}
    >
      {/* Body */}
      <ellipse cx={x} cy={y + 18 * scale} rx={10 * scale} ry={14 * scale} fill={col} />
      {/* Head */}
      <circle cx={x} cy={y} r={9 * scale} fill={col} />
      {/* Hair mass */}
      <path
        d={`M ${x - 9 * scale} ${y - 2 * scale} Q ${x} ${y - 14 * scale} ${x + 9 * scale} ${y - 2 * scale} Q ${x + 6 * scale} ${y - 8 * scale} ${x} ${y - 10 * scale} Q ${x - 6 * scale} ${y - 8 * scale} ${x - 9 * scale} ${y - 2 * scale} Z`}
        fill="rgba(10,12,28,0.9)"
      />
      {/* Arm (copying notes) */}
      {anim === 'copy' && (
        <motion.line
          x1={x + 4 * scale} y1={y + 22 * scale}
          x2={x + 16 * scale} y2={y + 30 * scale}
          stroke={col} strokeWidth={3 * scale} strokeLinecap="round"
          animate={{ x2: [x + 16 * scale, x + 22 * scale, x + 14 * scale, x + 18 * scale] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay }}
        />
      )}
      {anim === 'look' && (
        <motion.line
          x1={x - 6 * scale} y1={y + 20 * scale}
          x2={x - 14 * scale} y2={y + 12 * scale}
          stroke={col} strokeWidth={2.5 * scale} strokeLinecap="round"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay }}
        />
      )}
      {/* Notebook on desk */}
      <rect x={x - 14 * scale} y={y + 30 * scale} width={20 * scale} height={12 * scale} rx={1.5 * scale}
        fill="rgba(240,238,215,0.2)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.6} />
    </motion.g>
  );
}

export function LectureHallScene({ phase }: { phase: number }) {
  if (phase < 1) return null;

  const ANIMS: Array<'copy' | 'still' | 'look' | 'smile'> = ['copy', 'still', 'look', 'smile', 'copy', 'still', 'look', 'copy', 'still'];

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 4 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2.5 }}
    >
      <svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMax meet"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '75%' }}>

        {/* Lecture hall floor perspective lines */}
        <line x1="500" y1="520" x2="50" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="500" y1="520" x2="950" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="500" y1="520" x2="200" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="500" y1="520" x2="800" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* Tiered desk rows */}
        {ROWS.map((row, ri) => {
          const baseY = 520 - row.y * 4.5;
          const spacing = 1000 / (row.count + 1);
          return (
            <g key={ri}>
              {/* Desk surface for row */}
              <rect x={40} y={baseY + 28 * row.scale} width={920} height={8 * row.scale} rx={2}
                fill={`rgba(20,24,52,${0.85 - ri * 0.08})`}
                stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />

              {/* Students in row */}
              {Array.from({ length: row.count }, (_, si) => (
                <StudentSilhouette
                  key={si}
                  x={spacing * (si + 1)}
                  y={baseY}
                  scale={row.scale}
                  delay={ri * 0.2 + si * 0.08}
                  anim={ANIMS[(ri * 3 + si) % ANIMS.length]}
                />
              ))}
            </g>
          );
        })}

        {/* Blackboard / projection at the front */}
        <rect x={180} y={30} width={640} height={110} rx={4}
          fill="rgba(12,18,48,0.82)" stroke="rgba(100,130,220,0.2)" strokeWidth="1.5" />
        {/* Board content — blurry lecture slide text */}
        {[40, 60, 78, 92, 105].map((y, i) => (
          <rect key={i} x={210 + (i % 2) * 12} y={y} width={80 + (i * 37 % 120)} height={5} rx={2.5}
            fill={`rgba(200,215,255,${0.12 - i * 0.015})`} />
        ))}
        {/* Diagram circle on board */}
        <circle cx={730} cy={82} r={28} fill="none" stroke="rgba(200,215,255,0.12)" strokeWidth="1.5" />
        <line x1="716" y1="82" x2="744" y2="82" stroke="rgba(200,215,255,0.1)" strokeWidth="1" />
        <line x1="730" y1="68" x2="730" y2="96" stroke="rgba(200,215,255,0.1)" strokeWidth="1" />

        {/* Teacher silhouette */}
        <ellipse cx={500} cy={160} rx={14} ry={20} fill="rgba(150,165,220,0.3)" />
        <circle cx={500} cy={136} r={12} fill="rgba(150,165,220,0.3)" />

        {/* Anxiety vibes — small sweat/stress marks near a few students */}
        {phase >= 2 && (
          <>
            {/* Student copying frantically — extra lines */}
            <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.1, repeat: Infinity }}>
              <line x1="820" y1="320" x2="835" y2="310" stroke="rgba(255,220,100,0.45)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="830" y1="318" x2="840" y2="305" stroke="rgba(255,220,100,0.3)" strokeWidth="1.2" strokeLinecap="round" />
            </motion.g>
            {/* Student on phone looking at Telegram */}
            <motion.rect x={175} y={352} width={28} height={18} rx={3}
              fill="rgba(30,60,120,0.6)" stroke="rgba(100,150,255,0.4)" strokeWidth="1"
              animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.2, repeat: Infinity }} />
            <motion.rect x={178} y={355} width={22} height={12} rx={1}
              fill="rgba(40,100,200,0.35)"
              animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }} />
          </>
        )}
      </svg>

      {/* Bottom gradient to blend with text area */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(to top, rgba(4,5,16,0.95), transparent)',
        pointerEvents: 'none',
      }} />
    </motion.div>
  );
}
