import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";
import {
  ODISHA_GOVT_COLLEGES, ODISHA_PRIVATE_COLLEGES,
  MBBS_YEARS, SESSION_YEARS,
} from "@/lib/colleges";
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GraduationCap, Phone, Building2, Calendar, ShieldCheck, Loader2 } from "lucide-react";

function isProfileComplete(user: any): boolean {
  return !!(
    user?.year?.trim() &&
    user?.sessionYear?.trim() &&
    user?.college?.trim()
  );
}

export { isProfileComplete };

export function CompleteProfileModal() {
  const { user, updateUser } = useAuth();

  const [year, setYear]               = useState((user as any)?.year || "");
  const [sessionYear, setSessionYear] = useState((user as any)?.sessionYear || "");
  const [college, setCollege]         = useState((user as any)?.college || "");
  const [mobile, setMobile]           = useState((user as any)?.mobileNumber || "");
  const [saving, setSaving]           = useState(false);

  const missingFields = [];
  if (!year)        missingFields.push("MBBS Year");
  if (!sessionYear) missingFields.push("Session Year");
  if (!college)     missingFields.push("College");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!year || !sessionYear || !college) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (mobile.trim() && !/^[6-9]\d{9}$/.test(mobile.trim())) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: year.trim(),
          sessionYear: sessionYear.trim(),
          college: college.trim(),
          mobileNumber: mobile.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile");
      }
      const updated = await res.json();
      updateUser(updated);
      toast.success("Profile completed! Welcome to Mission Distinction 🎉");
    } catch (err: any) {
      toast.error(err.message || "Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-5 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Complete Your Profile</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Please fill in all required details to access Mission Distinction.
            {missingFields.length > 0 && (
              <span className="block mt-1 text-amber-400 font-medium">
                Missing: {missingFields.join(", ")}
              </span>
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* MBBS Year */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <GraduationCap size={14} className="text-primary" />
              MBBS Year <span className="text-red-400">*</span>
            </Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className={!year ? "border-red-500/50" : ""}>
                <SelectValue placeholder="Select your year" />
              </SelectTrigger>
              <SelectContent>
                {MBBS_YEARS.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Year */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              Session Year <span className="text-red-400">*</span>
            </Label>
            <Select value={sessionYear} onValueChange={setSessionYear}>
              <SelectTrigger className={!sessionYear ? "border-red-500/50" : ""}>
                <SelectValue placeholder="Select session year" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_YEARS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* College */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building2 size={14} className="text-primary" />
              College <span className="text-red-400">*</span>
            </Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className={!college ? "border-red-500/50" : ""}>
                <SelectValue placeholder="Select your college" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Government Medical Colleges</SelectLabel>
                  {ODISHA_GOVT_COLLEGES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Private Medical Colleges</SelectLabel>
                  {ODISHA_PRIVATE_COLLEGES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Phone size={14} className="text-primary" />
              Mobile Number
              <span className="text-[10px] font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                +91
              </span>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={`rounded-l-none ${mobile && !/^[6-9]\d{9}$/.test(mobile) ? "border-red-500/50" : ""}`}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Recommended — used for important notices, not shared publicly.
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving || !year || !sessionYear || !college || (!!mobile && mobile.length !== 10)}
            className="w-full mt-2"
            size="lg"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin mr-2" /> Saving…</>
            ) : (
              "Complete Profile & Continue"
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            This information helps us personalize your learning experience.
          </p>
        </form>
      </div>
    </div>
  );
}
