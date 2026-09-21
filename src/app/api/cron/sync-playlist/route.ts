import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { syncReleaseRadarPlaylistForAllUsers } from "@/lib/sources/playlistSync";

// Runs after the content syncs (see vercel.json) so it's working off
// today's freshly-synced releases, not yesterday's. No-ops for anyone who
// hasn't granted the playlist-modify-private scope yet (see
// /api/spotify/playlist/authorize) — most users, until they opt in from
// Settings.
export const maxDuration = 60;

async function handleSync(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const summary = await syncReleaseRadarPlaylistForAllUsers();
  return NextResponse.json({ ok: true, summary });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
