import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Stethoscope, CheckCircle2, XCircle, ChevronRight, RotateCcw } from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

interface Challenge {
  scenario: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export default function DiagnosisChallenge() {
  const [subject, setSubject] = useState("Physiology");
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const generate = async () => {
    setLoading(true);
    setChallenge(null);
    setSelected(null);
    setRevealed(false);
    try {
      const res = await apiFetch("/api/games/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setChallenge(data);
    } catch {
      toast.error("Failed to generate challenge. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = () => {
    if (!selected || !challenge) return;
    setRevealed(true);
    const correct = selected.charAt(0).toUpperCase() === challenge.answer.charAt(0).toUpperCase();
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => generate();

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-44 bg-card/40 border-border/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={generate} disabled={loading} className="gap-2">
          <Stethoscope size={15} />
          {challenge ? "New Challenge" : "Generate"}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
            ✓ {score.correct}/{score.total}
          </Badge>
          {accuracy !== null && (
            <Badge variant="outline" className={accuracy >= 70 ? "text-green-400" : "text-amber-400"}>
              {accuracy}% accuracy
            </Badge>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      )}

      {!loading && !challenge && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Stethoscope size={40} className="mb-3 opacity-30" />
          <p className="text-sm">AI-generated clinical &amp; conceptual scenarios</p>
          <p className="text-xs mt-1 opacity-60">Based on 1st Year MBBS curriculum</p>
        </div>
      )}

      {challenge && !loading && (
        <div className="space-y-4">
          <div className="bg-card/30 border border-border/40 rounded-xl p-5 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Scenario</p>
            <p className="text-sm leading-relaxed">{challenge.scenario}</p>
          </div>

          <div className="bg-card/20 border border-border/30 rounded-xl p-4">
            <p className="text-sm font-semibold mb-3 text-foreground">{challenge.question}</p>
            <div className="space-y-2">
              {challenge.options.map(opt => {
                const letter = opt.charAt(0).toUpperCase();
                const isCorrect = letter === challenge.answer.charAt(0).toUpperCase();
                const isSelected = selected === letter;
                let cls = "border-border/40 bg-card/20 hover:bg-card/50 text-foreground/80 cursor-pointer";
                if (revealed) {
                  if (isCorrect) cls = "border-green-500/50 bg-green-500/10 text-green-300";
                  else if (isSelected && !isCorrect) cls = "border-red-500/40 bg-red-500/10 text-red-400";
                  else cls = "border-border/20 bg-card/10 text-muted-foreground opacity-50";
                } else if (isSelected) {
                  cls = "border-primary/50 bg-primary/10 text-primary";
                }
                return (
                  <button
                    key={opt}
                    disabled={revealed}
                    onClick={() => setSelected(letter)}
                    className={`w-full text-left text-sm px-4 py-3 rounded-lg border transition-colors ${cls}`}
                  >
                    <div className="flex items-center gap-2">
                      {revealed && isCorrect && <CheckCircle2 size={14} className="text-green-400 shrink-0" />}
                      {revealed && isSelected && !isCorrect && <XCircle size={14} className="text-red-400 shrink-0" />}
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {revealed && (
            <div className={`rounded-xl p-4 border text-sm leading-relaxed ${
              selected?.charAt(0).toUpperCase() === challenge.answer.charAt(0).toUpperCase()
                ? "bg-green-500/10 border-green-500/30 text-green-200"
                : "bg-amber-500/10 border-amber-500/30 text-amber-200"
            }`}>
              <p className="font-semibold mb-1">
                {selected?.charAt(0).toUpperCase() === challenge.answer.charAt(0).toUpperCase()
                  ? "✓ Correct!" : "✗ Incorrect"} — Answer: {challenge.answer}
              </p>
              <p className="opacity-90">{challenge.explanation}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!revealed ? (
              <Button onClick={checkAnswer} disabled={!selected} className="gap-1.5">
                Check Answer
              </Button>
            ) : (
              <Button onClick={next} className="gap-1.5">
                <ChevronRight size={14} /> Next Challenge
              </Button>
            )}
            {!revealed && (
              <Button variant="outline" onClick={generate} className="gap-1.5">
                <RotateCcw size={13} /> Skip
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
