import { motion } from 'framer-motion';

interface Props { phase: number }

export function HostelDeskScene({ phase }: Props) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ bottom: '10%', left: '3%', width: '52%', zIndex: 4 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 1 ? 1 : 0 }}
      transition={{ duration: 3, ease: 'easeOut' }}
    >
      <svg viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          {/* Lamp warm cone */}
          <radialGradient id="lampCone" cx="50%" cy="5%" r="95%" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,215,100,0.28)" />
            <stop offset="55%" stopColor="rgba(255,180,60,0.10)" />
            <stop offset="100%" stopColor="rgba(255,150,40,0)" />
          </radialGradient>
          {/* Laptop blue glow */}
          <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(80,140,255,0.45)" />
            <stop offset="100%" stopColor="rgba(80,140,255,0)" />
          </radialGradient>
          {/* Lamp halo */}
          <radialGradient id="lampHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,220,100,0.55)" />
            <stop offset="100%" stopColor="rgba(255,200,80,0)" />
          </radialGradient>
          {/* Face soft shadow */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
            <feOffset dx="0" dy="4" result="offset" />
            <feFlood floodColor="rgba(0,0,20,0.7)" result="color" />
            <feComposite in="color" in2="offset" operator="in" result="shadow" />
            <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── LAMP ───────────────────────────────────── */}
        {/* Light cone (big warm spread) */}
        <path d="M 348 128 L 260 310 L 460 310 Z"
          fill="url(#lampCone)" opacity="0.9" />
        {/* Lamp base on desk */}
        <rect x="372" y="296" width="28" height="8" rx="4" fill="rgba(180,165,120,0.55)" />
        {/* Stand */}
        <line x1="386" y1="296" x2="386" y2="210" stroke="rgba(180,165,120,0.5)" strokeWidth="4" strokeLinecap="round" />
        {/* Arm */}
        <line x1="386" y1="210" x2="348" y2="135" stroke="rgba(180,165,120,0.5)" strokeWidth="3.5" strokeLinecap="round" />
        {/* Shade */}
        <path d="M 324 135 L 372 135 L 362 110 L 334 110 Z"
          fill="rgba(200,175,100,0.7)" stroke="rgba(220,195,120,0.4)" strokeWidth="1" />
        {/* Bulb */}
        <circle cx="348" cy="126" r="6" fill="rgba(255,235,160,1)" filter="url(#glow)" />
        <circle cx="348" cy="126" r="14" fill="rgba(255,225,120,0.18)" />

        {/* ── STACKED BOOKS (left pile) ───────────────── */}
        <rect x="22" y="255" width="88" height="16" rx="2" fill="rgba(120,40,200,0.85)"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" transform="rotate(-1.8 66 263)" />
        <rect x="20" y="238" width="84" height="15" rx="2" fill="rgba(210,35,35,0.85)"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" transform="rotate(2.2 62 245)" />
        <rect x="24" y="222" width="80" height="14" rx="2" fill="rgba(28,75,210,0.85)"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" transform="rotate(-1.5 64 229)" />
        <rect x="26" y="207" width="76" height="13" rx="2" fill="rgba(5,75,58,0.85)"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" transform="rotate(1.8 64 213)" />
        {/* Spine labels (thin lines) */}
        <line x1="48" y1="256" x2="48" y2="271" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
        <line x1="46" y1="239" x2="46" y2="252" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />

        {/* ── OPEN NOTEBOOK ON DESK ──────────────────── */}
        <path d="M 235 272 L 340 267 L 344 293 L 240 298 Z"
          fill="rgba(240,238,215,0.12)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.7" />
        {/* Spine */}
        <line x1="291" y1="267" x2="295" y2="295" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
        {/* Highlighted lines */}
        <line x1="244" y1="276" x2="288" y2="274" stroke="rgba(255,220,70,0.42)" strokeWidth="4" strokeLinecap="round" />
        <line x1="244" y1="283" x2="282" y2="282" stroke="rgba(255,220,70,0.25)" strokeWidth="3" strokeLinecap="round" />
        <line x1="300" y1="274" x2="338" y2="272" stroke="rgba(255,220,70,0.35)" strokeWidth="4" strokeLinecap="round" />
        <line x1="300" y1="281" x2="335" y2="280" stroke="rgba(100,175,255,0.28)" strokeWidth="3" strokeLinecap="round" />
        <line x1="244" y1="290" x2="276" y2="289" stroke="rgba(100,175,255,0.2)" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── DRIED HIGHLIGHTER PEN ──────────────────── */}
        <rect x="152" y="278" width="58" height="9" rx="4.5" fill="rgba(255,210,0,0.45)"
          transform="rotate(-14 180 282)" />
        <rect x="152" y="278" width="12" height="9" rx="4.5" fill="rgba(255,210,0,0.65)"
          transform="rotate(-14 180 282)" />

        {/* ── LAPTOP ─────────────────────────────────── */}
        {/* Screen frame */}
        <path d="M 158 185 L 278 185 L 278 268 L 158 268 Z"
          fill="rgba(8,10,28,0.95)" stroke="rgba(70,115,200,0.45)" strokeWidth="1.8" rx="4" />
        {/* Screen display */}
        <rect x="163" y="190" width="110" height="73" fill="rgba(6,10,30,0.85)" />
        <rect x="165" y="192" width="106" height="69" fill="url(#screenGlow)" opacity="0.7" />
        {/* Code lines */}
        {[
          { y: 199, w: 42, c: 'rgba(100,195,255,0.42)' },
          { y: 205, w: 60, c: 'rgba(200,100,255,0.32)' },
          { y: 211, w: 38, c: 'rgba(100,195,255,0.28)' },
          { y: 217, w: 74, c: 'rgba(100,195,255,0.38)' },
          { y: 223, w: 50, c: 'rgba(255,100,100,0.42)' },
          { y: 229, w: 55, c: 'rgba(100,195,255,0.25)' },
          { y: 235, w: 32, c: 'rgba(210,210,100,0.3)' },
          { y: 241, w: 68, c: 'rgba(100,195,255,0.35)' },
          { y: 247, w: 44, c: 'rgba(200,100,255,0.25)' },
        ].map((l, i) => (
          <line key={i} x1="169" y1={l.y} x2={169 + l.w} y2={l.y}
            stroke={l.c} strokeWidth="1.6" strokeLinecap="round" />
        ))}
        {/* Laptop hinge + base */}
        <line x1="155" y1="268" x2="281" y2="268" stroke="rgba(70,115,200,0.3)" strokeWidth="1" />
        <path d="M 145 268 L 291 268 L 296 278 L 140 278 Z"
          fill="rgba(22,25,48,0.92)" stroke="rgba(70,115,200,0.28)" strokeWidth="1" />
        {/* Trackpad */}
        <rect x="200" y="269" width="36" height="7" rx="2.5"
          fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.09)" strokeWidth="0.7" />

        {/* ── DESK SURFACE ───────────────────────────── */}
        <rect x="0" y="304" width="500" height="20" rx="3"
          fill="rgba(14,16,36,0.97)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        {/* Desk highlight edge */}
        <line x1="0" y1="304" x2="500" y2="304" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* ── CHAIR BACK ─────────────────────────────── */}
        <rect x="178" y="316" width="144" height="100" rx="10"
          fill="rgba(10,12,26,0.82)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="195" y1="316" x2="195" y2="416" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="305" y1="316" x2="305" y2="416" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

        {/* ── CHARACTER BODY ──────────────────────────── */}
        {/* Torso/shirt */}
        <path d="M 188 290 Q 215 282 250 282 Q 275 282 292 290 L 292 310 Q 286 322 250 324 L 248 380 L 202 380 L 200 324 Q 165 322 158 310 Z"
          fill="rgba(12,15,32,0.95)" />
        {/* Collar */}
        <path d="M 215 282 L 250 286 L 285 282"
          stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" fill="none" />

        {/* ── ARMS ON DESK ───────────────────────────── */}
        {/* Left arm */}
        <path d="M 182 292 Q 150 298 118 305 Q 90 307 68 304"
          stroke="rgba(12,15,32,0.95)" strokeWidth="26" fill="none" strokeLinecap="round" />
        {/* Right arm */}
        <path d="M 298 292 Q 325 298 355 303 Q 385 304 410 301"
          stroke="rgba(12,15,32,0.95)" strokeWidth="26" fill="none" strokeLinecap="round" />

        {/* ── NECK ───────────────────────────────────── */}
        <rect x="224" y="268" width="32" height="20" rx="7" fill="rgba(12,15,32,0.95)" />

        {/* ── HEAD ───────────────────────────────────── */}
        {/* Head base (face) */}
        <ellipse cx="240" cy="238" rx="50" ry="52" fill="rgba(13,16,34,0.97)" filter="url(#softShadow)" />
        {/* Subtle face tone */}
        <ellipse cx="240" cy="245" rx="42" ry="44" fill="rgba(18,21,44,0.88)" />

        {/* ── HAIR ────────────────────────────────────── */}
        {/* Main hair mass (covers top/sides of head) */}
        <path d="
          M 192 230
          Q 190 192 210 178
          Q 225 170 240 168
          Q 258 170 272 180
          Q 290 196 290 230
          Q 278 205 260 198
          Q 244 193 228 195
          Q 208 198 192 230 Z"
          fill="rgba(8,9,18,0.98)" />
        {/* Side hair left */}
        <path d="M 192 230 Q 188 248 192 265 Q 194 258 196 252 Q 192 244 192 230 Z"
          fill="rgba(8,9,18,0.97)" />
        {/* Side hair right */}
        <path d="M 290 230 Q 292 248 288 265 Q 286 258 284 252 Q 288 244 290 230 Z"
          fill="rgba(8,9,18,0.97)" />
        {/* Anime hair tufts on top */}
        <path d="M 228 168 Q 226 152 234 148 Q 238 162 232 170 Z" fill="rgba(8,9,18,0.98)" />
        <path d="M 238 165 Q 240 150 250 148 Q 252 163 244 170 Z" fill="rgba(8,9,18,0.98)" />
        <path d="M 250 168 Q 254 153 262 155 Q 262 170 254 174 Z" fill="rgba(8,9,18,0.97)" />
        {/* Forehead fringe */}
        <path d="M 205 218 Q 210 206 220 210 Q 218 222 210 226 Z" fill="rgba(8,9,18,0.97)" />
        <path d="M 218 213 Q 224 205 230 210 Q 228 220 220 222 Z" fill="rgba(8,9,18,0.96)" />

        {/* ── FACE FEATURES — NO SPECTACLES ───────────── */}
        {/* Left eye — just the eye, nothing around it */}
        <ellipse cx="222" cy="248" rx="7.5" ry="7" fill="rgba(6,8,22,0.95)" />
        <ellipse cx="221" cy="248" rx="4.5" ry="5" fill="rgba(255,255,255,0.14)" />
        {/* Pupil reflect */}
        <circle cx="223" cy="246" r="1.8" fill="rgba(255,255,255,0.45)" />

        {/* Right eye — just the eye, nothing around it */}
        <ellipse cx="258" cy="248" rx="7.5" ry="7" fill="rgba(6,8,22,0.95)" />
        <ellipse cx="257" cy="248" rx="4.5" ry="5" fill="rgba(255,255,255,0.14)" />
        <circle cx="259" cy="246" r="1.8" fill="rgba(255,255,255,0.45)" />

        {/* Tired/worried eyebrows — slight inner raise (stressed look) */}
        <path d="M 213 238 Q 218 234 225 237"
          stroke="rgba(200,205,230,0.55)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M 255 237 Q 261 234 268 238"
          stroke="rgba(200,205,230,0.55)" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Nose (very subtle) */}
        <path d="M 236 258 Q 240 263 244 258"
          stroke="rgba(200,205,230,0.2)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Mouth — slight flat/downturn (stressed) */}
        <path d="M 232 270 Q 240 274 248 270"
          stroke="rgba(200,205,230,0.28)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Laptop blue light tint on face */}
        <ellipse cx="240" cy="248" rx="50" ry="52" fill="rgba(70,120,220,0.07)" />
        {/* Lamp warm glow on face */}
        <ellipse cx="270" cy="220" rx="55" ry="50" fill="rgba(255,195,80,0.05)" />

        {/* Coffee cup (right side of desk) */}
        <path d="M 418 276 L 408 304 L 434 304 L 424 276 Z"
          fill="rgba(35,28,20,0.85)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        <ellipse cx="421" cy="276" rx="8" ry="4" fill="rgba(45,35,25,0.9)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        {/* Steam */}
        <path d="M 415 268 Q 412 260 415 254 Q 418 248 415 242"
          stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 421 265 Q 424 257 421 251"
          stroke="rgba(255,255,255,0.09)" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
