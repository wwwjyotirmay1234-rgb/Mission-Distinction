import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

interface YTResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: string;
  views: string;
}

async function scrapeYouTube(query: string): Promise<YTResult[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) throw new Error(`YouTube responded ${res.status}`);
  const html = await res.text();

  const match = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
  if (!match) throw new Error("Could not find ytInitialData");

  const data = JSON.parse(match[1]);

  const sectionContents: any[] =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents ?? [];

  const items: any[] = [];
  for (const section of sectionContents) {
    const inner = section?.itemSectionRenderer?.contents;
    if (Array.isArray(inner)) {
      items.push(...inner);
    }
  }

  const results: YTResult[] = items
    .filter((item: any) => item?.videoRenderer?.videoId)
    .slice(0, 20)
    .map((item: any) => {
      const v = item.videoRenderer;
      const thumbs: any[] = v.thumbnail?.thumbnails ?? [];
      const thumb =
        thumbs.find((t: any) => t.width >= 320)?.url ??
        thumbs.slice(-1)[0]?.url ??
        `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
      return {
        videoId: v.videoId,
        title: v.title?.runs?.map((r: any) => r.text).join("") ?? "",
        thumbnail: thumb.startsWith("//") ? "https:" + thumb : thumb,
        channel: v.ownerText?.runs?.[0]?.text ?? v.shortBylineText?.runs?.[0]?.text ?? "",
        duration: v.lengthText?.simpleText ?? "",
        views: v.shortViewCountText?.simpleText ?? v.viewCountText?.simpleText ?? "",
      };
    })
    .filter((v) => v.videoId && v.title);

  return results;
}

router.get("/search", authMiddleware, async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q) {
    res.status(400).json({ error: "Missing query parameter q" });
    return;
  }

  try {
    const results = await scrapeYouTube(q);
    res.json({ results });
  } catch (err) {
    logger.error({ err }, "YouTube search error");
    res.status(502).json({ error: "YouTube search temporarily unavailable. Please try again." });
  }
});

export default router;
