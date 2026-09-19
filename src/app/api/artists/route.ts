import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/spotify/importArtists";

const bodySchema = z.object({ name: z.string().trim().min(1).max(80) });

/** Lets onboarding create a custom artist that isn't in the seeded catalog. */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid artist name" }, { status: 400 });
  }

  const name = parsed.data.name;
  const slug = slugify(name);

  const existing = await db.artist.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({
      artist: { id: existing.id, name: existing.name, genres: JSON.parse(existing.genres) },
    });
  }

  const artist = await db.artist.create({
    data: { name, slug, genres: JSON.stringify([]) },
  });

  return NextResponse.json({
    artist: { id: artist.id, name: artist.name, genres: [] as string[] },
  });
}
