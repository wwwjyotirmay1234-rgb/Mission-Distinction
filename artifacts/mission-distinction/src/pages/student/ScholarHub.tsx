import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customFetch } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap, FileText, BookOpen, ClipboardList, Upload, Link2,
  CheckCircle2, XCircle, Clock, ExternalLink, Loader2, Star,
} from "lucide-react";

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry",
  "Microbiology", "Pathology", "Pharmacology",
  "Forensic Medicine", "Community Medicine",
];

const YEARS = [
  "2024", "2023", "2022", "2021", "2020",
  "2019", "2018", "2017", "2016", "2015",
];

const TYPE_META = {
  note:  { label: "Notes",     icon: FileText,      color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",   desc: "Handwritten or typed notes" },
  book:  { label: "Book",      icon: BookOpen,      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", desc: "Reference books or resources" },
  pyq:   { label: "PYQ",       icon: ClipboardList, color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30",  desc: "Previous year question papers" },
} as const;

type SubType = keyof typeof TYPE_META;

type Submission = {
  id: number;
  type: SubType;
  title: string;
  subject: string;
  year: string | null;
  url: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by_name: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

async function requestUploadUrl(fileName: string) {
  return customFetch<{ signedUrl: string; serveUrl: string }>("/api/upload/submission/request-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });
}

const STATUS_META = {
  pending:  { label: "Under Review", icon: Clock,          color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
  approved: { label: "Approved",     icon: CheckCircle2,   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  rejected: { label: "Rejected",     icon: XCircle,        color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
};

function SubmissionCard({ sub }: { sub: Submission }) {
  const tm = TYPE_META[sub.type];
  const sm = STATUS_META[sub.status];
  const Icon = tm.icon;
  const SIcon = sm.icon;
  return (
    <Card className="bg-background/40 border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border ${tm.bg} shrink-0`}>
            <Icon size={16} className={tm.color} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-sm text-foreground line-clamp-1">{sub.title}</p>
              <Badge variant="outline" className={`text-[10px] shrink-0 px-2 py-0.5 border ${sm.bg} ${sm.color}`}>
                <SIcon size={10} className="mr-1" />{sm.label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge variant="outline" className="text-[10px] px-2 border-border/50 text-muted-foreground">{sub.subject}</Badge>
              {sub.year && <Badge variant="outline" className="text-[10px] px-2 border-border/50 text-muted-foreground">{sub.year}</Badge>}
              <Badge variant="outline" className={`text-[10px] px-2 border ${tm.bg} ${tm.color}`}>{tm.label}</Badge>
            </div>
            {sub.status === "rejected" && sub.rejection_reason && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 mt-1">
                Reason: {sub.rejection_reason}
              </p>
            )}
            {sub.status === "approved" && (
              <p className="text-xs text-emerald-400 mt-1">
                Added to {TYPE_META[sub.type].label} library ✓
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Submitted {new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScholarHub() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [type, setType] = useState<SubType>("note");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [useUpload, setUseUpload] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: mySubmissions, isLoading: loadingMy } = useQuery<Submission[]>({
    queryKey: ["scholar-hub-my"],
    queryFn: () => customFetch<Submission[]>("/api/submissions/my"),
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      customFetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Submitted! Admins will review it shortly.");
      setTitle(""); setSubject(""); setYear(""); setDescription("");
      setDriveUrl(""); setUploadedUrl(""); setUseUpload(false);
      qc.invalidateQueries({ queryKey: ["scholar-hub-my"] });
    },
    onError: (e: any) => toast.error(e?.message || "Submission failed"),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("File must be under 50 MB"); return; }
    setUploading(true);
    try {
      const { signedUrl, serveUrl } = await requestUploadUrl(file.name);
      const res = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file });
      if (!res.ok) throw new Error("Upload failed");
      setUploadedUrl(serveUrl);
      toast.success("PDF uploaded successfully!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = useUpload ? uploadedUrl : driveUrl.trim();
    if (!url) { toast.error(useUpload ? "Please upload a PDF first" : "Please enter a Google Drive link"); return; }
    if (!title.trim() || !subject) { toast.error("Title and subject are required"); return; }
    if (type === "pyq" && !year) { toast.error("Year is required for PYQs"); return; }
    const body: Record<string, string> = { type, title: title.trim(), subject, url };
    if (year) body.year = year;
    if (description.trim()) body.description = description.trim();
    submitMutation.mutate(body);
  }

  const pending = mySubmissions?.filter(s => s.status === "pending").length ?? 0;
  const approved = mySubmissions?.filter(s => s.status === "approved").length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
            <GraduationCap size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Scholar Hub</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Share your notes, books, and PYQs with fellow students. Submit a resource and once
              an admin approves it, it'll appear in the library for everyone to access.
            </p>
            {(pending > 0 || approved > 0) && (
              <div className="flex gap-3 mt-3">
                {pending > 0 && (
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10">
                    <Clock size={10} className="mr-1" />{pending} under review
                  </Badge>
                )}
                {approved > 0 && (
                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    <Star size={10} className="mr-1" />{approved} published
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Form */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload size={16} className="text-primary" />
            Submit a Resource
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Type selector */}
            <div className="space-y-1.5">
              <Label>Resource Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TYPE_META) as SubType[]).map(t => {
                  const tm = TYPE_META[t];
                  const Icon = tm.icon;
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                        active
                          ? `${tm.bg} ${tm.color} border-current`
                          : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <Icon size={18} />
                      {tm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="sh-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="sh-title"
                placeholder={
                  type === "pyq" ? "e.g. Anatomy VIMSAR 2023"
                  : type === "book" ? "e.g. Gray's Anatomy"
                  : "e.g. Upper Limb Notes — Chapter 1-4"
                }
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-background/50"
                maxLength={150}
              />
            </div>

            {/* Subject + Year */}
            <div className={`grid gap-3 ${type === "pyq" ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {type === "pyq" && (
                <div className="space-y-1.5">
                  <Label>Year <span className="text-destructive">*</span></Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* URL or Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>File / Link <span className="text-destructive">*</span></Label>
                <button
                  type="button"
                  onClick={() => { setUseUpload(v => !v); setDriveUrl(""); setUploadedUrl(""); }}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  {useUpload ? "Paste a link instead" : "Upload PDF instead"}
                </button>
              </div>

              {useUpload ? (
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    uploadedUrl
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 size={22} className="animate-spin text-primary" />
                      <span className="text-sm">Uploading…</span>
                    </div>
                  ) : uploadedUrl ? (
                    <div className="flex flex-col items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 size={22} />
                      <span className="text-sm font-medium">PDF uploaded!</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setUploadedUrl(""); }} className="text-xs text-muted-foreground hover:text-foreground underline mt-0.5">Remove</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                      <Upload size={22} />
                      <span className="text-sm">Click to upload PDF</span>
                      <span className="text-xs">Max 50 MB</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={driveUrl}
                    onChange={e => setDriveUrl(e.target.value)}
                    className="pl-8 bg-background/50"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="sh-desc">Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="sh-desc"
                placeholder="Brief description — what topics are covered, which chapter, etc."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="bg-background/50 resize-none text-sm"
                maxLength={500}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitMutation.isPending || uploading}>
              {submitMutation.isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Submitting…</> : "Submit for Review"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Submissions */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          My Contributions
          {mySubmissions && (
            <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground normal-case">
              {mySubmissions.length}
            </Badge>
          )}
        </h2>

        {loadingMy ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !mySubmissions?.length ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
            <GraduationCap size={28} className="mx-auto mb-2 opacity-30" />
            No submissions yet. Share something above!
          </div>
        ) : (
          <div className="space-y-3">
            {mySubmissions.map(sub => <SubmissionCard key={sub.id} sub={sub} />)}
          </div>
        )}
      </div>
    </div>
  );
}
