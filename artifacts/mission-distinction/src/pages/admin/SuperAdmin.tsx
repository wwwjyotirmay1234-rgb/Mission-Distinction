import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield, ShieldOff, Trash2, Eye, Search, Users, UserCheck, UserX,
  Crown, Flame, Activity, UserPlus, UserMinus, LogOut, Globe, Settings,
  MessageSquare, Key, Copy, Check, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch as authFetch } from "@/lib/apiFetch";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function api(path: string, opts: RequestInit = {}) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (opts.headers) new Headers(opts.headers as HeadersInit).forEach((v, k) => headers.set(k, v));
  return authFetch(`${BASE}${path}`, { ...opts, headers });
}

interface UserRow {
  id: number;
  fullName: string;
  email: string;
  mobileNumber?: string | null;
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

interface GroupRow {
  id: number;
  name: string;
  subject: string;
  description?: string | null;
  isAdminCreated: boolean;
  memberCount: number;
  creatorName: string;
  lastMessage?: string | null;
  createdAt: string;
}

interface PlatformSettings {
  stats: { totalUsers: number; totalGroups: number; activeSessions: number; bannedUsers: number };
  inviteCode: string | null;
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

type ActionMode = "ban" | "unban" | "delete" | "promote" | "demote" | "force-logout";

export default function SuperAdminPanel() {
  const { user: me } = useAuth();

  // ─ Users tab
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userTab, setUserTab] = useState("all");
  const [activityUser, setActivityUser] = useState<UserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ user: UserRow; mode: ActionMode } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ─ Community tab
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

  // ─ Platform tab
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const res = await api("/api/super-admin/users");
      if (res.ok) setUsers(await res.json());
    } finally { setUsersLoading(false); }
  }

  async function loadGroups() {
    setGroupsLoading(true);
    try {
      const res = await api("/api/super-admin/community");
      if (res.ok) setGroups(await res.json());
    } finally { setGroupsLoading(false); }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const res = await api("/api/super-admin/settings");
      if (res.ok) setSettings(await res.json());
    } finally { setSettingsLoading(false); }
  }

  async function viewActivity(u: UserRow) {
    setActivityLoading(true);
    try {
      const res = await api(`/api/super-admin/users/${u.id}/activity`);
      if (res.ok) setActivityUser(await res.json());
    } finally { setActivityLoading(false); }
  }

  async function confirmAction() {
    if (!actionDialog) return;
    setActionLoading(true);
    const { user: u, mode } = actionDialog;
    try {
      let res: Response;
      if (mode === "ban") res = await api(`/api/super-admin/users/${u.id}/ban`, { method: "POST", body: JSON.stringify({ reason: banReason }) });
      else if (mode === "unban") res = await api(`/api/super-admin/users/${u.id}/unban`, { method: "POST" });
      else if (mode === "delete") res = await api(`/api/super-admin/users/${u.id}`, { method: "DELETE" });
      else if (mode === "promote") res = await api(`/api/super-admin/users/${u.id}/promote-admin`, { method: "POST" });
      else if (mode === "demote") res = await api(`/api/super-admin/users/${u.id}/demote-admin`, { method: "POST" });
      else res = await api(`/api/super-admin/users/${u.id}/force-logout`, { method: "POST" });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setActionDialog(null);
      setBanReason("");
      await loadUsers();
    } finally { setActionLoading(false); }
  }

  async function deleteGroup(group: GroupRow) {
    if (!window.confirm(`Delete group "${group.name}"? This removes all messages and members.`)) return;
    setDeletingGroupId(group.id);
    try {
      const res = await api(`/api/super-admin/community/${group.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setGroups(prev => prev.filter(g => g.id !== group.id));
    } finally { setDeletingGroupId(null); }
  }

  function copyInviteCode() {
    if (!settings?.inviteCode) return;
    navigator.clipboard.writeText(settings.inviteCode).then(() => {
      setCodeCopied(true);
      toast.success("Invite code copied");
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const match = u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    if (userTab === "students") return match && u.role === "student";
    if (userTab === "admins") return match && u.role === "admin";
    if (userTab === "banned") return match && !!u.bannedAt;
    return match;
  });

  const counts = {
    all: users.length,
    students: users.filter(u => u.role === "student").length,
    admins: users.filter(u => u.role === "admin").length,
    banned: users.filter(u => !!u.bannedAt).length,
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.subject.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.creatorName.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const actionMeta: Record<ActionMode, { title: string; desc: (name: string) => string; confirmLabel: string; variant: "default" | "destructive" }> = {
    ban: { title: "Suspend Account", desc: (n) => `${n} will immediately lose access to the platform.`, confirmLabel: "Suspend", variant: "destructive" },
    unban: { title: "Restore Account", desc: (n) => `${n}'s access will be restored.`, confirmLabel: "Restore", variant: "default" },
    delete: { title: "Delete Account", desc: (n) => `Permanently delete ${n}'s account and all their data. This cannot be undone.`, confirmLabel: "Delete Forever", variant: "destructive" },
    promote: { title: "Promote to Admin", desc: (n) => `Grant ${n} admin privileges. They will be able to manage all content.`, confirmLabel: "Promote", variant: "default" },
    demote: { title: "Demote to Student", desc: (n) => `Remove ${n}'s admin access and revert to student. Their sessions will be cleared.`, confirmLabel: "Demote", variant: "destructive" },
    "force-logout": { title: "Force Logout", desc: (n) => `Clear all active sessions for ${n}. They will need to log in again on all devices.`, confirmLabel: "Force Logout", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Crown size={20} className="text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin Control Panel</h1>
          <p className="text-muted-foreground text-sm">Full platform authority — Users, Community, Settings</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: counts.all, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Students", value: counts.students, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Admins", value: counts.admins, icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Suspended", value: counts.banned, icon: UserX, color: "text-red-500", bg: "bg-red-500/10" },
        ].map(s => (
          <Card key={s.label} className="bg-card/40 border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold">{usersLoading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2"><Users size={14} /> Users</TabsTrigger>
          <TabsTrigger value="community" className="gap-2" onClick={() => { if (!groups.length) loadGroups(); }}>
            <MessageSquare size={14} /> Community
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-2" onClick={() => { if (!settings) loadSettings(); }}>
            <Settings size={14} /> Platform
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="users">
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle className="text-base">All Users</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search by name or email…" className="pl-8 h-8 bg-background/50 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" title="Refresh" onClick={loadUsers}><RefreshCw size={14} /></Button>
                </div>
              </div>
              <Tabs value={userTab} onValueChange={setUserTab} className="mt-2">
                <TabsList className="h-8 text-xs">
                  <TabsTrigger value="all" className="text-xs">All ({counts.all})</TabsTrigger>
                  <TabsTrigger value="students" className="text-xs">Students ({counts.students})</TabsTrigger>
                  <TabsTrigger value="admins" className="text-xs">Admins ({counts.admins})</TabsTrigger>
                  <TabsTrigger value="banned" className="text-xs">Suspended ({counts.banned})</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredUsers.map(u => {
                    const initials = u.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                    const isSelf = u.id === (me as any)?.id;
                    return (
                      <div key={u.id} className={`p-4 flex items-center gap-3 hover:bg-muted/10 ${u.bannedAt ? "opacity-60" : ""}`}>
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className={`text-xs font-bold ${u.isSuperAdmin ? "bg-yellow-500/20 text-yellow-400" : u.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-primary/20 text-primary"}`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium truncate">{u.fullName}</p>
                            {u.isSuperAdmin && <Crown size={12} className="text-yellow-500 shrink-0" aria-label="Super Admin" />}
                            {u.bannedAt && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Suspended</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${u.isSuperAdmin ? "border-yellow-500/30 text-yellow-400" : u.role === "admin" ? "border-purple-500/30 text-purple-400" : "border-primary/30 text-primary"}`}>
                              {u.isSuperAdmin ? "super admin" : u.role}
                            </Badge>
                            {u.college && <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">{u.college}</span>}
                            {!!u.studyStreak && u.studyStreak > 0 && (
                              <span className="text-[10px] text-orange-400 flex items-center gap-0.5"><Flame size={10} />{u.studyStreak}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">Joined {timeAgo(u.createdAt)}</span>
                          </div>
                          {u.bannedAt && u.banReason && <p className="text-[10px] text-red-400 mt-0.5">Reason: {u.banReason}</p>}
                        </div>

                        {!isSelf && !u.isSuperAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View Activity" onClick={() => viewActivity(u)}>
                              <Eye size={14} />
                            </Button>
                            {u.role === "student" ? (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-purple-400 hover:text-purple-300" title="Promote to Admin" onClick={() => setActionDialog({ user: u, mode: "promote" })}>
                                <UserPlus size={14} />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-orange-400 hover:text-orange-300" title="Demote to Student" onClick={() => setActionDialog({ user: u, mode: "demote" })}>
                                <UserMinus size={14} />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Force Logout" onClick={() => setActionDialog({ user: u, mode: "force-logout" })}>
                              <LogOut size={13} />
                            </Button>
                            {u.bannedAt ? (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-500 hover:text-green-400" title="Restore Account" onClick={() => setActionDialog({ user: u, mode: "unban" })}>
                                <ShieldOff size={14} />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-orange-500 hover:text-orange-400" title="Suspend Account" onClick={() => { setActionDialog({ user: u, mode: "ban" }); setBanReason(""); }}>
                                <Shield size={14} />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Delete Account" onClick={() => setActionDialog({ user: u, mode: "delete" })}>
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
        </TabsContent>

        {/* ── Community Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="community">
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe size={16} /> All Community Groups
                </CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search groups…" className="pl-8 h-8 bg-background/50 text-sm" value={groupSearch} onChange={e => setGroupSearch(e.target.value)} />
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={loadGroups}><RefreshCw size={14} /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {groupsLoading ? (
                <div className="p-4 space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {groups.length === 0 ? "No community groups yet." : "No groups match your search."}
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredGroups.map(g => (
                    <div key={g.id} className="p-4 flex items-center gap-3 hover:bg-muted/10">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageSquare size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{g.name}</p>
                          {g.isAdminCreated && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400">Official</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{g.subject}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users size={10} /> {g.memberCount}
                          </span>
                          <span className="text-xs text-muted-foreground">by {g.creatorName}</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(g.createdAt)}</span>
                        </div>
                        {g.lastMessage && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{g.lastMessage}</p>}
                      </div>
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
                        title="Delete Group"
                        disabled={deletingGroupId === g.id}
                        onClick={() => deleteGroup(g)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Platform Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="platform">
          <div className="space-y-4">
            {settingsLoading ? (
              <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : settings ? (
              <>
                {/* Platform Stats */}
                <Card className="bg-card/40 border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Activity size={16} /> Live Platform Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total Users", value: settings.stats.totalUsers, color: "text-blue-400" },
                        { label: "Community Groups", value: settings.stats.totalGroups, color: "text-green-400" },
                        { label: "Active Sessions", value: settings.stats.activeSessions, color: "text-purple-400" },
                        { label: "Banned Users", value: settings.stats.bannedUsers, color: "text-red-400" },
                      ].map(s => (
                        <div key={s.label} className="bg-muted/20 rounded-lg p-4 text-center">
                          <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={loadSettings}><RefreshCw size={12} /> Refresh</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Invite Code */}
                <Card className="bg-card/40 border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Key size={16} /> Admin Invite Code</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This code is required when registering a new admin account. Only share it with trusted team members.
                    </p>
                    {settings.inviteCode ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 font-mono text-sm bg-muted/30 border border-border/40 rounded-lg px-4 py-2.5 tracking-widest select-all">
                          {codeVisible ? settings.inviteCode : "•".repeat(settings.inviteCode.length)}
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0 h-9" onClick={() => setCodeVisible(v => !v)}>
                          {codeVisible ? "Hide" : "Reveal"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0" onClick={copyInviteCode} title="Copy">
                          {codeCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                        <p className="text-sm text-orange-400">
                          No <code className="font-mono text-xs bg-orange-500/10 px-1 rounded">ADMIN_INVITE_CODE</code> environment variable is set.
                          Set it in the Secrets panel to enable admin registration.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">Failed to load settings.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Activity Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!activityUser} onOpenChange={() => setActivityUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Activity size={16} /> {activityUser?.user.fullName}'s Activity</DialogTitle>
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
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Recent Activity</p>
                {activityUser.recentActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {activityUser.recentActivity.map(a => (
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

      {/* ── Action Confirmation Dialog ───────────────────────────────────────── */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          {actionDialog && (() => {
            const meta = actionMeta[actionDialog.mode];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className={actionDialog.mode === "promote" || actionDialog.mode === "unban" ? "text-primary" : "text-destructive"}>
                    {meta.title}
                  </DialogTitle>
                  <DialogDescription>{meta.desc(actionDialog.user.fullName)}</DialogDescription>
                </DialogHeader>
                {actionDialog.mode === "ban" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason (optional)</label>
                    <Input placeholder="e.g. Spam, inappropriate behaviour…" value={banReason} onChange={e => setBanReason(e.target.value)} />
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                  <Button variant={meta.variant} disabled={actionLoading} onClick={confirmAction}>
                    {actionLoading ? "Processing…" : meta.confirmLabel}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
