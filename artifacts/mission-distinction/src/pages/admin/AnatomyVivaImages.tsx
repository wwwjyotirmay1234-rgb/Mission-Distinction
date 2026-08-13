import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { Loader2, Trash2, Image as ImageIcon } from "lucide-react";
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

export default function AnatomyVivaImages() {
  const [images, setImages] = useState<AnatomyImageRow[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<AnatomyImageRow | null>(null);

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
    loadImages(categoryFilter);
  }, [categoryFilter, loadImages]);

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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-teal-400" /> Anatomy Viva Images
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and manage labeled specimen images for the 5 Anatomy image-based viva stations. Delete unwanted images below.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold">Images ({images.length})</h2>
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
          <p className="text-sm text-muted-foreground py-4">No images found for this filter.</p>
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
