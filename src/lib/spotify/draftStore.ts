import "server-only";
import { db } from "@/lib/db";
import type { DraftArtist } from "./importArtists";
import type { SpotifyTokenSet } from "./types";

export const DRAFT_ID_COOKIE = "mr_spotify_draft_id";

/**
 * Persists an imported Spotify artist list + tokens server-side and returns
 * the row id to stash in a small cookie. A real account's follow/top/saved
 * list is routinely far larger than the ~4KB a cookie can hold — this is
 * why the payload lives in the database rather than the cookie itself.
 */
export async function saveSpotifyDraft(
  artists: DraftArtist[],
  tokenSet: SpotifyTokenSet,
): Promise<string> {
  const draft = await db.spotifyImportDraft.create({
    data: {
      artistsJson: JSON.stringify(artists),
      accessToken: tokenSet.accessToken,
      refreshToken: tokenSet.refreshToken,
      scope: tokenSet.scope,
    },
  });
  return draft.id;
}

export interface LoadedSpotifyDraft {
  artists: DraftArtist[];
  accessToken: string | null;
  refreshToken: string | null;
  scope: string | null;
  connectedAt: Date;
}

export async function loadSpotifyDraft(
  draftId: string,
): Promise<LoadedSpotifyDraft | null> {
  const draft = await db.spotifyImportDraft.findUnique({ where: { id: draftId } });
  if (!draft) return null;
  return {
    artists: JSON.parse(draft.artistsJson) as DraftArtist[],
    accessToken: draft.accessToken,
    refreshToken: draft.refreshToken,
    scope: draft.scope,
    connectedAt: draft.connectedAt,
  };
}

export async function deleteSpotifyDraft(draftId: string): Promise<void> {
  await db.spotifyImportDraft.delete({ where: { id: draftId } }).catch(() => {
    // already gone — fine
  });
}
