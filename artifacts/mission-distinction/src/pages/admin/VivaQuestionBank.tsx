import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Sparkles, Save, Upload, FileText, Trash2, BookOpen } from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"] as const;
type Subject = (typeof SUBJECTS)[number];

const EXAMINER_NAMES: Record<Subject, string> = {
  Anatomy: "Dr. Aswini",
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
  const [uploading, setUploading] = useState(false);
  const [uploadingBook, setUploadingBook] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);
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

  async function handlePdfSelected(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/admin/viva-sources/extract-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to extract text from PDF");
        return;
      }
      setDraft((prev) => {
        const trimmedPrev = prev.trim();
        return trimmedPrev ? `${trimmedPrev}\n\n${data.text}` : data.text;
      });
      toast.success(
        data.truncated
          ? `Extracted text from "${file.name}" (truncated to fit). Review below and click Save Notes.`
          : `Extracted text from "${file.name}". Review below and click Save Notes.`
      );
    } catch {
      toast.error("Failed to extract text from PDF");
    } finally {
      setUploading(false);
    }
  }

  // Books upload straight from the browser to object storage via a signed
  // URL, bypassing the Replit proxy's request body-size limit — the old
  // multipart path silently failed for anything much above ~100MB even
  // though the server's multer config allowed up to 500MB. Files are
  // processed one at a time (not in parallel) to keep this predictable and
  // to surface a clear per-file error if one large upload fails.
  async function uploadOneBook(file: File): Promise<{ fileName: string } | { fileName: string; error: string }> {
    try {
      const urlRes = await apiFetch(`/api/admin/viva-sources/${activeSubject}/documents/request-upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        return { fileName: file.name, error: urlData.error ?? "Failed to prepare upload." };
      }

      const putRes = await fetch(urlData.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!putRes.ok) {
        return { fileName: file.name, error: "Upload to storage failed. Please try again." };
      }

      const processRes = await apiFetch(`/api/admin/viva-sources/${activeSubject}/documents/process-uploaded`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectName: urlData.objectName, fileName: file.name }),
      });
      const processData = await processRes.json();
      if (!processRes.ok) {
        return { fileName: file.name, error: processData.error ?? "Failed to process this file." };
      }
      return { fileName: processData.saved?.fileName ?? file.name };
    } catch {
      return { fileName: file.name, error: "Failed to upload this file. Please try again." };
    }
  }

  async function handleBooksSelected(files: File[]) {
    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      toast.error("Please select at least one PDF file.");
      return;
    }
    if (pdfFiles.length < files.length) {
      toast.error("Some selected files were skipped — only PDF files are allowed.");
    }
    setUploadingBook(true);
    try {
      const saved: string[] = [];
      const failed: Array<{ fileName: string; error: string }> = [];
      for (const file of pdfFiles) {
        const result = await uploadOneBook(file);
        if ("error" in result) failed.push(result);
        else saved.push(result.fileName);
      }
      if (saved.length > 0) {
        toast.success(
          saved.length === 1
            ? `"${saved[0]}" added to the ${activeSubject} book library.`
            : `${saved.length} books added to the ${activeSubject} book library.`
        );
      }
      failed.forEach((f) => toast.error(`"${f.fileName}": ${f.error}`));
      if (saved.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["viva-source-documents", activeSubject] });
      }
    } finally {
      setUploadingBook(false);
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
          <Mic className="w-6 h-6 text-primary" /> Practical Hub — Viva Examiners
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Each subject has its own named AI examiner who writes and asks the viva questions live —{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Anatomy}</span> (Anatomy),{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Physiology}</span> (Physiology), and{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Biochemistry}</span> (Biochemistry).
          You don't need to write exact questions. Optionally share focus areas or reference notes below — the examiner
          will use them as inspiration while still writing every question in its own words.
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>
                {EXAMINER_NAMES[activeSubject]} generates {activeSubject} questions itself — notes below are optional guidance, not a script.
              </span>
            </div>
            <Textarea
              placeholder={`e.g. Focus on lower limb osteology and femoral triangle this term; emphasize NEET PG high-yield topics for ${activeSubject}...`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bg-muted/30 resize-none min-h-[220px]"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfSelected(file);
                e.target.value = "";
              }}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 w-fit"
              >
                {uploading ? (
                  <>
                    <FileText className="w-4 h-4 animate-pulse" /> Extracting text…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload PDF (textbook/reference)
                  </>
                )}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Uploading a PDF extracts its text and appends it to the notes above — nothing is saved until you click "Save Notes".
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>
              {activeSubject} book library — upload full textbooks/reference books. {EXAMINER_NAMES[activeSubject]} draws
              relevant excerpts from these automatically while asking questions, so the whole book stays usable without
              being crammed into a single notes field.
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
            <p className="text-sm text-muted-foreground">No books uploaded yet for {activeSubject}.</p>
          )}

          <input
            ref={bookInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) handleBooksSelected(files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingBook}
            onClick={() => bookInputRef.current?.click()}
            className="gap-1.5 w-fit"
          >
            {uploadingBook ? (
              <>
                <FileText className="w-4 h-4 animate-pulse" /> Uploading & extracting…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload textbooks (PDF, up to 500MB each)
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Select multiple PDFs to upload them all at once (up to 10 files, 500MB each). Full books are stored completely
            (no truncation) and are added to the library immediately — no separate save step.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
