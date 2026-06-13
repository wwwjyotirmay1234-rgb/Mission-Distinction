import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListPdfs, useCreatePdf, useDeletePdf, getListPdfsQueryKey } from "@workspace/api-client-react";
import { Search, Plus, MoreVertical, Trash2, FileIcon, Link } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Medicine", "Surgery"];

export default function AdminPDFs() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", professor: "", year: "", url: "", pages: "", size: "" });
  const queryClient = useQueryClient();

  const { data: pdfs, isLoading } = useListPdfs(
    { search: search || undefined },
    { query: { queryKey: getListPdfsQueryKey({ search: search || undefined }) } }
  );

  const createPdf = useCreatePdf();
  const deletePdf = useDeletePdf();

  const handleAdd = () => {
    if (!form.title || !form.subject || !form.url) {
      toast.error("Title, subject and URL are required.");
      return;
    }
    createPdf.mutate({
      data: {
        ...form,
        pages: form.pages ? parseInt(form.pages) : undefined,
      }
    }, {
      onSuccess: () => {
        toast.success("PDF added successfully!");
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        setOpen(false);
        setForm({ title: "", subject: "", professor: "", year: "", url: "", pages: "", size: "" });
      },
      onError: () => toast.error("Failed to add PDF."),
    });
  };

  const handleDelete = (id: number) => {
    deletePdf.mutate({ id }, {
      onSuccess: () => {
        toast.success("PDF deleted.");
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
      },
      onError: () => toast.error("Failed to delete PDF."),
    });
  };

  const pdfList = Array.isArray(pdfs) ? pdfs : [];

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
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Upload PDF</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Document</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Size / Pages</TableHead>
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
              ) : pdfList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileIcon className="h-8 w-8 opacity-30" />
                      <span>No PDFs yet. Click "Upload PDF" to add one.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pdfList.map((pdf) => (
                  <TableRow key={pdf.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                          <FileIcon size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{pdf.title}</div>
                          <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                            <Link size={10} /> View PDF
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-500/5 border-orange-500/20 text-orange-500">{pdf.subject}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{pdf.professor || "—"}</TableCell>
                    <TableCell className="text-sm">{pdf.downloadCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{pdf.size || "—"}</div>
                      <div className="text-xs">{pdf.pages ? `${pdf.pages} pages` : "—"}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload New PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Guyton Physiology - Chapter 5" className="bg-background/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
                <Label>Year</Label>
                <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>PDF URL <span className="text-destructive">*</span></Label>
              <Input placeholder="https://drive.google.com/..." className="bg-background/50" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Professor</Label>
                <Input placeholder="Dr. Name" className="bg-background/50" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Pages</Label>
                <Input type="number" placeholder="e.g. 120" className="bg-background/50" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>File Size</Label>
                <Input placeholder="e.g. 5.2 MB" className="bg-background/50" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createPdf.isPending}>
              {createPdf.isPending ? "Uploading..." : "Upload PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
