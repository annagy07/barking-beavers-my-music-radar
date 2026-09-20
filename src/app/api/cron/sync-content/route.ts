import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { syncAllContent } from "@/lib/sources/syncAll";

// Manual "sync everything at once" endpoint — fine for a small account, but
// not what the scheduled cron uses: at real scale (100+ followed artists)
// this reliably exceeds Vercel's function duration limit. The daily cron in
// vercel.json instead hits the four single-source routes next to this one
// (sync-spotify, sync-ticketmaster, sync-youtube, sync-blognews), each with
// its own time budget. Keep this around for local/manual testing.
export const maxDuration = 60;

async function handleSync(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const summary = await syncAllContent();
  return NextResponse.json({ ok: true, summary });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
