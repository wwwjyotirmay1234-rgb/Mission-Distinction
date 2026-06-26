import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const { user, login, token } = useAuth();

  const tokenParam = new URLSearchParams(window.location.search).get("token") || "";

  useEffect(() => {
    if (!tokenParam) {
      setStatus("error");
      setMessage("No verification token found in this link.");
      return;
    }

    const verify = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
        const res = await fetch(`${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(tokenParam)}`, {
          credentials: "include"
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          if (user && token) {
            login({ token, user: { ...user, emailVerified: true } as any });
          }
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [tokenParam]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <img src="/logo.jpeg" alt="Mission Distinction" className="h-10 w-10 object-contain rounded-xl" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Mission Distinction
          </span>
        </div>

        <Card className="bg-card/80 border-border/50 backdrop-blur">
          <CardContent className="p-8 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="mx-auto text-primary animate-spin" size={40} />
                <p className="font-semibold">Verifying your email...</p>
              </>
            )}
            {status === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="text-green-500" size={36} />
                </div>
                <div>
                  <p className="font-semibold text-lg">Email Verified!</p>
                  <p className="text-muted-foreground text-sm mt-1">{message}</p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/student/dashboard">Go to Dashboard</Link>
                </Button>
              </>
            )}
            {status === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <XCircle className="text-destructive" size={36} />
                </div>
                <div>
                  <p className="font-semibold text-lg">Verification Failed</p>
                  <p className="text-muted-foreground text-sm mt-1">{message}</p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Back to Login</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
