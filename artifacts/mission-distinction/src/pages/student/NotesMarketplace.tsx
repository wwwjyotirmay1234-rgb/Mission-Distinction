import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Store, Upload, FileText, ImageIcon, Clock, CheckCircle, XCircle, Zap, Eye, Download } from "lucide-react";

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry",
  "Pathology", "Pharmacology", "Microbiology",
  "Forensic Medicine", "Community Medicine",
  "General Medicine", "General Surgery",
  "Obstetrics & Gynaecology", "Paediatrics",
];

interface ApprovedNote {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  uploaderName: string;
  createdAt: string;
}

interface MySubmission {
  id: number;
  title: string;
  subject: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: string;
  xpAwarded: boolean;
}

export default function NotesMarketplace() {
  const [tab, setTab] = useState<"browse" | "my-submissions">("browse");
  const [filterSubject, setFilterSubject] = useState("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const approvedQuery = useQuery({
    queryKey: ["marketplace-notes", filterSubject],
    queryFn: () =>
      apiFetchJson<{ notes: ApprovedNote[] }>(
        `/api/marketplace/notes${filterSubject !== "All" ? `?subject=${encodeURIComponent(filterSubject)}` : ""}`
      ),
  });

  const mySubmissionsQuery = useQuery({
    queryKey: ["my-note-submissions"],
    queryFn: () => apiFetchJson<{ submissions: MySubmission[] }>("/api/marketplace/notes/my-submissions"),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!file || !title.trim() || !subject) throw new Error("File, title and subject are required");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("subject", subject);
      if (description.trim()) formData.append("description", description.trim());

      const token = localStorage.getItem("mission_token");
      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${BASE}/api/marketplace/notes/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to submit");
      }
      return resp.json();
    },
    onSuccess: () => {
      toast.success("Notes submitted for review! You'll earn Goals when approved.");
      setUploadOpen(false);
      setFile(null);
      setTitle("");
      setSubject("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["my-note-submissions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Submit failed"),
  });

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/40"><CheckCircle size={10} className="mr-1" />Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40"><XCircle size={10} className="mr-1" />Rejected</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/40"><Clock size={10} className="mr-1" />Pending Review</Badge>;
  };

  const notes = approvedQuery.data?.notes ?? [];
  const filtered = filterSubject === "All" ? notes : notes.filter(n => n.subject === filterSubject);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store className="text-primary" size={20} />
            <h1 className="text-xl font-bold text-primary">Notes Marketplace</h1>
          </div>
          <p className="text-sm text-muted-foreground">Community-shared handwritten notes — approved by admins</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0">
              <Upload size={14} className="mr-1" /> Share Notes
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="text-primary">Share Your Notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                <Input
                  placeholder="e.g. Anatomy Upper Limb Short Notes"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Subject *</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description <span className="text-muted-foreground/60">(optional)</span></label>
                <Textarea
                  placeholder="What topics does this cover? Any special tips?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none text-sm"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">File * <span className="text-muted-foreground/60">(PDF or image, max 30 MB)</span></label>
                {file ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                    {file.type === "application/pdf"
                      ? <FileText size={20} className="text-red-500 flex-shrink-0" />
                      : <ImageIcon size={20} className="text-blue-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive text-xs">Remove</button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 border-2 border-dashed border-border rounded-xl text-center text-sm text-muted-foreground hover:border-primary transition-colors"
                  >
                    <Upload size={20} className="mx-auto mb-1 text-muted-foreground" />
                    Click to select PDF or image
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 30 * 1024 * 1024) { toast.error("File must be under 30 MB"); return; }
                    setFile(f ?? null);
                  }}
                />
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs text-primary">
                <Zap size={12} className="inline mr-1" />
                You'll earn <strong>10–20 Goals ⚽</strong> when your notes are approved by an admin.
              </div>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || !file || !title.trim() || !subject}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                {submitMutation.isPending ? "Uploading..." : "Submit for Review"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-xl">
        {(["browse", "my-submissions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "browse" ? "Browse Notes" : "My Submissions"}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <>
          {/* Subject filter */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {["All", ...SUBJECTS.slice(0, 8)].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSubject(s)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filterSubject === s
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border text-foreground hover:border-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {approvedQuery.isLoading ? (
            <div className="text-center text-muted-foreground py-12 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <svg viewBox="0 0 64 48" className="mx-auto mb-3 w-14 h-10 text-primary/30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="56" height="5" rx="2.5" fill="currentColor"/>
                <rect x="4" y="4" width="5" height="34" rx="2.5" fill="currentColor"/>
                <rect x="55" y="4" width="5" height="34" rx="2.5" fill="currentColor"/>
                <path d="M4 38 Q32 28 60 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45"/>
                <circle cx="32" cy="22" r="6" fill="currentColor" opacity="0.35"/>
                <path d="M32 16 l2 4 l4 0 l-3 3 l1 4 l-4-3 l-4 3 l1-4 l-3-3 l4 0 z" fill="white" opacity="0.5" transform="scale(0.7) translate(14,14)"/>
              </svg>
              <p className="text-muted-foreground font-medium">No notes on the pitch yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Be the first to share your notes!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(note => (
                <div key={note.id} className="bg-card border border-border/40 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0">
                      {note.fileType === "pdf"
                        ? <FileText size={18} className="text-red-500" />
                        : <ImageIcon size={18} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{note.subject} · by {note.uploaderName}</p>
                      {note.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.description}</p>
                      )}
                    </div>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-8">
                        <Eye size={12} className="mr-1" /> View
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "my-submissions" && (
        <>
          {mySubmissionsQuery.isLoading ? (
            <div className="text-center text-muted-foreground py-12 text-sm">Loading...</div>
          ) : (mySubmissionsQuery.data?.submissions?.length ?? 0) === 0 ? (
            <div className="text-center py-16">
              <svg viewBox="0 0 64 64" className="mx-auto mb-3 w-12 h-12 text-primary/30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="4"/>
                <path d="M32 14 l5 10 l11 1.5 l-8 7.5 l2 11 l-10-5.5 l-10 5.5 l2-11 l-8-7.5 l11-1.5 z" fill="currentColor" opacity="0.45"/>
                <circle cx="32" cy="32" r="5" fill="currentColor" opacity="0.6"/>
              </svg>
              <p className="text-muted-foreground font-medium">No goals from your side yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Share your notes and score Goals!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissionsQuery.data!.submissions.map(sub => (
                <div key={sub.id} className="bg-card border border-border/40 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{sub.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{sub.subject} · {new Date(sub.createdAt).toLocaleDateString()}</p>
                      {statusBadge(sub.status)}
                      {sub.status === "approved" && sub.xpAwarded && (
                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400"><Zap size={10} className="inline" /> Goals awarded!</span>
                      )}
                    </div>
                  </div>
                  {sub.adminNote && (
                    <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 border border-border/40">
                      <strong>Admin note:</strong> {sub.adminNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
