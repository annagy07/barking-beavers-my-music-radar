import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purgeSeedEvents } from "@/lib/seedCatalog";

// One-off cleanup route: removes the example/editorial MusicEvent rows
// seedCatalog() created, now that real content sync (src/lib/sources/) has
// taken over. Reuses CRON_SECRET as the gate — same convention as
// /api/cron/sync-content — so no extra env var is needed for a single
// manual call. Delete this route after running it once.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 403 });
  }

  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await purgeSeedEvents(db);
  return NextResponse.json({ ok: true, summary });
}
