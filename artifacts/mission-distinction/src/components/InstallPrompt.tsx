import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - Number(dismissedAt) < sevenDays) return;
      localStorage.removeItem("pwa-install-dismissed");
    }

    const isIOSDevice = /ipad|iphone|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;

    if (isInStandaloneMode) return;

    if (isIOSDevice) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-primary/30 rounded-xl p-4 shadow-2xl shadow-primary/10 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Mission Distinction</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS ? "Add to your Home Screen for the full app experience" : "Install the app for faster access, offline support, and push notifications"}
            </p>
            {showIOSInstructions && (
              <div className="mt-2 p-2 bg-primary/10 rounded-lg">
                <p className="text-xs text-foreground">
                  Tap the <strong>Share</strong> button (square with arrow) at the bottom of your browser, then tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-xs px-3 gap-1.5" onClick={handleInstall}>
                <Download className="w-3 h-3" />
                {isIOS ? "How to install" : "Install App"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-3 text-muted-foreground" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
