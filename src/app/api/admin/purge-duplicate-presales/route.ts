import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// One-off cleanup: wipes every "presale" MusicEvent row. Needed once,
// because the old Ticketmaster sync created one presale per venue per
// tour — after the fix (a single upsertSingletonEvent row per artist),
// those old duplicates would otherwise sit there forever, since the new
// code only ever finds-and-updates the first existing row per artist.
// Presale data is fully regenerable (not user data) — safe to wipe and
// let the next /api/cron/sync-content run repopulate it consolidated.
// Reuses CRON_SECRET as the gate. Delete this route after running it once.
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

  const result = await db.musicEvent.deleteMany({ where: { type: "presale" } });
  return NextResponse.json({ ok: true, deleted: result.count });
}
