import React, { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Brain, RotateCcw, Trophy, Zap } from "lucide-react";
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

// Fallback emoji palette per subject if AI forgets to include one
const SUBJECT_EMOJI: Record<string, string[]> = {
  Anatomy:    ["🦴","🫀","🫁","🧠","🦷","👁","👂","🦵","💪","🫃","🫂","🦾"],
  Physiology: ["⚡","💧","🩸","🌡","💨","🔬","⚗","🧪","🫧","🔄","📊","🧬"],
  Biochemistry:["🧬","⚗","🔬","💊","🧪","🫧","⚡","🔩","🔗","🧲","💎","🌀"],
  Pharmacology:["💊","💉","🩺","🧪","⚗","🏥","🔬","🩹","🌿","🧬","⚡","🫧"],
  Pathology:  ["🔬","🩸","🧫","🦠","🫀","💔","⚠","🧬","🩻","🩹","🔍","🚨"],
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

  return (
    <button
      onClick={onClick}
      disabled={disabled || card.matched}
      aria-label={faceDown ? "Hidden card" : card.type === "picture" ? card.term : card.term}
      style={{
        position: "relative",
        height: 96,
        borderRadius: 14,
        border: card.matched
          ? "2px solid rgba(34,197,94,0.6)"
          : card.flipped
            ? card.type === "picture"
              ? "2px solid rgba(167,139,250,0.7)"
              : "2px solid rgba(99,102,241,0.7)"
            : "2px solid rgba(255,255,255,0.08)",
        background: card.matched
          ? "linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.1) 100%)"
          : card.flipped
            ? card.type === "picture"
              ? "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(109,40,217,0.15) 100%)"
              : "linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(55,48,163,0.15) 100%)"
            : "rgba(255,255,255,0.05)",
        cursor: disabled || card.matched ? "default" : "pointer",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        transform: card.matched ? "scale(0.97)" : card.flipped ? "scale(1.03)" : "scale(1)",
        boxShadow: card.flipped && !card.matched
          ? card.type === "picture"
            ? "0 4px 20px rgba(139,92,246,0.35)"
            : "0 4px 20px rgba(79,70,229,0.35)"
          : card.matched
            ? "0 2px 12px rgba(34,197,94,0.3)"
            : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "6px 4px",
        overflow: "hidden",
      }}
    >
      {faceDown ? (
        /* Face-down: question mark */
        <>
          <span style={{ fontSize: 32, opacity: 0.35 }}>?</span>
        </>
      ) : card.type === "picture" ? (
        /* Picture card: big emoji */
        <>
          <span style={{ fontSize: 42, lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}>
            {card.emoji}
          </span>
          {card.matched && (
            <span style={{ fontSize: 9, color: "rgba(34,197,94,0.8)", fontWeight: 700, letterSpacing: 0.5 }}>
              MATCHED ✓
            </span>
          )}
        </>
      ) : (
        /* Name card: term text */
        <>
          <span style={{
            fontSize: card.term.length > 12 ? 11 : card.term.length > 8 ? 13 : 14,
            fontWeight: 800,
            color: card.matched ? "rgb(134,239,172)" : "rgb(199,210,254)",
            textAlign: "center",
            lineHeight: 1.25,
            padding: "0 4px",
            wordBreak: "break-word",
          }}>
            {card.term}
          </span>
          {card.matched && (
            <span style={{ fontSize: 16 }}>✓</span>
          )}
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
      // Match!
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
            color: "white", border: "none", cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Brain size={14} />
          {cards.length ? "New Game" : "Start Game"}
        </button>

        {/* Stats */}
        {cards.length > 0 && (
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span style={{ color: "rgb(167,139,250)" }}>🟣</span> {matched}/{total}
            </span>
            <span>🕐 {fmt(elapsed)}</span>
            <span>⚡ {moves}</span>
          </div>
        )}
      </div>

      {/* How to play hint */}
      {cards.length > 0 && !won && (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
          Match each 🖼 picture card with its 📝 name card
        </p>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{
              height: 96, borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      )}

      {/* Win screen */}
      {won && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "32px 16px", textAlign: "center",
          background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(167,139,250,0.08) 100%)",
          border: "1px solid rgba(167,139,250,0.3)", borderRadius: 16,
        }}>
          <Trophy size={44} style={{ color: "rgb(250,204,21)", marginBottom: 12 }} />
          <h3 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 6px" }}>You Won! 🎉</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 16px" }}>
            {total} pairs matched · {moves} moves · {fmt(elapsed)}
          </p>
          <button onClick={generate} style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
            color: "white", border: "none", borderRadius: 10,
            padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <RotateCcw size={14} /> Play Again
          </button>
        </div>
      )}

      {/* Card grid */}
      {!loading && !won && cards.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
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

      {/* Legend strip (shown after cards loaded) */}
      {!loading && cards.length > 0 && !won && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(167,139,250,0.8)" }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(139,92,246,0.3)", border: "1px solid rgba(167,139,250,0.5)" }} />
            Picture cards
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(165,180,252,0.8)" }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(79,70,229,0.3)", border: "1px solid rgba(99,102,241,0.5)" }} />
            Name cards
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(134,239,172,0.8)" }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)" }} />
            Matched!
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && cards.length === 0 && !won && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
          <span style={{ fontSize: 48, marginBottom: 12 }}>🧬</span>
          <p style={{ fontSize: 14 }}>Match the picture cards with their medical names</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Select a subject and hit Start Game</p>
        </div>
      )}
    </div>
  );
}
