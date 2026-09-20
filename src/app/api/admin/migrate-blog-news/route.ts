import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { db } from "@/lib/db";

// One-off migration: "Blog coverage" was retired as its own category and
// section — blog articles now land in "Interesting facts" like any other
// fact instead. Existing "blog_news" MusicEvent rows need converting to
// "fact"/"interesting_fact" so they don't just vanish from every radar,
// and any saved UserPreference that still has "blog_news" in its enabled
// categories needs it swapped for "interesting_facts" so those users keep
// seeing this content. Delete this route after running it once.
export async function POST(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const events = await db.musicEvent.updateMany({
    where: { type: "blog_news" },
    data: { type: "fact", subtype: "interesting_fact" },
  });

  const preferences = await db.userPreference.findMany();
  let preferencesUpdated = 0;
  for (const pref of preferences) {
    const categories = JSON.parse(pref.contentCategories) as string[];
    if (!categories.includes("blog_news")) continue;

    const next = Array.from(
      new Set(categories.map((id) => (id === "blog_news" ? "interesting_facts" : id))),
    );
    await db.userPreference.update({
      where: { id: pref.id },
      data: { contentCategories: JSON.stringify(next) },
    });
    preferencesUpdated++;
  }

  return NextResponse.json({
    ok: true,
    eventsMigrated: events.count,
    preferencesUpdated,
  });
}
