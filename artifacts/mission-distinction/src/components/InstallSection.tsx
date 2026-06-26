import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Share, MoreVertical, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "desktop">("android");
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /ipad|iphone|ipod/i.test(ua) && !(window as any).MSStream;
    const android = /android/i.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);
    if (ios) setActiveTab("ios");
    else if (android) setActiveTab("android");
    else setActiveTab("desktop");

    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsInstalled(installed);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setJustInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || justInstalled) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-green-400 text-sm font-medium">
        <CheckCircle size={18} />
        App installed — open it from your home screen!
      </div>
    );
  }

  const tabs = [
    { id: "android" as const, label: "Android", icon: Smartphone },
    { id: "ios" as const, label: "iPhone / iPad", icon: Share },
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
  ];

  return (
    <div className="bg-card/40 backdrop-blur border border-primary/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Install Mission D on your device</p>
          <p className="text-xs text-muted-foreground">Works offline · No app store needed · Free</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${
              activeTab === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Android */}
      {activeTab === "android" && (
        <div className="space-y-3">
          {deferredPrompt ? (
            <Button className="w-full gap-2" onClick={handleInstall}>
              <Download size={16} />
              Install App
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Follow these steps in Chrome:</p>
              {[
                { icon: <MoreVertical size={14} />, text: 'Tap the ⋮ menu (top-right of Chrome)' },
                { icon: <Plus size={14} />, text: 'Tap "Add to Home screen"' },
                { icon: <CheckCircle size={14} />, text: 'Tap "Add" to confirm' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-foreground/80">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  {step.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* iOS */}
      {activeTab === "ios" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Follow these steps in Safari:</p>
          {[
            { text: 'Tap the Share button (□↑) at the bottom of Safari' },
            { text: 'Scroll down and tap "Add to Home Screen"' },
            { text: 'Tap "Add" in the top-right corner' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-foreground/80">
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
                {i + 1}
              </div>
              {step.text}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground pt-1">
            ⚠️ Must use <strong>Safari</strong> — Chrome on iOS doesn't support install
          </p>
        </div>
      )}

      {/* Desktop */}
      {activeTab === "desktop" && (
        <div className="space-y-2">
          {deferredPrompt ? (
            <Button className="w-full gap-2" onClick={handleInstall}>
              <Download size={16} />
              Install App
            </Button>
          ) : (
            <>
              <p className="text-xs text-muted-foreground font-medium">In Chrome or Edge:</p>
              {[
                { text: 'Look for the install icon (⊕) in the address bar' },
                { text: 'Click it and select "Install"' },
                { text: 'The app opens in its own window' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-foreground/80">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  {step.text}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
