import type { Artist, PrismaClient } from "@prisma/client";
import { XMLParser } from "fast-xml-parser";
import {
  createEventIfNew,
  emptyResult,
  fetchWithRetry,
  getOrCreateSource,
  mapWithConcurrency,
  type SyncResult,
} from "./shared";

const MAX_ITEM_AGE_DAYS = 14;
const FEED_CONCURRENCY = 6;

interface BlogFeed {
  name: string;
  url: string;
}

// Public RSS/Atom feeds — no API key, no partner approval, same
// "music_publication" credibility tier the seeded Pitchfork/DIY Magazine
// sources already use. Covers the gap Spotify/Ticketmaster/YouTube can't:
// merch drops, album-cycle news, anything a blog covers before it hits a
// structured API. Genre-diverse (indie, hip-hop, electronic, metal, pop)
// and UK/US/DE/FR/Nordic. URLs were looked up individually (not all
// guessed) but plenty of these sites don't run standard WordPress, so
// expect some to be stale — a wrong or moved URL just shows up as one
// entry in `errors` below and never blocks the other feeds or sources.
//
// Deliberately left out despite being asked for, since no working feed
// could be found: Complex Music (only a truncated/unusable feed URL
// turned up), Resident Advisor (their old RSS offering — "The Feed" —
// appears to have been discontinued). laut.de is out for the same
// reason (its domain isn't reachable from this environment to check).
const BLOG_FEEDS: BlogFeed[] = [
  { name: "DIY Magazine", url: "https://diymag.com/feed" },
  { name: "The Line of Best Fit", url: "https://www.thelineofbestfit.com/feed" },
  { name: "Stereogum", url: "https://www.stereogum.com/feed/" },
  { name: "Musikexpress", url: "https://www.musikexpress.de/feed/" },
  { name: "Rolling Stone DE", url: "https://www.rollingstone.de/feed/" },
  { name: "Pitchfork", url: "https://pitchfork.com/feed/rss" },
  { name: "Rolling Stone", url: "https://www.rollingstone.com/music/feed/" },
  { name: "Billboard", url: "https://www.billboard.com/music/feed/" },
  { name: "NME", url: "https://www.nme.com/music/news?alt=rss" },
  { name: "Clash", url: "https://www.clashmusic.com/rss.xml" },
  { name: "Mixmag", url: "https://mixmag.net/rss-category/news" },
  { name: "DJ Mag", url: "https://feeds.feedburner.com/DJmag-LatestNews" },
  { name: "Loudwire", url: "https://loudwire.com/feed/" },
  { name: "Metal Hammer", url: "https://www.loudersound.com/feeds.xml" },
  { name: "Consequence", url: "https://consequence.net/feed/" },
  { name: "BrooklynVegan", url: "https://www.brooklynvegan.com/feed/" },
  { name: "Rap-Up", url: "https://www.rap-up.com/feed" },
  { name: "Okayplayer", url: "https://www.okayplayer.com/feed" },
  { name: "Les Inrockuptibles", url: "https://www.lesinrocks.com/feed" },
  { name: "GAFFA", url: "https://gaffa.dk/feed/" },
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

// No adapter actually produces "tour" MusicEvents otherwise (Ticketmaster
// only yields per-venue "concert"/"presale" rows, never a tour-level
// announcement) — this is currently the only real source for the "Tour
// announcements" category, keyword-matched from the headline since blog
// RSS gives us no structured field to key off. English + German, the two
// languages BLOG_FEEDS actually publishes in. A title matching none of
// these still isn't lost, it just falls through to "fact" below instead.
const TOUR_KEYWORDS = [
  "tour",
  "tour dates",
  "on sale",
  "on-sale",
  "presale",
  "pre-sale",
  "tickets",
  "reschedule",
  "rescheduled",
  "postponed",
  "additional dates",
  "extra dates",
  "co-headline",
  "tournee",
  "konzert",
  "konzerttermine",
  "vorverkauf",
  "zusatzkonzert",
  "zusatztermin",
  "tourdaten",
];

export function looksLikeTourNews(title: string): boolean {
  const lower = title.toLowerCase();
  return TOUR_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Fetches each configured blog feed ONCE per sync — not once per artist,
 * since every feed covers every artist — and records a MusicEvent for
 * each item published in the last MAX_ITEM_AGE_DAYS whose title mentions
 * an artist someone actually follows. Tour/concert-flavored headlines
 * (see looksLikeTourNews) become a "tour" event so they land in Tour
 * announcements; everything else is a "fact" (subtype "interesting_fact"),
 * the same bucket as the Interesting Facts category — blog coverage
 * doesn't get its own section. Feeds are fetched with bounded concurrency
 * (FEED_CONCURRENCY): at ~20 feeds, fetching them one at a time risked
 * the same kind of slow-sync problem the per-artist sources hit at scale.
 */
export async function syncBlogNews(db: PrismaClient, artists: Artist[]): Promise<SyncResult> {
  const result = emptyResult();
  if (artists.length === 0) return result;

  const cutoff = Date.now() - MAX_ITEM_AGE_DAYS * 24 * 60 * 60 * 1000;

  await mapWithConcurrency(BLOG_FEEDS, FEED_CONCURRENCY, async (feed) => {
    let items: FeedItem[];
    try {
      const res = await fetchWithRetry(feed.url, {
        cache: "no-store",
        headers: { "User-Agent": "BarkingBeaverBot/1.0 (+https://barking-beavers-my-music-radar.vercel.app)" },
      });
      if (!res.ok) {
        result.errors.push(`${feed.name} fetch failed (${res.status})`);
        return;
      }
      items = parseFeed(await res.text());
    } catch (err) {
      result.errors.push(`${feed.name}: ${(err as Error).message}`);
      return;
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

        const isTourNews = looksLikeTourNews(item.title);
        const created = await createEventIfNew(db, {
          type: isTourNews ? "tour" : "fact",
          subtype: isTourNews ? undefined : "interesting_fact",
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
  });

  return result;
}
