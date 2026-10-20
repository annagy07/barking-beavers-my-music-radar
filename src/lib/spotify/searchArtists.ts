import "server-only";
import {
  getSpotifyAppToken,
  isSpotifyContentSyncConfigured,
} from "@/lib/sources/spotifyClientCredentials";

export interface SpotifyArtistSearchHit {
  spotifyId: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
}

interface SpotifySearchArtistObject {
  id: string;
  name: string;
  genres?: string[];
  images?: { url: string }[];
}

/** Public catalog search (Client Credentials, same token as the releases
 * sync) — lets onboarding's artist search reach beyond whatever's already
 * in our own Artist table, same as a real streaming app's search would.
 * Returns [] rather than throwing on any failure (not configured, network
 * error, rate limit) so search degrades to local-only results instead of
 * breaking the page. */
export async function searchSpotifyArtists(
  query: string,
  limit = 8,
): Promise<SpotifyArtistSearchHit[]> {
  if (!isSpotifyContentSyncConfigured()) return [];
  try {
    const token = await getSpotifyAppToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = (json.artists?.items ?? []) as SpotifySearchArtistObject[];
    return items.map((a) => ({
      spotifyId: a.id,
      name: a.name,
      genres: a.genres ?? [],
      imageUrl: a.images?.[a.images.length - 1]?.url ?? null,
    }));
  } catch {
    return [];
  }
}

/** The real "fans also like" endpoint — Spotify documents it as 403'd for
 * any app created after Nov 2024 without Extended Quota Mode, but that's
 * per-app, not universal, so it's worth actually trying rather than taking
 * that as gospel for every app. Returns null (not []) on any non-2xx or
 * error so the caller can tell "confirmed blocked/unavailable, fall back"
 * apart from "called fine, this artist genuinely has none". */
async function getRelatedArtists(
  spotifyId: string,
  excludeNames: Set<string>,
  limit: number,
): Promise<SpotifyArtistSearchHit[] | null> {
  try {
    const token = await getSpotifyAppToken();
    const res = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}/related-artists`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.error(`[suggestions] related-artists ${spotifyId} -> HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    const items = (json.artists ?? []) as SpotifySearchArtistObject[];
    return items
      .filter((a) => !excludeNames.has(a.name.toLowerCase()))
      .slice(0, limit)
      .map((a) => ({
        spotifyId: a.id,
        name: a.name,
        genres: a.genres ?? [],
        imageUrl: a.images?.[a.images.length - 1]?.url ?? null,
      }));
  } catch (err) {
    console.error(`[suggestions] related-artists ${spotifyId} threw:`, err);
    return null;
  }
}

/** "People who like this artist might also like…". Tries the real
 * related-artists endpoint first (see getRelatedArtists) and only falls
 * back to genre-filtered catalog search — querying each of the seed
 * artist's genres and pooling the hits — when that's unavailable for this
 * app. Both paths use the same Client Credentials token as everything else
 * in this file — no per-user Spotify login, so neither is subject to the
 * Development Mode user cap. */
export async function suggestSimilarArtists(
  spotifyId: string | null,
  genres: string[],
  excludeNames: Set<string>,
  limit = 10,
): Promise<SpotifyArtistSearchHit[]> {
  if (!isSpotifyContentSyncConfigured()) {
    console.error("[suggestions] Spotify not configured (SPOTIFY_CLIENT_ID/SECRET missing)");
    return [];
  }

  if (spotifyId) {
    const related = await getRelatedArtists(spotifyId, excludeNames, limit);
    if (related !== null) return related;
  }

  if (genres.length === 0) {
    console.error(`[suggestions] no genres for spotifyId=${spotifyId ?? "null"}, nothing to search`);
    return [];
  }

  const found = new Map<string, SpotifyArtistSearchHit>();
  for (const genre of genres.slice(0, 3)) {
    if (found.size >= limit) break;
    try {
      const token = await getSpotifyAppToken();
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(`genre:"${genre}"`)}&type=artist&limit=${limit}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        console.error(`[suggestions] genre search "${genre}" -> HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      const items = (json.artists?.items ?? []) as SpotifySearchArtistObject[];
      for (const a of items) {
        if (found.size >= limit) break;
        if (found.has(a.id) || excludeNames.has(a.name.toLowerCase())) continue;
        found.set(a.id, {
          spotifyId: a.id,
          name: a.name,
          genres: a.genres ?? [],
          imageUrl: a.images?.[a.images.length - 1]?.url ?? null,
        });
      }
    } catch (err) {
      // Degrade silently to the caller, same as searchSpotifyArtists — one
      // bad genre query shouldn't blank out suggestions from the others —
      // but still log so a run of genre failures shows up somewhere.
      console.error(`[suggestions] genre search "${genre}" threw:`, err);
    }
  }
  console.log(`[suggestions] genre-search fallback found ${found.size} for genres=${genres.join("|")}`);
  return [...found.values()].slice(0, limit);
}
