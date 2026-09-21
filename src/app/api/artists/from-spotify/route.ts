import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateArtistFromSpotify } from "@/lib/spotify/importArtists";

const bodySchema = z.object({
  spotifyId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(80),
  genres: z.array(z.string()).default([]),
  imageUrl: z.string().url().nullish(),
});

/** Turns a Spotify search hit the user picked in ArtistSearch into a real
 * local Artist row (creating it if genuinely new, or reusing/backfilling
 * an existing one matched by spotifyId or name) — see
 * findOrCreateArtistFromSpotify. Distinct from POST /api/artists, which is
 * the bare "add by name, no metadata" fallback for an artist Spotify
 * itself doesn't know about. */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid artist data" }, { status: 400 });
  }

  const artist = await findOrCreateArtistFromSpotify({
    spotifyId: parsed.data.spotifyId,
    name: parsed.data.name,
    genres: parsed.data.genres,
    imageUrl: parsed.data.imageUrl ?? null,
  });

  return NextResponse.json({
    artist: {
      id: artist.id,
      name: artist.name,
      genres: JSON.parse(artist.genres) as string[],
      country: artist.country,
    },
  });
}
