import "server-only";
import type { Artist, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { syncSpotifyReleasesForArtist } from "./spotifyReleases";
import { syncTicketmasterForArtist, isTicketmasterConfigured } from "./ticketmaster";
import { syncYoutubeForArtist, isYoutubeConfigured } from "./youtube";
import { syncBlogNews, isBlogNewsConfigured } from "./blogNews";
import { isSpotifyContentSyncConfigured } from "./spotifyClientCredentials";
import { mapWithConcurrency, sleep, type SyncResult } from "./shared";

// How many artists to sync in parallel within a single source. Sequential
// (1-at-a-time) doesn't scale past a couple dozen followed artists before
// hitting Vercel's function time limit — a bounded worker pool keeps wall
// time roughly (artists / ARTIST_CONCURRENCY) instead of (artists) round
// trips, without hammering any one API hard enough to get rate-limited.
const ARTIST_CONCURRENCY = 8;

// Spotify's Client Credentials rate limit turned out to be much easier to
// trip (and much slower to recover from — the whole app can end up 429ing
// on every request for a while, not just the burst that tripped it) than
// Ticketmaster's or YouTube's, which were fine at ARTIST_CONCURRENCY. Even
// 3-at-a-time kept tripping it daily, so this is now fully sequential
// (one artist at a time) with a deliberate pause between requests — see
// SPOTIFY_REQUEST_DELAY_MS. Slower, but artists it doesn't get through in
// one run are simply picked up by the next day's sync (see
// ROUTE_TIME_BUDGET_MS below), same as before.
const SPOTIFY_CONCURRENCY = 1;
const SPOTIFY_REQUEST_DELAY_MS = 500;

// If this many consecutive attempts all come back 429, the source is
// rate-limited right now for the whole app, not just unlucky — burning the
// rest of the time budget retrying every remaining artist one at a time
// would just produce more of the same. Stop and let the next sync retry
// once the limit window has had a chance to clear.
const RATE_LIMIT_CIRCUIT_BREAKER = 10;

// Each route's own maxDuration is 60s — this stops picking up new artists
// comfortably before that, leaving headroom for in-flight requests to
// finish and the JSON response itself to be written. Splitting sync into
// one route per source (see syncSpotifyContent etc.) was step one; this is
// step two, for whenever even a single source alone doesn't fit one run
// (e.g. Spotify's rate limits at 150+ followed artists). Artists skipped
// this way are simply picked up on the next daily sync — nothing is lost,
// just delayed a day at most.
const ROUTE_TIME_BUDGET_MS = 45_000;

export interface SourceSyncResult {
  enabled: boolean;
  artistsProcessed: number;
  created: number;
  errors: string[];
}

async function followedArtists(): Promise<Artist[]> {
  return db.artist.findMany({ where: { userPreferences: { some: { blocked: false } } } });
}

async function syncPerArtistSource(
  enabled: boolean,
  syncOne: (db: PrismaClient, artist: Artist) => Promise<SyncResult>,
  concurrency: number = ARTIST_CONCURRENCY,
  requestDelayMs = 0,
): Promise<SourceSyncResult> {
  const result: SourceSyncResult = { enabled, artistsProcessed: 0, created: 0, errors: [] };
  if (!enabled) return result;

  const artists = await followedArtists();
  result.artistsProcessed = artists.length;

  const deadline = Date.now() + ROUTE_TIME_BUDGET_MS;
  let skipped = 0;
  let consecutiveRateLimits = 0;
  let circuitOpen = false;

  await mapWithConcurrency(artists, concurrency, async (artist) => {
    if (circuitOpen || Date.now() >= deadline) {
      skipped++;
      return;
    }
    try {
      const r = await syncOne(db, artist);
      result.created += r.created;
      result.errors.push(...r.errors);

      const rateLimited = r.errors.some((e) => e.includes("(429)"));
      consecutiveRateLimits = rateLimited ? consecutiveRateLimits + 1 : 0;
      if (consecutiveRateLimits >= RATE_LIMIT_CIRCUIT_BREAKER) circuitOpen = true;
    } catch (err) {
      result.errors.push(`${artist.name}: ${(err as Error).message}`);
    }
    if (requestDelayMs > 0) await sleep(requestDelayMs);
  });

  if (circuitOpen) {
    result.errors.push(
      "Stopped early — this source looks rate-limited for the whole app right now; try again in a few minutes.",
    );
  } else if (skipped > 0) {
    result.errors.push(
      `Ran out of time budget — ${skipped} artist(s) skipped this run, will be picked up on the next sync.`,
    );
  }

  return result;
}

// Each of these is meant to be called from its own route (see
// src/app/api/cron/sync-*) so it gets its own serverless function time
// budget — combining all four sources across 100+ followed artists in one
// invocation reliably exceeded Vercel's function duration limit.

export function syncSpotifyContent(): Promise<SourceSyncResult> {
  return syncPerArtistSource(
    isSpotifyContentSyncConfigured(),
    syncSpotifyReleasesForArtist,
    SPOTIFY_CONCURRENCY,
    SPOTIFY_REQUEST_DELAY_MS,
  );
}

export function syncTicketmasterContent(): Promise<SourceSyncResult> {
  return syncPerArtistSource(isTicketmasterConfigured(), syncTicketmasterForArtist);
}

export function syncYoutubeContent(): Promise<SourceSyncResult> {
  return syncPerArtistSource(isYoutubeConfigured(), syncYoutubeForArtist);
}

export async function syncBlogNewsContent(): Promise<SourceSyncResult> {
  const enabled = isBlogNewsConfigured();
  const result: SourceSyncResult = { enabled, artistsProcessed: 0, created: 0, errors: [] };
  if (!enabled) return result;

  const artists = await followedArtists();
  result.artistsProcessed = artists.length;
  const r = await syncBlogNews(db, artists);
  result.created = r.created;
  result.errors = r.errors;
  return result;
}

export interface SyncAllSummary {
  artistsProcessed: number;
  spotify: SourceSyncResult;
  ticketmaster: SourceSyncResult;
  youtube: SourceSyncResult;
  blogNews: SourceSyncResult;
}

/**
 * Runs all four sources in one call. Handy for local testing on a small
 * account, but at real scale (100+ followed artists) this is exactly what
 * timed out in production — the scheduled cron uses the four single-source
 * routes instead, each getting its own time budget (see
 * /api/cron/sync-spotify, sync-ticketmaster, sync-youtube, sync-blognews).
 * Kept here for manual full-sync testing via /api/cron/sync-content.
 */
export async function syncAllContent(): Promise<SyncAllSummary> {
  const [spotify, ticketmaster, youtube, blogNews] = await Promise.all([
    syncSpotifyContent(),
    syncTicketmasterContent(),
    syncYoutubeContent(),
    syncBlogNewsContent(),
  ]);

  return {
    artistsProcessed: Math.max(
      spotify.artistsProcessed,
      ticketmaster.artistsProcessed,
      youtube.artistsProcessed,
      blogNews.artistsProcessed,
    ),
    spotify,
    ticketmaster,
    youtube,
    blogNews,
  };
}
