import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { customFetch } from "@workspace/api-client-react";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Star, MessageSquare, Bell, BellOff, Loader2, Camera, Trash2, ShieldAlert, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { resetAnalytics } from "@/lib/analytics";

export default function StudentSettings() {
  const { user, updateUser, logout } = useAuth();
  const { supported, permission, subscribed, loading: pushLoading, requestAndSubscribe, unsubscribe } = usePushNotifications();
  const [feedback, setFeedback] = useState({ category: "general", subject: "", message: "", rating: 0 });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileName, setProfileName] = useState(user?.fullName || "");
  const [profileYear, setProfileYear] = useState(user?.year || "");
  const [profileCollege, setProfileCollege] = useState(user?.college || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "MD";

  const handleSaveProfile = async () => {
    if (!profileName.trim()) { toast.error("Name cannot be empty."); return; }
    setSavingProfile(true);
    try {
      const res = await apiFetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: profileName.trim(), year: profileYear.trim(), college: profileCollege.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }
      const updated = await res.json();
      updateUser(updated);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Image must be under 30 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await apiFetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json();
        throw new Error(d.error || "Upload failed");
      }
      const { url } = await uploadRes.json();
      const patchRes = await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!patchRes.ok) throw new Error("Failed to save avatar");
      const updatedUser = await patchRes.json();
      updateUser(updatedUser);
      setAvatarUrl(url);
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.subject.trim() || !feedback.message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await customFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...feedback, rating: feedback.rating || undefined }),
      });
      toast.success("Feedback submitted! Thank you.");
      setFeedback({ category: "general", subject: "", message: "", rating: 0 });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    if (!deletePassword) {
      toast.error("Password is required.");
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await apiFetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account.");
      }
      resetAnalytics();
      toast.success("Your account has been permanently deleted.");
      logout();
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and academic info.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || user?.avatarUrl || ""} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
                aria-label="Change profile avatar"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                {uploading ? "Uploading…" : "Change Avatar"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 30 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload avatar image"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-background/50" aria-label="Full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted/50" aria-label="Email address (read only)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Input id="year" value={profileYear} onChange={(e) => setProfileYear(e.target.value)} className="bg-background/50" aria-label="Academic year" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Input id="college" value={profileCollege} onChange={(e) => setProfileCollege(e.target.value)} className="bg-background/50" aria-label="College name" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} aria-label="Save profile changes">
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" aria-hidden="true" /> Notifications
          </CardTitle>
          <CardDescription>Configure how you receive alerts and push notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border/40 rounded-lg bg-background/30">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm font-medium flex items-center gap-2" id="push-notifications-label">
                {subscribed ? <Bell className="h-3.5 w-3.5 text-green-400" aria-hidden="true" /> : <BellOff className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground" id="push-notifications-desc">
                {!supported
                  ? "Not supported in this browser."
                  : permission === "denied"
                  ? "Blocked — enable notifications in browser settings."
                  : subscribed
                  ? "You'll receive alerts for new announcements and updates."
                  : "Get instant alerts for new announcements and content."}
              </p>
            </div>
            <Button
              variant={subscribed ? "outline" : "default"}
              size="sm"
              disabled={pushLoading || !supported || permission === "denied"}
              onClick={subscribed ? unsubscribe : requestAndSubscribe}
              className="ml-4 shrink-0"
              aria-labelledby="push-notifications-label"
              aria-describedby="push-notifications-desc"
            >
              {pushLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Loading" />
              ) : subscribed ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium" htmlFor="quiz-reminders-switch">Quiz Reminders</Label>
              <p className="text-xs text-muted-foreground" id="quiz-reminders-desc">Reminders for scheduled mock tests.</p>
            </div>
            <Switch id="quiz-reminders-switch" defaultChecked aria-describedby="quiz-reminders-desc" />
          </div>
          <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium" htmlFor="mentions-switch">Community Mentions</Label>
              <p className="text-xs text-muted-foreground" id="mentions-desc">Alerts when someone mentions you or replies to your post.</p>
            </div>
            <Switch id="mentions-switch" defaultChecked aria-describedby="mentions-desc" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" /> Send Feedback
          </CardTitle>
          <CardDescription>Report a bug, suggest a feature, or share your experience with us.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="feedback-category">Category</Label>
              <Select value={feedback.category} onValueChange={(v) => setFeedback({ ...feedback, category: v })}>
                <SelectTrigger id="feedback-category" className="bg-background/50" aria-label="Feedback category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="content">Content Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label id="rating-label">Overall Rating</Label>
              <div className="flex items-center gap-1 h-9" role="radiogroup" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={n <= feedback.rating}
                    aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                    onClick={() => setFeedback({ ...feedback, rating: n })}
                  >
                    <Star
                      size={22}
                      className={cn(
                        "transition-colors",
                        n <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
                {feedback.rating > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground ml-2 hover:text-foreground"
                    aria-label="Clear rating"
                    onClick={() => setFeedback({ ...feedback, rating: 0 })}
                  >
                    clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback-subject">Subject <span className="text-destructive" aria-hidden="true">*</span></Label>
            <Input
              id="feedback-subject"
              className="bg-background/50"
              placeholder="e.g. Quiz timer not working"
              value={feedback.subject}
              onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })}
              aria-required="true"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback-message">Message <span className="text-destructive" aria-hidden="true">*</span></Label>
            <Textarea
              id="feedback-message"
              className="bg-background/50 min-h-[100px] resize-none"
              placeholder="Describe your feedback in detail..."
              value={feedback.message}
              onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
              aria-required="true"
            />
          </div>
          <Button onClick={handleSubmitFeedback} disabled={submittingFeedback} aria-label="Submit feedback">
            {submittingFeedback ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
            Privacy Policy <ExternalLink size={12} aria-hidden="true" />
          </a>
          <span className="text-muted-foreground">·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
            Terms of Service <ExternalLink size={12} aria-hidden="true" />
          </a>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-destructive/40 border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" /> Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone. Your data will be deleted in accordance with the{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              DPDPA 2023 right to erasure
            </a>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Permanently deletes your account, quiz history, bookmarks, and all personal data.
                This action cannot be reversed.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="ml-4 shrink-0 gap-2"
              onClick={() => {
                setDeletePassword("");
                setDeleteConfirmText("");
                setDeleteDialogOpen(true);
              }}
              aria-label="Open account deletion dialog"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              Permanently Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  This will permanently delete your account, quiz history, bookmarks, feedback, and all personal
                  data associated with <strong className="text-foreground">{user?.email}</strong>.
                </p>
                <p className="text-destructive font-medium">This action cannot be undone.</p>

                <div className="space-y-2">
                  <Label htmlFor="delete-password" className="text-foreground">
                    Enter your password to confirm
                  </Label>
                  <Input
                    id="delete-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Your current password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="bg-background/50"
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-foreground">
                    Type <strong>DELETE</strong> to confirm
                  </Label>
                  <Input
                    id="delete-confirm"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="bg-background/50"
                    aria-required="true"
                    aria-describedby="delete-confirm-hint"
                  />
                  <p id="delete-confirm-hint" className="text-xs text-muted-foreground">
                    Type the word DELETE in capitals to enable the delete button.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletingAccount}
              onClick={() => setDeleteDialogOpen(false)}
              aria-label="Cancel account deletion"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmText !== "DELETE" || !deletePassword}
              aria-label="Confirm permanent account deletion"
              className="gap-2"
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete My Account
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
