import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchSpotifyArtists, suggestSimilarArtists } from "@/lib/spotify/searchArtists";

const SUGGESTION_LIMIT = 3;

/** Onboarding's "because you like X" row. Looks up the seed artist's own
 * spotifyId (set when they were originally resolved from a Spotify search
 * hit — see findOrCreateArtistFromSpotify) so suggestSimilarArtists can try
 * the real related-artists endpoint before falling back to genre search.
 * An artist added through the bare "add manually" fallback has neither a
 * spotifyId nor genres — rather than give up, this does a one-off lookup
 * by name to resolve one, and backfills the local row so later requests
 * (and the rest of the app) don't need to repeat it. */
export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");
  const excludeNames = new Set(
    (request.nextUrl.searchParams.get("excludeNames") ?? "")
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean),
  );

  const seedArtist = artistId
    ? await db.artist.findUnique({
        where: { id: artistId },
        select: { id: true, name: true, spotifyId: true, genres: true },
      })
    : null;

  if (!seedArtist) {
    return NextResponse.json({ artists: [] });
  }

  let spotifyId = seedArtist.spotifyId;
  let genres = JSON.parse(seedArtist.genres) as string[];

  if (!spotifyId) {
    const hits = await searchSpotifyArtists(seedArtist.name, 5);
    const match =
      hits.find((h) => h.name.toLowerCase() === seedArtist.name.toLowerCase()) ?? hits[0];
    if (match) {
      spotifyId = match.spotifyId;
      genres = match.genres;
      await db.artist.update({
        where: { id: seedArtist.id },
        data: { spotifyId: match.spotifyId, genres: JSON.stringify(match.genres) },
      });
    }
  }

  if (!spotifyId && genres.length === 0) {
    return NextResponse.json({ artists: [] });
  }

  const suggestions = await suggestSimilarArtists(spotifyId, genres, excludeNames, SUGGESTION_LIMIT);

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
