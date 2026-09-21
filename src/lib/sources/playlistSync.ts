import "server-only";
import type { ConnectedAccount, MusicEvent } from "@prisma/client";
import { db } from "@/lib/db";
import { spotifyAdapter } from "@/lib/spotify";
import type { SpotifyTokenSet } from "@/lib/spotify/types";
import { getSpotifyAppToken } from "./spotifyClientCredentials";
import { fetchWithRetry, mapWithConcurrency } from "./shared";
import { buildCategoryMatcher } from "@/lib/radar/scoring";
import type { ContentCategoryId } from "@/lib/constants";

const PLAYLIST_NAME = "Barking Beaver Release Radar";
const PLAYLIST_DESCRIPTION =
  "Automatically kept in sync with new releases from the artists on your Barking Beaver radar.";
const SYNC_CONCURRENCY = 3;

/** Upserts the Spotify ConnectedAccount row after a successful playlist-
 * scope authorization — shared by the real callback and the mock
 * authorize short-circuit, same upsert shape onboarding's callback uses
 * for the base (read-only) connection. */
export async function connectPlaylistAccount(userId: string, tokenSet: SpotifyTokenSet) {
  const expiresAt = new Date(Date.now() + tokenSet.expiresIn * 1000);
  await db.connectedAccount.upsert({
    where: { userId_provider: { userId, provider: "spotify" } },
    create: {
      userId,
      provider: "spotify",
      accessToken: tokenSet.accessToken,
      refreshToken: tokenSet.refreshToken,
      expiresAt,
      scope: tokenSet.scope,
      connectedAt: new Date(),
    },
    update: {
      accessToken: tokenSet.accessToken,
      refreshToken: tokenSet.refreshToken,
      expiresAt,
      scope: tokenSet.scope,
      connectedAt: new Date(),
      disconnectedAt: null,
    },
  });
}

export interface PlaylistSyncResult {
  ran: boolean;
  created: boolean;
  tracksAdded: number;
  errors: string[];
}

/** Reads the lead track off a release's Spotify album/single object —
 * public catalog data, so the app's own Client Credentials token is
 * enough, no user token needed. For an album this means exactly one track
 * gets added per release, same as a single (which only has one anyway). */
async function getLeadTrackUri(albumId: string): Promise<string | null> {
  const token = await getSpotifyAppToken();
  const res = await fetchWithRetry(
    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=1`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = await res.json();
  const track = json.items?.[0];
  return track?.id ? `spotify:track:${track.id}` : null;
}

/** Spotify access tokens last about an hour — far shorter than the daily
 * sync cadence — so this always refreshes up front rather than tracking
 * exact expiry, persisting the new token set back onto the account. */
async function getFreshAccessToken(account: ConnectedAccount): Promise<string | null> {
  if (!account.refreshToken) return account.accessToken;
  try {
    const tokenSet = await spotifyAdapter.refreshAccessToken(account.refreshToken);
    await db.connectedAccount.update({
      where: { id: account.id },
      data: {
        accessToken: tokenSet.accessToken,
        refreshToken: tokenSet.refreshToken ?? account.refreshToken,
        expiresAt: new Date(Date.now() + tokenSet.expiresIn * 1000),
        scope: tokenSet.scope,
      },
    });
    return tokenSet.accessToken;
  } catch (err) {
    console.error("Spotify token refresh failed", err);
    return null;
  }
}

/**
 * Keeps one user's Release Radar playlist in sync: creates it on first run
 * (once the playlist-modify-private scope has been granted — see
 * /api/spotify/playlist/authorize), then adds one track per qualifying
 * "release" event not already added (PlaylistTrackItem tracks that,
 * mirroring how SentDigestItem tracks the newsletter). Whether that's the
 * very first batch seeding a brand new playlist or one new release found
 * on today's sync is the same code path — no special-casing needed.
 */
export async function syncReleaseRadarPlaylistForUser(userId: string): Promise<PlaylistSyncResult> {
  const result: PlaylistSyncResult = { ran: false, created: false, tracksAdded: 0, errors: [] };

  const account = await db.connectedAccount.findFirst({
    where: { userId, provider: "spotify", disconnectedAt: null },
  });
  if (!account?.scope?.includes("playlist-modify-private")) return result;
  result.ran = true;

  const accessToken = await getFreshAccessToken(account);
  if (!accessToken) {
    result.errors.push("Could not refresh Spotify access token");
    return result;
  }

  let playlistId = account.playlistId;
  if (!playlistId) {
    const spotifyUserId = await spotifyAdapter.getSpotifyUserId(accessToken);
    const playlist = await spotifyAdapter.createPlaylist({
      accessToken,
      spotifyUserId,
      name: PLAYLIST_NAME,
      description: PLAYLIST_DESCRIPTION,
    });
    playlistId = playlist.id;
    await db.connectedAccount.update({ where: { id: account.id }, data: { playlistId } });
    result.created = true;
  }

  const preference = await db.userPreference.findUnique({ where: { userId } });
  if (!preference) return result;

  const [followed, alreadyAdded] = await Promise.all([
    db.userArtistPreference.findMany({
      where: { userId, blocked: false },
      select: { artistId: true },
    }),
    db.playlistTrackItem.findMany({ where: { userId }, select: { musicEventId: true } }),
  ]);
  const followedIds = followed.map((f) => f.artistId);
  const addedIds = new Set(alreadyAdded.map((a) => a.musicEventId));
  const matchCategory = buildCategoryMatcher(
    JSON.parse(preference.contentCategories) as ContentCategoryId[],
  );

  if (followedIds.length === 0) return result;

  const candidates = await db.musicEvent.findMany({
    where: { type: "release", externalId: { not: null }, artistId: { in: followedIds } },
    orderBy: { publishedAt: "asc" }, // oldest first, so the playlist builds up in release order
  });
  const toAdd = candidates.filter(
    (event) => !addedIds.has(event.id) && matchCategory(event.type, event.subtype),
  );

  const resolved: { event: MusicEvent; uri: string }[] = [];
  for (const event of toAdd) {
    try {
      const uri = await getLeadTrackUri(event.externalId!);
      if (uri) resolved.push({ event, uri });
    } catch (err) {
      result.errors.push(`${event.title}: ${(err as Error).message}`);
    }
  }

  if (resolved.length > 0) {
    await spotifyAdapter.addTracksToPlaylist({
      accessToken,
      playlistId,
      trackUris: resolved.map((r) => r.uri),
    });
    await db.playlistTrackItem.createMany({
      data: resolved.map((r) => ({ userId, musicEventId: r.event.id, trackUri: r.uri })),
      skipDuplicates: true,
    });
    result.tracksAdded = resolved.length;
  }

  return result;
}

export interface PlaylistSyncSummary {
  usersProcessed: number;
  playlistsCreated: number;
  totalTracksAdded: number;
  errors: string[];
}

export async function syncReleaseRadarPlaylistForAllUsers(): Promise<PlaylistSyncSummary> {
  const accounts = await db.connectedAccount.findMany({
    where: {
      provider: "spotify",
      disconnectedAt: null,
      scope: { contains: "playlist-modify-private" },
    },
    select: { userId: true },
  });

  const summary: PlaylistSyncSummary = {
    usersProcessed: 0,
    playlistsCreated: 0,
    totalTracksAdded: 0,
    errors: [],
  };

  await mapWithConcurrency(accounts, SYNC_CONCURRENCY, async ({ userId }) => {
    try {
      const result = await syncReleaseRadarPlaylistForUser(userId);
      if (!result.ran) return;
      summary.usersProcessed++;
      if (result.created) summary.playlistsCreated++;
      summary.totalTracksAdded += result.tracksAdded;
      summary.errors.push(...result.errors);
    } catch (err) {
      summary.errors.push(`${userId}: ${(err as Error).message}`);
    }
  });

  return summary;
}
