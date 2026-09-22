import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { db } from "@/lib/db";
import { generatePersonalizedRadar } from "@/lib/radar/generateRadar";
import { listRadarEditions } from "@/lib/radar/editions";

// One-off diagnostic for "I got the same newsletter content again" /
// "some songs still have no cover art" reports — dumps exactly what the
// dedup ledger, radar library, and a fresh radar computation currently
// look like for one user, instead of guessing from the outside. Safe to
// re-run, read-only. Delete once the underlying issue is confirmed fixed.
export async function POST(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : null;
  if (!email) {
    return NextResponse.json({ error: 'Send a JSON body like {"email":"..."}' }, { status: 400 });
  }

  const subscription = await db.newsletterSubscription.findFirst({
    where: { email },
    include: { user: { include: { preference: true } } },
  });
  if (!subscription) {
    return NextResponse.json({ error: `No subscription found for ${email}` }, { status: 404 });
  }
  const userId = subscription.userId;

  const [sentCount, recentSent, editions, freshRadar] = await Promise.all([
    db.sentDigestItem.count({ where: { userId } }),
    db.sentDigestItem.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      take: 10,
      select: { musicEventId: true, sentAt: true },
    }),
    listRadarEditions(userId),
    generatePersonalizedRadar(userId),
  ]);

  const sentIds = new Set(
    (await db.sentDigestItem.findMany({ where: { userId }, select: { musicEventId: true } })).map(
      (r) => r.musicEventId,
    ),
  );
  const wouldFilterOut = freshRadar.items.filter((item) => sentIds.has(item.id)).length;
  const wouldStayNew = freshRadar.items.length - wouldFilterOut;

  const missingArtwork = freshRadar.items.filter(
    (item) => item.type === "release" && !item.imageUrl,
  ).length;

  return NextResponse.json({
    ok: true,
    subscription: {
      status: subscription.status,
      lastSentAt: subscription.lastSentAt,
      frequency: subscription.user.preference?.newsletterFrequency ?? null,
    },
    sentDigestItem: { totalCount: sentCount, mostRecent: recentSent },
    radarLibrary: { editionCount: editions.length, editions },
    freshRadarRightNow: {
      totalItems: freshRadar.items.length,
      wouldBeFilteredAsAlreadySent: wouldFilterOut,
      wouldBeGenuinelyNew: wouldStayNew,
      releaseItemsMissingArtwork: missingArtwork,
    },
  });
}
