import React, { useState, useEffect } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

import { StudentSidebar } from "./StudentSidebar";
import { Header } from "./Header";
import { PersistentPlayer } from "./PersistentPlayer";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { MailWarning, X, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { PinnedBanner } from "@/components/PinnedBanner";
import { WarningBanner } from "@/components/WarningBanner";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Watermark } from "@/components/Watermark";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";

function EmailVerificationBanner() {
  const { user, token } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const emailVerified = (user as any)?.emailVerified;
  if (!user || emailVerified || dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await apiFetch(`/api/auth/resend-verification`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Verification email sent!");
        if (data.devLink) setDevLink(data.devLink);
      } else {
        toast.error(data.error || "Failed to send email.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
        <MailWarning size={16} className="text-yellow-400 shrink-0" />
        <p className="text-sm text-yellow-300 flex-1 min-w-0">
          {devLink
            ? "Email couldn't be sent — click the link below to verify your account."
            : "Please verify your email address to keep your account secure."}
        </p>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {devLink ? (
            <>
              <a
                href={devLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-7 px-3 text-xs font-medium bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 rounded-md transition-colors border border-yellow-500/30"
              >
                <CheckCircle size={11} /> Verify Now
              </a>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                onClick={() => { navigator.clipboard.writeText(devLink); toast.success("Verify link copied!"); }}
              >
                <Copy size={11} /> Copy Link
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend Email"}
            </Button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed, hidden } = useSidebar();
  const isMobile = useIsMobile();
  const sidebarMargin = isMobile ? 0 : hidden ? 0 : collapsed ? 60 : 220;
  return (
    <div
      className="min-h-screen bg-background text-foreground flex"
      onContextMenu={(e) => e.preventDefault()}
    >
      <StudentSidebar />
      <div
        id="md-capture-area"
        className="relative flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ease-in-out"
        style={{ marginLeft: sidebarMargin }}
      >
        <Watermark />
        <Header />
        <PinnedBanner />
        <EmailVerificationBanner />
        <WarningBanner />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <MusicPlayerProvider>
      <SidebarProvider>
        <StudentLayoutInner>{children}</StudentLayoutInner>
        <PersistentPlayer />
        <CompleteProfileModal />
        <OnboardingModal />
      </SidebarProvider>
    </MusicPlayerProvider>
  );
}
