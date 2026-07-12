import { motion } from 'framer-motion';
import { CSSProperties, useEffect, useRef } from 'react';

interface WordRevealProps {
  text: string;
  startDelay?: number;        // seconds before first word
  wordInterval?: number;      // seconds between each word (default 0.09)
  style?: CSSProperties;
  className?: string;
  speak?: boolean;            // trigger TTS when words start
  speechDelay?: number;       // seconds before speech starts (matches startDelay)
  speechRate?: number;        // TTS rate (default 0.82)
  active?: boolean;           // only animate/speak when true (default true)
}

// Per-word anime-style stamp animation
function Word({ word, delay }: { word: string; delay: number }) {
  return (
    <motion.span
      className="inline-block"
      style={{ marginRight: '0.28em' }}
      initial={{ opacity: 0, y: 10, scale: 0.78 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        duration: 0.18,
        ease: [0.22, 1, 0.36, 1],
        scale: { type: 'spring', stiffness: 480, damping: 22, delay },
      }}
    >
      {word}
    </motion.span>
  );
}

export function WordReveal({
  text,
  startDelay = 0,
  wordInterval = 0.09,
  style,
  className,
  speak = false,
  speechDelay,
  speechRate = 0.82,
  active = true,
}: WordRevealProps) {
  const words = text.split(' ').filter(Boolean);
  const spokenRef = useRef(false);

  useEffect(() => {
    if (!active || !speak) return;
    if (spokenRef.current) return;
    spokenRef.current = true;

    const delay = (speechDelay ?? startDelay) * 1000;
    const timer = setTimeout(() => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = 0.92;
      utterance.volume = 1;
      // Prefer a clear English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    }, delay);

    return () => clearTimeout(timer);
  }, [active, speak, text, startDelay, speechDelay, speechRate]);

  if (!active) return null;

  return (
    <span className={className} style={style}>
      {words.map((word, i) => (
        <Word key={`${word}-${i}`} word={word} delay={startDelay + i * wordInterval} />
      ))}
    </span>
  );
}
