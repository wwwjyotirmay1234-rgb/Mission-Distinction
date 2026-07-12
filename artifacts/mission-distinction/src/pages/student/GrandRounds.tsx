import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, Trophy, Star, ChevronRight, ChevronLeft,
  CheckCircle, Target, Award, Users, Zap, BookOpen
} from "lucide-react";

interface GrandRoundCase {
  id: number;
  scenario: string;
  subject: string;
  explanation: string;
  grandRoundWeek: string | null;
  featuredAttemptId: number | null;
  winnerAnnouncedAt: string | null;
  attempted: boolean;
  myAttempt: {
    id: number;
    answerText: string;
    aiFeedback: AiFeedback;
  } | null;
  featuredAnswer: {
    userName: string;
    answerText: string;
    aiFeedback: AiFeedback;
  } | null;
}

interface AiFeedback {
  score: number;
  diagnosis: string;
  pathway: string;
  clinicalCorrelates: string;
  investigations?: string;
  missedPoints: string[];
  strengths: string[];
  verdict: string;
  grade: string;
}

interface LeaderboardEntry {
  id: number;
  userName: string;
  score: number;
  verdict: string;
  createdAt: string;
}

interface CaseDetail extends GrandRoundCase {
  leaderboard: LeaderboardEntry[];
}

const GRADE_COLORS: Record<string, string> = {
  Distinction: "text-yellow-400 bg-yellow-900/20 border-yellow-700/30",
  Merit: "text-green-400 bg-green-900/20 border-green-700/30",
  Pass: "text-blue-400 bg-blue-900/20 border-blue-700/30",
  "Needs Revision": "text-red-400 bg-red-900/20 border-red-700/30",
};

export default function GrandRounds() {
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [view, setView] = useState<"list" | "case" | "result">("list");
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["grand-rounds"],
    queryFn: () => apiFetchJson<{ cases: GrandRoundCase[] }>("/api/grand-rounds"),
  });

  const caseQuery = useQuery({
    queryKey: ["grand-round", selectedCaseId],
    queryFn: () => apiFetchJson<CaseDetail>(`/api/grand-rounds/${selectedCaseId}`),
    enabled: !!selectedCaseId && view === "case",
  });

  const attemptMutation = useMutation({
    mutationFn: (body: { answerText: string }) =>
      apiFetchJson<{ feedback: AiFeedback; id: number }>(
        `/api/grand-rounds/${selectedCaseId}/attempt`,
        { method: "POST", body: JSON.stringify(body) }
      ),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["grand-rounds"] });
      qc.invalidateQueries({ queryKey: ["grand-round", selectedCaseId] });
      setView("result");
    },
    onError: (e: any) => toast.error(e.message ?? "Submit failed"),
  });

  const cases = listQuery.data?.cases ?? [];
  const activeCase = caseQuery.data;

  const openCase = (id: number) => {
    setSelectedCaseId(id);
    setAnswerText("");
    setView("case");
  };

  if (view === "list") {
    return (
      <div className="min-h-screen bg-[#0d0f1a] text-white p-4 max-w-xl mx-auto">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="text-violet-400" size={20} />
            <h1 className="text-xl font-bold text-violet-300">Grand Rounds</h1>
          </div>
          <p className="text-sm text-gray-400">Weekly clinical cases with AI grading — compete for the top answer</p>
        </div>

        {listQuery.isLoading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20">
            <Stethoscope size={36} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">No Grand Rounds yet</p>
            <p className="text-gray-500 text-sm mt-1">The first Grand Round will be posted soon. Stay tuned!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map(c => (
              <button
                key={c.id}
                onClick={() => openCase(c.id)}
                className="w-full text-left bg-[#13152a] border border-white/5 hover:border-violet-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-violet-400">{c.subject}</span>
                      {c.grandRoundWeek && (
                        <span className="text-xs text-gray-500">· {c.grandRoundWeek}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed">{c.scenario}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {c.attempted
                        ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Attempted</span>
                        : <span className="text-xs text-yellow-400 flex items-center gap-1"><Target size={10} /> Not attempted</span>}
                      {c.featuredAttemptId && (
                        <span className="text-xs text-yellow-400 flex items-center gap-1"><Star size={10} /> Winner announced</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-500 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === "case") {
    const c = activeCase ?? cases.find(x => x.id === selectedCaseId);
    if (!c) return null;

    const alreadyAttempted = c.attempted && c.myAttempt;

    return (
      <div className="min-h-screen bg-[#0d0f1a] text-white p-4 max-w-xl mx-auto">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4"
        >
          <ChevronLeft size={14} /> Back to Grand Rounds
        </button>

        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-violet-400">{c.subject}</span>
          {c.grandRoundWeek && <span className="text-xs text-gray-500">{c.grandRoundWeek}</span>}
        </div>

        {/* Scenario */}
        <div className="bg-[#13152a] border border-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope size={14} className="text-violet-400" />
            <p className="text-xs font-semibold text-violet-300">Clinical Scenario</p>
          </div>
          <p className="text-sm text-gray-100 leading-relaxed">{c.scenario}</p>
        </div>

        {/* Featured Answer */}
        {c.featuredAnswer && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-yellow-400" />
              <p className="text-xs font-semibold text-yellow-300">Featured Answer — {c.featuredAnswer.userName}</p>
            </div>
            <p className="text-sm text-yellow-100 leading-relaxed line-clamp-4">{c.featuredAnswer.answerText}</p>
            {c.featuredAnswer.aiFeedback?.grade && (
              <Badge className={`mt-2 text-xs border ${GRADE_COLORS[c.featuredAnswer.aiFeedback.grade] ?? ""}`}>
                {c.featuredAnswer.aiFeedback.grade} · {c.featuredAnswer.aiFeedback.score}/10
              </Badge>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeCase?.leaderboard && activeCase.leaderboard.length > 0 && (
          <div className="bg-[#13152a] border border-white/5 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-yellow-400" />
              <p className="text-xs font-semibold text-gray-300">Top Submissions</p>
            </div>
            <div className="space-y-2">
              {activeCase.leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-500"}`}>
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-300 truncate">{entry.userName}</span>
                  <span className="text-sm font-bold text-violet-400">{entry.score}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alreadyAttempted ? (
          <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-green-400" />
              <p className="text-xs font-semibold text-green-300">You already submitted this Grand Round</p>
            </div>
            {c.myAttempt?.aiFeedback && (
              <div className="mt-2">
                <Badge className={`text-xs border mb-2 ${GRADE_COLORS[c.myAttempt.aiFeedback.grade] ?? ""}`}>
                  {c.myAttempt.aiFeedback.grade} · {c.myAttempt.aiFeedback.score}/10
                </Badge>
                <p className="text-xs text-gray-400">{c.myAttempt.aiFeedback.verdict}</p>
              </div>
            )}
            <button
              onClick={() => setView("result")}
              className="mt-2 text-xs text-violet-400 hover:underline"
            >
              View full feedback →
            </button>
          </div>
        ) : (
          <>
            {/* Answer input */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Your Answer</label>
              <Textarea
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Write your comprehensive clinical answer here. Include diagnosis, pathophysiology, investigations, and management..."
                className="bg-[#13152a] border-white/10 text-white placeholder-gray-500 resize-none text-sm min-h-40"
                maxLength={8000}
              />
              <p className="text-right text-xs text-gray-600 mt-1">{answerText.length}/8000</p>
            </div>

            <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-3 mb-4 text-xs text-violet-300">
              <Zap size={11} className="inline mr-1" />
              Earn 20–40 XP based on your grade. Top answer gets <strong>100 XP bonus!</strong>
            </div>

            <Button
              onClick={() => attemptMutation.mutate({ answerText })}
              disabled={attemptMutation.isPending || answerText.trim().length < 50}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl"
            >
              {attemptMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI is grading...
                </span>
              ) : "Submit Answer"}
            </Button>
            {answerText.trim().length > 0 && answerText.trim().length < 50 && (
              <p className="text-xs text-red-400 text-center mt-2">Please write at least 50 characters</p>
            )}
          </>
        )}
      </div>
    );
  }

  if (view === "result") {
    const c = activeCase ?? cases.find(x => x.id === selectedCaseId);
    const attempt = c?.myAttempt ?? null;
    const feedback: AiFeedback | null = (attempt?.aiFeedback as AiFeedback) ?? null;

    if (!feedback) {
      setView("list");
      return null;
    }

    const gradeClass = GRADE_COLORS[feedback.grade] ?? "";

    return (
      <div className="min-h-screen bg-[#0d0f1a] text-white p-4 max-w-xl mx-auto">
        <button
          onClick={() => setView("case")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4"
        >
          <ChevronLeft size={14} /> Back to Case
        </button>

        {/* Score card */}
        <div className={`rounded-2xl border p-5 mb-4 text-center ${gradeClass}`}>
          <Award size={32} className="mx-auto mb-2" />
          <div className="text-4xl font-black mb-1">{feedback.score}/10</div>
          <div className="text-lg font-bold mb-1">{feedback.grade}</div>
          <p className="text-sm opacity-80">{feedback.verdict}</p>
        </div>

        <div className="space-y-3">
          {[
            { label: "Diagnosis", value: feedback.diagnosis, icon: Target },
            { label: "Pathophysiology / Pathway", value: feedback.pathway, icon: BookOpen },
            { label: "Clinical Application", value: feedback.clinicalCorrelates, icon: Stethoscope },
            ...(feedback.investigations ? [{ label: "Investigations", value: feedback.investigations, icon: CheckCircle }] : []),
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#13152a] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className="text-violet-400" />
                <p className="text-xs font-semibold text-violet-300">{label}</p>
              </div>
              <p className="text-sm text-gray-200">{value}</p>
            </div>
          ))}

          {feedback.strengths?.length > 0 && (
            <div className="bg-green-900/10 border border-green-700/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-400 mb-2">✓ Strengths</p>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-200 flex items-start gap-1">
                    <span className="mt-0.5 flex-shrink-0">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.missedPoints?.length > 0 && (
            <div className="bg-red-900/10 border border-red-700/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-400 mb-2">✗ Key points missed</p>
              <ul className="space-y-1">
                {feedback.missedPoints.map((pt, i) => (
                  <li key={i} className="text-sm text-red-200 flex items-start gap-1">
                    <span className="mt-0.5 flex-shrink-0">•</span> {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c?.explanation && (
            <div className="bg-[#13152a] border border-violet-700/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-violet-300 mb-2">Model Explanation</p>
              <p className="text-sm text-gray-300 leading-relaxed">{c.explanation}</p>
            </div>
          )}
        </div>

        <Button
          onClick={() => setView("list")}
          variant="outline"
          className="w-full mt-4 border-white/10 text-gray-300"
        >
          Back to Grand Rounds
        </Button>
      </div>
    );
  }

  return null;
}
