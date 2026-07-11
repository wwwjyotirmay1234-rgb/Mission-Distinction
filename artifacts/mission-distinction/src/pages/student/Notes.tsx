import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListNotes, getListNotesQueryKey, customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, FileText, Download, BookMarked, X, ChevronLeft, BookOpen, ExternalLink, BookText, ClipboardList, Sparkles, History, AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Note = {
  id: number;
  title: string;
  subject: string;
  content?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  author?: string | null;
  downloadCount?: number;
};

type Book = {
  id: number;
  title: string;
  subject: string;
  author?: string | null;
  url: string;
  coverUrl?: string | null;
};

type PYQ = {
  id: number;
  title: string;
  subject: string;
  year: string;
  url: string;
  downloadCount?: number;
};

const SUBJECT_COLORS: Record<string, string> = {
  Anatomy:       "border-blue-500/30 text-blue-400 bg-blue-500/10",
  Physiology:    "border-red-500/30 text-red-400 bg-red-500/10",
  Biochemistry:  "border-green-500/30 text-green-400 bg-green-500/10",
  Pharmacology:  "border-orange-500/30 text-orange-400 bg-orange-500/10",
  Pathology:     "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
};
const DEFAULT_COLOR = "border-purple-500/30 text-purple-400 bg-purple-500/10";

function getServeUrlWithToken(url: string): string {
  if (!url.includes("/api/upload/pdf/serve/")) return url;
  const token = localStorage.getItem("mission_token");
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

function showAuthor(author?: string | null): boolean {
  if (!author) return false;
  const t = author.trim().toLowerCase();
  return t !== "" && t !== "unknown" && t !== "unknown author" && t !== "n/a" && t !== "na" && t !== "-" && t !== "anonymous";
}

function getDownloadUrl(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&authuser=0`;
  if (url.includes("/api/upload/pdf/serve/")) return getServeUrlWithToken(url);
  return url;
}

function openDownload(url: string) {
  window.open(getDownloadUrl(url), "_blank", "noopener,noreferrer");
}

function NoteViewerModal({ note, onClose }: { note: Note; onClose: () => void }) {
  const color = SUBJECT_COLORS[note.subject] || DEFAULT_COLOR;
  const isFile = note.fileType && note.fileType !== "text" && note.fileType !== "link";
  const isLink = note.fileType === "link";
  const isPdf = note.fileUrl && (note.fileUrl.endsWith(".pdf") || note.fileUrl.includes("/pdf/serve/"));
  const embedUrl = note.fileUrl ? getServeUrlWithToken(note.fileUrl) : null;
  const [embedFailed, setEmbedFailed] = React.useState(false);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border ${color}`}>
                {note.subject}
              </Badge>
              {showAuthor(note.author) && (
                <span className="text-xs text-muted-foreground">{note.author}</span>
              )}
            </div>
            <DialogTitle className="text-lg font-bold leading-tight">{note.title}</DialogTitle>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 ml-2" onClick={onClose}>
            <X size={16} />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {isLink ? (
            note.fileUrl ? (
              <iframe
                src={getEmbedUrl(note.fileUrl)}
                className="w-full rounded border border-border/40"
                style={{ height: "60vh" }}
                title={note.title}
                allow="autoplay"
              />
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">No link available.</p>
            )
          ) : isFile && embedUrl ? (
            isPdf ? (
              embedFailed ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center py-16">
                  <FileText size={48} className="text-primary/50" />
                  <div>
                    <p className="font-semibold text-lg">{note.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{note.subject}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    <Button className="flex-1 gap-2" asChild>
                      <a href={getEmbedUrl(note.fileUrl!)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={15} /> Open in Browser
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => openDownload(note.fileUrl!)}>
                      <Download size={15} /> Download
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Preview unavailable — tap "Open in Browser" to read.</p>
                </div>
              ) : (
                <iframe
                  src={embedUrl}
                  className="w-full rounded border border-border/40"
                  style={{ height: "60vh" }}
                  title={note.title}
                  onError={() => setEmbedFailed(true)}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <FileText size={40} className="text-primary/60" />
                <p className="text-muted-foreground text-sm">File attached to this note.</p>
                <a href={embedUrl} download>
                  <Button className="gap-2">
                    <Download size={14} /> Download File
                  </Button>
                </a>
              </div>
            )
          ) : (
            <article className="prose prose-invert prose-sm max-w-none">
              <div
                className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans"
                style={{ lineHeight: "1.8" }}
              >
                {note.content || <span className="text-muted-foreground italic">No content available.</span>}
              </div>
            </article>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {note.content ? `${Math.ceil(note.content.length / 1000)} pages · ` : ""}{note.downloadCount || 0} downloads
          </span>
          <div className="flex gap-2">
            {note.fileUrl && note.fileType !== "link" && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openDownload(note.fileUrl!)}>
                <Download size={13} /> Download
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onClose}>
              <ChevronLeft size={13} /> Back
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CATEGORIES = ["All Subjects", "Anatomy", "Physiology", "Biochemistry"];

function trackNoteRead(noteId: number) {
  customFetch(`/api/notes/${noteId}/read`, { method: "POST" }).catch(() => {});
}

async function fetchBooks(search?: string, subject?: string): Promise<Book[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (subject) params.set("subject", subject);
  const qs = params.toString();
  return customFetch<Book[]>(`/api/books${qs ? `?${qs}` : ""}`);
}

function trackBookRead(bookId: number) {
  customFetch(`/api/books/${bookId}/read`, { method: "POST" }).catch(() => {});
}

async function fetchPYQs(search?: string, subject?: string): Promise<PYQ[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (subject) params.set("subject", subject);
  const qs = params.toString();
  return customFetch<PYQ[]>(`/api/pyqs${qs ? `?${qs}` : ""}`);
}

function trackPYQRead(pyqId: number) {
  customFetch(`/api/pyqs/${pyqId}/read`, { method: "POST" }).catch(() => {});
}

function getDriveEmbedUrl(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return url;
}

function getEmbedUrl(url: string): string {
  if (url.includes("drive.google.com")) return getDriveEmbedUrl(url);
  if (url.includes("/api/upload/pdf/serve/") || url.includes("/api/pdfs/")) return getServeUrlWithToken(url);
  // Use Google Docs Viewer as a universal in-app renderer for any external doc/PDF URL
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf") || lower.includes(".pdf?") || lower.includes("docs.google") || lower.endsWith(".docx") || lower.endsWith(".pptx")) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
}

function PYQCard({ pyq }: { pyq: PYQ }) {
  const color = SUBJECT_COLORS[pyq.subject] || DEFAULT_COLOR;
  const isDrive = pyq.url.includes("drive.google.com");
  const embedUrl = isDrive ? getDriveEmbedUrl(pyq.url) : getServeUrlWithToken(pyq.url);
  const [viewing, setViewing] = React.useState(false);
  const [embedFailed, setEmbedFailed] = React.useState(false);

  // AI Search Topic State
  const [topic, setTopic] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<{ completed: number; total: number } | null>(null);
  const [searchResults, setSearchResults] = useState<{ matches: { year: string | null; question: string }[]; note: string; warning?: string } | null>(null);

  // AI Repeated Questions State
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingPhase, setAnalyzingPhase] = useState<"reading" | "synthesizing">("reading");
  const [repeatedProgress, setRepeatedProgress] = useState<{ completed: number; total: number } | null>(null);
  const [repeatedData, setRepeatedData] = useState<{ chapters: { chapter: string; importance: "high" | "medium" | "low"; repeatedQuestions: { question: string; timesSeen: number; yearsSeen: string[] }[] }[]; summary: string; warning?: string } | null>(null);

  const open = () => {
    trackPYQRead(pyq.id);
    setViewing(true);
  };

  // Both AI routes stream Server-Sent Events so the connection stays open for as
  // long as a large scanned PDF takes to walk (no fixed timeout window), and to
  // surface live batch progress instead of a single opaque spinner.
  async function streamPyqAi(path: string, body: unknown, onEvent: (evt: any) => void) {
    const token = localStorage.getItem("mission_token");
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Request failed (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          onEvent(JSON.parse(line.slice(6)));
        } catch {}
      }
    }
  }

  const handleSearchTopic = async () => {
    if (!topic.trim()) return;
    setSearching(true);
    setSearchProgress(null);
    setSearchResults(null);
    try {
      await streamPyqAi(`/api/pyqs/${pyq.id}/search-topic`, { topic }, (evt) => {
        if (evt.type === "progress") setSearchProgress({ completed: evt.completed, total: evt.total });
        else if (evt.type === "done") setSearchResults(evt);
        else if (evt.type === "error") toast.error(evt.message || "Failed to search topic");
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to search topic");
    } finally {
      setSearching(false);
      setSearchProgress(null);
    }
  };

  const handleRepeatedQuestions = async () => {
    setAnalyzing(true);
    setAnalyzingPhase("reading");
    setRepeatedProgress(null);
    setRepeatedData(null);
    try {
      await streamPyqAi(`/api/pyqs/${pyq.id}/repeated-questions`, {}, (evt) => {
        if (evt.type === "progress") setRepeatedProgress({ completed: evt.completed, total: evt.total });
        else if (evt.type === "synthesizing") setAnalyzingPhase("synthesizing");
        else if (evt.type === "done") setRepeatedData(evt);
        else if (evt.type === "error") toast.error(evt.message || "Failed to analyze repeated questions");
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to analyze repeated questions");
    } finally {
      setAnalyzing(false);
      setAnalyzingPhase("reading");
      setRepeatedProgress(null);
    }
  };

  return (
    <>
      <Card className="bg-card/40 border-border/40 hover:border-primary/40 transition-all group flex flex-col overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
          <ClipboardList size={40} className="text-amber-500/40" />
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border shrink-0 ${color}`}>
              {pyq.subject}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 border border-amber-500/30 text-amber-400 bg-amber-500/5 shrink-0">
              {pyq.year}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {pyq.title}
          </h3>
          <div className="flex gap-2 mt-auto">
            <Button className="flex-1 text-xs gap-1.5" size="sm" onClick={open}>
              <BookOpen size={12} /> Read
            </Button>
            <Button variant="secondary" className="flex-1 text-xs gap-1.5" size="sm" onClick={() => openDownload(pyq.url)}>
              <Download size={12} /> Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {viewing && (
        <Dialog open onOpenChange={v => { if (!v) setViewing(false); }}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border ${color}`}>{pyq.subject}</Badge>
                  <Badge variant="outline" className="text-[10px] px-2 border border-amber-500/30 text-amber-400">{pyq.year}</Badge>
                </div>
                <DialogTitle className="text-lg font-bold leading-tight">{pyq.title}</DialogTitle>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 ml-2" onClick={() => setViewing(false)}>
                <X size={16} />
              </Button>
            </DialogHeader>

            <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 border-b border-border/50 bg-muted/20">
                <TabsList className="h-10 bg-transparent border-0 gap-4">
                  <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 text-xs">
                    <FileText size={14} className="mr-2" /> PDF Preview
                  </TabsTrigger>
                  <TabsTrigger value="search" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 text-xs">
                    <Sparkles size={14} className="mr-2 text-purple-400" /> Search Topic
                  </TabsTrigger>
                  <TabsTrigger value="repeated" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 text-xs">
                    <History size={14} className="mr-2 text-amber-400" /> Chapter Analysis
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="flex-1 m-0 overflow-hidden relative">
                {embedFailed ? (
                  <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center py-12">
                    <ClipboardList size={48} className="text-amber-500/50" />
                    <div>
                      <p className="font-semibold text-lg">{pyq.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{pyq.subject} · {pyq.year}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                      <Button className="flex-1 gap-2" asChild>
                        <a href={pyq.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={15} /> Open in Browser
                        </a>
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2" onClick={() => openDownload(pyq.url)}>
                        <Download size={15} /> Download
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Preview unavailable — tap "Open in Browser" to read.</p>
                  </div>
                ) : (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full rounded border-0"
                    style={{ minHeight: "60vh" }}
                    title={pyq.title}
                    allow="autoplay"
                    onError={() => setEmbedFailed(true)}
                  />
                )}
              </TabsContent>

              <TabsContent value="search" className="flex-1 m-0 overflow-hidden flex flex-col p-6 gap-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter topic (e.g. 'Heart Valves', 'Krebs Cycle')..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchTopic()}
                    disabled={searching}
                    className="bg-muted/30 border-border/50"
                  />
                  <Button onClick={handleSearchTopic} disabled={searching || !topic.trim()} className="shrink-0 bg-purple-600 hover:bg-purple-700">
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span className="ml-2 hidden sm:inline">Search AI</span>
                  </Button>
                </div>

                {searching && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
                    <Spinner className="w-8 h-8 text-purple-500" />
                    <div className="space-y-1">
                      <p className="font-medium">
                        {searchProgress && searchProgress.total > 0
                          ? `Reading batch ${searchProgress.completed}/${searchProgress.total}...`
                          : "Analyzing PDF document..."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchProgress && searchProgress.total > 1
                          ? "Long papers can take a few minutes — this stays open until it finishes."
                          : "Reading through the entire paper, however long it takes."}
                      </p>
                    </div>
                  </div>
                )}

                {!searching && searchResults && (
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {searchResults.warning && (
                        <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-400 py-2">
                          <AlertCircle size={14} className="text-amber-400" />
                          <AlertDescription className="text-[10px] ml-2">
                            {searchResults.warning}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {searchResults.matches.length === 0 ? (
                        <div className="text-center py-12 border rounded-xl border-dashed border-border/50">
                          <Search size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">{searchResults.note || "No matching questions found for this topic."}</p>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {searchResults.matches.map((m, i) => (
                            <Card key={i} className="bg-muted/20 border-border/40 overflow-hidden">
                              <div className="p-4 flex justify-between items-start gap-3">
                                <h4 className="font-medium text-sm leading-snug text-foreground/90">{m.question}</h4>
                                {m.year && <Badge variant="outline" className="text-[10px] shrink-0 bg-background/50 border-border/50">{m.year}</Badge>}
                              </div>
                            </Card>
                          ))}
                          <p className="text-[10px] text-muted-foreground italic text-center pb-2">{searchResults.note}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}

                {!searching && !searchResults && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center opacity-60 py-12">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Sparkles size={32} className="text-purple-400" />
                    </div>
                    <div className="max-w-xs space-y-2">
                      <p className="font-semibold">AI Topic Search</p>
                      <p className="text-xs text-muted-foreground">Search for any specific topic and I'll find all related questions in this paper.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="repeated" className="flex-1 m-0 overflow-hidden flex flex-col p-6 gap-4">
                {!analyzing && !repeatedData && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <History size={40} className="text-amber-400" />
                    </div>
                    <div className="max-w-sm space-y-3">
                      <h3 className="text-lg font-bold">Full Chapter Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        AI reads every page and groups ALL questions chapter-wise — including single-occurrence questions — so you see the complete exam picture across all years.
                      </p>
                      <Button onClick={handleRepeatedQuestions} className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
                        Analyse All Questions
                      </Button>
                    </div>
                  </div>
                )}

                {analyzing && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
                    <Spinner className="w-8 h-8 text-amber-500" />
                    <div className="space-y-1">
                      <p className="font-medium text-amber-500/90">
                        {analyzingPhase === "synthesizing"
                          ? "Grouping all questions by chapter..."
                          : repeatedProgress && repeatedProgress.total > 0
                            ? `Reading batch ${repeatedProgress.completed}/${repeatedProgress.total}...`
                            : "Analysing all pages..."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {repeatedProgress && repeatedProgress.total > 1
                          ? "Long papers can take a few minutes — this stays open until it finishes."
                          : "Reading every question across all years."}
                      </p>
                    </div>
                  </div>
                )}

                {!analyzing && repeatedData && (
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6">
                      {repeatedData.warning && (
                        <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-400 py-2">
                          <AlertCircle size={14} className="text-amber-400" />
                          <AlertDescription className="text-[10px] ml-2">
                            {repeatedData.warning}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-2">Analysis Summary</h4>
                        <p className="text-sm leading-relaxed">{repeatedData.summary}</p>
                      </div>

                      <div className="space-y-6 pb-4">
                        {repeatedData.chapters.map((chap, idx) => {
                          const importanceColor = chap.importance === "high" 
                            ? "bg-red-500/20 text-red-400 border-red-500/30" 
                            : chap.importance === "medium" 
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-muted text-muted-foreground border-border/50";
                          
                          return (
                            <div key={idx} className="space-y-3">
                              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                <h3 className="font-bold text-sm text-foreground/90">{chap.chapter}</h3>
                                <Badge className={`text-[10px] uppercase font-black tracking-widest px-2 py-0 ${importanceColor}`}>
                                  {chap.importance}
                                </Badge>
                              </div>
                              <div className="grid gap-3">
                                {chap.repeatedQuestions.map((q, qi) => (
                                  <div key={qi} className="bg-muted/10 rounded-lg p-3 border border-border/20 hover:border-border/50 transition-colors">
                                    <p className="text-sm font-medium mb-2">{q.question}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-none">
                                        Seen {q.timesSeen} {q.timesSeen === 1 ? "time" : "times"}
                                      </Badge>
                                      {q.yearsSeen.map((y, yi) => (
                                        <Badge key={yi} variant="outline" className="text-[10px] h-5 border-border/50 text-muted-foreground">
                                          {y}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

            <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between bg-muted/10">
              <span className="text-xs text-muted-foreground">{pyq.downloadCount ?? 0} views</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openDownload(pyq.url)}>
                  <Download size={13} /> Download
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setViewing(false)}>
                  <ChevronLeft size={13} /> Back
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function BookCard({ book }: { book: Book }) {
  const color = SUBJECT_COLORS[book.subject] || DEFAULT_COLOR;
  const embedUrl = getEmbedUrl(book.url);
  const [viewing, setViewing] = React.useState(false);
  const [embedFailed, setEmbedFailed] = React.useState(false);

  const open = () => {
    trackBookRead(book.id);
    setViewing(true);
  };

  return (
    <>
      <Card className="bg-card/40 border-border/40 hover:border-primary/40 transition-all group flex flex-col overflow-hidden">
        {book.coverUrl ? (
          <div className="h-40 overflow-hidden bg-muted/30">
            <img
              src={book.coverUrl}
              alt={book.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <BookText size={48} className="text-primary/30" />
          </div>
        )}
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border shrink-0 ${color}`}>
              {book.subject}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {book.title}
          </h3>
          {showAuthor(book.author) && (
            <p className="text-xs text-muted-foreground mb-3">by {book.author}</p>
          )}
          <div className="flex gap-2 mt-auto">
            <Button className="flex-1 text-xs gap-1.5" size="sm" onClick={open}>
              <BookOpen size={12} /> Read
            </Button>
            <Button variant="secondary" className="flex-1 text-xs gap-1.5" size="sm" onClick={() => openDownload(book.url)}>
              <Download size={12} /> Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {viewing && (
        <Dialog open onOpenChange={v => { if (!v) setViewing(false); }}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border ${color}`}>{book.subject}</Badge>
                  {showAuthor(book.author) && <span className="text-xs text-muted-foreground">by {book.author}</span>}
                </div>
                <DialogTitle className="text-lg font-bold leading-tight">{book.title}</DialogTitle>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 ml-2" onClick={() => setViewing(false)}>
                <X size={16} />
              </Button>
            </DialogHeader>
            <div className="flex-1 overflow-hidden min-h-0">
              {embedFailed ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
                  <BookText size={48} className="text-primary/50" />
                  <div>
                    <p className="font-semibold text-lg">{book.title}</p>
                    {showAuthor(book.author) && <p className="text-sm text-muted-foreground mt-1">by {book.author}</p>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    <Button className="flex-1 gap-2" asChild>
                      <a href={book.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={15} /> Open in Browser
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => openDownload(book.url)}>
                      <Download size={15} /> Download
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Preview unavailable — tap "Open in Browser" to read.</p>
                </div>
              ) : (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  style={{ minHeight: "60vh" }}
                  title={book.title}
                  allow="autoplay"
                  onError={() => setEmbedFailed(true)}
                />
              )}
            </div>
            <div className="px-6 py-3 border-t border-border/50 flex justify-end gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openDownload(book.url)}>
                <Download size={13} /> Download
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setViewing(false)}>
                <ChevronLeft size={13} /> Back
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function StudentNotes() {
  const [activeTab, setActiveTab] = useState<"notes" | "books" | "pyqs">("notes");
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState("All Subjects");
  const [activeYear, setActiveYear] = useState("All Years");
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (viewingNote) trackNoteRead(viewingNote.id);
  }, [viewingNote?.id]);

  const { data: notesData, isLoading: notesLoading, isError: notesError, refetch: refetchNotes } = useListNotes(
    { search: search || undefined, subject: activeSubject === "All Subjects" ? undefined : activeSubject },
    { query: { queryKey: getListNotesQueryKey({ search: search || undefined, subject: activeSubject === "All Subjects" ? undefined : activeSubject }) } }
  );

  const { data: allNotesData } = useListNotes(
    {},
    { query: { queryKey: getListNotesQueryKey({}), staleTime: 5 * 60 * 1000 } }
  );
  const noteCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of allNotesData ?? []) counts[n.subject] = (counts[n.subject] || 0) + 1;
    return counts;
  }, [allNotesData]);

  const { data: booksData, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["books", search, activeSubject],
    queryFn: () => fetchBooks(search || undefined, activeSubject === "All Subjects" ? undefined : activeSubject),
    enabled: activeTab === "books",
    staleTime: 30_000,
  });

  const { data: pyqsData, isLoading: pyqsLoading } = useQuery<PYQ[]>({
    queryKey: ["pyqs", search, activeSubject],
    queryFn: () => fetchPYQs(search || undefined, activeSubject === "All Subjects" ? undefined : activeSubject),
    enabled: activeTab === "pyqs",
    staleTime: 30_000,
  });

  const { data: allPyqsData } = useQuery<PYQ[]>({
    queryKey: ["pyqs-all"],
    queryFn: () => fetchPYQs(undefined, undefined),
    staleTime: 5 * 60 * 1000,
  });
  const pyqCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allPyqsData ?? []) counts[p.subject] = (counts[p.subject] || 0) + 1;
    return counts;
  }, [allPyqsData]);

  const isLoading = activeTab === "notes" ? notesLoading : activeTab === "books" ? booksLoading : pyqsLoading;

  return (
    <div className="space-y-4 sm:space-y-6">
      {viewingNote && <NoteViewerModal note={viewingNote} onClose={() => setViewingNote(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Notes, Books & PYQs</h1>
          <p className="text-sm text-muted-foreground">High-yield notes, textbooks, and previous year question papers.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={activeTab === "notes" ? "Search notes..." : activeTab === "books" ? "Search books..." : "Search PYQs..."}
              className="pl-9 bg-muted/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 bg-muted/50">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "notes"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText size={15} /> Notes
        </button>
        <button
          onClick={() => setActiveTab("books")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "books"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen size={15} /> Books
        </button>
        <button
          onClick={() => setActiveTab("pyqs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "pyqs"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList size={15} /> PYQs
        </button>
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {CATEGORIES.map((cat) => {
          const count = cat === "All Subjects"
            ? (activeTab === "pyqs" ? (allPyqsData?.length ?? null) : activeTab === "notes" ? (allNotesData?.length ?? null) : null)
            : (activeTab === "pyqs" ? (pyqCountBySubject[cat] ?? null) : activeTab === "notes" ? (noteCountBySubject[cat] ?? null) : null);
          return (
            <Badge
              key={cat}
              variant={activeSubject === cat ? "default" : "outline"}
              className={`px-3 py-1.5 cursor-pointer shrink-0 snap-start flex items-center gap-1.5 ${
                activeSubject === cat
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => setActiveSubject(cat)}
            >
              {cat}
              {count != null && (
                <span className={`text-[10px] font-bold rounded-full px-1 ${activeSubject === cat ? "bg-white/20" : "bg-muted-foreground/20"}`}>{count}</span>
              )}
            </Badge>
          );
        })}
      </div>

      {/* Notes Grid */}
      {activeTab === "notes" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
          ) : notesError ? (
            <div className="col-span-full p-12 text-center border border-dashed border-destructive/30 rounded-xl">
              <FileText size={32} className="mx-auto mb-3 text-destructive/50" />
              <p className="font-semibold text-foreground mb-1">Couldn't load notes</p>
              <p className="text-sm text-muted-foreground mb-4">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetchNotes()}>Retry</Button>
            </div>
          ) : !notesData || notesData.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
              No notes found. Try adjusting your search or filter.
            </div>
          ) : (
            notesData.map((note: Note) => {
              const color = SUBJECT_COLORS[note.subject] || DEFAULT_COLOR;
              return (
                <Card
                  key={note.id}
                  className="bg-card/40 border-border/40 hover:border-primary/40 transition-all group flex flex-col cursor-pointer"
                  onClick={() => setViewingNote(note as Note)}
                >
                  <CardContent className="p-3 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={`text-[9px] uppercase tracking-wider px-1.5 py-0 border ${color}`}>
                        {note.subject}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {note.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 flex-1 leading-snug">
                      {note.fileType === "link"
                        ? "External link"
                        : note.fileType && note.fileType !== "text"
                          ? "Attached file"
                          : note.content
                            ? `${note.content.substring(0, 80)}...`
                            : "No preview"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-2">
                      {note.content
                        ? <span className="flex items-center gap-0.5"><FileText size={10} /> {Math.ceil(note.content.length / 1000)}p</span>
                        : <span className="flex items-center gap-0.5"><FileText size={10} /> {note.fileType || "text"}</span>}
                      <span className="flex items-center gap-0.5"><Download size={10} /> {note.downloadCount ?? 0}</span>
                    </p>
                    {note.fileUrl && note.fileType !== "text" ? (
                      <div className="flex gap-1.5">
                        <Button className="flex-1 text-[11px] gap-1 h-7 px-2" variant="secondary" size="sm">
                          {note.fileType === "link" ? <ExternalLink size={10} /> : <BookOpen size={10} />}
                          {note.fileType === "link" ? "Open" : "Read"}
                        </Button>
                        <Button
                          className="h-7 w-7 p-0 shrink-0"
                          variant="outline"
                          size="sm"
                          title="Download"
                          onClick={(e) => { e.stopPropagation(); openDownload(note.fileUrl!); }}
                        >
                          <Download size={10} />
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full text-[11px] h-7" variant="secondary" size="sm">
                        Read Note
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Books Grid */}
      {activeTab === "books" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading ? (
            Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
          ) : !booksData || booksData.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
              No books found. {activeSubject !== "All Subjects" || search ? "Try adjusting your search or filter." : "Admin hasn't uploaded any books yet."}
            </div>
          ) : (
            booksData.map((book) => <BookCard key={book.id} book={book} />)
          )}
        </div>
      )}

      {/* PYQs Grid */}
      {activeTab === "pyqs" && (() => {
        const allYears = pyqsData
          ? ["All Years", ...Array.from(new Set(pyqsData.map(p => p.year).filter(Boolean) as string[])).sort((a, b) => b.localeCompare(a))]
          : ["All Years"];
        const filtered = pyqsData
          ? (activeYear === "All Years" ? pyqsData : pyqsData.filter(p => p.year === activeYear))
          : [];
        return (
          <>
            {!isLoading && pyqsData && pyqsData.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {allYears.map(yr => (
                  <Badge
                    key={yr}
                    variant={activeYear === yr ? "default" : "outline"}
                    className={`px-3 py-1.5 cursor-pointer shrink-0 text-xs ${
                      activeYear === yr ? "bg-amber-500 text-white border-amber-500" : "hover:bg-muted border-border/50"
                    }`}
                    onClick={() => setActiveYear(yr)}
                  >
                    {yr}
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)
              ) : !pyqsData || pyqsData.length === 0 ? (
                <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
                  No PYQs found. {activeSubject !== "All Subjects" || search ? "Try adjusting your search or filter." : "Admin hasn't uploaded any PYQs yet."}
                </div>
              ) : filtered.length === 0 ? (
                <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
                  No PYQs for {activeYear}. <button className="text-primary underline ml-1" onClick={() => setActiveYear("All Years")}>Show all years</button>
                </div>
              ) : (
                filtered.map((pyq) => <PYQCard key={pyq.id} pyq={pyq} />)
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
