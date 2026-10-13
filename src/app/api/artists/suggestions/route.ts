import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suggestSimilarArtists } from "@/lib/spotify/searchArtists";

const SUGGESTION_LIMIT = 10;

/** Onboarding's "because you like X" row. Looks up the seed artist's own
 * spotifyId (set when they were originally resolved from a Spotify search
 * hit — see findOrCreateArtistFromSpotify) so suggestSimilarArtists can try
 * the real related-artists endpoint before falling back to genre search. */
export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");
  const genres = (request.nextUrl.searchParams.get("genres") ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const excludeNames = new Set(
    (request.nextUrl.searchParams.get("excludeNames") ?? "")
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean),
  );

  const seedArtist = artistId
    ? await db.artist.findUnique({ where: { id: artistId }, select: { spotifyId: true } })
    : null;

  if (!seedArtist?.spotifyId && genres.length === 0) {
    return NextResponse.json({ artists: [] });
  }

  const suggestions = await suggestSimilarArtists(
    seedArtist?.spotifyId ?? null,
    genres,
    excludeNames,
    SUGGESTION_LIMIT,
  );

  return NextResponse.json({
    artists: suggestions.map((s) => ({
      id: null,
      spotifyId: s.spotifyId,
      name: s.name,
      genres: s.genres,
      imageUrl: s.imageUrl,
      country: null,
    })),
  });
}
