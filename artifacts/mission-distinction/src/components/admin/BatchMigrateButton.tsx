import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { CopyCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  /** e.g. "/api/quizzes/bulk-duplicate" */
  endpoint: string;
  /** e.g. "quizzes", "notes" — shown in the dialog */
  contentLabel: string;
  /** Source batch. Defaults to "2025-26" */
  fromBatch?: string;
  /** Target batch. Defaults to "2026-27" */
  toBatch?: string;
  /** Query keys to invalidate after a successful migration. Accepts readonly arrays too. */
  queryKeys?: ReadonlyArray<unknown>[];
}

export default function BatchMigrateButton({
  endpoint,
  contentLabel,
  fromBatch = "2025-26",
  toBatch   = "2026-27",
  queryKeys = [],
}: Props) {
  const qc = useQueryClient();
  const [open, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      // customFetch returns the parsed JSON body directly and throws on non-2xx
      const data = await customFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ fromBatch, toBatch }),
      }) as { copied?: number; skipped?: number; total?: number };
      const { copied = 0, skipped = 0, total = 0 } = data;
      toast.success(
        `Migrated ${contentLabel}: ${copied} copied, ${skipped} skipped (${total} total in source batch)`,
        { duration: 6000 }
      );
      for (const key of queryKeys) qc.invalidateQueries({ queryKey: key as unknown[] });
      setPending(false);
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
        onClick={() => setPending(true)}
        className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 shrink-0"
        title={`Copy all ${fromBatch} ${contentLabel} to ${toBatch}`}
      >
        <CopyCheck className="mr-2 h-4 w-4" />
        Migrate All →
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!loading) setPending(v); }}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle>Migrate all {contentLabel}</DialogTitle>
            <DialogDescription>
              Copy every <strong>{fromBatch}</strong> {contentLabel} into the{" "}
              <strong>{toBatch}</strong> batch.
              <br /><br />
              Items that already exist in {toBatch} (matched by title + subject) will be
              skipped automatically — running this twice is safe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={run} disabled={loading}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Migrating…</>
                : `Yes, migrate ${contentLabel}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
