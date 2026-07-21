import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Stethoscope, Sparkles, CheckCircle2, AlertTriangle, Star,
  Target, ChevronRight, RefreshCw, Lightbulb, Share2, History,
  ChevronLeft, ChevronDown,
} from "lucide-react";

function shareToWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface ClinicalCaseData {
  id: number;
  scenario: string;
  subject: string;
  explanation: string;
  attempted: boolean;
  myAttempt: {
    id: number;
    answerText: string;
    aiFeedback: AiFeedback | null;
    createdAt: string;
  } | null;
}

interface AiFeedback {
  score: number;
  diagnosis: string;
  pathway: string;
  clinicalCorrelates: string;
  missedPoints: string[];
  strengths: string[];
  verdict: string;
}

function ScoreRing({ score }: { score: number }) {
  const pct = score / 10;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-muted-foreground -mt-1">/ 10</span>
      </div>
    </div>
  );
}

function FeedbackCard({ feedback, explanation }: { feedback: AiFeedback; explanation: string }) {
  return (
    <div className="space-y-4 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/60 border border-border/40">
        <ScoreRing score={feedback.score} />
        <div className="flex-1">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">AI Verdict</p>
          <p className="text-sm font-semibold leading-snug">{feedback.verdict}</p>
          {feedback.score >= 7 && (
            <Badge className="mt-1.5 bg-green-500/15 text-green-400 border-green-500/25 text-[10px]">
              +25 XP Earned
            </Badge>
          )}
          {feedback.score < 7 && (
            <Badge className="mt-1.5 bg-primary/15 text-primary border-primary/25 text-[10px]">
              +15 XP Earned
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="p-3.5 rounded-xl bg-card/40 border border-border/30">
          <p className="text-[10px] font-bold text-primary uppercase mb-1.5 flex items-center gap-1">
            <Target size={11} /> Diagnosis
          </p>
          <p className="text-xs text-foreground/85 leading-relaxed">{feedback.diagnosis}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-card/40 border border-border/30">
          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1.5 flex items-center gap-1">
            <Stethoscope size={11} /> Pathway & Mechanism
          </p>
          <p className="text-xs text-foreground/85 leading-relaxed">{feedback.pathway}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-card/40 border border-border/30">
          <p className="text-[10px] font-bold text-purple-400 uppercase mb-1.5 flex items-center gap-1">
            <Lightbulb size={11} /> Clinical Correlates
          </p>
          <p className="text-xs text-foreground/85 leading-relaxed">{feedback.clinicalCorrelates}</p>
        </div>
      </div>

      {feedback.strengths?.length > 0 && (
        <div className="p-3.5 rounded-xl bg-green-500/5 border border-green-500/20">
          <p className="text-[10px] font-bold text-green-400 uppercase mb-2">
            <CheckCircle2 size={11} className="inline mr-1" />
            What you got right
          </p>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                <span className="text-green-400 mt-0.5">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.missedPoints?.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-[10px] font-bold text-amber-400 uppercase mb-2">
            <AlertTriangle size={11} className="inline mr-1" />
            Key points to review
          </p>
          <ul className="space-y-1">
            {feedback.missedPoints.map((p, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">→</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15">
        <p className="text-[10px] font-bold text-primary uppercase mb-1.5">Full Explanation</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
}

interface HistoryAttempt {
  id: number;
  caseId: number;
  dateKey: string;
  answerText: string;
  aiFeedback: AiFeedback | null;
  createdAt: string;
  scenario: string;
  subject: string;
}

export default function ClinicalCase() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clinicalCase, setClinicalCase] = useState<ClinicalCaseData | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [view, setView] = useState<"today" | "history">("today");
  const [historyAttempts, setHistoryAttempts] = useState<HistoryAttempt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`${BASE}/api/clinical-cases/my-history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryAttempts(data.attempts ?? []);
      }
    } catch {
      toast.error("Failed to load case history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCase = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${BASE}/api/clinical-cases/today`);
      if (res.ok) {
        const data: ClinicalCaseData = await res.json();
        setClinicalCase(data);
        if (data.myAttempt?.aiFeedback) {
          setFeedback(data.myAttempt.aiFeedback as AiFeedback);
          setAnswer(data.myAttempt.answerText);
        }
      } else if (res.status === 404) {
        setClinicalCase(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, []);

  const handleSubmit = async () => {
    if (!answer.trim() || !clinicalCase || submitting) return;
    if (answer.trim().length < 20) {
      toast.error("Please write a more detailed answer (at least 20 characters)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`${BASE}/api/clinical-cases/${clinicalCase.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerText: answer }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.feedback);
        setClinicalCase(prev => prev ? { ...prev, attempted: true } : prev);
        toast.success("Great attempt! AI feedback ready. +15 XP earned!");
      } else {
        toast.error(data.error || "Failed to submit answer");
      }
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!clinicalCase && view !== "history") {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="p-12 text-center border border-dashed rounded-2xl text-muted-foreground">
          <Stethoscope size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No clinical case available today</p>
          <p className="text-xs mt-1 opacity-70">Check back soon — cases are added regularly.</p>
        </div>
        <div className="text-center">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setView("history"); fetchHistory(); }}>
            <History size={14} /> View Past Cases
          </Button>
        </div>
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setView("today")}>
            <ChevronLeft size={16} /> Today's Case
          </Button>
        </div>
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <History size={20} className="text-primary" /> Past Cases
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your clinical case attempt history.</p>
        </div>

        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : historyAttempts.length === 0 ? (
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-10 text-center text-muted-foreground text-sm">
              <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
              No past attempts yet. Complete today's case to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {historyAttempts.map(attempt => {
              const score = attempt.aiFeedback?.score ?? null;
              const scoreColor = score === null ? "text-muted-foreground" : score >= 7 ? "text-green-400" : score >= 4 ? "text-amber-400" : "text-red-400";
              const isExpanded = expandedId === attempt.id;
              return (
                <Card key={attempt.id} className="bg-card/40 border-border/40 overflow-hidden">
                  <button
                    className="w-full p-4 text-left hover:bg-card/60 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : attempt.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5">
                            {attempt.subject}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(attempt.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2 text-left">{attempt.scenario}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {score !== null && (
                          <span className={`text-lg font-black ${scoreColor}`}>{score}<span className="text-[10px] font-normal text-muted-foreground">/10</span></span>
                        )}
                        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </button>
                  {isExpanded && attempt.aiFeedback && (
                    <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3 animate-in fade-in duration-200">
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Your Answer</p>
                        <p className="text-xs leading-relaxed text-foreground/80 line-clamp-4">{attempt.answerText}</p>
                      </div>
                      <FeedbackCard feedback={attempt.aiFeedback} explanation="" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!clinicalCase) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" />
            Clinical Case of the Day
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setView("history"); fetchHistory(); }}
          >
            <History size={13} /> Past Cases
          </Button>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
            {clinicalCase.subject}
          </Badge>
        </div>
      </div>

      {/* Scenario */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="p-4 pb-2 border-b border-border/30 bg-primary/5">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles size={14} className="text-primary" /> Clinical Scenario
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm leading-relaxed font-medium">{clinicalCase.scenario}</p>
        </CardContent>
      </Card>

      {/* Answer Section */}
      {!feedback ? (
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="p-4 pb-2 border-b border-border/30">
            <CardTitle className="text-sm font-bold">Your Answer</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your clinical reasoning here — mention the diagnosis, pathophysiology, and management. Think step-by-step like a doctor."
              rows={7}
              disabled={clinicalCase.attempted || submitting}
              className="w-full bg-background/60 border border-border/50 rounded-xl p-3 text-sm resize-none outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-muted-foreground">
                {answer.length}/5000 · AI will evaluate and give structured feedback · +15 XP on completion
              </p>
              <Button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitting || clinicalCase.attempted}
                className="gap-1.5 shrink-0"
                size="sm"
              >
                {submitting ? (
                  <><RefreshCw size={13} className="animate-spin" /> Evaluating…</>
                ) : (
                  <><ChevronRight size={13} /> Get AI Feedback</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card/40 border border-border/40">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Your Answer</p>
            <p className="text-sm leading-relaxed text-foreground/80">{answer}</p>
          </div>
          <div>
            <p className="text-sm font-bold flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" /> AI Feedback
            </p>
            <FeedbackCard feedback={feedback} explanation={clinicalCase.explanation} />
          </div>
          <button
            onClick={() => {
              const appUrl = window.location.origin;
              const text = `🩺 *Clinical Case of the Day — Mission Distinction*\n\nI scored *${feedback.score}/10* on today's ${clinicalCase.subject} case!\n\n"${feedback.verdict}"\n\nJoin me & test yourself → ${appUrl}`;
              shareToWhatsApp(text);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/8 hover:bg-[#25D366]/15 text-[#25D366] text-sm font-semibold transition-colors"
          >
            <Share2 size={15} />
            Share my score on WhatsApp
          </button>
        </div>
      )}

      {clinicalCase.attempted && !feedback && (
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
          <CheckCircle2 size={24} className="mx-auto mb-1.5 text-green-400" />
          <p className="text-sm font-semibold text-green-400">Already completed today's case!</p>
          <p className="text-xs text-muted-foreground mt-0.5">Come back tomorrow for a new case.</p>
        </div>
      )}
    </div>
  );
}
