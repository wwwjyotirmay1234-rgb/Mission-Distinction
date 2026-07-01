import React, { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { customFetch, getListNotesQueryKey, getListPdfsQueryKey, getListBooksQueryKey } from "@workspace/api-client-react";
import { UploadCloud, FileIcon, Image as ImageIcon, X, CheckCircle2, AlertCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

type Destination = "pdfs" | "notes" | "books";
type Status = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  key: string;
  file: File;
  title: string;
  subject: string;
  author: string;
  destination: Destination;
  status: Status;
  progress: number;
  error?: string;
}

function guessSubject(name: string): string {
  const n = name.toLowerCase();
  if (/(anat|osteo|myolog|limb|thorax|abdomen|pelvis|neuroanat)/.test(n)) return "Anatomy";
  if (/(physio|cvs|renal|resp|nerve\s*physio|endocrine)/.test(n)) return "Physiology";
  if (/(biochem|enzyme|metabolism|vitamin)/.test(n)) return "Biochemistry";
  return "";
}

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "");
  const spaced = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

function guessDestination(file: File): Destination {
  if (file.type === "application/pdf") return "pdfs";
  return "notes";
}

function isAllowedFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
  );
}

async function uploadPdfDirect(file: File, onProgress: (p: number) => void): Promise<string> {
  const token = localStorage.getItem("mission_token");
  const presignResp = await fetch("/api/upload/pdf/request-upload-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ fileName: file.name }),
  });
  if (!presignResp.ok) {
    const data = await presignResp.json().catch(() => ({}));
    throw new Error((data as any).error || "Failed to get upload URL");
  }
  const { signedUrl, serveUrl } = await presignResp.json();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(serveUrl); else reject(new Error(`Upload failed (${xhr.status})`)); };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

async function uploadNoteFileDirect(file: File, onProgress: (p: number) => void): Promise<{ url: string; fileType: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/note-file");
    xhr.withCredentials = true;
    const token = localStorage.getItem("mission_token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try { const data = JSON.parse(xhr.responseText); resolve({ url: data.url, fileType: data.fileType }); }
        catch { reject(new Error("Invalid response from server")); }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).error || `Upload failed (${xhr.status})`)); }
        catch { reject(new Error(`Upload failed (${xhr.status})`)); }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

let keyCounter = 0;

export default function QuickUpload() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const addFiles = useCallback((files: FileList | File[]) => {
    const items: QueueItem[] = [];
    let skipped = 0;
    Array.from(files).forEach((file) => {
      if (!isAllowedFile(file)) { skipped++; return; }
      items.push({
        key: `f${Date.now()}_${keyCounter++}`,
        file,
        title: titleFromFilename(file.name),
        subject: guessSubject(file.name),
        author: "",
        destination: guessDestination(file),
        status: "pending",
        progress: 0,
      });
    });
    if (skipped > 0) toast.error(`Skipped ${skipped} file(s) — only PDF and image files are supported.`);
    if (items.length > 0) setQueue((q) => [...q, ...items]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const updateItem = (key: string, patch: Partial<QueueItem>) => {
    setQueue((q) => q.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const removeItem = (key: string) => setQueue((q) => q.filter((it) => it.key !== key));

  const uploadOne = async (item: QueueItem) => {
    updateItem(item.key, { status: "uploading", progress: 0, error: undefined });
    try {
      if (!item.title.trim() || !item.subject.trim()) {
        throw new Error("Title and subject are required.");
      }
      if (item.destination === "pdfs") {
        const url = await uploadPdfDirect(item.file, (p) => updateItem(item.key, { progress: p }));
        await customFetch("/api/pdfs", { method: "POST", body: JSON.stringify({ title: item.title, subject: item.subject, url }) });
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
      } else if (item.destination === "books") {
        const url = await uploadPdfDirect(item.file, (p) => updateItem(item.key, { progress: p }));
        await customFetch("/api/books", { method: "POST", body: JSON.stringify({ title: item.title, subject: item.subject, author: item.author || undefined, url }) });
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      } else {
        const { url, fileType } = await uploadNoteFileDirect(item.file, (p) => updateItem(item.key, { progress: p }));
        await customFetch("/api/notes", { method: "POST", body: JSON.stringify({ title: item.title, subject: item.subject, fileUrl: url, fileType }) });
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      }
      updateItem(item.key, { status: "done", progress: 100 });
    } catch (e: any) {
      updateItem(item.key, { status: "error", error: e.message || "Upload failed" });
    }
  };

  const uploadAll = async () => {
    const pending = queue.filter((it) => it.status === "pending" || it.status === "error");
    if (pending.length === 0) return;
    const missing = pending.find((it) => !it.title.trim() || !it.subject.trim());
    if (missing) { toast.error("Every file needs a title and subject before uploading."); return; }
    setBusy(true);
    for (const item of pending) {
      await uploadOne(item);
    }
    setBusy(false);
    const results = queue.filter((it) => pending.some((p) => p.key === it.key));
    toast.success("Upload batch finished. Check the list below for any errors.");
  };

  const doneCount = queue.filter((i) => i.status === "done").length;
  const errorCount = queue.filter((i) => i.status === "error").length;

  const destLabel = (d: Destination) => d === "pdfs" ? "PDF Library" : d === "books" ? "Books Library" : "Notes";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" /> Quick Upload
        </h1>
        <p className="text-muted-foreground">Drag & drop multiple PDFs or images at once — they'll be sorted into PDFs, Notes, or Books automatically.</p>
      </div>

      <Card
        className={`bg-card/40 border-2 border-dashed transition-colors p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-border/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
        />
        <UploadCloud className="h-10 w-10 text-primary" />
        <div>
          <p className="font-medium">Drop files here, or click to browse</p>
          <p className="text-sm text-muted-foreground">PDF and image files · multiple files at once</p>
        </div>
      </Card>

      {queue.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {queue.length} file(s) queued
              {doneCount > 0 && <span className="text-green-400"> · {doneCount} done</span>}
              {errorCount > 0 && <span className="text-destructive"> · {errorCount} failed</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setQueue((q) => q.filter((it) => it.status !== "done"))} disabled={busy || doneCount === 0}>
                Clear completed
              </Button>
              <Button onClick={uploadAll} disabled={busy || queue.every((it) => it.status === "done")}>
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</> : "Upload All"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <Card key={item.key} className="bg-card/40 border-border/40 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-3 sm:w-16 shrink-0">
                    <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {item.file.type === "application/pdf" ? <FileIcon size={18} /> : <ImageIcon size={18} />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={item.title}
                        disabled={item.status === "uploading" || item.status === "done"}
                        onChange={(e) => updateItem(item.key, { title: e.target.value })}
                        className="bg-background/50 h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subject</Label>
                      <Select
                        value={item.subject}
                        onValueChange={(v) => updateItem(item.key, { subject: v })}
                        disabled={item.status === "uploading" || item.status === "done"}
                      >
                        <SelectTrigger className="bg-background/50 h-9"><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Goes to</Label>
                      <Select
                        value={item.destination}
                        onValueChange={(v) => updateItem(item.key, { destination: v as Destination })}
                        disabled={item.status === "uploading" || item.status === "done" || item.file.type !== "application/pdf"}
                      >
                        <SelectTrigger className="bg-background/50 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {item.file.type === "application/pdf" ? (
                            <>
                              <SelectItem value="pdfs">PDF Library</SelectItem>
                              <SelectItem value="books">Books Library</SelectItem>
                            </>
                          ) : (
                            <SelectItem value="notes">Notes</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {item.destination === "books" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Author (optional)</Label>
                        <Input
                          value={item.author}
                          disabled={item.status === "uploading" || item.status === "done"}
                          onChange={(e) => updateItem(item.key, { author: e.target.value })}
                          className="bg-background/50 h-9"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:w-40 shrink-0 gap-2">
                    <Badge variant="outline" className="text-xs">{destLabel(item.destination)}</Badge>
                    {item.status === "pending" && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => removeItem(item.key)}>
                        <X size={13} className="mr-1" /> Remove
                      </Button>
                    )}
                    {item.status === "uploading" && (
                      <div className="w-full sm:w-32">
                        <Progress value={item.progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1 text-right">{item.progress}%</p>
                      </div>
                    )}
                    {item.status === "done" && (
                      <div className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle2 size={14} /> Uploaded</div>
                    )}
                    {item.status === "error" && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-destructive text-xs"><AlertCircle size={14} /> Failed</div>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => uploadOne(item)}>Retry</Button>
                      </div>
                    )}
                  </div>
                </div>
                {item.error && <p className="text-xs text-destructive mt-2">{item.error}</p>}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
