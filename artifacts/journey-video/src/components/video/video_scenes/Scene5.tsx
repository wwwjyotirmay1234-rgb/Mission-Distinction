import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Major cities in Odisha with approximate positions on a 400x480 viewBox
const CITIES = [
  { name: 'Bhubaneswar', x: 248, y: 310, capital: true },
  { name: 'Cuttack',     x: 252, y: 278 },
  { name: 'Puri',        x: 258, y: 348 },
  { name: 'Sambalpur',   x: 148, y: 168 },
  { name: 'Rourkela',    x: 108, y: 108 },
  { name: 'Berhampur',   x: 248, y: 398 },
  { name: 'Balasore',    x: 290, y: 148 },
  { name: 'Koraput',     x: 178, y: 418 },
  { name: 'Keonjhar',    x: 228, y: 128 },
  { name: 'Rayagada',    x: 192, y: 390 },
];

// Connection lines between cities
const CONNECTIONS = [
  [0, 1], [0, 2], [0, 4], [0, 6], [0, 7],
  [1, 3], [1, 5], [1, 8],
  [3, 4], [3, 8],
  [2, 7], [5, 9],
];

// Simplified Odisha state outline path (viewBox 0 0 400 480)
const ODISHA_PATH = `
  M 290 80
  L 318 100
  L 330 130
  L 318 160
  L 300 178
  L 310 210
  L 308 240
  L 296 268
  L 290 300
  L 292 330
  L 282 358
  L 268 385
  L 248 412
  L 228 430
  L 208 438
  L 185 432
  L 162 418
  L 140 400
  L 122 378
  L 108 355
  L 95 330
  L 88 305
  L 90 278
  L 98 252
  L 88 225
  L 80 195
  L 78 165
  L 85 138
  L 98 115
  L 115 95
  L 138 80
  L 162 68
  L 188 62
  L 215 62
  L 245 68
  L 270 74
  Z
`;

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-[#05070f]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      {/* Deep space background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,_rgba(124,58,237,0.25)_0%,_rgba(13,15,26,0.9)_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(200,163,64,0.1)_0%,_transparent_60%)]" />

      {/* Animated star field */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2vw] p-[4vw]">

        {/* Caduceus icon */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.8 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}caduceus-hero-nobg.png`}
            alt="Caduceus"
            className="w-[5vw] h-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 12px rgba(200, 163, 64, 0.7))' }}
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-[5.5vw] font-display text-white uppercase leading-none text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          IMPACT ALL OVER{' '}
          <span className="text-brand-gold">ODISHA</span>
        </motion.h1>

        {/* Odisha map + stats row */}
        <div className="flex items-center justify-center gap-[4vw] w-full">

          {/* Odisha SVG Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
            style={{ width: '28vw', height: '33vw' }}
          >
            <svg
              viewBox="0 0 400 480"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="glow-purple">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-gold">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="mapFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#C8A340" stopOpacity="0.08" />
                </linearGradient>
              </defs>

              {/* State fill */}
              <motion.path
                d={ODISHA_PATH}
                fill="url(#mapFill)"
                stroke="#7c3aed"
                strokeWidth="2.5"
                strokeLinejoin="round"
                filter="url(#glow-purple)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={phase >= 1 ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />

              {/* Connection lines */}
              {phase >= 2 && CONNECTIONS.map(([a, b], i) => (
                <motion.line
                  key={i}
                  x1={CITIES[a].x} y1={CITIES[a].y}
                  x2={CITIES[b].x} y2={CITIES[b].y}
                  stroke="#C8A340"
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.08 }}
                />
              ))}

              {/* City dots */}
              {CITIES.map((city, i) => (
                <g key={city.name}>
                  {/* Pulse ring */}
                  {phase >= 2 && (
                    <motion.circle
                      cx={city.x} cy={city.y}
                      r={city.capital ? 14 : 10}
                      fill="none"
                      stroke={city.capital ? '#C8A340' : '#7c3aed'}
                      strokeWidth="1"
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeOut',
                      }}
                      style={{ transformOrigin: `${city.x}px ${city.y}px` }}
                    />
                  )}
                  {/* Dot */}
                  <motion.circle
                    cx={city.x} cy={city.y}
                    r={city.capital ? 5 : 3}
                    fill={city.capital ? '#C8A340' : '#8b5cf6'}
                    filter="url(#glow-gold)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.07, type: 'spring' }}
                    style={{ transformOrigin: `${city.x}px ${city.y}px` }}
                  />
                </g>
              ))}

              {/* Bhubaneswar label */}
              {phase >= 3 && (
                <motion.text
                  x="262" y="325"
                  fill="#C8A340"
                  fontSize="12"
                  fontFamily="'Bebas Neue', sans-serif"
                  letterSpacing="1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  ★ BHUBANESWAR
                </motion.text>
              )}
            </svg>
          </motion.div>

          {/* Stats column */}
          <div className="flex flex-col gap-[2vw]">
            {[
              { value: '500+', label: 'Students', delay: 0 },
              { value: '30+', label: 'Colleges', delay: 0.15 },
              { value: '24/7', label: 'Active Learning', delay: 0.3 },
            ].map(({ value, label, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 30 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                transition={{ duration: 0.7, delay, ease: 'easeOut' }}
                className="text-left"
              >
                <div className="text-[2.5vw] text-brand-gold font-sans font-bold leading-none">{value}</div>
                <div className="text-[1.2vw] text-white/60 font-sans uppercase tracking-widest mt-1">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
