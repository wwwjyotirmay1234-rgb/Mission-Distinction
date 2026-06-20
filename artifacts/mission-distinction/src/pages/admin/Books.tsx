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
import { useListBooks, useCreateBook, useDeleteBook, getListBooksQueryKey, customFetch } from "@workspace/api-client-react";
import { Search, Plus, MoreVertical, Trash2, BookOpen, Pencil, ImagePlus, X, Upload, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

type BookItem = { id: number; title: string; subject: string; author?: string | null; url: string; coverUrl?: string | null; downloadCount?: number; createdAt: string | Date };

async function uploadBookCover(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/book-cover");
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

async function uploadBookPdf(file: File, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/pdf");
    const token = localStorage.getItem("mission_token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try { resolve(JSON.parse(xhr.responseText).url); }
        catch { reject(new Error("Invalid response")); }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed")); }
        catch { reject(new Error("Upload failed")); }
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

const EMPTY_FORM = { title: "", subject: "", author: "", url: "", coverUrl: "", uploadedFileName: "" };

export default function AdminBooks() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BookItem | null>(null);
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
        const url = await uploadBookPdf(file, setPdfProgress);
        setForm(f => ({ ...f, url, uploadedFileName: file.name }));
        toast.success(`"${file.name}" uploaded!`);
      } catch (e: any) { toast.error(e.message || "PDF upload failed."); }
      finally { setPdfUploading(false); }
    } else {
      setEditPdfUploading(true); setEditPdfProgress(0);
      try {
        const url = await uploadBookPdf(file, setEditPdfProgress);
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
      const url = await uploadBookCover(file);
      if (mode === "add") setForm(f => ({ ...f, coverUrl: url }));
      else setEditForm(f => ({ ...f, coverUrl: url }));
      toast.success("Cover uploaded!");
    } catch (e: any) {
      const msg = e?.body?.error || e?.message || "Cover upload failed.";
      toast.error(msg);
    } finally {
      set(false);
    }
  };

  const { data: books, isLoading } = useListBooks(
    { search: search || undefined },
    { query: { queryKey: getListBooksQueryKey({ search: search || undefined }) } }
  );

  const createBook = useCreateBook();
  const deleteBook = useDeleteBook();

  const handleAdd = () => {
    if (!form.title || !form.subject || !form.url) {
      toast.error("Title, subject and a PDF file (or URL) are required.");
      return;
    }
    createBook.mutate({ data: { title: form.title, subject: form.subject, author: form.author || undefined, url: form.url, coverUrl: form.coverUrl || undefined } }, {
      onSuccess: () => {
        toast.success("Book added successfully!");
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
        setOpen(false);
        setForm({ ...EMPTY_FORM });
        setUseUrl(false);
      },
      onError: () => toast.error("Failed to add book."),
    });
  };

  const openEdit = (book: BookItem) => {
    setEditTarget(book);
    const isDrive = book.url.includes("drive.google.com");
    setEditUseUrl(isDrive);
    setEditForm({ title: book.title, subject: book.subject, author: book.author || "", url: book.url, coverUrl: book.coverUrl || "", uploadedFileName: isDrive ? "" : "Current file" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !editForm.title || !editForm.subject || !editForm.url) {
      toast.error("Title, subject and URL are required.");
      return;
    }
    setEditPending(true);
    try {
      await customFetch(`/api/books/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      toast.success("Book updated successfully!");
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      setEditOpen(false);
      setEditTarget(null);
    } catch {
      toast.error("Failed to update book.");
    } finally {
      setEditPending(false);
    }
  };

  const handleDelete = (id: number) => {
    deleteBook.mutate({ id }, {
      onSuccess: () => {
        toast.success("Book deleted.");
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      },
      onError: () => toast.error("Failed to delete book."),
    });
  };

  const bookList = Array.isArray(books) ? books : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Books</h1>
          <p className="text-muted-foreground">Manage the reference books library.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search books..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Book</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Book</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48 mb-2" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : bookList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-8 w-8 opacity-30" />
                      <span>No books yet. Click "Add Book" to get started.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bookList.map((book) => (
                  <TableRow key={book.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 rounded bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
                          {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} /> : <BookOpen size={16} />}
                        </div>
                        <div className="font-medium text-foreground">{book.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-500/5 border-purple-500/20 text-purple-500">{book.subject}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{book.author || "—"}</TableCell>
                    <TableCell className="text-sm">{book.downloadCount || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(book.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(book as BookItem)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(book.id)}>
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

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm({ ...EMPTY_FORM }); setUseUrl(false); } }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Book Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Gray's Anatomy" className="bg-background/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
                <Label>Author</Label>
                <Input placeholder="e.g. Henry Gray" className="bg-background/50" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
            </div>
            {/* PDF upload field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Book PDF <span className="text-destructive">*</span></Label>
                <button type="button" onClick={() => setUseUrl(v => !v)} className="text-xs text-primary underline-offset-2 hover:underline">
                  {useUrl ? "← Upload file instead" : "Paste URL instead"}
                </button>
              </div>
              {useUrl ? (
                <Input placeholder="https://drive.google.com/... or any HTTPS URL" className="bg-background/50" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              ) : (
                <>
                  <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfFile(f, "add"); e.target.value = ""; }} />
                  {form.url && !form.url.includes("drive.google.com") ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-green-400 truncate">{form.uploadedFileName || "File uploaded"}</p><p className="text-xs text-muted-foreground">Ready to save</p></div>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setForm(f => ({ ...f, url: "", uploadedFileName: "" }))}><X size={13} className="mr-1" /> Replace</Button>
                    </div>
                  ) : pdfUploading ? (
                    <div className="p-3 rounded-lg border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-sm"><Upload size={14} className="text-primary animate-bounce" /><span>Uploading… {pdfProgress}%</span></div>
                      <Progress value={pdfProgress} className="h-1.5" />
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
            <div className="space-y-1.5">
              <Label>Cover Image <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f, "add"); e.target.value = ""; }} />
              {form.coverUrl ? (
                <div className="flex items-center gap-3">
                  <img src={form.coverUrl} alt="Cover preview" className="h-16 w-12 object-cover rounded border border-border/50" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, coverUrl: "" }))}><X className="h-3 w-3 mr-1" /> Remove</Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled={coverUploading} onClick={() => coverRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-2" />{coverUploading ? "Uploading..." : "Upload Cover Image"}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createBook.isPending || pdfUploading || coverUploading}>
              {createBook.isPending ? "Adding..." : "Add Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditTarget(null); }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Book Title <span className="text-destructive">*</span></Label>
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
                <Label>Author</Label>
                <Input className="bg-background/50" value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} />
              </div>
            </div>
            {/* PDF upload field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Book PDF <span className="text-destructive">*</span></Label>
                <button type="button" onClick={() => setEditUseUrl(v => !v)} className="text-xs text-primary underline-offset-2 hover:underline">
                  {editUseUrl ? "← Upload file instead" : "Paste URL instead"}
                </button>
              </div>
              {editUseUrl ? (
                <Input placeholder="https://drive.google.com/... or any HTTPS URL" className="bg-background/50" value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} />
              ) : (
                <>
                  <input ref={editPdfRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfFile(f, "edit"); e.target.value = ""; }} />
                  {editForm.url && !editForm.url.includes("drive.google.com") ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-green-400 truncate">{editForm.uploadedFileName || "File uploaded"}</p><p className="text-xs text-muted-foreground">Ready to save</p></div>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditForm(f => ({ ...f, url: "", uploadedFileName: "" }))}><X size={13} className="mr-1" /> Replace</Button>
                    </div>
                  ) : editPdfUploading ? (
                    <div className="p-3 rounded-lg border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-sm"><Upload size={14} className="text-primary animate-bounce" /><span>Uploading… {editPdfProgress}%</span></div>
                      <Progress value={editPdfProgress} className="h-1.5" />
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
            <div className="space-y-1.5">
              <Label>Cover Image</Label>
              <input ref={editCoverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f, "edit"); e.target.value = ""; }} />
              {editForm.coverUrl ? (
                <div className="flex items-center gap-3">
                  <img src={editForm.coverUrl} alt="Cover preview" className="h-16 w-12 object-cover rounded border border-border/50" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditForm(f => ({ ...f, coverUrl: "" }))}><X className="h-3 w-3 mr-1" /> Remove</Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled={editCoverUploading} onClick={() => editCoverRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-2" />{editCoverUploading ? "Uploading..." : "Upload Cover Image"}
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
