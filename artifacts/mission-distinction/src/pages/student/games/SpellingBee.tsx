import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { CheckCircle2, XCircle, ChevronRight, Lightbulb, Zap } from "lucide-react";

import { ALL_SUBJECTS, DIFFICULTY_OPTIONS, type Difficulty } from "./gameConstants";
interface BeeWord { word: string; phonetic: string; definition: string; hint: string; }

export default function SpellingBee() {
  const [subject, setSubject] = useState("Anatomy");
  const [difficulty, setDifficulty] = useState<Difficulty>("neet-pg");
  const [loading, setLoading] = useState(false);
  const [words, setWords] = useState<BeeWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);
  const [showPhonetic, setShowPhonetic] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (words.length > 0) inputRef.current?.focus(); }, [words, idx]);

  const generate = async () => {
    setLoading(true);
    setWords([]);
    setIdx(0);
    setInput("");
    setStatus("idle");
    setShowHint(false);
    setShowPhonetic(false);
    try {
      const res = await apiFetch("/api/games/spelling-bee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setWords(data.words ?? []);
    } catch {
      toast.error("Failed to generate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const current = words[idx] ?? null;

  const submit = () => {
    if (!current || !input.trim()) return;
    const guess = input.trim().toUpperCase().replace(/[^A-Z]/g, "");
    const correct = guess === current.word.toUpperCase().replace(/[^A-Z]/g, "");
    setStatus(correct ? "correct" : "wrong");
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => {
    if (idx + 1 >= words.length) {
      toast.success(`Round complete! ${score.correct + (status === "correct" ? 1 : 0)}/${words.length} correct`);
      setWords([]);
      setIdx(0);
      setScore({ correct: 0, total: 0 });
    } else {
      setIdx(i => i + 1);
      setInput("");
      setStatus("idle");
      setShowHint(false);
      setShowPhonetic(false);
    }
  };

  const done = words.length > 0 && idx >= words.length;

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
          <Zap size={15} />
          {words.length ? "New Round" : "Start"}
        </Button>
        {words.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline">{idx + 1}/{words.length}</Badge>
            <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
              ✓ {score.correct}
            </Badge>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      )}

      {!loading && words.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Zap size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Spell tricky medical terms from their definitions</p>
          <p className="text-xs mt-1 opacity-60">6 words per round</p>
        </div>
      )}

      {current && !loading && (
        <div className="space-y-4">
          <div className="bg-card/30 border border-border/40 rounded-xl p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Definition</p>
                <p className="text-base font-medium leading-relaxed">{current.definition}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">{subject}</Badge>
            </div>
            {showPhonetic && (
              <p className="text-sm text-primary font-mono mt-2">🔊 {current.phonetic}</p>
            )}
            {showHint && (
              <p className="text-xs text-muted-foreground mt-1">
                💡 {current.hint} &nbsp;|&nbsp; {current.word.length} letters &nbsp;|&nbsp; starts with <strong className="text-primary">{current.word[0]}</strong>
              </p>
            )}
          </div>

          <div className="bg-card/20 border border-border/30 rounded-xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Spell the medical term</p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value.toUpperCase()); if (status !== "idle") setStatus("idle"); }}
                onKeyDown={e => e.key === "Enter" && status === "idle" && submit()}
                placeholder="Type the term..."
                disabled={status !== "idle"}
                className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
              />
              {status === "idle" && (
                <Button onClick={submit} disabled={!input.trim()}>Spell it</Button>
              )}
            </div>

            {status === "correct" && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 size={15} />
                <span className="font-semibold">Correct! ✨ <strong>{current.word}</strong></span>
              </div>
            )}
            {status === "wrong" && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <XCircle size={15} />
                <span>Incorrect. Correct spelling: <strong className="text-foreground">{current.word}</strong></span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {status === "idle" && !showPhonetic && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowPhonetic(true)}>
                🔊 Pronunciation
              </Button>
            )}
            {status === "idle" && !showHint && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowHint(true)}>
                <Lightbulb size={13} /> Hint
              </Button>
            )}
            {status !== "idle" && (
              <Button size="sm" className="gap-1.5" onClick={next}>
                <ChevronRight size={14} />
                {idx + 1 >= words.length ? "Finish Round" : "Next Word"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
