import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useListPdfs, getListPdfsQueryKey } from "@workspace/api-client-react";
import { Search, Filter, Download, BookOpen, X, ExternalLink, FileText, ChevronDown } from "lucide-react";
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

/** True when the URL is served by our own API (needs ?token= for iframe auth) */
function isApiServeUrl(url: string): boolean {
  return url.includes("/api/upload/pdf/serve/");
}

/**
 * Append the JWT token as a query param so our /pdf/serve/:fileName endpoint
 * can authenticate iframe requests (which can't set Authorization headers).
 */
function withAuthToken(url: string): string {
  const token = localStorage.getItem("mission_token");
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

/** URL to embed in an iframe — works for Drive, Cloudinary, and GCS serve URLs */
function getEmbedUrl(url: string): string {
  const id = getDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  if (isApiServeUrl(url)) return withAuthToken(url);
  // Cloudinary or any other direct PDF URL — embed directly
  return url;
}

/** URL to open in browser — Drive view page or direct URL */
function getOpenUrl(url: string): string {
  const id = getDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/view`;
  if (isApiServeUrl(url)) return withAuthToken(url);
  return url;
}

/** URL for downloading — uses drive.usercontent.google.com which returns
 *  application/octet-stream directly (no redirect, no warning page). */
function getDownloadUrl(url: string): string {
  const id = getDriveFileId(url);
  if (id) return `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
  if (isApiServeUrl(url)) return withAuthToken(url);
  return url;
}

function PdfViewerModal({ pdf, onClose }: { pdf: Pdf; onClose: () => void }) {
  const [embedFailed, setEmbedFailed] = React.useState(false);

  const embedUrl = getEmbedUrl(pdf.url);
  const openUrl = getOpenUrl(pdf.url);
  const downloadUrl = getDownloadUrl(pdf.url);

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
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
              <a href={openUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} /> Open
              </a>
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download size={13} /> Download
              </a>
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 relative overflow-hidden">
          {embedFailed ? (
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
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download size={16} /> Download
                  </a>
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

  const activeSubject = subject === "All" ? undefined : subject;
  const { data: pdfsData, isLoading } = useListPdfs(
    { search: search || undefined, subject: activeSubject },
    { query: { queryKey: getListPdfsQueryKey({ search: search || undefined, subject: activeSubject }) } }
  );

  return (
    <div className="space-y-6">
      {viewingPdf && <PdfViewerModal pdf={viewingPdf} onClose={() => setViewingPdf(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDF Library</h1>
          <p className="text-muted-foreground">Standard textbooks & reference materials.</p>
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
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                    <Button size="sm" className="w-full" onClick={() => setViewingPdf(pdf as Pdf)}>
                      <BookOpen className="mr-2 h-4 w-4" /> Read
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => { trackDownload(pdf.id); window.open(getDownloadUrl(pdf.url), "_blank", "noopener,noreferrer"); }}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{pdf.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pdf.professor || "Unknown Author"}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-card">{pdf.subject}</Badge>
                    {pdf.pages && <span className="text-[10px] text-muted-foreground">{pdf.pages} pages</span>}
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
