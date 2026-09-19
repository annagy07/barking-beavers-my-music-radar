import "server-only";
import { db } from "@/lib/db";
import { syncSpotifyReleasesForArtist } from "./spotifyReleases";
import { syncTicketmasterForArtist, isTicketmasterConfigured } from "./ticketmaster";
import { syncYoutubeForArtist, isYoutubeConfigured } from "./youtube";
import { isSpotifyContentSyncConfigured } from "./spotifyClientCredentials";

export interface SyncAllSummary {
  artistsProcessed: number;
  spotify: { enabled: boolean; created: number; errors: string[] };
  ticketmaster: { enabled: boolean; created: number; errors: string[] };
  youtube: { enabled: boolean; created: number; errors: string[] };
}

/**
 * Pulls fresh content for every artist someone actually follows (not the
 * whole catalog — no point spending API quota on artists nobody tracks).
 * Each source is best-effort and independently fails soft: one artist's
 * Spotify error, say, never blocks its Ticketmaster/YouTube sync or any
 * other artist's sync.
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

  for (const artist of artists) {
    if (summary.spotify.enabled) {
      try {
        const r = await syncSpotifyReleasesForArtist(db, artist);
        summary.spotify.created += r.created;
        summary.spotify.errors.push(...r.errors);
      } catch (err) {
        summary.spotify.errors.push(`${artist.name}: ${(err as Error).message}`);
      }
    }

    if (summary.ticketmaster.enabled) {
      try {
        const r = await syncTicketmasterForArtist(db, artist);
        summary.ticketmaster.created += r.created;
        summary.ticketmaster.errors.push(...r.errors);
      } catch (err) {
        summary.ticketmaster.errors.push(`${artist.name}: ${(err as Error).message}`);
      }
    }

    if (summary.youtube.enabled) {
      try {
        const r = await syncYoutubeForArtist(db, artist);
        summary.youtube.created += r.created;
        summary.youtube.errors.push(...r.errors);
      } catch (err) {
        summary.youtube.errors.push(`${artist.name}: ${(err as Error).message}`);
      }
    }
  }

  return summary;
}
