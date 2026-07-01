import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListNotes, useDeleteNote, getListNotesQueryKey, customFetch } from "@workspace/api-client-react";
import { Search, Plus, MoreVertical, Trash2, FileText, Pencil, Upload, Image, FileIcon, Link, X, Loader2, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

type NoteItem = {
  id: number;
  title: string;
  subject: string;
  content?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  downloadCount?: number;
  createdAt: string | Date;
};

type NoteMode = "text" | "file" | "link";

function fileTypeIcon(ft: string | null | undefined) {
  if (ft === "image") return <Image size={14} />;
  if (ft === "pdf") return <FileIcon size={14} />;
  if (ft === "link") return <Link size={14} />;
  return <FileText size={14} />;
}

function fileTypeBadge(ft: string | null | undefined) {
  if (ft === "image") return <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 text-xs">Photo</Badge>;
  if (ft === "pdf") return <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-400 text-xs">PDF</Badge>;
  if (ft === "link") return <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">Link</Badge>;
  return <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">Text</Badge>;
}

async function uploadNoteFile(
  file: File,
  setUploading: (v: boolean) => void,
  onDone: (url: string, type: string) => void
) {
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { apiFetch } = await import("@/lib/apiFetch");
    const res = await apiFetch("/api/upload/note-file", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    const data = await res.json();
    onDone(data.url, data.fileType);
    toast.success("File uploaded!");
  } catch (err: any) {
    toast.error(err.message || "Upload failed. Please try again.");
  } finally {
    setUploading(false);
  }
}

interface NoteFormProps {
  mode: NoteMode;
  setMode: (m: NoteMode) => void;
  form: { title: string; subject: string; content: string; fileUrl: string; fileType: string };
  setForm: (f: any) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  fileRef: React.RefObject<HTMLInputElement>;
}

function NoteForm({ mode, setMode, form, setForm, uploading, setUploading, fileRef }: NoteFormProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Title <span className="text-destructive">*</span></Label>
        <Input
          placeholder="e.g. Upper Limb - Bones and Joints"
          className="bg-background/50"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Subject <span className="text-destructive">*</span></Label>
        <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
          <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Note Content <span className="text-destructive">*</span></Label>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => { setMode("text"); setForm((f: any) => ({ ...f, fileUrl: "", fileType: "" })); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Write Text
          </button>
          <button
            type="button"
            onClick={() => { setMode("file"); setForm((f: any) => ({ ...f, content: "" })); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => { setMode("link"); setForm((f: any) => ({ ...f, content: "", fileUrl: "", fileType: "link" })); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "link" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Drive Link
          </button>
        </div>

        {mode === "text" && (
          <Textarea
            placeholder="Enter the note content here..."
            className="bg-background/50 min-h-[120px] resize-none"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        )}

        {mode === "link" && (
          <div className="space-y-1.5">
            <Input
              placeholder="https://drive.google.com/file/d/... or any HTTPS link"
              className="bg-background/50"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value, fileType: "link" })}
            />
            <p className="text-xs text-muted-foreground">Paste a Google Drive, OneDrive, or any public document link. Students will open it in their browser.</p>
          </div>
        )}

        {mode === "file" && (
          <div className="space-y-2">
            {form.fileUrl ? (
              <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/50 rounded-lg">
                <div className="shrink-0 text-primary">{fileTypeIcon(form.fileType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{form.fileType === "image" ? "Image uploaded" : "PDF uploaded"}</p>
                  <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View file ↗</a>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, fileUrl: "", fileType: "" })}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-primary" />
                ) : (
                  <Upload size={24} className="text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Uploading…" : "Click to upload"}
                </span>
                <span className="text-xs text-muted-foreground/70">Photo (JPG/PNG/WebP) · PDF · up to 100 MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                uploadNoteFile(file, setUploading, (url, type) => setForm({ ...form, fileUrl: url, fileType: type }));
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminNotes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NoteItem | null>(null);
  const [addPending, setAddPending] = useState(false);
  const [editPending, setEditPending] = useState(false);

  const [addMode, setAddMode] = useState<NoteMode>("text");
  const [addForm, setAddForm] = useState({ title: "", subject: "", content: "", fileUrl: "", fileType: "" });
  const [addUploading, setAddUploading] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState<NoteMode>("text");
  const [editForm, setEditForm] = useState({ title: "", subject: "", content: "", fileUrl: "", fileType: "" });
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useListNotes(
    { search: search || undefined },
    { query: { queryKey: getListNotesQueryKey({ search: search || undefined }) } }
  );
  const deleteNote = useDeleteNote();

  const resetAdd = () => {
    setAddForm({ title: "", subject: "", content: "", fileUrl: "", fileType: "" });
    setAddMode("text");
    setOpen(false);
  };

  const handleAdd = async () => {
    if (!addForm.title || !addForm.subject) { toast.error("Title and subject are required."); return; }
    if (addMode === "text" && !addForm.content) { toast.error("Please enter some content."); return; }
    if (addMode === "file" && !addForm.fileUrl) { toast.error("Please upload a file first."); return; }
    if (addMode === "link" && !addForm.fileUrl) { toast.error("Please enter a link."); return; }
    if (addMode === "link" && !addForm.fileUrl.startsWith("https://")) { toast.error("Link must start with https://"); return; }

    setAddPending(true);
    try {
      await customFetch("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          title: addForm.title,
          subject: addForm.subject,
          content: addMode === "text" ? addForm.content : undefined,
          fileUrl: addMode !== "text" ? addForm.fileUrl : undefined,
          fileType: addMode === "text" ? "text" : addForm.fileType || addMode,
        }),
      });
      toast.success("Note added successfully!");
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      resetAdd();
    } catch {
      toast.error("Failed to add note. Check your connection and try again.");
    } finally {
      setAddPending(false);
    }
  };

  const openEdit = (note: NoteItem) => {
    setEditTarget(note);
    const ft = note.fileType;
    const mode: NoteMode = ft === "link" ? "link" : note.fileUrl ? "file" : "text";
    setEditMode(mode);
    setEditForm({
      title: note.title,
      subject: note.subject,
      content: note.content || "",
      fileUrl: note.fileUrl || "",
      fileType: note.fileType || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !editForm.title || !editForm.subject) { toast.error("Title and subject are required."); return; }
    if (editMode === "text" && !editForm.content) { toast.error("Please enter some content."); return; }
    if (editMode === "file" && !editForm.fileUrl) { toast.error("Please upload a file first."); return; }
    if (editMode === "link" && !editForm.fileUrl) { toast.error("Please enter a link."); return; }
    if (editMode === "link" && !editForm.fileUrl.startsWith("https://")) { toast.error("Link must start with https://"); return; }

    setEditPending(true);
    try {
      await customFetch(`/api/notes/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title,
          subject: editForm.subject,
          content: editMode === "text" ? editForm.content : null,
          fileUrl: editMode !== "text" ? editForm.fileUrl : null,
          fileType: editMode === "text" ? "text" : editForm.fileType || editMode,
        }),
      });
      toast.success("Note updated!");
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      setEditOpen(false);
      setEditTarget(null);
    } catch {
      toast.error("Failed to update note.");
    } finally {
      setEditPending(false);
    }
  };

  const handleDelete = (id: number) => {
    deleteNote.mutate({ id }, {
      onSuccess: () => {
        toast.success("Note deleted.");
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      },
      onError: () => toast.error("Failed to delete note."),
    });
  };

  const notesList = Array.isArray(notes) ? notes : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Notes</h1>
          <p className="text-muted-foreground">Add, edit, or remove study notes.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search notes..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" asChild>
            <a href="/admin/content/quick-upload"><Zap className="mr-2 h-4 w-4" /> Quick Upload</a>
          </Button>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Note</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-14 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : notesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 opacity-30" />
                      <span>No notes yet. Click "Add Note" to get started.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                notesList.map((note) => {
                  const n = note as NoteItem;
                  const ft = n.fileUrl ? n.fileType : "text";
                  return (
                    <TableRow key={n.id} className="border-border/40 hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            {fileTypeIcon(ft)}
                          </div>
                          <div className="font-medium text-foreground">{n.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">{n.subject}</Badge>
                      </TableCell>
                      <TableCell>{fileTypeBadge(ft)}</TableCell>
                      <TableCell className="text-sm">{n.downloadCount ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(n)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(n.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetAdd(); else setOpen(true); }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <NoteForm
              mode={addMode}
              setMode={setAddMode}
              form={addForm}
              setForm={setAddForm}
              uploading={addUploading}
              setUploading={setAddUploading}
              fileRef={addFileRef as React.RefObject<HTMLInputElement>}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetAdd}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addPending || addUploading}>
              {addPending ? "Adding…" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) { setEditOpen(false); setEditTarget(null); } }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <NoteForm
              mode={editMode}
              setMode={setEditMode}
              form={editForm}
              setForm={setEditForm}
              uploading={editUploading}
              setUploading={setEditUploading}
              fileRef={editFileRef as React.RefObject<HTMLInputElement>}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditTarget(null); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editPending || editUploading}>
              {editPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
