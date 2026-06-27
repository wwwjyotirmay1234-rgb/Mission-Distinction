import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Grid3x3, CheckCircle2, RotateCcw, Eye } from "lucide-react";

import { ALL_SUBJECTS, DIFFICULTY_OPTIONS, type Difficulty } from "./gameConstants";

interface WordPlacement {
  number: number; word: string; clue: string;
  direction: "across" | "down"; row: number; col: number;
}
interface CrosswordData { size: number; words: WordPlacement[]; }

function buildSolution(words: WordPlacement[], size: number): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  for (const w of words) {
    const letters = w.word.toUpperCase().replace(/[^A-Z]/g, "").split("");
    for (let i = 0; i < letters.length; i++) {
      const r = w.direction === "across" ? w.row : w.row + i;
      const c = w.direction === "across" ? w.col + i : w.col;
      if (r >= 0 && r < size && c >= 0 && c < size) grid[r][c] = letters[i];
    }
  }
  return grid;
}

function buildNumbers(words: WordPlacement[], size: number): (number | null)[][] {
  const grid: (number | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  for (const w of words) {
    if (w.row >= 0 && w.row < size && w.col >= 0 && w.col < size) {
      grid[w.row][w.col] = w.number;
    }
  }
  return grid;
}

export default function Crossword() {
  const [subject, setSubject] = useState("Anatomy");
  const [difficulty, setDifficulty] = useState<Difficulty>("neet-pg");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CrosswordData | null>(null);
  const [solution, setSolution] = useState<(string | null)[][]>([]);
  const [numbers, setNumbers] = useState<(number | null)[][]>([]);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number; dir: "across" | "down" } | null>(null);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const generate = async () => {
    setLoading(true);
    setData(null);
    setSelected(null);
    setChecked(false);
    setRevealed(false);
    try {
      const res = await apiFetch("/api/games/crossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty }),
      });
      if (!res.ok) throw new Error("Failed");
      const d: CrosswordData = await res.json();
      const size = d.size ?? 10;
      const sol = buildSolution(d.words, size);
      const nums = buildNumbers(d.words, size);
      const ug = Array.from({ length: size }, () => Array(size).fill(""));
      setData(d);
      setSolution(sol);
      setNumbers(nums);
      setUserGrid(ug);
    } catch {
      toast.error("Failed to generate crossword. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = useCallback((r: number, c: number) => {
    if (!solution[r]?.[c]) return;
    setChecked(false);
    if (selected?.r === r && selected?.c === c) {
      setSelected(s => s ? { ...s, dir: s.dir === "across" ? "down" : "across" } : null);
    } else {
      setSelected({ r, c, dir: selected?.dir ?? "across" });
    }
  }, [selected, solution]);

  const handleInput = useCallback((r: number, c: number, val: string) => {
    const letter = val.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setUserGrid(prev => {
      const ng = prev.map(row => [...row]);
      ng[r][c] = letter;
      return ng;
    });
    setChecked(false);
    if (!letter || !data) return;
    const dir = selected?.dir ?? "across";
    const nr = dir === "across" ? r : r + 1;
    const nc = dir === "across" ? c + 1 : c;
    if (nr < data.size && nc < data.size && solution[nr]?.[nc]) {
      setSelected({ r: nr, c: nc, dir });
    }
  }, [selected, data, solution]);

  const isHighlighted = (r: number, c: number): boolean => {
    if (!selected || !data) return false;
    const word = data.words.find(w => {
      if (selected.dir !== w.direction) return false;
      if (w.direction === "across") return w.row === selected.r && selected.c >= w.col && selected.c < w.col + w.word.length;
      return w.col === selected.c && selected.r >= w.row && selected.r < w.row + w.word.length;
    });
    if (!word) return false;
    if (word.direction === "across") return r === word.row && c >= word.col && c < word.col + word.word.length;
    return c === word.col && r >= word.row && r < word.row + word.word.length;
  };

  const checkAnswers = () => setChecked(true);
  const revealAll = () => {
    if (!data) return;
    const size = data.size;
    setUserGrid(Array.from({ length: size }, (_, r) => Array.from({ length: size }, (__, c) => solution[r]?.[c] ?? "")));
    setRevealed(true);
    setChecked(true);
  };

  const correct = (r: number, c: number) => solution[r]?.[c] && userGrid[r]?.[c] === solution[r]?.[c];
  const wrong = (r: number, c: number) => solution[r]?.[c] && userGrid[r]?.[c] && userGrid[r]?.[c] !== solution[r]?.[c];
  const totalCells = solution.flat().filter(Boolean).length;
  const filledCorrect = checked ? solution.flat().filter((l, i) => l && userGrid[Math.floor(i / (data?.size ?? 10))]?.[i % (data?.size ?? 10)] === l).length : 0;

  const acrossClues = data?.words.filter(w => w.direction === "across").sort((a, b) => a.number - b.number) ?? [];
  const downClues = data?.words.filter(w => w.direction === "down").sort((a, b) => a.number - b.number) ?? [];

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
          <Grid3x3 size={15} />
          {data ? "New Puzzle" : "Generate"}
        </Button>
        {data && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={checkAnswers} className="gap-1.5">
              <CheckCircle2 size={13} /> Check
            </Button>
            <Button variant="outline" size="sm" onClick={revealAll} className="gap-1.5">
              <Eye size={13} /> Reveal
            </Button>
            <Button variant="outline" size="sm" onClick={generate} className="gap-1.5">
              <RotateCcw size={13} />
            </Button>
          </div>
        )}
      </div>

      {checked && data && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${filledCorrect === totalCells ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
          {filledCorrect === totalCells ? "🎉 Perfect! All correct!" : `${filledCorrect}/${totalCells} cells correct`}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Grid3x3 size={40} className="mb-3 opacity-30" />
          <p className="text-sm">AI-generated medical crossword puzzle</p>
          <p className="text-xs mt-1 opacity-60">Click a cell then type; click again to switch direction</p>
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="overflow-x-auto">
            <div
              className="inline-grid gap-0.5 bg-background p-1 border border-border/40 rounded-xl"
              style={{ gridTemplateColumns: `repeat(${data.size}, 1fr)` }}
            >
              {Array.from({ length: data.size }, (_, r) =>
                Array.from({ length: data.size }, (__, c) => {
                  const isActive = solution[r]?.[c] != null;
                  const isSelected = selected?.r === r && selected?.c === c;
                  const isHl = isHighlighted(r, c);
                  const num = numbers[r]?.[c];
                  const userVal = userGrid[r]?.[c] ?? "";
                  const isCorrect = checked && correct(r, c);
                  const isWrong = checked && wrong(r, c);

                  if (!isActive) return (
                    <div key={`${r}-${c}`} className="w-7 h-7 bg-foreground/10 rounded-[2px]" />
                  );

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative w-7 h-7 border rounded-[2px] cursor-pointer flex items-center justify-center transition-colors
                        ${isSelected ? "bg-primary border-primary" :
                          isHl ? "bg-primary/20 border-primary/40" :
                          isCorrect ? "bg-green-500/20 border-green-500/40" :
                          isWrong ? "bg-red-500/20 border-red-500/40" :
                          "bg-card/80 border-border/40 hover:bg-card"}`}
                    >
                      {num && (
                        <span className="absolute top-0 left-0.5 text-[7px] leading-none text-muted-foreground font-bold">
                          {num}
                        </span>
                      )}
                      <input
                        type="text"
                        maxLength={1}
                        value={userVal}
                        onChange={e => handleInput(r, c, e.target.value)}
                        onClick={e => { e.stopPropagation(); handleCellClick(r, c); }}
                        className={`w-full h-full text-center text-[11px] font-bold uppercase bg-transparent focus:outline-none cursor-pointer
                          ${isSelected ? "text-primary-foreground" : isCorrect ? "text-green-300" : isWrong ? "text-red-400" : "text-foreground"}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 min-w-0">
            {acrossClues.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Across</p>
                <div className="space-y-1">
                  {acrossClues.map(w => (
                    <div key={`a-${w.number}`}
                      onClick={() => setSelected({ r: w.row, c: w.col, dir: "across" })}
                      className="text-xs cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-card/30">
                      <span className="font-bold text-primary mr-1">{w.number}.</span>
                      {w.clue}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {downClues.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Down</p>
                <div className="space-y-1">
                  {downClues.map(w => (
                    <div key={`d-${w.number}`}
                      onClick={() => setSelected({ r: w.row, c: w.col, dir: "down" })}
                      className="text-xs cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-card/30">
                      <span className="font-bold text-primary mr-1">{w.number}.</span>
                      {w.clue}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
