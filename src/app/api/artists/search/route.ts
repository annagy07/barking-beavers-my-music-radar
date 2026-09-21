import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchSpotifyArtists } from "@/lib/spotify/searchArtists";

const LOCAL_LIMIT = 12;
const SPOTIFY_LIMIT = 8;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    const popular = await db.artist.findMany({ take: LOCAL_LIMIT, orderBy: { name: "asc" } });
    return NextResponse.json({ artists: serializeLocal(popular) });
  }

  const [local, spotifyHits] = await Promise.all([
    db.artist.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: LOCAL_LIMIT,
      orderBy: { name: "asc" },
    }),
    // Below 2 characters Spotify's search returns too much noise to be
    // useful, so it isn't worth spending the request on.
    q.length >= 2 ? searchSpotifyArtists(q, SPOTIFY_LIMIT) : Promise.resolve([]),
  ]);

  // Our own catalog is the trusted list (already reviewed, already linked
  // to events) — Spotify only fills in artists genuinely missing from it,
  // matched by spotifyId where we have one and by name otherwise.
  const localSpotifyIds = new Set(local.map((a) => a.spotifyId).filter((id): id is string => Boolean(id)));
  const localNames = new Set(local.map((a) => a.name.toLowerCase()));

  const spotifyOnly = spotifyHits
    .filter((hit) => !localSpotifyIds.has(hit.spotifyId) && !localNames.has(hit.name.toLowerCase()))
    .map((hit) => ({
      id: null,
      spotifyId: hit.spotifyId,
      name: hit.name,
      genres: hit.genres,
      imageUrl: hit.imageUrl,
      country: null,
    }));

  return NextResponse.json({ artists: [...serializeLocal(local), ...spotifyOnly] });
}

function serializeLocal(
  artists: {
    id: string;
    name: string;
    genres: string;
    country: string | null;
    imageUrl?: string | null;
    spotifyId?: string | null;
  }[],
) {
  return artists.map((a) => ({
    id: a.id,
    spotifyId: a.spotifyId ?? null,
    name: a.name,
    genres: JSON.parse(a.genres) as string[],
    imageUrl: a.imageUrl ?? null,
    country: a.country,
  }));
}
