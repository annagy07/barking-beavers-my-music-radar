import "server-only";
import type { Artist, PrismaClient } from "@prisma/client";
import { suggestSimilarArtists } from "@/lib/spotify/searchArtists";
import { findOrCreateArtistFromSpotify } from "@/lib/spotify/importArtists";
import { createEventIfNew, emptyResult, getOrCreateSource, type SyncResult } from "./shared";

const SUGGESTIONS_PER_ARTIST = 3;

/** Powers Discovery Mode: for a followed artist with a spotifyId, finds
 * similar artists via suggestSimilarArtists (Spotify's related-artists
 * endpoint, falling back to genre-filtered search — same logic onboarding's
 * "because you like X" row uses) and records each one as a "discovery"
 * MusicEvent plus the ArtistRelation edge generateRadar.ts already reads to
 * build the "You like X — …" reason text. Replaces the old approach of a
 * handful of hand-curated ArtistRelation rows, which only ever covered
 * three seeded artists and never grew. */
export async function syncDiscoveryForArtist(
  db: PrismaClient,
  artist: Artist,
): Promise<SyncResult> {
  const result = emptyResult();
  if (!artist.spotifyId) return result;

  const genres = JSON.parse(artist.genres) as string[];
  const suggestions = await suggestSimilarArtists(
    artist.spotifyId,
    genres,
    new Set([artist.name.toLowerCase()]),
    SUGGESTIONS_PER_ARTIST,
  );
  if (suggestions.length === 0) return result;

  const source = await getOrCreateSource(db, { name: "Spotify", type: "spotify" });

  for (const hit of suggestions) {
    try {
      const target = await findOrCreateArtistFromSpotify(hit);
      if (target.id === artist.id) continue;

      await db.artistRelation.upsert({
        where: { fromArtistId_toArtistId: { fromArtistId: artist.id, toArtistId: target.id } },
        create: {
          fromArtistId: artist.id,
          toArtistId: target.id,
          reasonType: "spotify_related",
          note: "Similar artist on Spotify",
        },
        update: {},
      });

      const created = await createEventIfNew(db, {
        type: "discovery",
        artistId: target.id,
        title: "Worth checking out",
        description: `Similar to ${artist.name} on Spotify.`,
        publishedAt: new Date(),
        sourceId: source.id,
        credibilityScore: source.credibilityScore,
      });
      if (created) result.created++;
    } catch (err) {
      result.errors.push(`${artist.name} -> ${hit.name}: ${(err as Error).message}`);
    }
  }

  return result;
}
