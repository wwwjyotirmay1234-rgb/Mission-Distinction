import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, Brain } from "lucide-react";
import type { QuizQuestion } from "@/data/anatomyData";

interface Props {
  questions: QuizQuestion[];
  title: string;
}

type AnswerState = "unanswered" | "correct" | "wrong";

export default function AnatomyQuizPanel({ questions, title }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<boolean[]>([]);

  const q = questions[current];
  if (!q) return null;

  const optionLabels = ["A", "B", "C", "D"];

  const handleSelect = useCallback((idx: number) => {
    if (answered !== "unanswered") return;
    setSelected(idx);
    const isCorrect = idx === q.correct;
    setAnswered(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore(s => s + 1);
    setHistory(h => [...h, isCorrect]);
  }, [answered, q]);

  const handleNext = useCallback(() => {
    if (current + 1 >= questions.length) {
      setCompleted(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered("unanswered");
    }
  }, [current, questions.length]);

  const handleReset = useCallback(() => {
    setCurrent(0);
    setSelected(null);
    setAnswered("unanswered");
    setScore(0);
    setCompleted(false);
    setHistory([]);
  }, []);

  if (completed) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Fair" : "Needs Review";
    const gradeColor = pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-blue-400" : pct >= 40 ? "text-amber-400" : "text-red-400";
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-8 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 border-2 border-violet-500/50 flex items-center justify-center">
          <Trophy size={28} className="text-violet-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{score} / {questions.length}</p>
          <p className={`text-lg font-semibold mt-1 ${gradeColor}`}>{grade}</p>
          <p className="text-sm text-slate-400 mt-1">{pct}% correct</p>
        </div>
        {/* Per-question result */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {history.map((correct, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border ${
                correct
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-red-500/20 border-red-500/50 text-red-400"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
        >
          <RotateCcw size={14} /> Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Brain size={13} className="text-violet-400" />
            <span className="text-xs font-semibold text-slate-300">{title}</span>
          </div>
          <span className="text-xs text-slate-400">
            Question {current + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-500"
            style={{ width: `${((current) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="rounded-xl bg-white/[0.04] border border-white/8 p-3.5">
        <p className="text-sm font-medium text-white leading-relaxed">{q.q}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {q.options.map((opt, idx) => {
          let state: "default" | "correct" | "wrong" = "default";
          if (answered !== "unanswered") {
            if (idx === q.correct) state = "correct";
            else if (idx === selected && idx !== q.correct) state = "wrong";
          }
          const styles: Record<"default" | "correct" | "wrong", string> = {
            default:  answered !== "unanswered" ? "border-white/8 bg-white/[0.03] text-slate-500 opacity-60" : "border-white/10 bg-white/[0.04] hover:border-violet-500/50 hover:bg-violet-500/10 text-slate-200 cursor-pointer",
            correct:  "border-emerald-500/60 bg-emerald-500/15 text-emerald-300",
            wrong:    "border-red-500/60 bg-red-500/15 text-red-300",
          };
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered !== "unanswered"}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${styles[state]}`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  state === "correct" ? "bg-emerald-500/30 border-emerald-400 text-emerald-200" :
                  state === "wrong"   ? "bg-red-500/30 border-red-400 text-red-200" :
                  answered !== "unanswered" ? "border-white/10 text-slate-600" :
                  "border-violet-500/40 text-violet-300 bg-violet-500/10"
                }`}
              >
                {state === "correct" ? <CheckCircle2 size={14} /> : state === "wrong" ? <XCircle size={14} /> : optionLabels[idx]}
              </span>
              <span className="text-sm leading-relaxed">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered !== "unanswered" && (
        <div className={`rounded-xl p-3 border text-xs leading-relaxed ${
          answered === "correct"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
            : "bg-red-500/10 border-red-500/30 text-red-200"
        }`}>
          <p className="font-semibold mb-1">
            {answered === "correct" ? "✓ Correct! " : "✗ Incorrect — "}
            Explanation
          </p>
          <p className="text-slate-300">{q.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {answered !== "unanswered" && (
        <button
          onClick={handleNext}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
        >
          {current + 1 >= questions.length ? "View Results" : "Next Question"}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
