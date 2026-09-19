import { PrismaClient } from "@prisma/client";
import { seedCatalog } from "../src/lib/seedCatalog";

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Demo user — lets reviewers browse /radar, /artists, /preferences
// immediately after seeding, without completing onboarding first.
// ---------------------------------------------------------------------------

const DEMO_ARTISTS: { name: string; source: string; relevance: string }[] = [
  { name: "Fontaines D.C.", source: "manual", relevance: "essential" },
  { name: "Bon Iver", source: "spotify_followed_artist", relevance: "essential" },
  { name: "Fred again..", source: "spotify_top_artist", relevance: "interested" },
  { name: "Moderat", source: "spotify_top_artist", relevance: "interested" },
  { name: "Jamie xx", source: "spotify_followed_artist", relevance: "interested" },
  { name: "IDLES", source: "manual", relevance: "essential" },
  { name: "The National", source: "spotify_saved_music", relevance: "occasional" },
  { name: "Little Simz", source: "manual", relevance: "interested" },
  { name: "Bicep", source: "spotify_top_artist", relevance: "occasional" },
  { name: "Big Thief", source: "spotify_followed_artist", relevance: "interested" },
];

const BASE_WEIGHT: Record<string, number> = {
  manual: 50,
  spotify_followed_artist: 40,
  spotify_top_artist: 35,
  spotify_saved_music: 25,
};

async function main() {
  console.log("Seeding…");

  // Full local-dev reset. This is destructive — never run it against a
  // database with real user accounts (use /api/admin/seed-catalog there
  // instead, which only upserts the catalog and never deletes anything).
  await db.spotifyImportDraft.deleteMany();
  await db.musicEvent.deleteMany();
  await db.artistRelation.deleteMany();
  await db.userArtistPreference.deleteMany();
  await db.musicSource.deleteMany();
  await db.newsletterSubscription.deleteMany();
  await db.consent.deleteMany();
  await db.connectedAccount.deleteMany();
  await db.userPreference.deleteMany();
  await db.user.deleteMany();
  await db.artist.deleteMany();

  const summary = await seedCatalog(db);
  console.log(`Created ${summary.artists} artists`);
  console.log(`Created ${summary.sources} sources`);
  console.log(`Created ${summary.eventsCreated} events`);
  console.log(`Created ${summary.relations} artist relations`);

  const artists = await db.artist.findMany();
  const artistByName = new Map(artists.map((a) => [a.name, a]));

  const demoUser = await db.user.create({
    data: { email: "demo@musicradar.app" },
  });

  for (const d of DEMO_ARTISTS) {
    const artist = artistByName.get(d.name);
    if (!artist) continue;
    await db.userArtistPreference.create({
      data: {
        userId: demoUser.id,
        artistId: artist.id,
        source: d.source,
        relevance: d.relevance,
        baseWeight: BASE_WEIGHT[d.source],
      },
    });
  }

  await db.userPreference.create({
    data: {
      userId: demoUser.id,
      contentCategories: JSON.stringify([
        "new_singles",
        "albums_eps",
        "upcoming_releases",
        "concerts",
        "tour_announcements",
        "presales",
        "music_videos",
        "interviews",
        "collaborations",
        "interesting_facts",
        "new_artists",
      ]),
      discoveryLevel: 4,
      city: "Berlin",
      concertRadiusKm: 100,
      concertLookaheadDays: 90,
      newsletterFrequency: "weekly",
      instantPresaleAlerts: true,
    },
  });

  await db.connectedAccount.create({
    data: {
      userId: demoUser.id,
      provider: "spotify",
      providerAccountId: "demo-spotify-user",
      accessToken: "mock-access-token",
      scope: "user-follow-read user-top-read user-library-read",
    },
  });

  await db.consent.create({
    data: {
      userId: demoUser.id,
      channel: "email",
      consentStatus: "granted",
      consentTextVersion: "v1",
    },
  });

  await db.newsletterSubscription.create({
    data: {
      userId: demoUser.id,
      email: "demo@musicradar.app",
      status: "active",
    },
  });

  console.log("Created demo user demo@musicradar.app");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
