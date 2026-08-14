import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CopyCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const MBBS_YEARS = ["1st Year", "2nd Year", "3rd/4th Year", "Final Year"] as const;

interface Props {
  /** e.g. "/api/quizzes/bulk-duplicate" */
  endpoint: string;
  /** e.g. "quizzes", "notes" — shown in the dialog */
  contentLabel: string;
  /** Query keys to invalidate after a successful migration. Accepts readonly arrays too. */
  queryKeys?: ReadonlyArray<unknown>[];
}

export default function BatchMigrateButton({
  endpoint,
  contentLabel,
  queryKeys = [],
}: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fromYear, setFromYear] = useState<string>("1st Year");
  const [toYear, setToYear]     = useState<string>("2nd Year");

  async function run() {
    if (fromYear === toYear) {
      toast.error("Source and target year cannot be the same.");
      return;
    }
    setLoading(true);
    try {
      const data = await customFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ fromBatch: fromYear, toBatch: toYear }),
      }) as { copied?: number; skipped?: number; total?: number };
      const { copied = 0, skipped = 0, total = 0 } = data;
      toast.success(
        `Migrated ${contentLabel}: ${copied} copied, ${skipped} skipped (${total} total in source year)`,
        { duration: 6000 }
      );
      for (const key of queryKeys) qc.invalidateQueries({ queryKey: key as unknown[] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? `Failed to migrate ${contentLabel}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 shrink-0"
        title={`Copy all ${contentLabel} from one academic year to another`}
      >
        <CopyCheck className="mr-2 h-4 w-4" />
        Migrate All →
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!loading) setOpen(v); }}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle>Migrate all {contentLabel}</DialogTitle>
            <DialogDescription>
              Copy every {contentLabel} from one academic year into another.
              Items already present in the target year (matched by title + subject) are skipped — safe to run twice.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From year</Label>
              <Select value={fromYear} onValueChange={setFromYear}>
                <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MBBS_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To year</Label>
              <Select value={toYear} onValueChange={setToYear}>
                <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MBBS_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={run} disabled={loading || fromYear === toYear}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Migrating…</>
                : `Copy ${contentLabel}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
