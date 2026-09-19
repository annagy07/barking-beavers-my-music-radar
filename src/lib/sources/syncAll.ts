import "server-only";
import type { Artist } from "@prisma/client";
import { db } from "@/lib/db";
import { syncSpotifyReleasesForArtist } from "./spotifyReleases";
import { syncTicketmasterForArtist, isTicketmasterConfigured } from "./ticketmaster";
import { syncYoutubeForArtist, isYoutubeConfigured } from "./youtube";
import { isSpotifyContentSyncConfigured } from "./spotifyClientCredentials";
import { mapWithConcurrency } from "./shared";

export interface SyncAllSummary {
  artistsProcessed: number;
  spotify: { enabled: boolean; created: number; errors: string[] };
  ticketmaster: { enabled: boolean; created: number; errors: string[] };
  youtube: { enabled: boolean; created: number; errors: string[] };
}

// How many artists to sync in parallel. Sequential (1-at-a-time, 3 external
// calls each) doesn't scale past a couple dozen followed artists before
// hitting Vercel's function time limit — a bounded worker pool keeps wall
// time roughly (artists / ARTIST_CONCURRENCY) instead of (artists * 3)
// round trips, without hammering any one API hard enough to get rate-limited.
const ARTIST_CONCURRENCY = 8;

/**
 * Pulls fresh content for every artist someone actually follows (not the
 * whole catalog — no point spending API quota on artists nobody tracks).
 * Each source is best-effort and independently fails soft: one artist's
 * Spotify error, say, never blocks its Ticketmaster/YouTube sync or any
 * other artist's sync. Artists are processed through a bounded concurrent
 * worker pool (see ARTIST_CONCURRENCY) to stay within the route's time limit.
 */
export async function syncAllContent(): Promise<SyncAllSummary> {
  const summary: SyncAllSummary = {
    artistsProcessed: 0,
    spotify: { enabled: isSpotifyContentSyncConfigured(), created: 0, errors: [] },
    ticketmaster: { enabled: isTicketmasterConfigured(), created: 0, errors: [] },
    youtube: { enabled: isYoutubeConfigured(), created: 0, errors: [] },
  };

  const artists = await db.artist.findMany({
    where: { userPreferences: { some: { blocked: false } } },
  });
  summary.artistsProcessed = artists.length;

  async function syncOneArtist(artist: Artist) {
    const [spotifyResult, ticketmasterResult, youtubeResult] = await Promise.all([
      summary.spotify.enabled
        ? syncSpotifyReleasesForArtist(db, artist).catch((err: Error) => {
            summary.spotify.errors.push(`${artist.name}: ${err.message}`);
            return null;
          })
        : Promise.resolve(null),
      summary.ticketmaster.enabled
        ? syncTicketmasterForArtist(db, artist).catch((err: Error) => {
            summary.ticketmaster.errors.push(`${artist.name}: ${err.message}`);
            return null;
          })
        : Promise.resolve(null),
      summary.youtube.enabled
        ? syncYoutubeForArtist(db, artist).catch((err: Error) => {
            summary.youtube.errors.push(`${artist.name}: ${err.message}`);
            return null;
          })
        : Promise.resolve(null),
    ]);

    if (spotifyResult) {
      summary.spotify.created += spotifyResult.created;
      summary.spotify.errors.push(...spotifyResult.errors);
    }
    if (ticketmasterResult) {
      summary.ticketmaster.created += ticketmasterResult.created;
      summary.ticketmaster.errors.push(...ticketmasterResult.errors);
    }
    if (youtubeResult) {
      summary.youtube.created += youtubeResult.created;
      summary.youtube.errors.push(...youtubeResult.errors);
    }
  }

  await mapWithConcurrency(artists, ARTIST_CONCURRENCY, syncOneArtist);

  return summary;
}
