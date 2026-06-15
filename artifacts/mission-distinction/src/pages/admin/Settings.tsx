import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Shield, Key, User, Info, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function AdminSettings() {
  const { user, login, token } = useAuth();

  const [name, setName] = useState(user?.fullName ?? "");
  const [savingName, setSavingName] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() ?? "AD";

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    setSavingName(true);
    try {
      const res = await customFetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      login({ token: token!, user: updated });
      toast.success("Name updated successfully.");
    } catch {
      toast.error("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      toast.error("All password fields are required.");
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      const res = await customFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success("Password changed successfully.");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password. Check your current password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account and platform configuration.</p>
      </div>

      {/* Profile card */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-secondary" /> Admin Profile
          </CardTitle>
          <CardDescription>Update your display name. Email cannot be changed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-secondary/20 text-secondary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wider border-secondary/30 text-secondary bg-secondary/5">
                Administrator
              </Badge>
            </div>
          </div>

          <Separator className="border-border/40" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                className="bg-background/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                className="bg-muted/50 text-muted-foreground"
                value={user?.email ?? ""}
                disabled
              />
            </div>
          </div>
          <Button onClick={handleSaveName} disabled={savingName || name === user?.fullName}>
            {savingName ? "Saving..." : "Save Name"}
          </Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4 text-secondary" /> Change Password
          </CardTitle>
          <CardDescription>Update your admin account password. Minimum 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["current", "next", "confirm"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <Label>
                {field === "current"
                  ? "Current Password"
                  : field === "next"
                  ? "New Password"
                  : "Confirm New Password"}
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  className="bg-background/50 pr-10"
                  placeholder="••••••••"
                  value={pwForm[field]}
                  onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                />
                {field === "next" && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw((p) => !p)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <Button onClick={handleChangePassword} disabled={savingPw}>
            {savingPw ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Platform info */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-secondary" /> Platform Information
          </CardTitle>
          <CardDescription>Configuration details for Mission Distinction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Platform Name", value: "Mission Distinction" },
            { label: "Target Audience", value: "1st Year MBBS — Odisha" },
            { label: "Admin Invite Code", value: "Protected — set via ADMIN_INVITE_CODE env var" },
            { label: "Authentication", value: "JWT + Firebase Google Auth" },
            { label: "Database", value: "PostgreSQL (Drizzle ORM)" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/40 bg-muted/10"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground">{value}</span>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-2 px-4 py-3 rounded-lg border border-green-500/20 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <span className="text-sm text-green-400">All systems operational</span>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-secondary" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Password Hashing", desc: "SHA-256 with server-side salt" },
            { label: "Session Tokens", desc: "JWT signed tokens, 30-day expiry" },
            { label: "Route Protection", desc: "Admin middleware on all write operations" },
            { label: "Input Validation", desc: "All IDs and inputs validated server-side" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start justify-between px-4 py-3 rounded-lg border border-border/40 bg-muted/10 gap-4">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-sm text-muted-foreground text-right">{desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
