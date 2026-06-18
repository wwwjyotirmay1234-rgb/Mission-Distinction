import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { getCache, setCache } from "../lib/cache";

const router = Router();

const CLIENT_ID_CACHE_KEY = "sc:client_id";
const CLIENT_ID_TTL = 12 * 60 * 60 * 1000;

async function getSCClientId(): Promise<string> {
  const cached = getCache<string>(CLIENT_ID_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch("https://soundcloud.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
  });
  const html = await res.text();

  const scriptUrls = [
    ...html.matchAll(/https?:\/\/a-v2\.sndcdn\.com\/assets\/[^"' ]+\.js/g),
  ].map((m) => m[0]);

  for (const url of scriptUrls.slice(0, 8)) {
    try {
      const sr = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 Chrome/124.0.0.0" },
      });
      if (!sr.ok) continue;
      const js = await sr.text();
      const m =
        js.match(/[,\{]client_id:"([a-zA-Z0-9]{20,})"/) ??
        js.match(/client_id:"([a-zA-Z0-9]{20,})"/) ??
        js.match(/"client_id":"([a-zA-Z0-9]{20,})"/);
      if (m?.[1]) {
        setCache(CLIENT_ID_CACHE_KEY, m[1], CLIENT_ID_TTL);
        return m[1];
      }
    } catch {}
  }
  throw new Error("Could not extract SoundCloud client_id");
}

router.get("/search", authMiddleware, async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q) {
    res.status(400).json({ error: "Missing q" });
    return;
  }

  try {
    const clientId = await getSCClientId();
    const apiRes = await fetch(
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${clientId}&limit=20&offset=0&linked_partitioning=1`,
      {
        headers: {
          Origin: "https://soundcloud.com",
          Referer: "https://soundcloud.com/",
          "User-Agent": "Mozilla/5.0 Chrome/124.0.0.0",
        },
      }
    );

    if (apiRes.status === 401 || apiRes.status === 403) {
      setCache(CLIENT_ID_CACHE_KEY, "" as any, 0);
      res.status(502).json({ error: "SoundCloud authorization expired — retrying. Try again in a moment." });
      return;
    }

    if (!apiRes.ok) throw new Error(`SC API ${apiRes.status}`);

    const data = await apiRes.json();
    const tracks = (data.collection ?? [])
      .map((t: any) => ({
        id: t.id,
        title: t.title ?? "",
        artist: t.user?.username ?? "",
        artwork: t.artwork_url ? t.artwork_url.replace("-large", "-t300x300") : null,
        duration: Math.floor((t.duration ?? 0) / 1000),
        plays: t.playback_count ?? 0,
        permalinkUrl: t.permalink_url ?? "",
      }))
      .filter((t: any) => t.permalinkUrl);

    res.json({ tracks });
  } catch (err) {
    logger.error({ err }, "SoundCloud search error");
    res.status(502).json({ error: "SoundCloud search temporarily unavailable." });
  }
});

export default router;
