import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { Loader2, Trash2, Sparkles, RefreshCw, Image as ImageIcon, FileText, DatabaseZap } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ANATOMY_IMAGE_CATEGORIES = ["Histology", "Bone", "Visceral", "Section Anatomy", "Prosection"] as const;

type AvailablePdf = {
  objectName: string;
  displayName: string;
  size: number;
  updated: string | null;
};

type AnatomyImageRow = {
  id: number;
  category: string;
  title: string;
  side: string | null;
  region: string | null;
  notes: string | null;
  objectName: string;
  sourceFileName: string;
  sourcePage: number;
  createdAt: string;
};

function getImageUrl(id: number): string {
  const token = localStorage.getItem("mission_token");
  return `/api/anatomy-viva-images/serve/${id}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function AnatomyVivaImages() {
  const [pdfs, setPdfs] = useState<AvailablePdf[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<Set<string>>(new Set());
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  const [images, setImages] = useState<AnatomyImageRow[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [extracting, setExtracting] = useState(false);
  const [extractLog, setExtractLog] = useState<string[]>([]);
  const [extractProgress, setExtractProgress] = useState<{ fileName: string; processedPages: number; totalPages: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnatomyImageRow | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loadPdfs = useCallback(async () => {
    setLoadingPdfs(true);
    try {
      const data = await apiFetchJson<{ pdfs: AvailablePdf[] }>("/api/anatomy-viva-images/admin/available-pdfs");
      setPdfs(data.pdfs);
    } catch {
      toast.error("Failed to load available PDFs.");
    } finally {
      setLoadingPdfs(false);
    }
  }, []);

  const loadImages = useCallback(async (category: string) => {
    setLoadingImages(true);
    try {
      const qs = category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
      const data = await apiFetchJson<{ images: AnatomyImageRow[] }>(`/api/anatomy-viva-images/admin/list${qs}`);
      setImages(data.images);
    } catch {
      toast.error("Failed to load extracted images.");
    } finally {
      setLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    loadPdfs();
  }, [loadPdfs]);

  useEffect(() => {
    loadImages(categoryFilter);
  }, [categoryFilter, loadImages]);

  const togglePdf = (objectName: string) => {
    setSelectedPdfs((prev) => {
      const next = new Set(prev);
      if (next.has(objectName)) next.delete(objectName);
      else next.add(objectName);
      return next;
    });
  };

  const runExtraction = async () => {
    if (selectedPdfs.size === 0) {
      toast.error("Select at least one PDF to extract from.");
      return;
    }
    setExtracting(true);
    setExtractLog([]);
    setExtractProgress(null);
    try {
      const res = await apiFetch("/api/anatomy-viva-images/admin/extract", {
        method: "POST",
        body: JSON.stringify({ objectNames: Array.from(selectedPdfs) }),
      });
      if (!res.ok || !res.body) {
        toast.error("Failed to start extraction.");
        setExtracting(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\n\n/);
        buffer = blocks.pop() ?? "";
        for (const block of blocks) {
          const line = block.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          let event: any;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (event.type === "file_start") {
            setExtractLog((prev) => [...prev, `Starting ${event.fileName}...`]);
          } else if (event.type === "progress") {
            setExtractProgress({ fileName: event.fileName, processedPages: event.processedPages, totalPages: event.totalPages });
          } else if (event.type === "file_done") {
            setExtractLog((prev) => [...prev, `Finished ${event.fileName} (${event.pagesRead}/${event.totalPagesInFile} pages read)`]);
          } else if (event.type === "file_error") {
            setExtractLog((prev) => [...prev, `Error on ${event.fileName}: ${event.error}`]);
          } else if (event.type === "complete") {
            setExtractLog((prev) => [...prev, `Done — inserted ${event.inserted}, skipped ${event.skipped}.`]);
            toast.success(`Extraction complete: ${event.inserted} images added.`);
          } else if (event.type === "error") {
            toast.error(event.error);
          }
        }
      }
    } catch {
      toast.error("Extraction connection lost.");
    } finally {
      setExtracting(false);
      setExtractProgress(null);
      loadImages(categoryFilter);
    }
  };

  const applySeed = async () => {
    setSeeding(true);
    try {
      const data = await apiFetchJson<{ inserted: number; skipped: number; total: number }>(
        "/api/anatomy-viva-images/admin/apply-seed",
        { method: "POST" }
      );
      toast.success(`Seed complete — ${data.inserted} images added, ${data.skipped} already existed.`);
      loadImages(categoryFilter);
    } catch {
      toast.error("Seed failed. Check server logs.");
    } finally {
      setSeeding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/anatomy-viva-images/admin/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setImages((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success("Image deleted.");
    } catch {
      toast.error("Failed to delete image.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-teal-400" /> Anatomy Viva Images
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically extract labeled specimen images from already-uploaded PDFs for the 5 Anatomy image-based viva
            stations. Extraction is fully automatic — no review step; delete unwanted images below afterwards.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={applySeed}
          disabled={seeding}
          className="shrink-0 gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          title="Seed production DB with all 338 bundled images (idempotent)"
        >
          {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
          {seeding ? "Seeding..." : "Seed DB"}
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Select PDFs to extract from
          </h2>
          <Button variant="ghost" size="sm" onClick={loadPdfs} disabled={loadingPdfs}>
            <RefreshCw className={`h-4 w-4 ${loadingPdfs ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loadingPdfs ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : pdfs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No PDFs found. Upload books via the Notes/PDF manager first — this extracts from files already there.
          </p>
        ) : (
          <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
            {pdfs.map((pdf) => (
              <label
                key={pdf.objectName}
                className="flex items-center gap-3 rounded-md border p-2 text-sm hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selectedPdfs.has(pdf.objectName)}
                  onCheckedChange={() => togglePdf(pdf.objectName)}
                  disabled={extracting}
                />
                <span className="flex-1 truncate">{pdf.displayName}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(pdf.size)}</span>
              </label>
            ))}
          </div>
        )}

        <Button onClick={runExtraction} disabled={extracting || selectedPdfs.size === 0} className="gap-2">
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {extracting ? "Extracting..." : `Extract from ${selectedPdfs.size || ""} selected PDF${selectedPdfs.size === 1 ? "" : "s"}`}
        </Button>

        {extractProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{extractProgress.fileName}</span>
              <span>
                {extractProgress.processedPages}/{extractProgress.totalPages} pages
              </span>
            </div>
            <Progress value={(extractProgress.processedPages / Math.max(extractProgress.totalPages, 1)) * 100} />
          </div>
        )}

        {extractLog.length > 0 && (
          <div className="rounded-md bg-muted/40 p-3 text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
            {extractLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold">Extracted Images ({images.length})</h2>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {ANATOMY_IMAGE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingImages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No images extracted yet for this filter.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img) => (
              <div key={img.id} className="rounded-lg border overflow-hidden group relative">
                <img src={getImageUrl(img.id)} alt={img.title} className="w-full h-32 object-cover bg-black/5" />
                <button
                  onClick={() => setDeleteTarget(img)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5 text-white" />
                </button>
                <div className="p-2 space-y-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {img.category}
                  </Badge>
                  <p className="text-xs font-medium leading-tight line-clamp-2">{img.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {img.region || "—"} {img.side ? `· ${img.side}` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {img.sourceFileName} p.{img.sourcePage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed from the {deleteTarget?.category} viva station pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
