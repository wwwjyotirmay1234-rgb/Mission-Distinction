import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserCircle, AlertCircle } from "lucide-react";
import { ODISHA_GOVT_COLLEGES, ODISHA_PRIVATE_COLLEGES, MBBS_YEARS } from "@/lib/colleges";

export function CompleteProfileModal() {
  const { user, updateUser } = useAuth();

  const missingFields =
    !user ||
    !(user as any).year ||
    !(user as any).college;

  const [year, setYear] = useState((user as any)?.year ?? "");
  const [college, setCollege] = useState((user as any)?.college ?? "");
  const [saving, setSaving] = useState(false);

  if (!missingFields) return null;

  const handleSave = async () => {
    if (!year) { toast.error("Please select your academic year"); return; }
    if (!college) { toast.error("Please select your college"); return; }
    if (!user) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, college }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      updateUser(data);
      toast.success("Profile completed! Welcome to Mission Distinction.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <UserCircle size={36} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Complete Your Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A few details are missing. Please fill them in to continue using the app.
            </p>
          </div>
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-left w-full">
            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              These details help us personalise your experience and are required to access Mission Distinction.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Academic Year <span className="text-destructive">*</span>
            </Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select your year" />
              </SelectTrigger>
              <SelectContent>
                {MBBS_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              College <span className="text-destructive">*</span>
            </Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select your medical college" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectGroup>
                  <SelectLabel className="text-xs text-primary font-semibold px-2 py-1">🏛️ Government Colleges</SelectLabel>
                  {ODISHA_GOVT_COLLEGES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs text-secondary font-semibold px-2 py-1 mt-1">🏥 Private Colleges</SelectLabel>
                  {ODISHA_PRIVATE_COLLEGES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
