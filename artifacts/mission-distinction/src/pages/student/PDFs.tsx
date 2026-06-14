import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListPdfs, getListPdfsQueryKey } from "@workspace/api-client-react";
import { Search, Filter, Download, BookOpen, X, ExternalLink, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

function PdfViewerModal({ pdf, onClose }: { pdf: Pdf; onClose: () => void }) {
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdf.url)}&embedded=true`;
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
              <a href={pdf.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} /> Open Original
              </a>
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 relative">
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={pdf.title}
            allow="fullscreen"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentPDFs() {
  const [search, setSearch] = useState("");
  const [viewingPdf, setViewingPdf] = useState<Pdf | null>(null);

  const { data: pdfsData, isLoading } = useListPdfs(
    { search: search || undefined },
    { query: { queryKey: getListPdfsQueryKey({ search: search || undefined }) } }
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
          <Button variant="outline" size="icon" className="shrink-0 bg-muted/50">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText size={16} className="text-primary" /> All PDFs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)
          ) : !pdfsData?.pdfs || pdfsData.pdfs.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
              No PDFs yet. Check back once your admin uploads study materials.
            </div>
          ) : (
            pdfsData.pdfs.map((pdf) => (
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
                    <Button size="sm" variant="secondary" className="w-full" asChild>
                      <a href={pdf.url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </a>
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
