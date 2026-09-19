import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    const popular = await db.artist.findMany({ take: 12, orderBy: { name: "asc" } });
    return NextResponse.json({ artists: serialize(popular) });
  }

  const artists = await db.artist.findMany({
    where: { name: { contains: q } },
    take: 12,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ artists: serialize(artists) });
}

function serialize(artists: { id: string; name: string; genres: string; country: string | null }[]) {
  return artists.map((a) => ({
    id: a.id,
    name: a.name,
    genres: JSON.parse(a.genres) as string[],
    country: a.country,
  }));
}
