import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useListPdfs, getListPdfsQueryKey } from "@workspace/api-client-react";
import { Search, Filter, Download, BookOpen, X, ExternalLink, FileText, ChevronDown, WifiOff, HardDrive, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { savePdfBlob, getPdfBlob, deletePdfBlob, listSavedPdfIds } from "@/lib/pdfOfflineCache";

const SUBJECTS = ["All", "Anatomy", "Physiology", "Biochemistry"];

type Pdf = {
  id: number;
  title: string;
  subject: string;
  professor?: string | null;
  year?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  pages?: number | null;
  size?: string | null;
  downloadCount?: number;
};

// ─── Google Drive URL helpers ─────────────────────────────────────────────────
function getDriveFileId(url: string): string | null {
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function isApiServeUrl(url: string): boolean {
  return url.includes("/api/upload/pdf/serve/");
}

function withAuthToken(url: string): string {
  const token = localStorage.getItem("mission_token");
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

function getEmbedUrl(url: string): string {
  const id = getDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  if (isApiServeUrl(url)) return withAuthToken(url);
  return url;
}

function getOpenUrl(url: string): string {
  const id = getDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/view`;
  if (isApiServeUrl(url)) return withAuthToken(url);
  return url;
}

function getDownloadUrl(url: string): string {
  const id = getDriveFileId(url);
  if (id) return `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
  if (isApiServeUrl(url)) return withAuthToken(url);
  return url;
}

// ─── Offline PDF Viewer Modal ─────────────────────────────────────────────────
function PdfViewerModal({ pdf, onClose }: { pdf: Pdf; onClose: () => void }) {
  const [embedFailed, setEmbedFailed] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [savedBlob, setSavedBlob] = React.useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [cacheChecked, setCacheChecked] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveProgress, setSaveProgress] = React.useState(0);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Track online/offline
  React.useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Check IndexedDB cache BEFORE rendering the iframe so we never start a
  // network fetch when a local copy already exists.
  React.useEffect(() => {
    let revoke: string | null = null;
    getPdfBlob(pdf.id)
      .then((entry) => {
        if (entry) {
          setSavedBlob(entry.blob);
          setIsSaved(true);
          const url = URL.createObjectURL(entry.blob);
          revoke = url;
          setBlobUrl(url);
        }
      })
      .catch(() => {})
      .finally(() => setCacheChecked(true));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf.id]);

  const handleSaveOffline = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveProgress(0);
    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem("mission_token") ?? "";
      const res = await fetch(`/api/pdfs/${pdf.id}/proxy`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const total = Number(res.headers.get("content-length") ?? 0);
      const reader = res.body!.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) setSaveProgress(Math.round((received / total) * 100));
      }

      const blob = new Blob(chunks, { type: "application/pdf" });
      await savePdfBlob(pdf.id, blob, pdf.title);

      const url = URL.createObjectURL(blob);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(url);
      setSavedBlob(blob);
      setIsSaved(true);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        const msg = err?.message ?? "";
        if (msg.includes("valid PDF") || msg.includes("restricted") || msg.includes("sign-in")) {
          setSaveError("This PDF can't be saved offline — it's a Google Drive file that requires a sign-in to download directly. Use the Open button to read it online.");
        } else {
          setSaveError("Could not save for offline. Try again when connected.");
        }
      }
    } finally {
      setSaving(false);
      setSaveProgress(0);
    }
  };

  const handleDeleteSaved = async () => {
    await deletePdfBlob(pdf.id).catch(() => {});
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setSavedBlob(null);
    setIsSaved(false);
  };

  // Download via proxy → blob → <a download> so it stays in-app on mobile
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadPdfViaProxy(pdf);
    } catch {
      // Proxy failed (e.g. Google Drive restriction) — fall back to the
      // native Drive download URL which works directly in the browser.
      window.open(getDownloadUrl(pdf.url), "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  const embedUrl = getEmbedUrl(pdf.url);
  const openUrl = getOpenUrl(pdf.url);

  // When offline and no local copy — show a helpful screen instead of black iframe
  const showOfflineWall = isOffline && !blobUrl;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border/50 flex-row items-center justify-between">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold truncate">{pdf.title}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pdf.subject}{pdf.professor ? ` · ${pdf.professor}` : ""}{pdf.pages ? ` · ${pdf.pages} pages` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {/* Open in browser — for online Google Drive PDFs */}
            {!isOffline && !blobUrl && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
                <a href={openUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={13} /> Open
                </a>
              </Button>
            )}
            {/* Open from local blob — shows PDF in new tab, works on all mobile browsers */}
            {blobUrl && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                onClick={() => window.open(blobUrl, "_blank", "noopener")}>
                <ExternalLink size={13} /> Open
              </Button>
            )}
            {/* Download via proxy → blob → <a download> — stays in-app on mobile */}
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
              onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {downloading ? "…" : "Download"}
            </Button>
            {/* Save / remove offline copy */}
            {!isOffline && !isSaved && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
                onClick={handleSaveOffline}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    {saveProgress > 0 ? `${saveProgress}%` : "Saving…"}
                  </>
                ) : (
                  <><HardDrive size={13} /> Save Offline</>
                )}
              </Button>
            )}
            {isSaved && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-emerald-500 hover:text-red-400"
                onClick={handleDeleteSaved}
                title="Remove offline copy"
              >
                <CheckCircle size={13} /> Saved
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        {saveError && (
          <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
            {saveError}
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {!cacheChecked ? (
            /* ── Waiting for IndexedDB check ── */
            <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-sm">Opening…</span>
            </div>
          ) : showOfflineWall ? (
            /* ── Offline, no local copy ── */
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
              <div className="rounded-full bg-amber-500/10 p-5">
                <WifiOff size={40} className="text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-lg">No offline copy saved</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  You're offline. Connect to the internet to read this PDF, or save it next time you're online.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 max-w-xs w-full text-left">
                <p className="font-medium text-foreground">How to read PDFs offline:</p>
                <p>1. Come back online</p>
                <p>2. Open this PDF</p>
                <p>3. Tap <strong>Save Offline</strong> in the toolbar</p>
                <p>4. Next time you open it, it works offline ✓</p>
              </div>
            </div>
          ) : blobUrl ? (
            /* ── Offline / saved copy — blob URLs can't render in iframes on mobile.
               Use <object> which works on desktop, with a full-screen "Open" CTA
               as the universal mobile fallback (rendered inside <object>'s fallback
               slot AND as an overlay so it's always visible on phones). ── */
            <div className="relative w-full h-full flex flex-col">
              <object
                data={blobUrl}
                type="application/pdf"
                className="w-full flex-1 border-0"
                style={{ minHeight: 0 }}
              >
                {/* This content shows when <object> can't render (iOS, etc.) */}
                <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center py-12">
                  <div className="rounded-full bg-primary/10 p-5">
                    <FileText size={40} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{pdf.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">Saved offline · {pdf.subject}</p>
                  </div>
                  <Button className="gap-2 px-6" onClick={() => window.open(blobUrl, "_blank", "noopener")}>
                    <BookOpen size={16} /> Open PDF
                  </Button>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Tap <strong>Open PDF</strong> to read it — or use the <strong>Open</strong> button in the toolbar above.
                  </p>
                </div>
              </object>
            </div>
          ) : embedFailed ? (
            /* ── Online embed failed ── */
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
              <FileText size={48} className="text-primary/50" />
              <div>
                <p className="font-semibold text-lg">{pdf.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{pdf.subject}{pdf.pages ? ` · ${pdf.pages} pages` : ""}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Button className="flex-1 gap-2" asChild>
                  <a href={openUrl} target="_blank" rel="noopener noreferrer">
                    <BookOpen size={16} /> Read PDF
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadPdf} disabled={downloading}>
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Preview unavailable — tap "Read PDF" to open in your browser.</p>
            </div>
          ) : (
            /* ── Online embed (Google Drive preview / server URL) ── */
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              title={pdf.title}
              allow="fullscreen"
              onError={() => setEmbedFailed(true)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Fetch PDF via proxy → trigger <a download> click → optionally save to IndexedDB.
// Keeps the download in-app on mobile (no external browser).
// Throws if the proxy fails so callers can fall back to a browser open.
async function downloadPdfViaProxy(pdf: Pdf, { saveOffline = true } = {}) {
  const token = localStorage.getItem("mission_token") ?? "";
  // Reuse cached blob if we already saved it
  const cached = await getPdfBlob(pdf.id).catch(() => null);
  let blob: Blob;
  if (cached) {
    blob = cached.blob;
  } else {
    const res = await fetch(`/api/pdfs/${pdf.id}/proxy`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      // Try to surface a meaningful message from the server
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `Proxy error ${res.status}`);
    }
    blob = await res.blob();
    // Verify we actually got a PDF (magic bytes %PDF) before saving
    if (blob.size < 4) throw new Error("Empty response from server");
    const header = await blob.slice(0, 4).arrayBuffer();
    const magic = String.fromCharCode(...new Uint8Array(header));
    if (magic !== "%PDF") throw new Error("Server did not return a valid PDF");
    // Cache it for offline use while we're at it
    if (saveOffline) {
      savePdfBlob(pdf.id, blob, pdf.title).catch(() => {});
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pdf.title.replace(/[^a-z0-9 ._-]/gi, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  trackDownload(pdf.id);
}

async function trackDownload(pdfId: number) {
  try {
    const { apiFetch } = await import("@/lib/apiFetch");
    await apiFetch(`/api/pdfs/${pdfId}/download`, { method: "POST" });
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[trackDownload] Failed to record download:", e);
  }
}

export default function StudentPDFs() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [viewingPdf, setViewingPdf] = useState<Pdf | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const activeSubject = subject === "All" ? undefined : subject;
  const { data: pdfsData, isLoading } = useListPdfs(
    { search: search || undefined, subject: activeSubject },
    { query: { queryKey: getListPdfsQueryKey({ search: search || undefined, subject: activeSubject }) } }
  );

  // Load which PDFs are already saved for offline
  useEffect(() => {
    listSavedPdfIds().then((ids) => setSavedIds(new Set(ids))).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {viewingPdf && (
        <PdfViewerModal
          pdf={viewingPdf}
          onClose={() => {
            setViewingPdf(null);
            // Refresh saved IDs after modal closes (user may have saved/deleted)
            listSavedPdfIds().then((ids) => setSavedIds(new Set(ids))).catch(() => {});
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDF Library</h1>
          <p className="text-muted-foreground">Standard textbooks &amp; reference materials.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by title, subject..."
              className="pl-9 bg-muted/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={subject !== "All" ? "default" : "outline"} className="shrink-0 gap-1.5 bg-muted/50 px-3">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{subject}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {SUBJECTS.map(s => (
                <DropdownMenuItem
                  key={s}
                  className={subject === s ? "bg-primary/10 text-primary font-medium" : ""}
                  onClick={() => setSubject(s)}
                >
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText size={16} className="text-primary" /> All PDFs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)
          ) : !pdfsData || (Array.isArray(pdfsData) ? pdfsData.length === 0 : !(pdfsData as any).pdfs?.length) ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
              No PDFs yet. Check back once your admin uploads study materials.
            </div>
          ) : (
            (Array.isArray(pdfsData) ? pdfsData : (pdfsData as any).pdfs ?? []).map((pdf: any) => (
              <div key={pdf.id} className="group relative">
                <div className="aspect-[3/4] bg-muted/30 rounded-xl border border-border/50 overflow-hidden relative shadow-md transition-transform group-hover:-translate-y-1">
                  {pdf.thumbnailUrl ? (
                    <img src={pdf.thumbnailUrl} alt={pdf.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center p-4 text-center border-l-4 border-l-primary shadow-inner">
                      <span className="font-bold text-2xl opacity-40">{pdf.title.substring(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  {/* Offline saved indicator */}
                  {savedIds.has(pdf.id) && (
                    <div className="absolute top-2 right-2 bg-emerald-500/90 text-white rounded-full p-1" title="Saved for offline">
                      <HardDrive size={10} />
                    </div>
                  )}
                  {/* Hover overlay — desktop only, opens modal */}
                  <div
                    className="absolute inset-0 cursor-pointer hidden md:block"
                    onClick={() => setViewingPdf(pdf as Pdf)}
                  />
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{pdf.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pdf.professor || "Unknown Author"}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-card">{pdf.subject}</Badge>
                    {pdf.pages && <span className="text-[10px] text-muted-foreground">{pdf.pages} pages</span>}
                  </div>
                  {/* Action buttons — always visible on all screen sizes */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1.5"
                      onClick={() => setViewingPdf(pdf as Pdf)}
                    >
                      <BookOpen size={13} /> Read
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 h-8 text-xs gap-1.5"
                      onClick={() => downloadPdfViaProxy(pdf as Pdf).catch(() => window.open(getDownloadUrl((pdf as Pdf).url), "_blank", "noopener,noreferrer"))
                      }
                    >
                      <Download size={13} /> Download
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
