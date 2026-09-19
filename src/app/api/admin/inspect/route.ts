import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Protected, read-only diagnostic: given ?email=, lists that user's
 * followed artists with their artist id/slug/spotifyId and how many
 * MusicEvent rows each one has — quickly reveals whether an imported
 * Spotify artist ended up as a duplicate row instead of matching the
 * seeded catalog entry. Same ADMIN_SEED_TOKEN gate as /seed-catalog.
 */
export async function GET(request: NextRequest) {
  const configuredToken = process.env.ADMIN_SEED_TOKEN;
  if (!configuredToken) {
    return NextResponse.json(
      { error: "ADMIN_SEED_TOKEN is not configured" },
      { status: 403 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  if (!provided || provided !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "?email= is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "No user with that email" }, { status: 404 });
  }

  const prefs = await db.userArtistPreference.findMany({
    where: { userId: user.id },
    include: { artist: true },
    orderBy: { relevance: "asc" },
  });

  const artistIds = prefs.map((p) => p.artistId);
  const eventCounts = await db.musicEvent.groupBy({
    by: ["artistId"],
    where: { artistId: { in: artistIds } },
    _count: true,
  });
  const eventCountByArtistId = new Map(eventCounts.map((e) => [e.artistId, e._count]));

  // For each followed artist, also check whether a *different* artist row
  // shares a very similar name (the classic sign of a duplicate from a
  // slightly different string Spotify sent us).
  const possibleDuplicates: Record<string, { id: string; name: string; slug: string; eventCount: number }[]> = {};
  for (const p of prefs) {
    const nameStart = p.artist.name.split(" ")[0];
    const siblings = await db.artist.findMany({
      where: { name: { contains: nameStart }, id: { not: p.artistId } },
    });
    if (siblings.length > 0) {
      possibleDuplicates[p.artist.name] = await Promise.all(
        siblings.map(async (s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          eventCount: await db.musicEvent.count({ where: { artistId: s.id } }),
        })),
      );
    }
  }

  return NextResponse.json({
    userId: user.id,
    totalFollowedArtists: prefs.length,
    artists: prefs.map((p) => ({
      name: p.artist.name,
      slug: p.artist.slug,
      spotifyId: p.artist.spotifyId,
      source: p.source,
      relevance: p.relevance,
      blocked: p.blocked,
      eventCount: eventCountByArtistId.get(p.artistId) ?? 0,
    })),
    possibleDuplicates,
  });
}
