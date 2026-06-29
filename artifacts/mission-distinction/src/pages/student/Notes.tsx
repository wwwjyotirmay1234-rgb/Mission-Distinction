import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListNotes, getListNotesQueryKey, customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, FileText, Download, BookMarked, X, ChevronLeft, BookOpen, ExternalLink, BookText, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

function NoteViewerModal({ note, onClose }: { note: Note; onClose: () => void }) {
  const color = SUBJECT_COLORS[note.subject] || DEFAULT_COLOR;
  const isFile = note.fileType && note.fileType !== "text" && note.fileType !== "link";
  const isLink = note.fileType === "link";
  const isPdf = note.fileUrl && (note.fileUrl.endsWith(".pdf") || note.fileUrl.includes("/pdf/serve/"));
  const embedUrl = note.fileUrl ? getServeUrlWithToken(note.fileUrl) : null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border ${color}`}>
                {note.subject}
              </Badge>
              {note.author && (
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
              <iframe
                src={embedUrl}
                className="w-full rounded border border-border/40"
                style={{ height: "60vh" }}
                title={note.title}
              />
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

  const open = () => {
    trackPYQRead(pyq.id);
    setViewing(true);
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
          <Button className="w-full text-xs gap-1.5 mt-auto" size="sm" onClick={open}>
            <FileText size={12} /> Open PYQ
          </Button>
        </CardContent>
      </Card>

      {viewing && (
        <Dialog open onOpenChange={v => { if (!v) setViewing(false); }}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
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
            <div className="flex-1 overflow-hidden min-h-0">
              <iframe
                src={embedUrl}
                className="w-full h-full rounded border-0"
                style={{ minHeight: "60vh" }}
                title={pyq.title}
                allow="autoplay"
              />
            </div>
            <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{pyq.downloadCount ?? 0} views</span>
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

function BookCard({ book }: { book: Book }) {
  const color = SUBJECT_COLORS[book.subject] || DEFAULT_COLOR;
  const embedUrl = getEmbedUrl(book.url);
  const [viewing, setViewing] = React.useState(false);

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
          {book.author && (
            <p className="text-xs text-muted-foreground mb-3">by {book.author}</p>
          )}
          <Button className="w-full text-xs gap-1.5 mt-auto" size="sm" onClick={open}>
            <BookOpen size={12} /> Read Book
          </Button>
        </CardContent>
      </Card>

      {viewing && (
        <Dialog open onOpenChange={v => { if (!v) setViewing(false); }}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border ${color}`}>{book.subject}</Badge>
                  {book.author && <span className="text-xs text-muted-foreground">by {book.author}</span>}
                </div>
                <DialogTitle className="text-lg font-bold leading-tight">{book.title}</DialogTitle>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 ml-2" onClick={() => setViewing(false)}>
                <X size={16} />
              </Button>
            </DialogHeader>
            <div className="flex-1 overflow-hidden min-h-0">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                style={{ minHeight: "60vh" }}
                title={book.title}
                allow="autoplay"
              />
            </div>
            <div className="px-6 py-3 border-t border-border/50 flex justify-end">
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
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (viewingNote) trackNoteRead(viewingNote.id);
  }, [viewingNote?.id]);

  const { data: notesData, isLoading: notesLoading, isError: notesError, refetch: refetchNotes } = useListNotes(
    { search: search || undefined, subject: activeSubject === "All Subjects" ? undefined : activeSubject },
    { query: { queryKey: getListNotesQueryKey({ search: search || undefined, subject: activeSubject === "All Subjects" ? undefined : activeSubject }) } }
  );

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
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={activeSubject === cat ? "default" : "outline"}
            className={`px-4 py-2 cursor-pointer shrink-0 snap-start ${
              activeSubject === cat
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setActiveSubject(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Notes Grid */}
      {activeTab === "notes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border ${color}`}>
                        {note.subject}
                      </Badge>
                      <button
                        className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <BookMarked size={16} />
                      </button>
                    </div>
                    <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {note.fileType === "link"
                        ? "External link — click to open"
                        : note.fileType && note.fileType !== "text"
                          ? "Attached file — click to view"
                          : note.content
                            ? `${note.content.substring(0, 120)}...`
                            : "No preview available"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4 flex items-center gap-4">
                      {note.content
                        ? <span className="flex items-center gap-1"><FileText size={12} /> {Math.ceil(note.content.length / 1000)} pages</span>
                        : <span className="flex items-center gap-1"><FileText size={12} /> {note.fileType || "text"}</span>}
                      <span className="flex items-center gap-1"><Download size={12} /> {note.downloadCount ?? 0} dl</span>
                    </p>
                    <Button className="w-full text-xs" variant="secondary" size="sm">
                      {note.fileType === "link" ? "Open Link" : note.fileType && note.fileType !== "text" ? "View File" : "Read Note"}
                    </Button>
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
      {activeTab === "pyqs" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading ? (
            Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)
          ) : !pyqsData || pyqsData.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
              No PYQs found. {activeSubject !== "All Subjects" || search ? "Try adjusting your search or filter." : "Admin hasn't uploaded any PYQs yet."}
            </div>
          ) : (
            pyqsData.map((pyq) => <PYQCard key={pyq.id} pyq={pyq} />)
          )}
        </div>
      )}
    </div>
  );
}
