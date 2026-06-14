import React, { useState } from "react";
import { StudentSidebar } from "./StudentSidebar";
import { Header } from "./Header";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MailWarning, X, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";

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
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${baseUrl}/api/auth/resend-verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
          Please verify your email address to keep your account secure.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {devLink ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
              onClick={() => { navigator.clipboard.writeText(devLink); toast.success("Verify link copied!"); }}
            >
              <Copy size={11} /> Copy Link
            </Button>
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

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        <StudentSidebar />
        <div className="flex-1 flex flex-col md:ml-64 min-w-0">
          <Header />
          <EmailVerificationBanner />
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
