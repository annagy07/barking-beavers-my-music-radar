import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DRAFT_ID_COOKIE, deleteSpotifyDraft, loadSpotifyDraft } from "@/lib/spotify/draftStore";

export async function GET() {
  const cookieStore = await cookies();
  const draftId = cookieStore.get(DRAFT_ID_COOKIE)?.value;
  if (!draftId) {
    return NextResponse.json({ connected: false, artists: [] });
  }

  const draft = await loadSpotifyDraft(draftId);
  if (!draft) {
    return NextResponse.json({ connected: false, artists: [] });
  }

  return NextResponse.json({
    connected: true,
    connectedAt: draft.connectedAt.toISOString(),
    artists: draft.artists,
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const draftId = cookieStore.get(DRAFT_ID_COOKIE)?.value;
  if (draftId) {
    await deleteSpotifyDraft(draftId);
  }
  cookieStore.delete(DRAFT_ID_COOKIE);
  return NextResponse.json({ ok: true });
}
