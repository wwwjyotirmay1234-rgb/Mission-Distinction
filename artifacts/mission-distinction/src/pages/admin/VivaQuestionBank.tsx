import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Save, FileText, Trash2, BookOpen } from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"] as const;
type Subject = (typeof SUBJECTS)[number];

const EXAMINER_NAMES: Record<Subject, string> = {
  Anatomy: "Dr. Mamata",
  Physiology: "Dr. Rajiv",
  Biochemistry: "Dr. Madhu",
};

interface VivaSource {
  subject: Subject;
  sourceText: string;
  updatedAt: string | null;
}

interface VivaBookDocument {
  id: number;
  fileName: string;
  charCount: number;
  pages: number | null;
  createdAt: string;
}

export default function VivaQuestionBank() {
  const [activeSubject, setActiveSubject] = useState<Subject>("Anatomy");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: sources, isLoading } = useQuery<VivaSource[]>({
    queryKey: ["viva-sources"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/viva-sources");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: books, isLoading: booksLoading } = useQuery<VivaBookDocument[]>({
    queryKey: ["viva-source-documents", activeSubject],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/viva-sources/${activeSubject}/documents`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const activeSource = sources?.find((s) => s.subject === activeSubject);

  useEffect(() => {
    setDraft(activeSource?.sourceText ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject, sources]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/viva-sources/${activeSubject}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: draft.trim() }),
      });
      if (res.ok) {
        toast.success("Source notes saved");
        queryClient.invalidateQueries({ queryKey: ["viva-sources"] });
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Failed to save source notes");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBook(id: number) {
    setDeletingBookId(id);
    try {
      const res = await apiFetch(`/api/admin/viva-sources/${activeSubject}/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Book removed");
        queryClient.invalidateQueries({ queryKey: ["viva-source-documents", activeSubject] });
      } else {
        toast.error("Failed to remove book");
      }
    } finally {
      setDeletingBookId(null);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary" /> Viva Question Bank
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage source notes for each subject's viva examiner —{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Anatomy}</span> (Anatomy),{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Physiology}</span> (Physiology), and{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Biochemistry}</span> (Biochemistry).
          Share focus areas or reference notes below as optional guidance.
        </p>
      </div>

      <Tabs value={activeSubject} onValueChange={(v) => setActiveSubject(v as Subject)}>
        <TabsList>
          {SUBJECTS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-4">
            <Textarea
              placeholder={`e.g. Focus on lower limb osteology and femoral triangle this term; emphasize NEET PG high-yield topics for ${activeSubject}...`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bg-muted/30 resize-none min-h-[220px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>
              {activeSubject} book library — textbooks and reference books uploaded for {EXAMINER_NAMES[activeSubject]}.
            </span>
          </div>

          {booksLoading ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : books && books.length > 0 ? (
            <ul className="space-y-2">
              {books.map((book) => (
                <li
                  key={book.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{book.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {book.pages ? `${book.pages} pages · ` : ""}
                        {book.charCount.toLocaleString()} characters extracted
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deletingBookId === book.id}
                    onClick={() => handleDeleteBook(book.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No books in the {activeSubject} library yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
