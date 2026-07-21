import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, FileText, ImageIcon, Eye, Zap, Store, Clock } from "lucide-react";

interface PendingSubmission {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  status: string;
  createdAt: string;
  uploaderName: string;
  uploaderEmail: string;
  uploaderId: number;
}

export default function AdminNotesMarketplace() {
  const [selectedSub, setSelectedSub] = useState<PendingSubmission | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const qc = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ["admin-marketplace-pending"],
    queryFn: () => apiFetchJson<{ submissions: PendingSubmission[] }>("/api/admin/marketplace/notes/pending"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetchJson(`/api/admin/marketplace/notes/${id}/approve`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (_, id) => {
      toast.success("Notes approved! XP awarded to student.");
      qc.invalidateQueries({ queryKey: ["admin-marketplace-pending"] });
      if (selectedSub?.id === id) setSelectedSub(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Approve failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: number; adminNote: string }) =>
      apiFetchJson(`/api/admin/marketplace/notes/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNote }),
      }),
    onSuccess: (_, { id }) => {
      toast.success("Submission rejected.");
      qc.invalidateQueries({ queryKey: ["admin-marketplace-pending"] });
      setRejectOpen(false);
      setRejectNote("");
      if (selectedSub?.id === id) setSelectedSub(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Reject failed"),
  });

  const pending = pendingQuery.data?.submissions ?? [];

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Store className="text-violet-400" size={20} />
        <h1 className="text-xl font-bold text-violet-300">Notes Marketplace</h1>
        <Badge className="bg-yellow-700/30 text-yellow-300 border-yellow-700/40 ml-2">
          <Clock size={10} className="mr-1" />{pending.length} pending
        </Badge>
      </div>

      {pendingQuery.isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading...</div>
      ) : pending.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={36} className="mx-auto mb-3 text-green-500" />
          <p className="text-gray-300 font-medium">All caught up!</p>
          <p className="text-gray-500 text-sm mt-1">No pending submissions to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(sub => (
            <div key={sub.id} className="bg-[#13152a] border border-white/5 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 flex-shrink-0">
                  {sub.fileType === "pdf"
                    ? <FileText size={18} className="text-red-400" />
                    : <ImageIcon size={18} className="text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{sub.title}</p>
                  <p className="text-xs text-gray-400">{sub.subject} · by <span className="text-violet-300">{sub.uploaderName}</span> ({sub.uploaderEmail})</p>
                  {sub.description && (
                    <p className="text-xs text-gray-500 mt-1">{sub.description}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(sub.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/10 text-gray-300 text-xs h-7 w-full">
                      <Eye size={11} className="mr-1" /> Preview
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(sub.id)}
                    disabled={approveMutation.isPending}
                    className="bg-green-700 hover:bg-green-600 text-white text-xs h-7"
                  >
                    <CheckCircle size={11} className="mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedSub(sub); setRejectOpen(true); }}
                    className="border-red-700/40 text-red-400 hover:bg-red-900/20 text-xs h-7"
                  >
                    <XCircle size={11} className="mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-[#13152a] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">Reject Submission</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300">{selectedSub?.title}</p>
          <Textarea
            placeholder="Reason for rejection (shown to student)..."
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            className="bg-[#1a1d35] border-white/10 text-white placeholder-gray-500 resize-none text-sm"
            rows={3}
            maxLength={300}
          />
          <div className="flex gap-2 mt-1">
            <Button
              onClick={() => { setRejectOpen(false); setRejectNote(""); }}
              variant="outline"
              className="flex-1 border-white/10 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedSub && rejectMutation.mutate({ id: selectedSub.id, adminNote: rejectNote })}
              disabled={rejectMutation.isPending}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
