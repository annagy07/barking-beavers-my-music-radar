import { NextRequest, NextResponse } from "next/server";
import { syncAllContent } from "@/lib/sources/syncAll";

// Vercel Cron Jobs invoke this on the schedule in vercel.json and
// automatically send `Authorization: Bearer $CRON_SECRET` when that env
// var is set — which doubles as the guard against anyone else calling it.
// Can also be triggered manually (e.g. to test) with the same header.
export const maxDuration = 60;

async function handleSync(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 403 });
  }

  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
