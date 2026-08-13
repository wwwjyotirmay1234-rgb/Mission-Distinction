import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, Trophy, Star, ChevronRight, ChevronLeft,
  CheckCircle, Target, Zap, BookOpen
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
  myAttempt: { id: number; answerText: string } | null;
  featuredAnswer: { userName: string; answerText: string } | null;
}

interface LeaderboardEntry {
  id: number;
  userName: string;
  createdAt: string;
}

interface CaseDetail extends GrandRoundCase {
  leaderboard: LeaderboardEntry[];
}

export default function GrandRounds() {
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [view, setView] = useState<"list" | "case">("list");
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
      apiFetchJson<{ id: number }>(
        `/api/grand-rounds/${selectedCaseId}/attempt`,
        { method: "POST", body: JSON.stringify(body) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grand-rounds"] });
      qc.invalidateQueries({ queryKey: ["grand-round", selectedCaseId] });
      toast.success("Answer submitted! Results will be announced by the admin.");
      setView("list");
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
      <div className="min-h-screen bg-background text-foreground p-4 max-w-xl mx-auto">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="text-primary" size={20} />
            <h1 className="text-xl font-bold text-primary">Grand Rounds</h1>
          </div>
          <p className="text-sm text-muted-foreground">Weekly clinical cases — write your best answer and compete for the top spot</p>
        </div>

        {listQuery.isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20">
            <svg viewBox="0 0 64 64" className="mx-auto mb-3 w-14 h-14 text-primary/30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="8" width="48" height="34" rx="4" stroke="currentColor" strokeWidth="3"/>
              <line x1="32" y1="8" x2="32" y2="42" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
              <circle cx="32" cy="25" r="7" stroke="currentColor" strokeWidth="2.5" opacity="0.6"/>
              <rect x="8" y="42" width="48" height="4" rx="2" fill="currentColor" opacity="0.3"/>
              <line x1="20" y1="50" x2="44" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
            </svg>
            <p className="text-muted-foreground font-medium">No Grand Rounds on the pitch yet</p>
            <p className="text-muted-foreground/60 text-sm mt-1">The first Grand Round will be posted soon. Stay tuned!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map(c => (
              <button
                key={c.id}
                onClick={() => openCase(c.id)}
                className="w-full text-left bg-card border border-border/40 hover:border-primary/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-primary">{c.subject}</span>
                      {c.grandRoundWeek && (
                        <span className="text-xs text-muted-foreground">· {c.grandRoundWeek}</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{c.scenario}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {c.attempted
                        ? <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Attempted</span>
                        : <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1"><Target size={10} /> Not attempted</span>}
                      {c.featuredAttemptId && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1"><Star size={10} /> Winner announced</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
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
      <div className="min-h-screen bg-background text-foreground p-4 max-w-xl mx-auto">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft size={14} /> Back to Grand Rounds
        </button>

        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{c.subject}</span>
          {c.grandRoundWeek && <span className="text-xs text-muted-foreground">{c.grandRoundWeek}</span>}
        </div>

        {/* Scenario */}
        <div className="bg-card border border-border/40 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope size={14} className="text-primary" />
            <p className="text-xs font-semibold text-primary">Clinical Scenario</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{c.scenario}</p>
        </div>

        {/* Featured Answer */}
        {c.featuredAnswer && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Featured Answer — {c.featuredAnswer.userName}</p>
            </div>
            <p className="text-sm text-yellow-900 dark:text-yellow-100 leading-relaxed line-clamp-4">{c.featuredAnswer.answerText}</p>
            <Badge className="mt-2 text-xs border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
              Featured Answer
            </Badge>
          </div>
        )}

        {/* Leaderboard */}
        {activeCase?.leaderboard && activeCase.leaderboard.length > 0 && (
          <div className="bg-card border border-border/40 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs font-semibold text-foreground">Submissions</p>
            </div>
            <div className="space-y-2">
              {activeCase.leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 ${i === 0 ? "text-yellow-600 dark:text-yellow-400" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-orange-500" : "text-muted-foreground"}`}>
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground truncate">{entry.userName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alreadyAttempted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
              <p className="text-xs font-semibold text-green-700 dark:text-green-300">You already submitted this Grand Round</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Results will be announced by the admin when grading is complete.</p>
          </div>
        ) : (
          <>
            {/* Answer input */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Your Answer</label>
              <Textarea
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Write your comprehensive clinical answer here. Include diagnosis, pathophysiology, investigations, and management..."
                className="bg-card border-border text-foreground placeholder:text-muted-foreground resize-none text-sm min-h-40"
                maxLength={8000}
              />
              <p className="text-right text-xs text-muted-foreground mt-1">{answerText.length}/8000</p>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 text-xs text-primary">
              <Zap size={11} className="inline mr-1" />
              Earn 20–40 Goals based on your grade. Top answer gets <strong>100 Goals bonus!</strong>
            </div>

            <Button
              onClick={() => attemptMutation.mutate({ answerText })}
              disabled={attemptMutation.isPending || answerText.trim().length < 50}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl"
            >
              {attemptMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : "Submit Answer"}
            </Button>
            {answerText.trim().length > 0 && answerText.trim().length < 50 && (
              <p className="text-xs text-destructive text-center mt-2">Please write at least 50 characters</p>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
