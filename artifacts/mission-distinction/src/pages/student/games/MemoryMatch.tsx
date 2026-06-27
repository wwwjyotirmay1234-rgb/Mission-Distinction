import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Brain, RotateCcw, Trophy } from "lucide-react";

import { ALL_SUBJECTS, DIFFICULTY_OPTIONS, type Difficulty } from "./gameConstants";

interface Pair { term: string; definition: string; }
interface Card { id: string; text: string; pairId: number; type: "term" | "def"; flipped: boolean; matched: boolean; }

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
    cards.push({ id: `term-${i}`, text: p.term, pairId: i, type: "term", flipped: false, matched: false });
    cards.push({ id: `def-${i}`, text: p.definition, pairId: i, type: "def", flipped: false, matched: false });
  });
  return shuffle(cards);
}

export default function MemoryMatch() {
  const [subject, setSubject] = useState("Anatomy");
  const [difficulty, setDifficulty] = useState<Difficulty>("neet-pg");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
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
    setCards([]);
    setSelected([]);
    setMoves(0);
    setWon(false);
    setStartTime(null);
    setElapsed(0);
    try {
      const res = await apiFetch("/api/games/memory-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCards(buildCards(data.pairs));
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
      }, 900);
    }
  }, [selected]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setWon(true);
    }
  }, [cards]);

  const matched = cards.filter(c => c.matched).length / 2;
  const total = cards.length / 2;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-44 bg-card/40 border-border/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={v => setDifficulty(v as Difficulty)}>
          <SelectTrigger className="w-32 bg-card/40 border-border/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map(d => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={generate} disabled={loading} className="gap-2">
          <Brain size={15} />
          {cards.length ? "New Game" : "Start Game"}
        </Button>
        {cards.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{matched}/{total} matched</Badge>
            <Badge variant="outline">🕐 {fmt(elapsed)}</Badge>
            <Badge variant="outline">Moves: {moves}</Badge>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )}

      {won && (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-card/30 border border-border/40 rounded-xl">
          <Trophy size={40} className="text-yellow-400 mb-3" />
          <h3 className="text-xl font-bold text-foreground mb-1">You Won! 🎉</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {total} pairs matched in {moves} moves &amp; {fmt(elapsed)}
          </p>
          <Button onClick={generate} className="gap-2"><RotateCcw size={14} /> Play Again</Button>
        </div>
      )}

      {!loading && !won && cards.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              disabled={card.matched || (selected.length === 2 && !card.flipped)}
              className={`relative h-16 rounded-xl text-xs font-medium transition-all duration-300 border
                ${card.matched
                  ? "bg-green-500/20 border-green-500/40 text-green-300"
                  : card.flipped
                    ? card.type === "term"
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-violet-500/15 border-violet-500/30 text-violet-300"
                    : "bg-card/40 border-border/40 text-muted-foreground hover:bg-card/60 hover:border-border/60 cursor-pointer"
                }`}
            >
              <span className="absolute top-1 left-1 text-[9px] opacity-50">
                {card.type === "term" ? "T" : "D"}
              </span>
              <span className="px-1 leading-tight line-clamp-3">
                {card.flipped || card.matched ? card.text : "?"}
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && cards.length === 0 && !won && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Brain size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Match medical terms with their definitions</p>
        </div>
      )}
    </div>
  );
}
