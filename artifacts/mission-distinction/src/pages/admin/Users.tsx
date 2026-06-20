import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useListUsers, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { Search, MoreVertical, Trash2, ShieldOff, Users, Download, AlertTriangle, CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [warnDialog, setWarnDialog] = useState<{ id: number; name: string } | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [warnSeverity, setWarnSeverity] = useState("warning");
  const [issuingWarn, setIssuingWarn] = useState(false);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: usersData, isLoading } = useListUsers(
    { role: roleFilter },
    { query: { queryKey: getListUsersQueryKey({ role: roleFilter }) } }
  );

  const deleteUser = useDeleteUser();

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    deleteUser.mutate({ id: confirmDelete.id }, {
      onSuccess: () => {
        toast.success(`${confirmDelete.name} has been removed.`);
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setSelected(prev => { const next = new Set(prev); next.delete(confirmDelete.id); return next; });
        setConfirmDelete(null);
      },
      onError: () => toast.error("Failed to remove user."),
    });
  };

  const filtered = usersData?.users?.filter(u =>
    !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(u => u.id)));
  };
  const toggleOne = (id: number) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  function exportCSV() {
    const rows = filtered.filter(u => selected.size === 0 || selected.has(u.id));
    const csv = ["Name,Email,Role,Year,College,Joined",
      ...rows.map(u => `"${u.fullName}","${u.email}","${u.role}","${(u as any).year || ""}","${(u as any).college || ""}","${new Date(u.createdAt).toLocaleDateString()}"`)
    ].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "users_export.csv"; a.click();
    toast.success(`Exported ${rows.length} users`);
  }

  async function bulkDelete() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    let done = 0; let failed = 0;
    for (const id of ids) {
      try {
        const res = await apiFetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) done++; else failed++;
      } catch { failed++; }
    }
    if (done > 0) toast.success(`Removed ${done} user${done !== 1 ? "s" : ""}`);
    if (failed > 0) toast.error(`Failed to remove ${failed} user${failed !== 1 ? "s" : ""}`);
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    setSelected(new Set());
  }

  async function issueWarning() {
    if (!warnDialog || !warnReason.trim()) { toast.error("Reason required"); return; }
    setIssuingWarn(true);
    try {
      const res = await apiFetch("/api/admin/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: warnDialog.id, reason: warnReason, severity: warnSeverity }),
      });
      if (res.ok) {
        toast.success(`Warning issued to ${warnDialog.name}`);
        setWarnDialog(null); setWarnReason(""); setWarnSeverity("warning");
      } else toast.error("Failed to issue warning");
    } finally { setIssuingWarn(false); }
  }

  const typeStyle: Record<string, string> = {
    announcement: "border-primary/30 text-primary bg-primary/5",
    news: "border-blue-500/30 text-blue-400 bg-blue-500/5",
    event: "border-green-500/30 text-green-400 bg-green-500/5",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage students and admins on the platform.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search users..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-card/50">
                {roleFilter ? `Role: ${roleFilter}` : "All Roles"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setRoleFilter(undefined)}>All Roles</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter("student")}>Students</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter("admin")}>Admins</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Export Selected
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDelete} className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="text-xs">Clear</Button>
          </div>
        </div>
      )}

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-[280px]">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Year / Details</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 opacity-30" />
                      <span>No users found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id} className={`border-border/40 hover:bg-muted/20 ${selected.has(user.id) ? "bg-primary/5" : ""}`}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={() => toggleOne(user.id)}
                        disabled={user.id === currentUser?.id}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "secondary" : "default"} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.role === "student" ? ((user as any).year || "—") : "Admin Access"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(user as any).college || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {user.id !== currentUser?.id ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setWarnDialog({ id: user.id, name: user.fullName })}>
                              <AlertTriangle className="mr-2 h-4 w-4 text-amber-400" /> Issue Warning
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10"
                              onClick={() => setConfirmDelete({ id: user.id, name: user.fullName })}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              {user.role === "student" ? "Kick Student" : "Remove Admin"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground pr-2">You</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing {filtered.length} of {usersData?.total || 0} users</div>
          {selected.size > 0 && <div className="text-primary">{selected.size} selected</div>}
        </div>
      </Card>

      {/* Warn dialog */}
      <Dialog open={!!warnDialog} onOpenChange={o => !o && setWarnDialog(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Issue Warning to {warnDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Severity</label>
              <Select value={warnSeverity} onValueChange={setWarnSeverity}>
                <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="strike">🟠 Strike</SelectItem>
                  <SelectItem value="final">🔴 Final Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reason</label>
              <Textarea placeholder="Explain the violation..." value={warnReason} onChange={e => setWarnReason(e.target.value)} className="bg-muted/30 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnDialog(null)}>Cancel</Button>
            <Button onClick={issueWarning} disabled={issuingWarn} className="bg-amber-500 hover:bg-amber-600 text-white">
              {issuingWarn ? "Issuing..." : "Issue Warning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong className="text-foreground">{confirmDelete?.name}</strong>? This permanently deletes their account and all data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDeleteConfirm}
            >
              {deleteUser.isPending ? "Removing..." : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
