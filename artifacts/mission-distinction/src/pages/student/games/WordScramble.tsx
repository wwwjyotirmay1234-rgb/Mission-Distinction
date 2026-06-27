import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Shuffle, CheckCircle2, XCircle, Lightbulb, RotateCcw } from "lucide-react";

import { ALL_SUBJECTS, DIFFICULTY_OPTIONS, type Difficulty } from "./gameConstants";

interface Puzzle { word: string; scrambled: string; definition: string; hint: string; }

export default function WordScramble() {
  const [subject, setSubject] = useState("Anatomy");
  const [difficulty, setDifficulty] = useState<Difficulty>("neet-pg");
  const [loading, setLoading] = useState(false);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [attempts, setAttempts] = useState(0);

  const generate = async () => {
    setLoading(true);
    setPuzzle(null);
    setInput("");
    setStatus("idle");
    setShowHint(false);
    setAttempts(0);
    try {
      const res = await apiFetch("/api/games/word-scramble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPuzzle(data);
    } catch {
      toast.error("Failed to generate puzzle. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (!puzzle || !input.trim()) return;
    const guess = input.trim().toUpperCase().replace(/[^A-Z]/g, "");
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (guess === puzzle.word) {
      setStatus("correct");
      setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setStatus("wrong");
      if (newAttempts >= 3) {
        setScore(s => ({ ...s, total: s.total + 1 }));
      }
    }
  };

  const next = () => {
    if (status === "idle") return;
    generate();
  };

  const scrambledLetters = puzzle?.scrambled.split("") ?? [];

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
          <Shuffle size={15} />
          {puzzle ? "New Word" : "Generate"}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
            ✓ {score.correct}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {score.total} played
          </Badge>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      )}

      {!loading && !puzzle && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Shuffle size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Click Generate to get your first scrambled word</p>
        </div>
      )}

      {puzzle && (
        <div className="space-y-4">
          <div className="bg-card/30 border border-border/40 rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Definition</p>
            <p className="text-base font-medium leading-relaxed">{puzzle.definition}</p>
            {showHint && (
              <p className="text-xs text-primary mt-2">
                💡 Hint: {puzzle.hint} &nbsp;|&nbsp; Starts with <strong>{puzzle.word[0]}</strong>, {puzzle.word.length} letters
              </p>
            )}
          </div>

          <div className="bg-card/20 border border-border/30 rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Unscramble these letters</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {scrambledLetters.map((l, i) => (
                <span key={i} className="inline-flex items-center justify-center w-10 h-10 bg-primary/15 border border-primary/30 rounded-lg text-primary font-bold text-lg">
                  {l}
                </span>
              ))}
            </div>

            {status === "idle" || status === "wrong" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => { setInput(e.target.value.toUpperCase()); setStatus("idle"); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="Type your answer..."
                  maxLength={puzzle.word.length + 2}
                  className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button onClick={submit} disabled={!input.trim()}>Check</Button>
              </div>
            ) : null}

            {status === "wrong" && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1.5">
                <XCircle size={14} /> Incorrect. {attempts < 3 ? `${3 - attempts} attempt(s) left.` : `Answer: ${puzzle.word}`}
              </p>
            )}

            {status === "correct" && (
              <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                <CheckCircle2 size={16} />
                <span className="font-semibold">Correct! The word is <strong>{puzzle.word}</strong></span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!showHint && status === "idle" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowHint(true)}>
                <Lightbulb size={13} /> Show Hint
              </Button>
            )}
            {(status !== "idle" || attempts >= 3) && (
              <Button size="sm" className="gap-1.5" onClick={next}>
                <RotateCcw size={13} /> Next Word
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
