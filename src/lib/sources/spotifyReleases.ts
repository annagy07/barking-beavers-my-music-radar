import type { Artist, PrismaClient } from "@prisma/client";
import { getSpotifyAppToken } from "./spotifyClientCredentials";
import { createEventIfNew, emptyResult, fetchWithRetry, getOrCreateSource, type SyncResult } from "./shared";

const MAX_RELEASE_AGE_DAYS = 90; // skip an artist's back catalog on first sync

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: "album" | "single" | "compilation";
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  external_urls: { spotify: string };
  images?: SpotifyImage[];
}

function parseReleaseDate(album: SpotifyAlbum): Date {
  const raw = album.release_date;
  if (album.release_date_precision === "day") return new Date(`${raw}T00:00:00Z`);
  if (album.release_date_precision === "month") return new Date(`${raw}-01T00:00:00Z`);
  return new Date(`${raw}-01-01T00:00:00Z`);
}

/** Spotify returns cover art in a few fixed sizes (usually 640/300/64px),
 * largest first. A ~300px image is plenty for both the radar and an email
 * and costs a lot less to load than the 640px original. */
export function pickCoverImage(images: SpotifyImage[] | undefined): string | undefined {
  if (!images || images.length === 0) return undefined;
  const midSized = images.find((img) => img.width !== null && img.width <= 300);
  return (midSized ?? images[images.length - 1]).url;
}

/** Shared with the artwork-backfill admin route so both call Spotify the
 * exact same way. */
export async function fetchArtistAlbums(spotifyId: string): Promise<{
  albums: SpotifyAlbum[];
  errorStatus?: number;
}> {
  const token = await getSpotifyAppToken();
  const res = await fetchWithRetry(
    `https://api.spotify.com/v1/artists/${spotifyId}/albums?include_groups=single,album&limit=10&market=US`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) return { albums: [], errorStatus: res.status };
  const json = await res.json();
  return { albums: (json.items ?? []) as SpotifyAlbum[] };
}

/** Fetches an artist's recent singles/albums from Spotify's public catalog
 * (Client Credentials — no user login involved) and records any release
 * from the last MAX_RELEASE_AGE_DAYS as a MusicEvent. Requires the artist
 * to already have a spotifyId (set during onboarding's Spotify import, or
 * left null for artists added manually/from the seed catalog). */
export async function syncSpotifyReleasesForArtist(
  db: PrismaClient,
  artist: Artist,
): Promise<SyncResult> {
  const result = emptyResult();
  if (!artist.spotifyId) return result;

  const { albums, errorStatus } = await fetchArtistAlbums(artist.spotifyId);
  if (errorStatus) {
    result.errors.push(`Spotify albums fetch failed (${errorStatus}) for ${artist.name}`);
    return result;
  }

  const source = await getOrCreateSource(db, { name: "Spotify", type: "spotify" });
  const cutoff = Date.now() - MAX_RELEASE_AGE_DAYS * 24 * 60 * 60 * 1000;

  for (const album of albums) {
    const releaseDate = parseReleaseDate(album);
    if (releaseDate.getTime() < cutoff) continue;

    // Spotify doesn't have a distinct "EP" album_type; approximate it as
    // "single" (its usual bucket for short releases) or "album".
    const subtype = album.album_type === "album" ? "album" : "single";

    const created = await createEventIfNew(db, {
      type: "release",
      subtype,
      artistId: artist.id,
      title: album.name,
      description: `New ${album.album_type} on Spotify.`,
      publishedAt: releaseDate,
      imageUrl: pickCoverImage(album.images),
      sourceId: source.id,
      sourceUrl: album.external_urls?.spotify,
      credibilityScore: source.credibilityScore,
      externalId: album.id,
    });
    if (created) result.created++;
  }

  return result;
}
