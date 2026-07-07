import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Stethoscope, Plus, Trash2, Pencil, Calendar } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface ClinicalCase {
  id: number;
  scenario: string;
  subject: string;
  modelAnswer: string;
  explanation: string;
  dateAssigned: string | null;
  createdAt: string;
}

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology",
  "Microbiology", "Medicine", "Surgery", "Obstetrics", "Paediatrics",
  "Ophthalmology", "ENT", "Orthopaedics", "Psychiatry", "Dermatology",
  "Radiology", "Community Medicine", "Forensic Medicine",
];

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const EMPTY_FORM = {
  scenario: "",
  subject: "Medicine",
  modelAnswer: "",
  explanation: "",
  dateAssigned: "",
};

export default function AdminClinicalCases() {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ClinicalCase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClinicalCase | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCases = async () => {
    try {
      const res = await apiFetch(`${BASE}/api/admin/clinical-cases`);
      if (res.ok) setCases(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (c: ClinicalCase) => {
    setEditTarget(c);
    setForm({
      scenario: c.scenario,
      subject: c.subject,
      modelAnswer: c.modelAnswer,
      explanation: c.explanation,
      dateAssigned: c.dateAssigned ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.scenario.trim() || !form.modelAnswer.trim() || !form.explanation.trim()) {
      toast.error("Scenario, model answer, and explanation are required.");
      return;
    }
    setSaving(true);
    try {
      const method = editTarget ? "PUT" : "POST";
      const url = editTarget
        ? `${BASE}/api/admin/clinical-cases/${editTarget.id}`
        : `${BASE}/api/admin/clinical-cases`;
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editTarget ? "Case updated!" : "Case created!");
        setShowForm(false);
        fetchCases();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save case");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`${BASE}/api/admin/clinical-cases/${deleteTarget.id}`, { method: "DELETE" });
      setCases(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success("Case deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = cases.filter(c =>
    !search ||
    c.scenario.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> Clinical Cases
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cases.length} case{cases.length !== 1 ? "s" : ""} · Students get one per day, cycling automatically
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" size="sm">
          <Plus size={14} /> Add Case
        </Button>
      </div>

      <Input
        placeholder="Search by scenario or subject…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-2xl text-muted-foreground">
          <Stethoscope size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No cases yet — click "Add Case" to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {c.subject}
                      </Badge>
                      {c.dateAssigned && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/20 bg-blue-400/5 gap-1">
                          <Calendar size={10} /> {c.dateAssigned}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed line-clamp-2">{c.scenario}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      <strong>Model Answer:</strong> {c.modelAnswer}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(c)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Clinical Case" : "Add Clinical Case"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Subject</label>
              <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Clinical Scenario <span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.scenario}
                onChange={e => setForm(f => ({ ...f, scenario: e.target.value }))}
                placeholder="Describe the patient presentation, age, symptoms, signs, investigations…"
                rows={5}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none outline-none focus:border-primary/50 transition-colors"
              />
              <p className="text-[10px] text-muted-foreground">{form.scenario.length}/2000</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Model Answer <span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.modelAnswer}
                onChange={e => setForm(f => ({ ...f, modelAnswer: e.target.value }))}
                placeholder="The complete, accurate answer a student should give — used by AI to grade responses"
                rows={4}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Explanation for Students <span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.explanation}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="The teaching point shown to students after they attempt — key concepts, clinical pearls, exam tips"
                rows={3}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Assign to Specific Date (optional)
              </label>
              <Input
                type="date"
                value={form.dateAssigned}
                onChange={e => setForm(f => ({ ...f, dateAssigned: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground">
                Leave blank to let the system cycle through cases automatically.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editTarget ? "Update Case" : "Create Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete clinical case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all student attempts for this case. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
