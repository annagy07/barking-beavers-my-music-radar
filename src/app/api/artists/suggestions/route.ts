import { NextRequest, NextResponse } from "next/server";
import { suggestSimilarArtists } from "@/lib/spotify/searchArtists";

const SUGGESTION_LIMIT = 10;

/** Onboarding's "because you like X" row — genre-filtered Spotify search,
 * see suggestSimilarArtists for why this isn't the related-artists API. */
export async function GET(request: NextRequest) {
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

  if (genres.length === 0) {
    return NextResponse.json({ artists: [] });
  }

  const suggestions = await suggestSimilarArtists(genres, excludeNames, SUGGESTION_LIMIT);

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
