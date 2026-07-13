import { useEffect } from 'react';

interface SpeechLine {
  text: string;
  atPhase: number;
  rate?: number;
}

// Speaks a line of text when `currentPhase` matches `atPhase`.
// Cancels the previous utterance automatically.
// Cancels everything on unmount (scene exit).
export function useSceneSpeech(lines: SpeechLine[], currentPhase: number) {
  useEffect(() => {
    const match = lines.find(l => l.atPhase === currentPhase);
    if (!match) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(match.text);
    u.rate = match.rate ?? 0.82;
    u.pitch = 0.92;
    u.volume = 1;

    // Pick a good voice when available
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) u.voice = preferred;
      window.speechSynthesis.speak(u);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
      return () => window.speechSynthesis.cancel();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', trySpeak);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', trySpeak);
        window.speechSynthesis.cancel();
      };
    }
  }, [currentPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel on scene exit
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);
}
