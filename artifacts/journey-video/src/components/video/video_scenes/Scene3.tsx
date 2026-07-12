import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SCENE 4 — THE JOURNEY
// Montage. PDFs. Code. Bugs. Coffee. Sleepless nights. Weeks become months.
// The callback: "The struggling student at 2 AM. Just like they once were."
const MONTAGE_ITEMS = [
  'Pages being scanned.',
  'PDFs being organized.',
  'Diagrams being redrawn.',
  'Coffee cups piling up.',
  'Code appearing on laptop screens.',
  'Error messages.',
  'Failed uploads.',
  'Crashes.',
  'Bugs.',
  'More bugs.',
];

export function Scene3() {
  const [phase, setPhase] = useState(0);
  const [montageIdx, setMontageIdx] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2000),   // montage text begins
      setTimeout(() => setPhase(3), 9500),   // victories/setbacks
      setTimeout(() => setPhase(4), 13000),  // sleepless nights
      setTimeout(() => setPhase(5), 16000),  // "days become weeks"
      setTimeout(() => setPhase(6), 18500),  // "many times they think"
      setTimeout(() => setPhase(7), 21000),  // the callback
    ];

    // Montage text cycles rapidly
    let idx = 0;
    const montageTimer = setInterval(() => {
      idx = (idx + 1) % MONTAGE_ITEMS.length;
      setMontageIdx(idx);
    }, 700);
    // Stop cycling after montage phase ends
    const stopMontage = setTimeout(() => clearInterval(montageTimer), 9000);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(montageTimer);
      clearTimeout(stopMontage);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.7 }}
    >
      {/* Background — group coding, dark and intense */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: phase >= 4 ? 1.04 : 1 }}
        transition={{ duration: 14, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/group_coding.png`}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.28) contrast(1.2) brightness(0.3)' }}
          alt=""
        />
      </motion.div>

      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.94) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 z-1 pointer-events-none mix-blend-color"
        style={{ backgroundColor: 'rgba(80,40,140,0.12)' }} />

      {/* Stamp */}
      <motion.p
        className="absolute font-mono z-10"
        style={{ top: '18%', left: '50%', transform: 'translateX(-50%)', fontSize: '0.85vw', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.16)', whiteSpace: 'nowrap' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5 }}>
        THE JOURNEY · VIMSAR · MAR — JUN 2026
      </motion.p>

      {/* Phase 2-3: RAPID MONTAGE TEXT */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={phase >= 2 && phase < 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}>
          <motion.p
            key={montageIdx}
            style={{ fontSize: '4.5vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}>
            {MONTAGE_ITEMS[montageIdx]}
          </motion.p>
        </motion.div>

        {/* Phase 3: "celebrates small victories..." */}
        <motion.div
          className="text-center px-[10vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 3 && phase < 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}>
          <p style={{ fontSize: '2.4vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', lineHeight: 2, marginBottom: '0.8vw' }}>
            The team celebrates small victories.
          </p>
          <p style={{ fontSize: '2.4vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1em', lineHeight: 2 }}>
            Then faces bigger setbacks.
          </p>
        </motion.div>

        {/* Phase 4: Sleepless nights */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={phase >= 4 && phase < 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <p style={{ fontSize: '2.6vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em' }}>
            Sleepless nights turning into sunrises.
          </p>
        </motion.div>

        {/* Phase 5: Days become weeks */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={phase >= 5 && phase < 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <div className="overflow-hidden mb-[1vw]">
            <motion.h2
              className="font-display text-white"
              style={{ fontSize: '6.5vw', letterSpacing: '-0.02em' }}
              initial={{ y: '110%' }}
              animate={phase >= 5 ? { y: 0 } : { y: '110%' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              DAYS BECOME WEEKS.
            </motion.h2>
          </div>
          <div className="overflow-hidden">
            <motion.h2
              className="font-display"
              style={{ fontSize: '6.5vw', color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.02em' }}
              initial={{ y: '110%' }}
              animate={phase >= 5 ? { y: 0 } : { y: '110%' }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
              WEEKS BECOME MONTHS.
            </motion.h2>
          </div>
        </motion.div>

        {/* Phase 6: "Many times they think about giving up." */}
        <motion.div
          className="text-center px-[10vw]"
          initial={{ opacity: 0 }}
          animate={phase >= 6 && phase < 7 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}>
          <p style={{ fontSize: '2.6vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.08em', lineHeight: 2, marginBottom: '0.5vw' }}>
            Many times they think about giving up.
          </p>
          <p style={{ fontSize: '2.4vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
            But every time they remember one thing:
          </p>
        </motion.div>

        {/* Phase 7: THE CALLBACK — the soul of the film */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={phase >= 7 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}>
          <p style={{ fontSize: '2.1vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: '0.8vw' }}>
            The struggling student sitting alone at 2 AM.
          </p>
          <p style={{ fontSize: '2.1vw', fontWeight: 100, fontStyle: 'italic', color: 'rgba(200,163,64,0.6)', letterSpacing: '0.12em' }}>
            Just like they once were.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
