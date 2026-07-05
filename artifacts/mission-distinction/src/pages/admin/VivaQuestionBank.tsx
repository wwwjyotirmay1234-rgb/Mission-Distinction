import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Sparkles, Save } from "lucide-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"] as const;
type Subject = (typeof SUBJECTS)[number];

const EXAMINER_NAMES: Record<Subject, string> = {
  Anatomy: "Dr. Aswini",
  Physiology: "Dr. Rajiv",
  Biochemistry: "Dr. Madhu",
};

interface VivaSource {
  subject: Subject;
  sourceText: string;
  updatedAt: string | null;
}

export default function VivaQuestionBank() {
  const [activeSubject, setActiveSubject] = useState<Subject>("Anatomy");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: sources, isLoading } = useQuery<VivaSource[]>({
    queryKey: ["viva-sources"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/viva-sources");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const activeSource = sources?.find((s) => s.subject === activeSubject);

  useEffect(() => {
    setDraft(activeSource?.sourceText ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject, sources]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/viva-sources/${activeSubject}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: draft.trim() }),
      });
      if (res.ok) {
        toast.success("Source notes saved");
        queryClient.invalidateQueries({ queryKey: ["viva-sources"] });
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Failed to save source notes");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary" /> Practical Hub — Viva Examiners
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Each subject has its own named AI examiner who writes and asks the viva questions live —{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Anatomy}</span> (Anatomy),{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Physiology}</span> (Physiology), and{" "}
          <span className="font-medium text-foreground">{EXAMINER_NAMES.Biochemistry}</span> (Biochemistry).
          You don't need to write exact questions. Optionally share focus areas or reference notes below — the examiner
          will use them as inspiration while still writing every question in its own words.
        </p>
      </div>

      <Tabs value={activeSubject} onValueChange={(v) => setActiveSubject(v as Subject)}>
        <TabsList>
          {SUBJECTS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>
                {EXAMINER_NAMES[activeSubject]} generates {activeSubject} questions itself — notes below are optional guidance, not a script.
              </span>
            </div>
            <Textarea
              placeholder={`e.g. Focus on lower limb osteology and femoral triangle this term; emphasize NEET PG high-yield topics for ${activeSubject}...`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bg-muted/30 resize-none min-h-[220px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
