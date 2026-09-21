import "server-only";
import { db } from "@/lib/db";
import type { SpotifyImportedArtist } from "./types";

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface DraftArtist {
  artistId: string;
  name: string;
  genres: string[];
  source: SpotifyImportedArtist["source"];
}

/**
 * Reconciles Spotify's artist list against our own Artist table (matching
 * by spotifyId, then by slug) and creates rows for anything genuinely new.
 * Returns lightweight draft records safe to stash in a cookie.
 */
export async function resolveImportedArtists(
  imported: SpotifyImportedArtist[],
): Promise<DraftArtist[]> {
  const drafts: DraftArtist[] = [];

  for (const item of imported) {
    const slug = slugify(item.name);
    let artist = await db.artist.findFirst({
      where: { OR: [{ spotifyId: item.spotifyId }, { slug }] },
    });

    if (!artist) {
      artist = await db.artist.create({
        data: {
          name: item.name,
          slug,
          genres: JSON.stringify(item.genres),
          spotifyId: item.spotifyId,
          imageUrl: item.imageUrl,
        },
      });
    } else if (!artist.spotifyId) {
      artist = await db.artist.update({
        where: { id: artist.id },
        data: { spotifyId: item.spotifyId },
      });
    }

    drafts.push({
      artistId: artist.id,
      name: artist.name,
      genres: JSON.parse(artist.genres) as string[],
      source: item.source,
    });
  }

  return drafts;
}

export interface SpotifySearchHit {
  spotifyId: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
}

/** Same match-by-spotifyId-then-slug, create-or-backfill logic as
 * resolveImportedArtists above, for the single-artist case: a user picking
 * a Spotify search result that isn't in our Artist table yet (see
 * /api/artists/from-spotify). */
export async function findOrCreateArtistFromSpotify(hit: SpotifySearchHit) {
  const slug = slugify(hit.name);
  let artist = await db.artist.findFirst({
    where: { OR: [{ spotifyId: hit.spotifyId }, { slug }] },
  });

  if (!artist) {
    artist = await db.artist.create({
      data: {
        name: hit.name,
        slug,
        genres: JSON.stringify(hit.genres),
        spotifyId: hit.spotifyId,
        imageUrl: hit.imageUrl,
      },
    });
  } else if (!artist.spotifyId) {
    artist = await db.artist.update({
      where: { id: artist.id },
      data: { spotifyId: hit.spotifyId, imageUrl: artist.imageUrl ?? hit.imageUrl },
    });
  }

  return artist;
}
