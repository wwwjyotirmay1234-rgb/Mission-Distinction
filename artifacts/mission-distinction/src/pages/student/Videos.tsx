import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, CheckCircle, Lock, ChevronLeft, BookOpen,
  HelpCircle, Clock, Trophy, RefreshCw, PlayCircle,
} from "lucide-react";

const SUBJECTS = ["all", "Anatomy", "Physiology", "Biochemistry", "NEET PG", "University Exams"];

interface VideoSummary {
  id: number;
  title: string;
  subject: string;
  description?: string;
  videoUrl?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  myProgress?: {
    watchedPercent: number;
    completed: boolean;
    quizScore?: number;
    quizTotal?: number;
  } | null;
}

interface Concept {
  id: number;
  heading: string;
  content: string;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctOption?: number;
  explanation?: string;
}

interface VideoDetail extends VideoSummary {
  concepts: Concept[];
  questions: Question[];
}

function formatDuration(secs?: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Videos() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"concepts" | "quiz">("concepts");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; results: any[] } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedRef = useRef(0);

  const { data: videos = [], isLoading } = useQuery<VideoSummary[]>({
    queryKey: ["videos", subject],
    queryFn: () => apiFetchJson(`/api/videos?subject=${subject}`),
  });

  const { data: detail, isLoading: detailLoading } = useQuery<VideoDetail>({
    queryKey: ["video-detail", selectedId],
    queryFn: () => apiFetchJson(`/api/videos/${selectedId}`),
    enabled: !!selectedId,
  });

  const progressMutation = useMutation({
    mutationFn: ({ videoId, watchedPercent }: { videoId: number; watchedPercent: number }) =>
      apiFetchJson(`/api/videos/${videoId}/progress`, {
        method: "POST",
        body: JSON.stringify({ watchedPercent }),
      }),
    onSuccess: (data, vars) => {
      if (data.completed) {
        qc.invalidateQueries({ queryKey: ["videos"] });
        qc.invalidateQueries({ queryKey: ["video-detail", vars.videoId] });
      }
    },
  });

  const quizMutation = useMutation({
    mutationFn: ({ videoId, answers }: { videoId: number; answers: Record<number, number> }) =>
      apiFetchJson(`/api/videos/${videoId}/quiz`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    onSuccess: (data) => {
      if (data.alreadySubmitted) {
        toast.info("You already submitted this quiz.");
        return;
      }
      setQuizResult(data);
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["video-detail", selectedId] });
      const xp = 20 + data.score * 5;
      toast.success(`${data.score}/${data.total} correct — +${xp} XP earned!`);
    },
    onError: (e: any) => toast.error(e.message ?? "Submit failed"),
  });

  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !selectedId || !vid.duration) return;
    const pct = Math.round((vid.currentTime / vid.duration) * 100);
    // Report every 10% increment
    if (pct >= lastReportedRef.current + 10 || pct >= 80) {
      lastReportedRef.current = pct;
      progressMutation.mutate({ videoId: selectedId, watchedPercent: pct });
    }
  }, [selectedId]);

  const openVideo = (id: number) => {
    setSelectedId(id);
    setActiveTab("concepts");
    setQuizAnswers({});
    setQuizResult(null);
    lastReportedRef.current = 0;
  };

  const closeVideo = () => {
    setSelectedId(null);
    setQuizResult(null);
    setQuizAnswers({});
  };

  const submitQuiz = () => {
    if (!selectedId || !detail) return;
    if (Object.keys(quizAnswers).length < detail.questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    quizMutation.mutate({ videoId: selectedId, answers: quizAnswers });
  };

  const completed = detail?.myProgress?.completed ?? false;
  const alreadyQuizzed = detail?.myProgress?.quizTotal != null;

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/40 px-4 py-3 flex items-center gap-3">
          <button onClick={closeVideo} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-sm truncate">{detail?.title ?? "Loading…"}</span>
          {detail && <Badge variant="outline" className="shrink-0 text-[10px]">{detail.subject}</Badge>}
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
            {/* Video player */}
            {detail.videoUrl ? (
              <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={detail.videoUrl}
                  controls
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => progressMutation.mutate({ videoId: selectedId, watchedPercent: 100 })}
                  controlsList="nodownload"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-card/40 border border-border/40 aspect-video flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Video not uploaded yet</p>
              </div>
            )}

            {/* Progress bar */}
            {detail.myProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{detail.myProgress.completed ? "Completed ✓" : `${detail.myProgress.watchedPercent}% watched`}</span>
                  {detail.myProgress.quizTotal != null && (
                    <span className="text-primary font-semibold">{detail.myProgress.quizScore}/{detail.myProgress.quizTotal} quiz</span>
                  )}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${detail.myProgress.watchedPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("concepts")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === "concepts" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <BookOpen size={13} /> Concepts
              </button>
              <button
                onClick={() => completed || alreadyQuizzed ? setActiveTab("quiz") : toast.error("Watch 80% of the video first to unlock the quiz.")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === "quiz" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"} ${!completed && !alreadyQuizzed ? "opacity-50" : ""}`}
              >
                {completed || alreadyQuizzed ? <HelpCircle size={13} /> : <Lock size={13} />}
                Quiz {!completed && !alreadyQuizzed && "(Locked)"}
              </button>
            </div>

            {/* Concepts tab */}
            {activeTab === "concepts" && (
              <div className="space-y-3 pb-4">
                {detail.concepts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No concepts added yet.</p>
                ) : detail.concepts.map(c => (
                  <Card key={c.id} className="bg-card/40 border-border/40">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold">{c.heading}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{c.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quiz tab */}
            {activeTab === "quiz" && (
              <div className="space-y-4 pb-4">
                {detail.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No questions added yet.</p>
                ) : quizResult || alreadyQuizzed ? (
                  // Results view
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-center">
                      <Trophy size={28} className="mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-black">{quizResult?.score ?? detail.myProgress?.quizScore}/{quizResult?.total ?? detail.myProgress?.quizTotal}</p>
                      <p className="text-xs text-muted-foreground mt-1">Quiz completed</p>
                    </div>
                    {detail.questions.map((q, qi) => {
                      const result = quizResult?.results?.find((r: any) => r.questionId === q.id);
                      const correct = result?.correct;
                      return (
                        <Card key={q.id} className={`border ${correct === true ? "border-green-500/30 bg-green-500/5" : correct === false ? "border-red-500/30 bg-red-500/5" : "border-border/40 bg-card/40"}`}>
                          <CardContent className="p-4 space-y-2">
                            <p className="text-sm font-medium">{qi + 1}. {q.text}</p>
                            {q.options.map((opt, i) => (
                              <div key={i} className={`text-xs px-3 py-1.5 rounded-lg ${i === q.correctOption ? "bg-green-500/20 text-green-400 font-semibold" : "text-muted-foreground"}`}>
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                            {q.explanation && (
                              <p className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded px-3 py-2">
                                <span className="font-semibold">Explanation: </span>{q.explanation}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  // Quiz input view
                  <div className="space-y-4">
                    {detail.questions.map((q, qi) => (
                      <Card key={q.id} className="bg-card/40 border-border/40">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-sm font-medium">{qi + 1}. {q.text}</p>
                          {q.options.map((opt, i) => {
                            const selected = quizAnswers[q.id] === i;
                            return (
                              <button
                                key={i}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: i }))}
                                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${selected ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/40 text-muted-foreground hover:border-primary/40"}`}
                              >
                                {String.fromCharCode(65 + i)}. {opt}
                              </button>
                            );
                          })}
                        </CardContent>
                      </Card>
                    ))}
                    <Button onClick={submitQuiz} disabled={quizMutation.isPending} className="w-full">
                      {quizMutation.isPending ? <><RefreshCw size={14} className="animate-spin mr-2" />Submitting…</> : "Submit Quiz"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/40 px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <PlayCircle size={20} className="text-primary" /> Video Lectures
        </h1>
      </div>

      {/* Subject filter */}
      <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-none">
        {SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${subject === s ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}
          >
            {s === "all" ? "All Subjects" : s}
          </button>
        ))}
      </div>

      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-card/40 border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <PlayCircle size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No videos available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videos.map(v => {
              const prog = v.myProgress;
              const done = prog?.completed;
              const quizzed = prog?.quizTotal != null;
              return (
                <button key={v.id} onClick={() => openVideo(v.id)} className="text-left">
                  <Card className={`border transition-all hover:border-primary/40 hover:shadow-md ${done ? "border-green-500/30 bg-green-500/5" : "border-border/40 bg-card/40"}`}>
                    {/* Thumbnail / placeholder */}
                    <div className="relative aspect-video bg-muted/30 rounded-t-xl overflow-hidden flex items-center justify-center">
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <Play size={32} className="text-muted-foreground/40" />
                      )}
                      {v.durationSeconds && (
                        <span className="absolute bottom-1.5 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                          {formatDuration(v.durationSeconds)}
                        </span>
                      )}
                      {done && (
                        <span className="absolute top-1.5 left-1.5 bg-green-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle size={9} /> Watched
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-semibold leading-tight line-clamp-2">{v.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <Badge variant="outline" className="text-[9px] px-1.5">{v.subject}</Badge>
                        <div className="flex items-center gap-1.5">
                          {quizzed && (
                            <span className="text-[9px] text-primary font-bold flex items-center gap-0.5">
                              <Trophy size={9} />{prog!.quizScore}/{prog!.quizTotal}
                            </span>
                          )}
                          {prog && !done && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Clock size={9} />{prog.watchedPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Progress bar */}
                      {prog && (
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${done ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${prog.watchedPercent}%` }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
