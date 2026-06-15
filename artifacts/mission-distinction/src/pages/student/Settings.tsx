import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { customFetch } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Star, MessageSquare, Bell, BellOff, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function StudentSettings() {
  const { user, updateUser } = useAuth();
  const { supported, permission, subscribed, loading: pushLoading, requestAndSubscribe, unsubscribe } = usePushNotifications();
  const [feedback, setFeedback] = useState({ category: "general", subject: "", message: "", rating: 0 });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "MD";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("mission_token");
      const uploadRes = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json();
        throw new Error(d.error || "Upload failed");
      }
      const { url } = await uploadRes.json();
      const patchRes = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      const res = await customFetch("/api/feedback", {
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
              >
                <Camera className="h-4 w-4" />
                {uploading ? "Uploading…" : "Change Avatar"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user?.fullName || ""} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Input id="year" defaultValue={user?.year || ""} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Input id="college" defaultValue={user?.college || ""} className="bg-background/50" />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
          <CardDescription>Configure how you receive alerts and push notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border/40 rounded-lg bg-background/30">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                {subscribed ? <Bell className="h-3.5 w-3.5 text-green-400" /> : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
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
            >
              {pushLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : subscribed ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Quiz Reminders</Label>
              <p className="text-xs text-muted-foreground">Reminders for scheduled mock tests.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Community Mentions</Label>
              <p className="text-xs text-muted-foreground">Alerts when someone mentions you or replies to your post.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Send Feedback
          </CardTitle>
          <CardDescription>Report a bug, suggest a feature, or share your experience with us.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={feedback.category} onValueChange={(v) => setFeedback({ ...feedback, category: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="content">Content Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Overall Rating</Label>
              <div className="flex items-center gap-1 h-9">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setFeedback({ ...feedback, rating: n })}>
                    <Star
                      size={22}
                      className={cn(
                        "transition-colors",
                        n <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"
                      )}
                    />
                  </button>
                ))}
                {feedback.rating > 0 && (
                  <button className="text-xs text-muted-foreground ml-2 hover:text-foreground" onClick={() => setFeedback({ ...feedback, rating: 0 })}>
                    clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Subject <span className="text-destructive">*</span></Label>
            <Input
              className="bg-background/50"
              placeholder="e.g. Quiz timer not working"
              value={feedback.subject}
              onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Message <span className="text-destructive">*</span></Label>
            <Textarea
              className="bg-background/50 min-h-[100px] resize-none"
              placeholder="Describe your feedback in detail..."
              value={feedback.message}
              onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
            />
          </div>
          <Button onClick={handleSubmitFeedback} disabled={submittingFeedback}>
            {submittingFeedback ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
