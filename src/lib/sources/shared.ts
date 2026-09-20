import type { PrismaClient } from "@prisma/client";
import { SOURCE_TYPE_CREDIBILITY } from "@/lib/constants";

/** Finds or creates a MusicSource by name, refreshing its credibility
 * snapshot from the source type each time (mirrors seedCatalog's pattern). */
export async function getOrCreateSource(
  db: PrismaClient,
  params: { name: string; type: keyof typeof SOURCE_TYPE_CREDIBILITY; url?: string },
) {
  const credibilityScore = SOURCE_TYPE_CREDIBILITY[params.type];
  const existing = await db.musicSource.findFirst({ where: { name: params.name } });
  if (existing) {
    return db.musicSource.update({
      where: { id: existing.id },
      data: { type: params.type, credibilityScore, url: params.url ?? existing.url },
    });
  }
  return db.musicSource.create({
    data: { name: params.name, type: params.type, credibilityScore, url: params.url },
  });
}

export interface NewEventInput {
  type: string;
  subtype?: string;
  artistId: string;
  title: string;
  description: string;
  publishedAt: Date;
  eventDate?: Date;
  city?: string;
  venue?: string;
  imageUrl?: string;
  sourceId: string;
  sourceUrl?: string;
  credibilityScore: number;
}

/** Creates a MusicEvent unless one already exists for the same artist +
 * type + title (our standing dedup key across all sync sources). Returns
 * whether a new row was created. */
export async function createEventIfNew(
  db: PrismaClient,
  input: NewEventInput,
): Promise<boolean> {
  const existing = await db.musicEvent.findFirst({
    where: { artistId: input.artistId, type: input.type, title: input.title },
  });
  if (existing) return false;

  await db.musicEvent.create({
    data: {
      type: input.type,
      subtype: input.subtype,
      artistId: input.artistId,
      title: input.title,
      description: input.description,
      publishedAt: input.publishedAt,
      eventDate: input.eventDate,
      city: input.city,
      venue: input.venue,
      imageUrl: input.imageUrl,
      genreTags: JSON.stringify([]),
      sourceId: input.sourceId,
      sourceUrl: input.sourceUrl,
      credibilityScore: input.credibilityScore,
    },
  });
  return true;
}

/** fetch() with retry-on-429. Running several artists concurrently means
 * several requests can land on the same external API in the same instant,
 * which trips per-app rate limits that a single sequential caller never
 * would — this backs off (honoring Retry-After when the API sends one) and
 * retries instead of just recording the request as failed. */
// Spotify in particular can send a Retry-After well past what's worth
// waiting on inside one serverless invocation with a hard time limit — a
// handful of rate-limited artists honoring a 20-30s Retry-After each would
// blow the whole route's budget by themselves. Capping the wait means a
// slow retry costs at most a few seconds, not tens of seconds; an artist
// that still 429s after that just gets skipped this run and picked up
// again on the next sync rather than stalling everyone behind it.
const MAX_RETRY_DELAY_MS = 3000;

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt >= maxRetries) return res;

    const retryAfter = Number(res.headers.get("retry-after"));
    const delayMs = Math.min(
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt,
      MAX_RETRY_DELAY_MS,
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/** Like createEventIfNew, but keyed on artistId+type alone (not title) and
 * updated in place instead of skipped on a repeat sync — for event types
 * where an artist should only ever have one current row (e.g. "the tour
 * presale window", which gets refreshed as later syncs learn about more
 * shows, rather than one row per venue the way concerts legitimately are). */
export async function upsertSingletonEvent(
  db: PrismaClient,
  input: NewEventInput,
): Promise<boolean> {
  const existing = await db.musicEvent.findFirst({
    where: { artistId: input.artistId, type: input.type },
  });

  const data = {
    subtype: input.subtype,
    title: input.title,
    description: input.description,
    publishedAt: input.publishedAt,
    eventDate: input.eventDate,
    city: input.city,
    venue: input.venue,
    imageUrl: input.imageUrl,
    sourceId: input.sourceId,
    sourceUrl: input.sourceUrl,
    credibilityScore: input.credibilityScore,
  };

  if (existing) {
    await db.musicEvent.update({ where: { id: existing.id }, data });
    return false;
  }

  await db.musicEvent.create({
    data: { ...data, type: input.type, artistId: input.artistId, genreTags: JSON.stringify([]) },
  });
  return true;
}

export interface SyncResult {
  created: number;
  errors: string[];
}

export function emptyResult(): SyncResult {
  return { created: 0, errors: [] };
}

/** Runs `fn` over `items` with at most `concurrency` in flight at once.
 * Used to keep syncAllContent within Vercel's function time limit — three
 * sequential external API calls per artist doesn't scale to hundreds of
 * followed artists, but a bounded worker pool does. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}
