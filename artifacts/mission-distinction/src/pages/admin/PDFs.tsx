import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useListPdfs, useCreatePdf, useDeletePdf, getListPdfsQueryKey, customFetch } from "@workspace/api-client-react";
import { Search, Plus, MoreVertical, Trash2, FileIcon, Pencil, ImagePlus, X, Upload, Link, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

type PdfItem = { id: number; title: string; subject: string; year?: string | null; url: string; thumbnailUrl?: string | null; pages?: number | null; downloadCount?: number; createdAt: string | Date };

async function uploadPdfFile(file: File, onProgress: (p: number) => void): Promise<string> {
  // Step 1: ask the server for a presigned GCS PUT URL (small JSON request — not blocked by proxy)
  const token = localStorage.getItem("mission_token");
  const presignResp = await fetch("/api/upload/pdf/request-upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ fileName: file.name }),
  });
  if (!presignResp.ok) {
    const data = await presignResp.json().catch(() => ({}));
    throw new Error((data as any).error || "Failed to get upload URL");
  }
  const { signedUrl, serveUrl } = await presignResp.json();

  // Step 2: PUT the file DIRECTLY to GCS — bypasses the Replit proxy entirely (supports up to 5 GB)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(serveUrl);
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

async function uploadCoverImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/image");
    const token = localStorage.getItem("mission_token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.url) resolve(data.url);
          else reject(new Error("Upload failed — no URL returned"));
        } catch { reject(new Error("Invalid response from server")); }
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

const EMPTY_FORM = { title: "", subject: "", year: "", url: "", pages: "", thumbnailUrl: "", uploadedFileName: "" };

export default function AdminPDFs() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PdfItem | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [editPdfUploading, setEditPdfUploading] = useState(false);
  const [editPdfProgress, setEditPdfProgress] = useState(0);
  const [coverUploading, setCoverUploading] = useState(false);
  const [editCoverUploading, setEditCoverUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const [editUseUrl, setEditUseUrl] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const editPdfRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const editCoverRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handlePdfFile = async (file: File, mode: "add" | "edit") => {
    if (mode === "add") {
      setPdfUploading(true); setPdfProgress(0);
      try {
        const url = await uploadPdfFile(file, setPdfProgress);
        setForm(f => ({ ...f, url, uploadedFileName: file.name }));
        toast.success(`"${file.name}" uploaded!`);
      } catch (e: any) { toast.error(e.message || "PDF upload failed."); }
      finally { setPdfUploading(false); }
    } else {
      setEditPdfUploading(true); setEditPdfProgress(0);
      try {
        const url = await uploadPdfFile(file, setEditPdfProgress);
        setEditForm(f => ({ ...f, url, uploadedFileName: file.name }));
        toast.success(`"${file.name}" uploaded!`);
      } catch (e: any) { toast.error(e.message || "PDF upload failed."); }
      finally { setEditPdfUploading(false); }
    }
  };

  const handleCoverUpload = async (file: File, mode: "add" | "edit") => {
    const set = mode === "add" ? setCoverUploading : setEditCoverUploading;
    set(true);
    try {
      const url = await uploadCoverImage(file);
      if (mode === "add") setForm(f => ({ ...f, thumbnailUrl: url }));
      else setEditForm(f => ({ ...f, thumbnailUrl: url }));
      toast.success("Cover uploaded!");
    } catch (e: any) { toast.error(e?.message || "Cover upload failed."); }
    finally { set(false); }
  };

  const { data: pdfs, isLoading } = useListPdfs(
    { search: search || undefined },
    { query: { queryKey: getListPdfsQueryKey({ search: search || undefined }) } }
  );

  const createPdf = useCreatePdf();
  const deletePdf = useDeletePdf();

  const handleAdd = () => {
    if (!form.title || !form.subject || !form.url) {
      toast.error("Title, subject and a PDF file (or URL) are required.");
      return;
    }
    createPdf.mutate({
      data: { title: form.title, subject: form.subject, year: form.year || undefined, url: form.url, thumbnailUrl: form.thumbnailUrl || undefined, pages: form.pages ? parseInt(form.pages) : undefined }
    }, {
      onSuccess: () => {
        toast.success("PDF added successfully!");
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        setOpen(false);
        setForm({ ...EMPTY_FORM });
        setUseUrl(false);
      },
      onError: () => toast.error("Failed to add PDF."),
    });
  };

  const openEdit = (pdf: PdfItem) => {
    setEditTarget(pdf);
    const isDrive = pdf.url.includes("drive.google.com");
    setEditUseUrl(isDrive);
    setEditForm({ title: pdf.title, subject: pdf.subject, year: pdf.year || "", url: pdf.url, pages: pdf.pages?.toString() || "", thumbnailUrl: pdf.thumbnailUrl || "", uploadedFileName: isDrive ? "" : "Current file" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !editForm.title || !editForm.subject || !editForm.url) {
      toast.error("Title, subject and PDF are required.");
      return;
    }
    setEditPending(true);
    try {
      await customFetch(`/api/pdfs/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editForm.title, subject: editForm.subject, year: editForm.year || null, url: editForm.url, thumbnailUrl: editForm.thumbnailUrl || null, pages: editForm.pages ? parseInt(editForm.pages) : null }),
      });
      toast.success("PDF updated successfully!");
      queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
      setEditOpen(false);
      setEditTarget(null);
    } catch { toast.error("Failed to update PDF."); }
    finally { setEditPending(false); }
  };

  const handleDelete = (id: number) => {
    deletePdf.mutate({ id }, {
      onSuccess: () => { toast.success("PDF deleted."); queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() }); },
      onError: () => toast.error("Failed to delete PDF."),
    });
  };

  const pdfList = Array.isArray(pdfs) ? pdfs : [];

  const PdfUploadField = ({ mode }: { mode: "add" | "edit" }) => {
    const isEdit = mode === "edit";
    const f = isEdit ? editForm : form;
    const uploading = isEdit ? editPdfUploading : pdfUploading;
    const progress = isEdit ? editPdfProgress : pdfProgress;
    const urlMode = isEdit ? editUseUrl : useUrl;
    const setUrlMode = isEdit ? setEditUseUrl : setUseUrl;
    const ref = isEdit ? editPdfRef : pdfRef;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>PDF File <span className="text-destructive">*</span></Label>
          <button type="button" onClick={() => setUrlMode(v => !v)} className="text-xs text-primary underline-offset-2 hover:underline">
            {urlMode ? "← Upload file instead" : "Paste URL instead"}
          </button>
        </div>
        {urlMode ? (
          <Input
            placeholder="https://drive.google.com/... or any HTTPS URL"
            className="bg-background/50"
            value={f.url}
            onChange={(e) => isEdit ? setEditForm(ef => ({ ...ef, url: e.target.value })) : setForm(ef => ({ ...ef, url: e.target.value }))}
          />
        ) : (
          <>
            <input ref={ref} type="file" accept="application/pdf" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePdfFile(file, mode); e.target.value = ""; }} />
            {f.url && !f.url.includes("drive.google.com") ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-400 truncate">{f.uploadedFileName || "File uploaded"}</p>
                  <p className="text-xs text-muted-foreground">Ready to save</p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs"
                  onClick={() => isEdit ? setEditForm(ef => ({ ...ef, url: "", uploadedFileName: "" })) : setForm(ef => ({ ...ef, url: "", uploadedFileName: "" }))}>
                  <X size={13} className="mr-1" /> Replace
                </Button>
              </div>
            ) : uploading ? (
              <div className="p-3 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Upload size={14} className="text-primary animate-bounce" />
                  <span>Uploading… {progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full gap-2 h-20 flex-col border-dashed" onClick={() => ref.current?.click()}>
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload PDF</span>
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage PDFs</h1>
          <p className="text-muted-foreground">Upload and manage PDF library content.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search PDFs..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add PDF</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Document</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48 mb-2" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : pdfList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileIcon className="h-8 w-8 opacity-30" />
                      <span>No PDFs yet. Click "Add PDF" to upload one.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pdfList.map((pdf) => (
                  <TableRow key={pdf.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-10 rounded flex items-center justify-center shrink-0 ${pdf.url.includes("drive.google.com") ? "bg-yellow-500/20 text-yellow-500" : "bg-orange-500/20 text-orange-500"}`}>
                          {pdf.url.includes("drive.google.com") ? <Link size={14} /> : <FileIcon size={16} />}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{pdf.title}</div>
                          <span className="text-xs text-muted-foreground">{pdf.url.includes("drive.google.com") ? "Google Drive" : "Uploaded file"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-500/5 border-orange-500/20 text-orange-500">{pdf.subject}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{pdf.downloadCount ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{pdf.pages ? `${pdf.pages} pages` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(pdf as PdfItem)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(pdf.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm({ ...EMPTY_FORM }); setUseUrl(false); } }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Anatomy Upper Limb Notes" className="bg-background/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pages</Label>
                <Input type="number" placeholder="e.g. 120" className="bg-background/50" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
              </div>
            </div>
            <PdfUploadField mode="add" />
            <div className="space-y-1.5">
              <Label>Cover Image <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f, "add"); e.target.value = ""; }} />
              {form.thumbnailUrl ? (
                <div className="flex items-center gap-3">
                  <img src={form.thumbnailUrl} alt="Cover preview" className="h-16 w-12 object-cover rounded border border-border/50" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, thumbnailUrl: "" }))}>
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled={coverUploading} onClick={() => coverRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {coverUploading ? "Uploading..." : "Upload Cover Image"}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createPdf.isPending || pdfUploading || coverUploading}>
              {createPdf.isPending ? "Saving..." : "Add PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditTarget(null); }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input className="bg-background/50" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={editForm.subject} onValueChange={(v) => setEditForm({ ...editForm, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pages</Label>
                <Input type="number" className="bg-background/50" value={editForm.pages} onChange={(e) => setEditForm({ ...editForm, pages: e.target.value })} />
              </div>
            </div>
            <PdfUploadField mode="edit" />
            <div className="space-y-1.5">
              <Label>Cover Image</Label>
              <input ref={editCoverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f, "edit"); e.target.value = ""; }} />
              {editForm.thumbnailUrl ? (
                <div className="flex items-center gap-3">
                  <img src={editForm.thumbnailUrl} alt="Cover preview" className="h-16 w-12 object-cover rounded border border-border/50" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditForm(f => ({ ...f, thumbnailUrl: "" }))}>
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled={editCoverUploading} onClick={() => editCoverRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {editCoverUploading ? "Uploading..." : "Upload Cover Image"}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editPending || editPdfUploading || editCoverUploading}>
              {editPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
