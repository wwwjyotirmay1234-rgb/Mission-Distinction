export type DevicePlatform = "android_phone" | "android_tablet" | "ios" | "desktop" | "other";

export function detectPlatform(userAgent: string | undefined | null): DevicePlatform {
  if (!userAgent) return "other";
  const ua = userAgent.toLowerCase();

  if (ua.includes("android")) {
    const isTablet = !ua.includes("mobile") || ua.includes("tablet") || ua.includes("sm-t") || ua.includes("nexus 7") || ua.includes("nexus 10");
    return isTablet ? "android_tablet" : "android_phone";
  }

  if (ua.includes("iphone") || ua.includes("ipod")) return "ios";
  if (ua.includes("ipad") || (ua.includes("macintosh") && ua.includes("mobile"))) return "ios";

  if (
    ua.includes("windows") ||
    ua.includes("macintosh") ||
    ua.includes("linux") && !ua.includes("android") ||
    ua.includes("cros")
  ) {
    return "desktop";
  }

  return "other";
}
