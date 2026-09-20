import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { db } from "@/lib/db";
import { looksLikeTourNews } from "@/lib/sources/blogNews";

// One-off migration, safe to re-run (each step only touches rows still in
// the old shape). Two passes:
// 1. "Blog coverage" was retired as its own category/section — blog
//    articles now land in "Interesting facts" like any other fact
//    instead. Existing "blog_news" MusicEvent rows need converting to
//    "fact"/"interesting_fact" so they don't just vanish from every
//    radar, and any saved UserPreference that still has "blog_news" in
//    its enabled categories needs it swapped for "interesting_facts" so
//    those users keep seeing this content.
// 2. Blog articles about a tour/concert now get classified as "tour" at
//    sync time (see looksLikeTourNews in blogNews.ts) instead of always
//    "fact", so they show up under Tour announcements. Reclassifies any
//    already-synced blog fact whose title matches in hindsight — scoped
//    to description "Covered by …", the fixed format only this adapter
//    writes, so it can't touch a seed-catalog or other source's fact.
// Delete this route once it's been run against production.
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

  const blogFacts = await db.musicEvent.findMany({
    where: {
      type: "fact",
      subtype: "interesting_fact",
      description: { startsWith: "Covered by " },
    },
    select: { id: true, title: true },
  });
  let reclassifiedAsTour = 0;
  for (const fact of blogFacts) {
    if (!looksLikeTourNews(fact.title)) continue;
    await db.musicEvent.update({
      where: { id: fact.id },
      data: { type: "tour", subtype: null },
    });
    reclassifiedAsTour++;
  }

  return NextResponse.json({
    ok: true,
    eventsMigrated: events.count,
    preferencesUpdated,
    reclassifiedAsTour,
  });
}
