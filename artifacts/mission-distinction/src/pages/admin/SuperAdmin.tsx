import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, ShieldOff, Trash2, Eye, Search, Users, UserCheck,
  UserX, Crown, Flame, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch as authFetch } from "@/lib/apiFetch";

interface UserRow {
  id: number;
  fullName: string;
  email: string;
  role: "student" | "admin";
  isSuperAdmin: boolean;
  year?: string;
  college?: string;
  studyStreak?: number;
  emailVerified: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  createdAt: string;
}

interface UserActivity {
  user: UserRow;
  quizStats: { attempts: number; avgScore: number };
  recentActivity: Array<{ id: number; type: string; description: string; createdAt: string }>;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (opts.headers) {
    new Headers(opts.headers as HeadersInit).forEach((v, k) => headers.set(k, v));
  }
  return authFetch(`${BASE}${path}`, { ...opts, headers });
}

export default function SuperAdminPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [activityUser, setActivityUser] = useState<UserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [banDialog, setBanDialog] = useState<{ user: UserRow; mode: "ban" | "unban" | "delete" } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  React.useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/super-admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function viewActivity(u: UserRow) {
    setActivityLoading(true);
    try {
      const res = await apiFetch(`/api/super-admin/users/${u.id}/activity`);
      if (res.ok) setActivityUser(await res.json());
    } finally {
      setActivityLoading(false);
    }
  }

  async function confirmAction() {
    if (!banDialog) return;
    setActionLoading(true);
    const { user: u, mode } = banDialog;
    try {
      let res: Response;
      if (mode === "ban") {
        res = await apiFetch(`/api/super-admin/users/${u.id}/ban`, {
          method: "POST", body: JSON.stringify({ reason: banReason }),
        });
      } else if (mode === "unban") {
        res = await apiFetch(`/api/super-admin/users/${u.id}/unban`, { method: "POST" });
      } else {
        res = await apiFetch(`/api/super-admin/users/${u.id}`, { method: "DELETE" });
      }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setBanDialog(null);
      setBanReason("");
      await loadUsers();
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    if (tab === "students") return matchSearch && u.role === "student";
    if (tab === "admins") return matchSearch && u.role === "admin";
    if (tab === "banned") return matchSearch && !!u.bannedAt;
    return matchSearch;
  });

  const counts = {
    all: users.length,
    students: users.filter(u => u.role === "student").length,
    admins: users.filter(u => u.role === "admin").length,
    banned: users.filter(u => !!u.bannedAt).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Crown size={20} className="text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin Control Panel</h1>
          <p className="text-muted-foreground text-sm">Manage all students and admins on the platform</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: counts.all, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Students", value: counts.students, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Admins", value: counts.admins, icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Suspended", value: counts.banned, icon: UserX, color: "text-red-500", bg: "bg-red-500/10" },
        ].map((s) => (
          <Card key={s.label} className="bg-card/40 border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/40 border-border/40">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base">All Users</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8 h-8 bg-background/50 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="mt-2">
            <TabsList className="h-8 text-xs">
              <TabsTrigger value="all" className="text-xs">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="students" className="text-xs">Students ({counts.students})</TabsTrigger>
              <TabsTrigger value="admins" className="text-xs">Admins ({counts.admins})</TabsTrigger>
              <TabsTrigger value="banned" className="text-xs">Suspended ({counts.banned})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((u) => {
                const initials = u.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                const isSelf = u.id === (me as any)?.id;
                return (
                  <div key={u.id} className={`p-4 flex items-center gap-3 hover:bg-muted/10 ${u.bannedAt ? "opacity-60" : ""}`}>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className={`text-xs font-bold ${u.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-primary/20 text-primary"}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{u.fullName}</p>
                        {u.isSuperAdmin && <Crown size={12} className="text-yellow-500 shrink-0" />}
                        {u.bannedAt && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Suspended</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${u.role === "admin" ? "border-purple-500/30 text-purple-400" : "border-primary/30 text-primary"}`}>
                          {u.role}
                        </Badge>
                        {u.role === "student" && u.college && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{u.college}</span>
                        )}
                        {u.studyStreak !== undefined && u.studyStreak > 0 && (
                          <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                            <Flame size={10} />{u.studyStreak}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">Joined {timeAgo(u.createdAt)}</span>
                      </div>
                      {u.bannedAt && u.banReason && (
                        <p className="text-[10px] text-red-400 mt-0.5">Reason: {u.banReason}</p>
                      )}
                    </div>
                    {!isSelf && !u.isSuperAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="View Activity"
                          onClick={() => viewActivity(u)}
                        >
                          <Eye size={14} />
                        </Button>
                        {u.bannedAt ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-500 hover:text-green-400"
                            title="Restore Account"
                            onClick={() => setBanDialog({ user: u, mode: "unban" })}
                          >
                            <ShieldOff size={14} />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-orange-500 hover:text-orange-400"
                            title="Suspend Account"
                            onClick={() => { setBanDialog({ user: u, mode: "ban" }); setBanReason(""); }}
                          >
                            <Shield size={14} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Delete Account"
                          onClick={() => setBanDialog({ user: u, mode: "delete" })}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Dialog */}
      <Dialog open={!!activityUser} onOpenChange={() => setActivityUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity size={16} /> {activityUser?.user.fullName}'s Activity
            </DialogTitle>
            <DialogDescription>{activityUser?.user.email}</DialogDescription>
          </DialogHeader>
          {activityLoading ? (
            <div className="space-y-3 py-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-32 w-full" /></div>
          ) : activityUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{activityUser.quizStats.attempts}</p>
                  <p className="text-xs text-muted-foreground">Quizzes Taken</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{activityUser.quizStats.avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Recent Activity</p>
                {activityUser.recentActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {activityUser.recentActivity.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
                        <span className="truncate flex-1">{a.description}</span>
                        <span className="text-muted-foreground ml-2 shrink-0">{timeAgo(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Ban/Delete Confirmation Dialog */}
      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={banDialog?.mode === "delete" ? "text-destructive" : banDialog?.mode === "ban" ? "text-orange-500" : "text-green-500"}>
              {banDialog?.mode === "ban" ? "Suspend Account" : banDialog?.mode === "unban" ? "Restore Account" : "Delete Account"}
            </DialogTitle>
            <DialogDescription>
              {banDialog?.mode === "ban"
                ? `This will immediately suspend ${banDialog?.user.fullName} from accessing the platform.`
                : banDialog?.mode === "unban"
                ? `This will restore ${banDialog?.user.fullName}'s access to the platform.`
                : `This will permanently delete ${banDialog?.user.fullName}'s account and all their data. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          {banDialog?.mode === "ban" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                placeholder="e.g. Spam, inappropriate behaviour..."
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBanDialog(null)}>Cancel</Button>
            <Button
              variant={banDialog?.mode === "unban" ? "default" : "destructive"}
              disabled={actionLoading}
              onClick={confirmAction}
            >
              {actionLoading ? "Processing..." : banDialog?.mode === "ban" ? "Suspend" : banDialog?.mode === "unban" ? "Restore" : "Delete Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
