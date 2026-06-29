import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useListPdfs, getListPdfsQueryKey } from "@workspace/api-client-react";
import { Search, Filter, Download, BookOpen, X, ExternalLink, FileText, ChevronDown, Loader2, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────
function PdfViewerModal({ pdf, onClose }: { pdf: Pdf; onClose: () => void }) {
  const [embedFailed, setEmbedFailed] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) {
        // On mobile, programmatic <a>.click() in async context is blocked by browsers.
        // window.open is the only reliable way — browser handles the download natively.
        window.open(getDownloadUrl(pdf.url), "_blank", "noopener,noreferrer");
        trackDownload(pdf.id);
      } else {
        // Desktop: fetch via proxy → blob → <a download>
        await downloadPdfViaProxy(pdf);
      }
    } catch {
      // Proxy failed — fall back to native browser download
      window.open(getDownloadUrl(pdf.url), "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  const embedUrl = getEmbedUrl(pdf.url);
  const openUrl  = getOpenUrl(pdf.url);

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
            {/* Open in browser */}
            {!isOffline && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
                <a href={openUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={13} /> Open
                </a>
              </Button>
            )}
            {/* Download */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={handleDownloadPdf}
              disabled={downloading || isOffline}
            >
              {downloading
                ? <><Loader2 size={13} className="animate-spin" /> Downloading…</>
                : <><Download size={13} /> Download</>
              }
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden">
          {isOffline ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
              <div className="rounded-full bg-amber-500/10 p-5">
                <WifiOff size={40} className="text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-lg">You're offline</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Connect to the internet to read this PDF.
                </p>
              </div>
            </div>
          ) : embedFailed ? (
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

// Fetch PDF via proxy → blob → <a download> (desktop only).
// Throws if proxy fails so callers can fall back.
async function downloadPdfViaProxy(pdf: Pdf) {
  const token = localStorage.getItem("mission_token") ?? "";
  const res = await fetch(`/api/pdfs/${pdf.id}/proxy`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Proxy error ${res.status}`);
  }
  const blob = await res.blob();
  if (blob.size < 4) throw new Error("Empty response");
  const header = await blob.slice(0, 4).arrayBuffer();
  const magic = String.fromCharCode(...new Uint8Array(header));
  if (magic !== "%PDF") throw new Error("Not a valid PDF");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pdf.title.replace(/[^a-z0-9 ._-]/gi, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  trackDownload(pdf.id);
}

async function trackDownload(pdfId: number) {
  try {
    const { apiFetch } = await import("@/lib/apiFetch");
    await apiFetch(`/api/pdfs/${pdfId}/download`, { method: "POST" });
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[trackDownload] Failed:", e);
  }
}

export default function StudentPDFs() {
  const [search, setSearch]       = useState("");
  const [subject, setSubject]     = useState("All");
  const [viewingPdf, setViewingPdf] = useState<Pdf | null>(null);

  const activeSubject = subject === "All" ? undefined : subject;
  const { data: pdfsData, isLoading } = useListPdfs(
    { search: search || undefined, subject: activeSubject },
    { query: { queryKey: getListPdfsQueryKey({ search: search || undefined, subject: activeSubject }) } }
  );

  return (
    <div className="space-y-6">
      {viewingPdf && (
        <PdfViewerModal pdf={viewingPdf} onClose={() => setViewingPdf(null)} />
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
                  {/* Hover overlay — desktop only */}
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
                      onClick={() => {
                        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
                        if (isMobile) {
                          window.open(getDownloadUrl((pdf as Pdf).url), "_blank", "noopener,noreferrer");
                          trackDownload(pdf.id);
                        } else {
                          downloadPdfViaProxy(pdf as Pdf).catch(() =>
                            window.open(getDownloadUrl((pdf as Pdf).url), "_blank", "noopener,noreferrer")
                          );
                        }
                      }}
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
