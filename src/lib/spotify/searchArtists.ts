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
