import type { Artist, PrismaClient } from "@prisma/client";
import { XMLParser } from "fast-xml-parser";
import { createEventIfNew, emptyResult, fetchWithRetry, getOrCreateSource, type SyncResult } from "./shared";

const MAX_ITEM_AGE_DAYS = 14;

interface BlogFeed {
  name: string;
  url: string;
}

// Public RSS/Atom feeds — no API key, no partner approval, same
// "music_publication" credibility tier the seeded Pitchfork/DIY Magazine
// sources already use. Covers the gap Spotify/Ticketmaster/YouTube can't:
// merch drops, album-cycle news, anything a blog covers before it hits a
// structured API. Mix of UK/US and German outlets. These are best-guess
// standard feed URLs (most run on WordPress's default /feed/ path) — a
// wrong or moved URL just shows up as one entry in `errors` below and
// never blocks the other feeds or sources.
const BLOG_FEEDS: BlogFeed[] = [
  { name: "DIY Magazine", url: "https://diymag.com/feed" },
  { name: "The Line of Best Fit", url: "https://www.thelineofbestfit.com/feed" },
  { name: "Stereogum", url: "https://www.stereogum.com/feed/" },
  { name: "Musikexpress", url: "https://www.musikexpress.de/feed/" },
  { name: "Rolling Stone DE", url: "https://www.rollingstone.de/feed/" },
  { name: "laut.de", url: "https://www.laut.de/vdb/musiknews.rss" },
];

export function isBlogNewsConfigured(): boolean {
  return true; // public feeds — nothing to configure
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: Date | null;
}

const xmlParser = new XMLParser({ ignoreAttributes: false });

function textOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    const text = (value as Record<string, unknown>)["#text"];
    return typeof text === "string" ? text : null;
  }
  return null;
}

function linkOf(value: unknown): string | null {
  if (typeof value === "string") return value; // RSS: <link>https://...</link>
  const first = Array.isArray(value) ? value[0] : value;
  if (first && typeof first === "object") {
    const href = (first as Record<string, unknown>)["@_href"]; // Atom: <link href="..."/>
    if (typeof href === "string") return href;
  }
  return null;
}

function parseFeed(xml: string): FeedItem[] {
  const parsed = xmlParser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  const list = Array.isArray(rawItems) ? rawItems : [rawItems];

  const items: FeedItem[] = [];
  for (const raw of list) {
    if (!raw) continue;
    const title = textOf(raw.title);
    const link = linkOf(raw.link);
    if (!title || !link) continue;

    const dateRaw = raw.pubDate ?? raw.updated ?? raw.published;
    const parsedDate = typeof dateRaw === "string" ? new Date(dateRaw) : null;
    const pubDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;

    items.push({ title, link, pubDate });
  }
  return items;
}

/** Matches an artist name against an article title as a whole-word,
 * case-insensitive substring — avoids e.g. "Air" matching "affair". */
function titleMentionsArtist(title: string, artistName: string): boolean {
  const escaped = artistName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu");
  return re.test(title);
}

/**
 * Fetches each configured blog feed ONCE per sync — not once per artist,
 * since every feed covers every artist — and records a "blog_news"
 * MusicEvent for each item published in the last MAX_ITEM_AGE_DAYS whose
 * title mentions an artist someone actually follows.
 */
export async function syncBlogNews(db: PrismaClient, artists: Artist[]): Promise<SyncResult> {
  const result = emptyResult();
  if (artists.length === 0) return result;

  const cutoff = Date.now() - MAX_ITEM_AGE_DAYS * 24 * 60 * 60 * 1000;

  for (const feed of BLOG_FEEDS) {
    let items: FeedItem[];
    try {
      const res = await fetchWithRetry(feed.url, {
        cache: "no-store",
        headers: { "User-Agent": "BarkingBeaverBot/1.0 (+https://barking-beavers-my-music-radar.vercel.app)" },
      });
      if (!res.ok) {
        result.errors.push(`${feed.name} fetch failed (${res.status})`);
        continue;
      }
      items = parseFeed(await res.text());
    } catch (err) {
      result.errors.push(`${feed.name}: ${(err as Error).message}`);
      continue;
    }

    const source = await getOrCreateSource(db, {
      name: feed.name,
      type: "music_publication",
      url: feed.url,
    });

    for (const item of items) {
      if (item.pubDate && item.pubDate.getTime() < cutoff) continue;

      for (const artist of artists) {
        if (!titleMentionsArtist(item.title, artist.name)) continue;

        const created = await createEventIfNew(db, {
          type: "blog_news",
          artistId: artist.id,
          title: item.title,
          description: `Covered by ${feed.name}.`,
          publishedAt: item.pubDate ?? new Date(),
          sourceId: source.id,
          sourceUrl: item.link,
          credibilityScore: source.credibilityScore,
        });
        if (created) result.created++;
      }
    }
  }

  return result;
}
