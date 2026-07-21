import React, { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Brain, RotateCcw, Trophy } from "lucide-react";
import { ALL_SUBJECTS, DIFFICULTY_OPTIONS, type Difficulty } from "./gameConstants";

interface Pair { term: string; definition: string; emoji: string; }

interface Card {
  id: string;
  pairId: number;
  type: "picture" | "name";
  emoji: string;
  term: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(pairs: Pair[]): Card[] {
  const cards: Card[] = [];
  pairs.forEach((p, i) => {
    const emoji = p.emoji || "🧬";
    cards.push({ id: `pic-${i}`, pairId: i, type: "picture", emoji, term: p.term, flipped: false, matched: false });
    cards.push({ id: `name-${i}`, pairId: i, type: "name", emoji, term: p.term, flipped: false, matched: false });
  });
  return shuffle(cards);
}

const SUBJECT_EMOJI: Record<string, string[]> = {
  Anatomy:     ["🦴","🫀","🫁","🧠","🦷","👁","👂","🦵","💪","🫃","🫂","🦾"],
  Physiology:  ["⚡","💧","🩸","🌡","💨","🔬","⚗","🧪","🫧","🔄","📊","🧬"],
  Biochemistry:["🧬","⚗","🔬","💊","🧪","🫧","⚡","🔩","🔗","🧲","💎","🌀"],
  Pharmacology:["💊","💉","🩺","🧪","⚗","🏥","🔬","🩹","🌿","🧬","⚡","🫧"],
  Pathology:   ["🔬","🩸","🧫","🦠","🫀","💔","⚠","🧬","🩻","🩹","🔍","🚨"],
  Microbiology:["🦠","🧫","🔬","🧬","⚗","🧪","🫧","🌡","💉","🩺","🌀","⚡"],
};

function getEmoji(pair: Pair, subject: string, idx: number): string {
  if (pair.emoji && pair.emoji.trim()) return pair.emoji.trim().split(/\s/)[0];
  const pool = SUBJECT_EMOJI[subject] || SUBJECT_EMOJI.Anatomy;
  return pool[idx % pool.length];
}

function CardTile({ card, onClick, disabled }: {
  card: Card; onClick: () => void; disabled: boolean;
}) {
  const faceDown = !card.flipped && !card.matched;

  let borderColor: string;
  let background: string;
  let boxShadow: string = "none";

  if (card.matched) {
    borderColor = "rgba(34,197,94,0.6)";
    background = "linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.1) 100%)";
    boxShadow = "0 2px 12px rgba(34,197,94,0.25)";
  } else if (card.flipped) {
    if (card.type === "picture") {
      borderColor = "rgba(167,139,250,0.7)";
      background = "linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(109,40,217,0.12) 100%)";
      boxShadow = "0 4px 20px rgba(139,92,246,0.3)";
    } else {
      borderColor = "rgba(99,102,241,0.7)";
      background = "linear-gradient(135deg, rgba(79,70,229,0.22) 0%, rgba(55,48,163,0.12) 100%)";
      boxShadow = "0 4px 20px rgba(79,70,229,0.3)";
    }
  } else {
    borderColor = "rgba(148,163,184,0.3)";
    background = "transparent";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || card.matched}
      aria-label={faceDown ? "Hidden card" : card.term}
      className={`border-2 rounded-[14px] flex flex-col items-center justify-center gap-1 transition-all duration-200 overflow-hidden select-none
        ${faceDown ? "bg-muted/50 hover:bg-muted/80" : ""}
        ${card.matched ? "opacity-80 scale-[0.97]" : card.flipped ? "scale-[1.03]" : "scale-100"}
        ${disabled && !card.flipped && !card.matched ? "cursor-default" : card.matched ? "cursor-default" : "cursor-pointer"}
      `}
      style={{
        height: 96,
        padding: "6px 4px",
        borderColor,
        background: faceDown ? undefined : background,
        boxShadow,
      }}
    >
      {faceDown ? (
        <span className="text-3xl font-bold text-foreground/30 leading-none">?</span>
      ) : card.type === "picture" ? (
        <>
          <span style={{ fontSize: 42, lineHeight: 1, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
            {card.emoji}
          </span>
          {card.matched && (
            <span className="text-[9px] font-bold text-green-600 dark:text-green-400 tracking-wide">MATCHED ✓</span>
          )}
        </>
      ) : (
        <>
          <span className={`text-center font-extrabold leading-snug px-1 break-words
            ${card.matched ? "text-green-600 dark:text-green-300" : "text-violet-700 dark:text-indigo-200"}
          `}
            style={{ fontSize: card.term.length > 12 ? 11 : card.term.length > 8 ? 13 : 14, wordBreak: "break-word" }}
          >
            {card.term}
          </span>
          {card.matched && <span className="text-base leading-none">✓</span>}
        </>
      )}
    </button>
  );
}

function fmt(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

export default function MemoryMatch() {
  const [subject, setSubject] = useState("Anatomy");
  const [difficulty, setDifficulty] = useState<Difficulty>("neet-pg");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!startTime || won) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(t);
  }, [startTime, won]);

  const generate = async () => {
    setLoading(true);
    setCards([]); setPairs([]); setSelected([]);
    setMoves(0); setWon(false); setStartTime(null); setElapsed(0);
    try {
      const res = await apiFetch("/api/games/memory-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const rawPairs: Pair[] = (data.pairs ?? []).slice(0, 8).map((p: Pair, i: number) => ({
        ...p,
        emoji: getEmoji(p, subject, i),
      }));
      setPairs(rawPairs);
      setCards(buildCards(rawPairs));
      setStartTime(Date.now());
    } catch {
      toast.error("Failed to generate cards. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const flip = useCallback((id: string) => {
    if (locked) return;
    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (!card || card.flipped || card.matched) return prev;
      return prev.map(c => c.id === id ? { ...c, flipped: true } : c);
    });
    setSelected(prev => {
      if (prev.length === 1 && prev[0] === id) return prev;
      return [...prev, id];
    });
  }, [locked]);

  useEffect(() => {
    if (selected.length !== 2) return;
    setMoves(m => m + 1);
    setLocked(true);
    const [a, b] = selected;
    const cardA = cards.find(c => c.id === a);
    const cardB = cards.find(c => c.id === b);

    if (cardA && cardB && cardA.pairId === cardB.pairId && cardA.type !== cardB.type) {
      setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, matched: true } : c));
      setSelected([]);
      setLocked(false);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, flipped: false } : c));
        setSelected([]);
        setLocked(false);
      }, 950);
    }
  }, [selected]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) setWon(true);
  }, [cards]);

  const matched = cards.filter(c => c.matched && c.type === "picture").length;
  const total = cards.length / 2;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-40 bg-card/40 border-border/40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={v => setDifficulty(v as Difficulty)}>
          <SelectTrigger className="w-28 bg-card/40 border-border/40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map(d => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-70"
          style={{ background: "linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)", cursor: loading ? "wait" : "pointer" }}
        >
          <Brain size={14} />
          {cards.length ? "New Game" : "Start Game"}
        </button>

        {cards.length > 0 && (
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="text-violet-500">🟣</span> {matched}/{total}
            </span>
            <span>🕐 {fmt(elapsed)}</span>
            <span>⚡ {moves}</span>
          </div>
        )}
      </div>

      {/* Hint */}
      {cards.length > 0 && !won && (
        <p className="text-[11px] text-muted-foreground text-center">
          Match each 🖼 picture card with its 📝 name card
        </p>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-24 rounded-[14px] bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Win screen */}
      {won && (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl border border-violet-500/30 bg-violet-500/5">
          <Trophy size={44} className="text-yellow-500 mb-3" />
          <h3 className="text-xl font-black text-foreground mb-1">You Won! 🎉</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {total} pairs matched · {moves} moves · {fmt(elapsed)}
          </p>
          <button
            onClick={generate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)" }}
          >
            <RotateCcw size={14} /> Play Again
          </button>
        </div>
      )}

      {/* Card grid */}
      {!loading && !won && cards.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {cards.map(card => (
            <CardTile
              key={card.id}
              card={card}
              onClick={() => flip(card.id)}
              disabled={locked || (selected.length === 2 && !card.flipped && !card.matched)}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      {!loading && cards.length > 0 && !won && (
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-300">
            <div className="w-4 h-4 rounded bg-violet-500/25 border border-violet-400/50" />
            Picture cards
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-300">
            <div className="w-4 h-4 rounded bg-indigo-500/25 border border-indigo-400/50" />
            Name cards
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-400/50" />
            Matched!
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && cards.length === 0 && !won && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <span className="text-5xl mb-3">🧬</span>
          <p className="text-sm">Match the picture cards with their medical names</p>
          <p className="text-xs mt-1 opacity-60">Select a subject and hit Start Game</p>
        </div>
      )}
    </div>
  );
}
