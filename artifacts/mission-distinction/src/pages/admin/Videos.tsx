import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, ChevronRight, ChevronDown, RefreshCw,
  Eye, EyeOff, PlayCircle, BookOpen, HelpCircle, X, Link2,
} from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "University Exams"];

interface VideoItem {
  id: number;
  title: string;
  subject: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  isPublished: boolean;
  sessionYear?: string | null;
  createdAt: string;
}

interface Concept { heading: string; content: string }
interface Question { text: string; options: string[]; correctOption: number; explanation: string }

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function getGoogleDriveId(url: string): string | null {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?\s]+)/);
  return m?.[1] ?? null;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0`;
  const vimeoM = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoM) return `https://player.vimeo.com/video/${vimeoM[1]}?dnt=1`;
  const driveId = getGoogleDriveId(url);
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
  return null;
}

function getPlatformName(url: string): string {
  if (!url) return "";
  if (/youtube\.com|youtu\.be/.test(url)) return "YouTube";
  if (/drive\.google\.com/.test(url)) return "Google Drive";
  if (/instagram\.com/.test(url)) return "Instagram";
  if (/vimeo\.com/.test(url)) return "Vimeo";
  if (/tiktok\.com/.test(url)) return "TikTok";
  if (/twitter\.com|x\.com/.test(url)) return "X (Twitter)";
  if (/facebook\.com/.test(url)) return "Facebook";
  return "External";
}

export default function AdminVideos() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState(SUBJECTS[0]);
  const [formDesc, setFormDesc] = useState("");
  const [formSessionYear, setFormSessionYear] = useState("2025-26");
  const [batchFilter, setBatchFilter] = useState<"all" | "2025-26" | "2026-27" | "shared">("all");

  // Concepts / questions state for expanded panel
  const [editConcepts, setEditConcepts] = useState<Concept[]>([]);
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);
  const [conceptsDirty, setConceptsDirty] = useState(false);
  const [questionsDirty, setQuestionsDirty] = useState(false);

  // Pending video URL being typed (before blur-save)
  const [urlDraft, setUrlDraft] = useState<Record<number, string>>({});

  const { data: videos = [], isLoading } = useQuery<VideoItem[]>({
    queryKey: ["admin-videos"],
    queryFn: () => apiFetchJson("/api/videos/admin/list"),
  });

  const allVideos: VideoItem[] = Array.isArray(videos) ? videos : [];
  const filteredVideos = batchFilter === "all" ? allVideos
    : batchFilter === "shared" ? allVideos.filter(v => !v.sessionYear)
    : allVideos.filter(v => v.sessionYear === batchFilter);

  const { data: expandedDetail } = useQuery<any>({
    queryKey: ["admin-video-detail", expandedId],
    queryFn: () => apiFetchJson(`/api/videos/admin/${expandedId}/detail`),
    enabled: !!expandedId,
    onSuccess: (d: any) => {
      setEditConcepts(d.concepts.map((c: any) => ({ heading: c.heading, content: c.content })));
      setEditQuestions(d.questions.map((q: any) => ({ text: q.text, options: q.options, correctOption: q.correctOption, explanation: q.explanation ?? "" })));
      setConceptsDirty(false);
      setQuestionsDirty(false);
    },
  } as any);

  const createMutation = useMutation({
    mutationFn: (body: any) => apiFetchJson("/api/videos/admin", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (video: VideoItem) => {
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      toast.success("Video created!");
      setShowForm(false);
      setFormTitle(""); setFormDesc(""); setFormSessionYear("2025-26");
      setExpandedId(video.id);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      apiFetchJson(`/api/videos/admin/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-videos"] }); toast.success("Saved!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetchJson(`/api/videos/admin/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-videos"] }); setExpandedId(null); toast.success("Deleted."); },
    onError: (e: any) => toast.error(e.message),
  });

  const conceptsMutation = useMutation({
    mutationFn: ({ id, concepts }: { id: number; concepts: Concept[] }) =>
      apiFetchJson(`/api/videos/admin/${id}/concepts`, { method: "PUT", body: JSON.stringify({ concepts }) }),
    onSuccess: () => { setConceptsDirty(false); toast.success("Concepts saved!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const questionsMutation = useMutation({
    mutationFn: ({ id, questions }: { id: number; questions: Question[] }) =>
      apiFetchJson(`/api/videos/admin/${id}/questions`, { method: "PUT", body: JSON.stringify({ questions }) }),
    onSuccess: () => { setQuestionsDirty(false); toast.success("Questions saved!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveVideoUrl = (v: VideoItem, rawUrl: string) => {
    const url = rawUrl.trim();
    if (url === (v.videoUrl ?? "")) return;

    // Auto-generate YouTube thumbnail
    const ytId = getYouTubeId(url);
    const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : undefined;

    updateMutation.mutate({
      id: v.id,
      body: {
        videoUrl: url || null,
        ...(autoThumb && !v.thumbnailUrl ? { thumbnailUrl: autoThumb } : {}),
      },
    });
  };

  const handleExpand = (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <PlayCircle size={20} className="text-primary" /> Video Manager
        </h1>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus size={14} /> Add Video
        </Button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Create form */}
        {showForm && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="p-4 pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">New Video</CardTitle>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <input
                value={formTitle} onChange={e => setFormTitle(e.target.value)}
                placeholder="Video title (e.g. Cardiac Cycle — Complete Explanation)"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
              <select
                value={formSubject} onChange={e => setFormSubject(e.target.value)}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm outline-none"
              >
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select
                value={formSessionYear} onChange={e => setFormSessionYear(e.target.value)}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="shared">All Batches (shared)</option>
                <option value="2025-26">2025-26 Batch</option>
                <option value="2026-27">2026-27 Batch</option>
              </select>
              <textarea
                value={formDesc} onChange={e => setFormDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-primary/50"
              />
              <Button
                onClick={() => createMutation.mutate({ title: formTitle, subject: formSubject, description: formDesc, sessionYear: formSessionYear === "shared" ? null : (formSessionYear || null) })}
                disabled={!formTitle.trim() || createMutation.isPending}
                size="sm" className="w-full"
              >
                {createMutation.isPending ? <><RefreshCw size={13} className="animate-spin mr-1" />Creating…</> : "Create Video"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Batch filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {(["all","2025-26","2026-27","shared"] as const).map(f => (
            <button key={f} onClick={() => setBatchFilter(f)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${batchFilter === f ? "bg-primary/20 border-primary/40 text-primary font-medium" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? "All Batches" : f === "shared" ? "Shared" : f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card/40 border border-border/40 animate-pulse" />)}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <PlayCircle size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{allVideos.length === 0 ? "No videos yet. Add one above." : "No videos match this filter."}</p>
          </div>
        ) : filteredVideos.map(v => {
          const ytId = v.videoUrl ? getYouTubeId(v.videoUrl) : null;
          const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
          const thumb = v.thumbnailUrl || autoThumb;
          const platform = v.videoUrl ? getPlatformName(v.videoUrl) : null;
          const embedUrl = v.videoUrl ? getEmbedUrl(v.videoUrl) : null;

          return (
            <Card key={v.id} className="border-border/40 bg-card/40">
              <CardContent className="p-0">
                {/* Header row */}
                <div className="flex items-center gap-3 p-4">
                  <div
                    className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                    onClick={() => handleExpand(v.id)}
                  >
                    {thumb
                      ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                      : <PlayCircle size={20} className="text-muted-foreground/50" />}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleExpand(v.id)}>
                    <p className="text-sm font-semibold truncate">{v.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] px-1.5">{v.subject}</Badge>
                      <Badge variant={v.isPublished ? "default" : "secondary"} className="text-[9px] px-1.5">
                        {v.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {v.sessionYear
                        ? <Badge variant="outline" className={`text-[9px] px-1.5 ${v.sessionYear === "2025-26" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : "text-purple-400 border-purple-500/30 bg-purple-500/10"}`}>{v.sessionYear}</Badge>
                        : <Badge variant="outline" className="text-[9px] px-1.5 text-green-400 border-green-500/30 bg-green-500/10">Shared</Badge>}
                      {platform && (
                        <span className="text-[9px] text-primary flex items-center gap-0.5">
                          <Link2 size={9} /> {platform}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateMutation.mutate({ id: v.id, body: { isPublished: !v.isPublished } })}
                      className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
                      title={v.isPublished ? "Unpublish" : "Publish"}
                    >
                      {v.isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this video?")) deleteMutation.mutate(v.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button onClick={() => handleExpand(v.id)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
                      {expandedId === v.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded editor */}
                {expandedId === v.id && (
                  <div className="border-t border-border/30 p-4 space-y-5">

                    {/* Video URL */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                        <Link2 size={11} /> Video Link
                      </p>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Paste any YouTube, Instagram, Vimeo, or other video URL.
                      </p>
                      <input
                        key={v.id}
                        defaultValue={v.videoUrl ?? ""}
                        placeholder="https://youtube.com/watch?v=… or https://www.instagram.com/reel/…"
                        onBlur={e => saveVideoUrl(v, e.target.value)}
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                      />
                      {/* Preview */}
                      {embedUrl ? (
                        <div className="mt-2 aspect-video rounded-xl overflow-hidden bg-black">
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                          />
                        </div>
                      ) : v.videoUrl ? (
                        <div className="mt-2 flex items-center gap-2 p-3 rounded-xl border border-border/40 bg-muted/20">
                          <Link2 size={14} className="text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground font-medium">{platform} link saved</p>
                            <p className="text-[10px] text-muted-foreground truncate">{v.videoUrl}</p>
                          </div>
                          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline shrink-0">
                            Preview ↗
                          </a>
                        </div>
                      ) : null}
                    </div>

                    {/* Thumbnail URL */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Thumbnail URL</p>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Auto-filled for YouTube. Override if needed.
                      </p>
                      <input
                        key={`thumb-${v.id}`}
                        defaultValue={v.thumbnailUrl ?? ""}
                        placeholder="https://… (auto-filled for YouTube)"
                        onBlur={e => {
                          if (e.target.value !== (v.thumbnailUrl ?? ""))
                            updateMutation.mutate({ id: v.id, body: { thumbnailUrl: e.target.value || null } });
                        }}
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* Publish toggle */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Visibility</p>
                      <Button
                        size="sm" variant={v.isPublished ? "outline" : "default"}
                        onClick={() => updateMutation.mutate({ id: v.id, body: { isPublished: !v.isPublished } })}
                      >
                        {v.isPublished ? <><EyeOff size={12} className="mr-1.5" />Unpublish</> : <><Eye size={12} className="mr-1.5" />Publish</>}
                      </Button>
                    </div>

                    {/* Concepts editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                          <BookOpen size={11} /> Concept Notes ({editConcepts.length})
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => { setEditConcepts(p => [...p, { heading: "", content: "" }]); setConceptsDirty(true); }}>
                            <Plus size={11} /> Add
                          </Button>
                          {conceptsDirty && (
                            <Button size="sm" className="h-7 text-xs"
                              onClick={() => conceptsMutation.mutate({ id: v.id, concepts: editConcepts })}>
                              {conceptsMutation.isPending ? <RefreshCw size={11} className="animate-spin" /> : "Save"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {editConcepts.map((c, i) => (
                          <div key={i} className="p-3 bg-background/50 border border-border/30 rounded-xl space-y-2">
                            <div className="flex gap-2">
                              <input
                                value={c.heading} placeholder="Heading"
                                onChange={e => { const n = [...editConcepts]; n[i] = { ...n[i], heading: e.target.value }; setEditConcepts(n); setConceptsDirty(true); }}
                                className="flex-1 bg-transparent border-b border-border/40 text-sm outline-none pb-0.5"
                              />
                              <button onClick={() => { setEditConcepts(p => p.filter((_, j) => j !== i)); setConceptsDirty(true); }} className="text-muted-foreground hover:text-red-400">
                                <X size={13} />
                              </button>
                            </div>
                            <textarea
                              value={c.content} placeholder="Content…" rows={3}
                              onChange={e => { const n = [...editConcepts]; n[i] = { ...n[i], content: e.target.value }; setEditConcepts(n); setConceptsDirty(true); }}
                              className="w-full bg-transparent text-xs text-foreground/80 outline-none resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Questions editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                          <HelpCircle size={11} /> MCQ Questions ({editQuestions.length})
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => { setEditQuestions(p => [...p, { text: "", options: ["", "", "", ""], correctOption: 0, explanation: "" }]); setQuestionsDirty(true); }}>
                            <Plus size={11} /> Add
                          </Button>
                          {questionsDirty && (
                            <Button size="sm" className="h-7 text-xs"
                              onClick={() => questionsMutation.mutate({ id: v.id, questions: editQuestions })}>
                              {questionsMutation.isPending ? <RefreshCw size={11} className="animate-spin" /> : "Save"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {editQuestions.map((q, qi) => (
                          <div key={qi} className="p-3 bg-background/50 border border-border/30 rounded-xl space-y-2">
                            <div className="flex gap-2">
                              <p className="text-[10px] font-bold text-muted-foreground mt-1">Q{qi + 1}</p>
                              <textarea
                                value={q.text} placeholder="Question text" rows={2}
                                onChange={e => { const n = [...editQuestions]; n[qi] = { ...n[qi], text: e.target.value }; setEditQuestions(n); setQuestionsDirty(true); }}
                                className="flex-1 bg-transparent text-sm outline-none resize-none"
                              />
                              <button onClick={() => { setEditQuestions(p => p.filter((_, j) => j !== qi)); setQuestionsDirty(true); }} className="text-muted-foreground hover:text-red-400">
                                <X size={13} />
                              </button>
                            </div>
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio" name={`correct-${qi}`} checked={q.correctOption === oi}
                                  onChange={() => { const n = [...editQuestions]; n[qi] = { ...n[qi], correctOption: oi }; setEditQuestions(n); setQuestionsDirty(true); }}
                                  className="shrink-0"
                                />
                                <span className="text-xs text-muted-foreground w-4">{String.fromCharCode(65 + oi)}.</span>
                                <input
                                  value={opt} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                  onChange={e => { const n = [...editQuestions]; n[qi].options[oi] = e.target.value; setEditQuestions([...n]); setQuestionsDirty(true); }}
                                  className={`flex-1 bg-transparent text-xs outline-none border-b ${q.correctOption === oi ? "border-green-500/50 text-green-400 font-medium" : "border-border/30"}`}
                                />
                              </div>
                            ))}
                            <input
                              value={q.explanation} placeholder="Explanation (optional)"
                              onChange={e => { const n = [...editQuestions]; n[qi] = { ...n[qi], explanation: e.target.value }; setEditQuestions(n); setQuestionsDirty(true); }}
                              className="w-full bg-transparent text-xs text-blue-400 outline-none border-b border-border/20 placeholder:text-muted-foreground/40"
                            />
                            <p className="text-[9px] text-muted-foreground">Select the radio button next to the correct answer</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

