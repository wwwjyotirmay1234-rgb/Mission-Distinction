// Shared browser/environment detection helpers used by install & notification flows.

export function isIOSDevice(): boolean {
  const ua = navigator.userAgent;
  const isTouchMac = /mac/i.test(ua) && navigator.maxTouchPoints > 1;
  return (/ipad|iphone|ipod/i.test(ua) || isTouchMac) && !(window as any).MSStream;
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as any).standalone === true
  );
}

// Detects Instagram / Facebook / WhatsApp / LinkedIn / Snapchat / WeChat / Android WebView
// in-app browsers. These cannot install PWAs (no beforeinstallprompt, no Add to Home
// Screen share-sheet access) — the only fix is "open in real browser".
export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent;
  const iOS = isIOSDevice();

  return (
    /FBAN|FBAV|Instagram|LinkedInApp|Snapchat|Line\/|MicroMessenger|GSA\//.test(ua) ||
    // Android WebView: has "wv" flag
    (/android/i.test(ua) && /wv/.test(ua)) ||
    // iOS in-app: no "safari" token but has AppleWebKit + Mobile (and isn't a known iOS browser)
    (iOS && !/safari/i.test(ua) && /\bAppleWebKit\b/i.test(ua) && /\bMobile\b/i.test(ua) && !/crios|fxios/i.test(ua))
  );
}
