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

/** "People who like this artist might also like…", without Spotify's own
 * related-artists/recommendations endpoints — both return 403 for any app
 * created after Nov 2024 that isn't in Extended Quota Mode (which itself
 * requires a registered business with 250k+ MAU, out of reach for a new
 * product). Genre-filtered catalog search is the documented workaround:
 * query each of the seed artist's genres and pool the hits, same Client
 * Credentials token as everything else in this file — no per-user Spotify
 * login, so it isn't subject to the Development Mode user cap either. */
export async function suggestSimilarArtists(
  genres: string[],
  excludeNames: Set<string>,
  limit = 10,
): Promise<SpotifyArtistSearchHit[]> {
  if (!isSpotifyContentSyncConfigured() || genres.length === 0) return [];

  const found = new Map<string, SpotifyArtistSearchHit>();
  for (const genre of genres.slice(0, 3)) {
    if (found.size >= limit) break;
    try {
      const token = await getSpotifyAppToken();
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(`genre:"${genre}"`)}&type=artist&limit=${limit}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) continue;
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
    } catch {
      // Degrade silently, same as searchSpotifyArtists — one bad genre
      // query shouldn't blank out suggestions from the others.
    }
  }
  return [...found.values()].slice(0, limit);
}
