import { useState, useEffect } from "react";
import { X, Download, Smartphone, Share, Plus, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiFetch";
import { isIOSDevice, isStandaloneDisplay, isInAppBrowser } from "@/lib/browserEnv";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const FIRST_VISIT_KEY = "md-has-visited";
const DISMISSED_KEY = "md-install-dismissed";

function isStandalone() {
  return isStandaloneDisplay();
}

function isDismissed() {
  return localStorage.getItem(DISMISSED_KEY) === "1";
}

function permanentlyDismiss() {
  localStorage.setItem(DISMISSED_KEY, "1");
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) {
      setHidden(true);
      return;
    }

    const ios = isIOSDevice();
    setIsIOS(ios);
    // In-app browsers (WhatsApp/Instagram/Facebook webviews) can never install a
    // PWA — no beforeinstallprompt, no Safari/Chrome share sheet. Students share
    // study links in WhatsApp groups constantly, so this is a common real path.
    setIsInApp(isInAppBrowser());

    const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);
    if (isFirstVisit) {
      localStorage.setItem(FIRST_VISIT_KEY, "1");
      setTimeout(() => setShowModal(true), 800);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.matchMedia("(display-mode: standalone)").addEventListener("change", (e) => {
      if (e.matches) {
        permanentlyDismiss();
        setHidden(true);
      }
    });

    const handleInstalled = () => {
      apiFetch("/api/device-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "install" }),
      }).catch(() => {});
    };
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    permanentlyDismiss();
    setHidden(true);
    setShowModal(false);
  };

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") dismiss();
  };

  const handleBannerInstall = async () => {
    if (isIOS || isInApp) {
      setShowModal(true);
    } else {
      await triggerInstall();
    }
  };

  if (hidden) return null;

  return (
    <>
      {/* ── First-visit modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 w-full max-w-sm animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="flex flex-col items-center pt-6 pb-4 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Install Mission Distinction</h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Add to your home screen for instant access, offline support, and the full app experience — completely free.
              </p>
            </div>

            {/* Bullets */}
            <div className="px-6 pb-4 space-y-2">
              {[
                "Works offline — study without internet",
                "Faster than the browser — no address bar",
                "Push notifications for announcements",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {/* In-app browser instructions (WhatsApp/Instagram/Facebook webview) */}
            {isInApp && (
              <div className="mx-6 mb-4 p-3 bg-primary/10 rounded-xl text-xs text-foreground/80 space-y-1.5">
                <p className="font-semibold text-foreground">You're inside an app's built-in browser:</p>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Tap the <strong>⋯</strong> or <strong>share</strong> icon in the top corner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Choose <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong></span>
                </div>
                <p className="text-muted-foreground text-[11px] pt-0.5">⚠️ Installing isn't possible from WhatsApp/Instagram's built-in browser — you must open the link in your regular browser first</p>
              </div>
            )}

            {/* iOS instructions inline */}
            {isIOS && !isInApp && (
              <div className="mx-6 mb-4 p-3 bg-primary/10 rounded-xl text-xs text-foreground/80 space-y-1.5">
                <p className="font-semibold text-foreground">How to install on iPhone / iPad:</p>
                <div className="flex items-center gap-2">
                  <Share className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Tap <strong>"Add to Home Screen"</strong> then <strong>Add</strong></span>
                </div>
                <p className="text-muted-foreground text-[11px] pt-0.5">⚠️ Must use Safari — Chrome on iOS doesn't support install</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 px-6 pb-6">
              {!isIOS && !isInApp && (
                <Button
                  className="w-full gap-2 h-11 text-sm font-semibold"
                  onClick={triggerInstall}
                  disabled={!deferredPrompt}
                >
                  <Download className="w-4 h-4" />
                  {deferredPrompt ? "Install Now" : "Continue in Browser"}
                </Button>
              )}
              {isInApp && (
                <Button className="w-full gap-2 h-11 text-sm font-semibold" onClick={dismiss}>
                  <CheckCircle className="w-4 h-4" /> Got It
                </Button>
              )}
              {isIOS && !isInApp && (
                <Button className="w-full gap-2 h-11 text-sm font-semibold" onClick={dismiss}>
                  <CheckCircle className="w-4 h-4" /> Done, I've Added It
                </Button>
              )}
              <Button variant="ghost" className="w-full h-9 text-sm text-muted-foreground" onClick={dismiss}>
                Don't show again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent bottom banner ───────────────────────────────────────── */}
      {!showModal && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 max-w-lg mx-auto">
          <div className="bg-card border border-primary/30 rounded-xl p-3.5 shadow-2xl shadow-primary/10 flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Smartphone className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Install Mission Distinction</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {isInApp
                  ? "Open in Chrome or Safari to install"
                  : isIOS
                  ? "Tap Share → Add to Home Screen in Safari"
                  : "Add to home screen for offline access"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                className="h-8 text-xs px-3 gap-1.5 font-semibold"
                onClick={handleBannerInstall}
                disabled={!isIOS && !isInApp && !deferredPrompt}
              >
                <Download className="w-3 h-3" />
                {isIOS || isInApp ? "How?" : "Install"}
              </Button>
              <button
                onClick={dismiss}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/40"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
