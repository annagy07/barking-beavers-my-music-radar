import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRAFT_COOKIE = "mr_spotify_draft";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DRAFT_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ connected: false, artists: [] });
  }
  try {
    const draft = JSON.parse(raw) as {
      connectedAt: string;
      artists: { artistId: string; name: string; genres: string[]; source: string }[];
    };
    return NextResponse.json({
      connected: true,
      connectedAt: draft.connectedAt,
      artists: draft.artists,
    });
  } catch {
    return NextResponse.json({ connected: false, artists: [] });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(DRAFT_COOKIE);
  return NextResponse.json({ ok: true });
}
