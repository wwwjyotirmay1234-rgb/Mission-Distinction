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
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, ClipboardList, Pencil, X, Upload, CheckCircle2, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology",
  "Microbiology", "Forensic Medicine", "Internal Medicine", "Surgery",
  "Obs & Gynae", "Pediatrics", "Ophthalmology", "ENT", "Orthopedics",
  "Psychiatry", "Community Medicine", "Dermatology",
];

const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"];

type PYQ = {
  id: number;
  title: string;
  subject: string;
  year: string;
  url: string;
  downloadCount?: number;
  createdAt: string | Date;
};

const PYQS_KEY = ["pyqs"];

async function fetchPYQs(search?: string): Promise<PYQ[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return customFetch<PYQ[]>(`/api/pyqs${qs}`);
}

async function uploadPYQPdf(file: File, onProgress: (p: number) => void): Promise<string> {
  const token = localStorage.getItem("mission_token");
  const presignResp = await fetch("/api/upload/pdf/request-upload-url", {
    method: "POST",
    credentials: "include",
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

const EMPTY = { title: "", subject: "", year: "", url: "", uploadedFileName: "" };

export default function AdminPYQs() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PYQ | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editForm, setEditForm] = useState({ ...EMPTY });
  const [useUrl, setUseUrl] = useState(false);
  const [editUseUrl, setEditUseUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editUploading, setEditUploading] = useState(false);
  const [editProgress, setEditProgress] = useState(0);
  const [editPending, setEditPending] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const editPdfRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: pyqs, isLoading } = useQuery<PYQ[]>({
    queryKey: [...PYQS_KEY, search],
    queryFn: () => fetchPYQs(search || undefined),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; subject: string; year: string; url: string }) =>
      customFetch("/api/pyqs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("PYQ added successfully!");
      qc.invalidateQueries({ queryKey: PYQS_KEY });
      setOpen(false);
      setForm({ ...EMPTY });
      setUseUrl(false);
    },
    onError: () => toast.error("Failed to add PYQ."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customFetch(`/api/pyqs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("PYQ deleted.");
      qc.invalidateQueries({ queryKey: PYQS_KEY });
    },
    onError: () => toast.error("Failed to delete PYQ."),
  });

  const handlePdfFile = async (file: File, mode: "add" | "edit") => {
    if (mode === "add") {
      setUploading(true); setProgress(0);
      try {
        const url = await uploadPYQPdf(file, setProgress);
        setForm(f => ({ ...f, url, uploadedFileName: file.name }));
        toast.success(`"${file.name}" uploaded!`);
      } catch (e: any) { toast.error(e.message || "Upload failed."); }
      finally { setUploading(false); }
    } else {
      setEditUploading(true); setEditProgress(0);
      try {
        const url = await uploadPYQPdf(file, setEditProgress);
        setEditForm(f => ({ ...f, url, uploadedFileName: file.name }));
        toast.success(`"${file.name}" uploaded!`);
      } catch (e: any) { toast.error(e.message || "Upload failed."); }
      finally { setEditUploading(false); }
    }
  };

  const handleAdd = () => {
    if (!form.title || !form.subject || !form.year || !form.url) {
      toast.error("Title, subject, year and a PDF/URL are required.");
      return;
    }
    createMutation.mutate({ title: form.title, subject: form.subject, year: form.year, url: form.url });
  };

  const openEdit = (p: PYQ) => {
    setEditTarget(p);
    const isDrive = p.url.includes("drive.google.com");
    setEditUseUrl(isDrive);
    setEditForm({ title: p.title, subject: p.subject, year: p.year, url: p.url, uploadedFileName: isDrive ? "" : "Current file" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !editForm.title || !editForm.subject || !editForm.year || !editForm.url) {
      toast.error("All fields are required.");
      return;
    }
    setEditPending(true);
    try {
      await customFetch(`/api/pyqs/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editForm.title, subject: editForm.subject, year: editForm.year, url: editForm.url }),
      });
      toast.success("PYQ updated!");
      qc.invalidateQueries({ queryKey: PYQS_KEY });
      setEditOpen(false);
      setEditTarget(null);
    } catch { toast.error("Failed to update PYQ."); }
    finally { setEditPending(false); }
  };

  const list = Array.isArray(pyqs) ? pyqs : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PYQs Library</h1>
          <p className="text-muted-foreground">Upload Previous Year Question papers as PDFs or Google Drive links.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search PYQs..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add PYQ</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-8 w-8 opacity-30" />
                      <span>No PYQs yet. Click "Add PYQ" to get started.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.map(p => (
                  <TableRow key={p.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                          <ClipboardList size={16} />
                        </div>
                        <div className="font-medium">{p.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-500/5 border-purple-500/20 text-purple-400">{p.subject}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-500/5 border-amber-500/20 text-amber-400">{p.year}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.downloadCount ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(p.url, "_blank", "noopener,noreferrer")}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => deleteMutation.mutate(p.id)}>
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
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setForm({ ...EMPTY }); setUseUrl(false); } }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Add PYQ Paper</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Anatomy PYQ — Final MBBS 2024" className="bg-background/50" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year <span className="text-destructive">*</span></Label>
                <Select value={form.year} onValueChange={v => setForm({ ...form, year: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>PDF File <span className="text-destructive">*</span></Label>
                <button type="button" onClick={() => setUseUrl(v => !v)} className="text-xs text-primary underline-offset-2 hover:underline">
                  {useUrl ? "← Upload file instead" : "Paste URL instead"}
                </button>
              </div>
              {useUrl ? (
                <Input placeholder="https://drive.google.com/... or any HTTPS URL" className="bg-background/50" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
              ) : (
                <>
                  <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfFile(f, "add"); e.target.value = ""; }} />
                  {form.url ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-green-400 truncate">{form.uploadedFileName || "File uploaded"}</p><p className="text-xs text-muted-foreground">Ready to save</p></div>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setForm(f => ({ ...f, url: "", uploadedFileName: "" }))}><X size={13} className="mr-1" /> Replace</Button>
                    </div>
                  ) : uploading ? (
                    <div className="p-3 rounded-lg border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-sm"><Upload size={14} className="text-primary animate-bounce" /><span>Uploading… {progress}%</span></div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full gap-2 h-20 flex-col border-dashed" onClick={() => pdfRef.current?.click()}>
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload PDF</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending || uploading}>
              {createMutation.isPending ? "Adding..." : "Add PYQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); if (!v) setEditTarget(null); }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Edit PYQ</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input className="bg-background/50" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={editForm.subject} onValueChange={v => setEditForm({ ...editForm, subject: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Select value={editForm.year} onValueChange={v => setEditForm({ ...editForm, year: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>PDF File</Label>
                <button type="button" onClick={() => setEditUseUrl(v => !v)} className="text-xs text-primary underline-offset-2 hover:underline">
                  {editUseUrl ? "← Upload file instead" : "Paste URL instead"}
                </button>
              </div>
              {editUseUrl ? (
                <Input placeholder="https://drive.google.com/... or any HTTPS URL" className="bg-background/50" value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} />
              ) : (
                <>
                  <input ref={editPdfRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfFile(f, "edit"); e.target.value = ""; }} />
                  {editForm.url ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-green-400 truncate">{editForm.uploadedFileName || "File uploaded"}</p><p className="text-xs text-muted-foreground">Ready to save</p></div>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditForm(f => ({ ...f, url: "", uploadedFileName: "" }))}><X size={13} className="mr-1" /> Replace</Button>
                    </div>
                  ) : editUploading ? (
                    <div className="p-3 rounded-lg border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-sm"><Upload size={14} className="text-primary animate-bounce" /><span>Uploading… {editProgress}%</span></div>
                      <Progress value={editProgress} className="h-1.5" />
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full gap-2 h-20 flex-col border-dashed" onClick={() => editPdfRef.current?.click()}>
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload new PDF</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editPending || editUploading}>
              {editPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
