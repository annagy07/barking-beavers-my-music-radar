import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { db } from "@/lib/db";
import { decodeHtmlEntities } from "@/lib/htmlEntities";

// One-off backfill: blog-sourced titles stored before decodeHtmlEntities
// existed can still contain literal HTML entities (e.g. "&#8216;Nepo
// Baby&#8217;") left over from CDATA content the feed's CMS had already
// entity-encoded — see the comment above decodeHtmlEntities. Re-decodes
// every event title (and description, same source) that still has one.
// Safe to re-run; delete this route once production looks right.
export async function POST(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const candidates = await db.musicEvent.findMany({
    where: { OR: [{ title: { contains: "&" } }, { description: { contains: "&" } }] },
    select: { id: true, title: true, description: true },
  });

  let updated = 0;
  for (const event of candidates) {
    const title = decodeHtmlEntities(event.title);
    const description = decodeHtmlEntities(event.description);
    if (title === event.title && description === event.description) continue;
    await db.musicEvent.update({ where: { id: event.id }, data: { title, description } });
    updated++;
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, updated });
}
