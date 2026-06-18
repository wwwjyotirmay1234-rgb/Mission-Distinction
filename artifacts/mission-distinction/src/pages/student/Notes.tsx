import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListNotes, getListNotesQueryKey, customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, FileText, Download, BookMarked, X, ChevronLeft, BookOpen, ExternalLink, BookText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Note = {
  id: number;
  title: string;
  subject: string;
  content: string;
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

const SUBJECT_COLORS: Record<string, string> = {
  Anatomy:       "border-blue-500/30 text-blue-400 bg-blue-500/10",
  Physiology:    "border-red-500/30 text-red-400 bg-red-500/10",
  Biochemistry:  "border-green-500/30 text-green-400 bg-green-500/10",
  Pharmacology:  "border-orange-500/30 text-orange-400 bg-orange-500/10",
  Pathology:     "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
};
const DEFAULT_COLOR = "border-purple-500/30 text-purple-400 bg-purple-500/10";

function NoteViewerModal({ note, onClose }: { note: Note; onClose: () => void }) {
  const color = SUBJECT_COLORS[note.subject] || DEFAULT_COLOR;
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <article className="prose prose-invert prose-sm max-w-none">
            <div
              className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans"
              style={{ lineHeight: "1.8" }}
            >
              {note.content}
            </div>
          </article>
        </div>

        <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {Math.ceil(note.content.length / 1000)} pages · {note.downloadCount || 0} downloads
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

const CATEGORIES = ["All Subjects", "Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"];

function trackNoteRead(noteId: number) {
  customFetch(`/api/notes/${noteId}/read`, { method: "POST" }).catch(() => {});
}

async function fetchBooks(search?: string, subject?: string): Promise<Book[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (subject) params.set("subject", subject);
  const qs = params.toString();
  const res = await customFetch(`/api/books${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load books");
  return res.json();
}

function BookCard({ book }: { book: Book }) {
  const color = SUBJECT_COLORS[book.subject] || DEFAULT_COLOR;
  return (
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
        <Button
          className="w-full text-xs gap-1.5 mt-auto"
          size="sm"
          onClick={() => window.open(book.url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink size={12} /> Read Book
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StudentNotes() {
  const [activeTab, setActiveTab] = useState<"notes" | "books">("notes");
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState("All Subjects");
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (viewingNote) trackNoteRead(viewingNote.id);
  }, [viewingNote?.id]);

  const { data: notesData, isLoading: notesLoading } = useListNotes(
    { search: search || undefined, subject: activeSubject === "All Subjects" ? undefined : activeSubject },
    { query: { queryKey: getListNotesQueryKey({ search: search || undefined, subject: activeSubject === "All Subjects" ? undefined : activeSubject }) } }
  );

  const { data: booksData, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["books", search, activeSubject],
    queryFn: () => fetchBooks(search || undefined, activeSubject === "All Subjects" ? undefined : activeSubject),
    enabled: activeTab === "books",
    staleTime: 30_000,
  });

  const isLoading = activeTab === "notes" ? notesLoading : booksLoading;

  return (
    <div className="space-y-6">
      {viewingNote && <NoteViewerModal note={viewingNote} onClose={() => setViewingNote(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes & Books Library</h1>
          <p className="text-muted-foreground">High-yield notes and textbooks crafted for distinction.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={activeTab === "notes" ? "Search notes..." : "Search books..."}
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
          ) : !notesData?.notes || notesData.notes.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
              No notes found. Try adjusting your search or filter.
            </div>
          ) : (
            notesData.notes.map((note) => {
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
                      {note.content.substring(0, 120)}...
                    </p>
                    <p className="text-xs text-muted-foreground mb-4 flex items-center gap-4">
                      <span className="flex items-center gap-1"><FileText size={12} /> {Math.ceil(note.content.length / 1000)} pages</span>
                      <span className="flex items-center gap-1"><Download size={12} /> {note.downloadCount} dl</span>
                    </p>
                    <Button className="w-full text-xs" variant="secondary" size="sm">
                      Read Note
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
    </div>
  );
}
