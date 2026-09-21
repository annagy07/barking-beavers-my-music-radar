import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { db } from "@/lib/db";
import { mapWithConcurrency } from "@/lib/sources/shared";
import { fetchArtistAlbums, pickCoverImage } from "@/lib/sources/spotifyReleases";

// One-off backfill: createEventIfNew (see lib/sources/shared.ts) only ever
// creates a MusicEvent, never updates one that already exists — so any
// "release" row synced before cover art (imageUrl) or the Release Radar
// playlist feature (externalId, the Spotify album id) was added to
// spotifyReleases.ts is permanently stuck missing them, even though every
// sync since has picked both up fine for new releases. Without externalId
// in particular, the playlist sync has no way to ever find a track for
// that release. This finds those stuck rows, re-fetches each affected
// artist's recent albums from Spotify (grouped so an artist with several
// stuck releases only costs one Spotify call, same SPOTIFY_CONCURRENCY-
// style bounded concurrency the real sync uses to avoid re-tripping the
// rate limit), and fills in whichever of the two fields is still missing
// by matching title. A release older than Spotify's "last 10" for that
// artist won't be found and is reported as skipped rather than erroring.
// Safe to re-run; delete this route once production looks right.
const CONCURRENCY = 3;

export async function POST(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const missing = await db.musicEvent.findMany({
    where: { type: "release", OR: [{ imageUrl: null }, { externalId: null }] },
    include: { artist: true },
  });

  const byArtist = new Map<string, typeof missing>();
  for (const event of missing) {
    if (!event.artist.spotifyId) continue;
    const list = byArtist.get(event.artistId) ?? [];
    list.push(event);
    byArtist.set(event.artistId, list);
  }

  let updated = 0;
  let notFound = 0;
  const errors: string[] = [];
  const artistIds = [...byArtist.keys()];

  await mapWithConcurrency(artistIds, CONCURRENCY, async (artistId) => {
    const events = byArtist.get(artistId)!;
    const artist = events[0].artist;
    try {
      const { albums, errorStatus } = await fetchArtistAlbums(artist.spotifyId!);
      if (errorStatus) {
        errors.push(`Spotify albums fetch failed (${errorStatus}) for ${artist.name}`);
        return;
      }
      const albumByTitle = new Map(albums.map((a) => [a.name, a]));

      for (const event of events) {
        const album = albumByTitle.get(event.title);
        if (!album) {
          notFound++;
          continue;
        }
        const imageUrl = event.imageUrl ?? pickCoverImage(album.images);
        const externalId = event.externalId ?? album.id;
        await db.musicEvent.update({ where: { id: event.id }, data: { imageUrl, externalId } });
        updated++;
      }
    } catch (err) {
      errors.push(`${artist.name}: ${(err as Error).message}`);
    }
  });

  return NextResponse.json({
    ok: true,
    candidates: missing.length,
    artistsChecked: artistIds.length,
    updated,
    notFound,
    errors,
  });
}
