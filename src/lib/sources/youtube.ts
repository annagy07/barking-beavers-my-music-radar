import type { Artist, PrismaClient } from "@prisma/client";
import { createEventIfNew, emptyResult, fetchWithRetry, getOrCreateSource, type SyncResult } from "./shared";

const MAX_VIDEO_AGE_DAYS = 90;

export function isYoutubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

async function resolveChannelId(name: string, apiKey: string): Promise<string | null> {
  // Costs 100 quota units — only spent once per artist, then cached on
  // Artist.youtubeChannelId. Takes the top channel search result as a
  // best-effort match; there's no reliable "official channel" flag.
  const res = await fetchWithRetry(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(name)}&key=${apiKey}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = await res.json();
  const item = json.items?.[0];
  return item?.id?.channelId ?? item?.snippet?.channelId ?? null;
}

interface PlaylistItem {
  snippet: {
    title: string;
    publishedAt: string;
    resourceId: { videoId: string };
  };
}

/** Resolves (and caches) an artist's YouTube channel, then pulls its most
 * recent uploads via the channel's uploads playlist — 1 quota unit per
 * sync instead of the 100-unit search endpoint, since the uploads
 * playlist id is deterministically the channel id with "UC" -> "UU". */
export async function syncYoutubeForArtist(
  db: PrismaClient,
  artist: Artist,
): Promise<SyncResult> {
  const result = emptyResult();
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return result;

  let channelId = artist.youtubeChannelId;
  if (!channelId) {
    channelId = await resolveChannelId(artist.name, apiKey);
    if (!channelId) return result; // no plausible channel found
    await db.artist.update({ where: { id: artist.id }, data: { youtubeChannelId: channelId } });
  }

  const uploadsPlaylistId = `UU${channelId.slice(2)}`;
  const res = await fetchWithRetry(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=5&playlistId=${uploadsPlaylistId}&key=${apiKey}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    result.errors.push(`YouTube playlistItems fetch failed (${res.status}) for ${artist.name}`);
    return result;
  }
  const json = await res.json();
  const items = (json.items ?? []) as PlaylistItem[];

  const source = await getOrCreateSource(db, {
    name: "Official YouTube channel",
    type: "official_youtube",
  });
  const cutoff = Date.now() - MAX_VIDEO_AGE_DAYS * 24 * 60 * 60 * 1000;

  for (const item of items) {
    const publishedAt = new Date(item.snippet.publishedAt);
    if (publishedAt.getTime() < cutoff) continue;

    const videoId = item.snippet.resourceId?.videoId;
    if (!videoId) continue;

    const created = await createEventIfNew(db, {
      type: "video",
      artistId: artist.id,
      title: item.snippet.title,
      description: "New upload on the artist's official YouTube channel.",
      publishedAt,
      sourceId: source.id,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      credibilityScore: source.credibilityScore,
    });
    if (created) result.created++;
  }

  return result;
}
