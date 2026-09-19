import type { PrismaClient } from "@prisma/client";
import { SOURCE_TYPE_CREDIBILITY } from "@/lib/constants";

/**
 * The editorial content catalog (artists, sources, events, discovery
 * relations) — everything except real user accounts. Idempotent: safe to
 * run against a database that already has real users in it, since it only
 * ever upserts by a natural key and never deletes or touches User-related
 * tables. Used by both `prisma/seed.ts` (local dev, which wipes the DB
 * first) and the protected `/api/admin/seed-catalog` route (production,
 * which never wipes anything).
 */

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

interface ArtistSeed {
  name: string;
  genres: string[];
  country: string;
  labelName?: string;
  bio?: string;
}

export const ARTISTS: ArtistSeed[] = [
  { name: "Fontaines D.C.", genres: ["indie", "rock", "alternative"], country: "Ireland", labelName: "Partisan Records" },
  { name: "Bon Iver", genres: ["indie", "alternative"], country: "USA", labelName: "Jagjaguwar" },
  { name: "IDLES", genres: ["rock", "alternative"], country: "UK", labelName: "Partisan Records" },
  { name: "The National", genres: ["indie", "rock"], country: "USA", labelName: "4AD" },
  { name: "Jamie xx", genres: ["electronic"], country: "UK", labelName: "Young" },
  { name: "Fred again..", genres: ["electronic", "pop"], country: "UK", labelName: "Atlantic" },
  { name: "Moderat", genres: ["electronic"], country: "Germany", labelName: "Monkeytown" },
  { name: "Overmono", genres: ["electronic"], country: "UK", labelName: "XL Recordings" },
  { name: "Nilüfer Yanya", genres: ["indie", "alternative"], country: "UK", labelName: "ATO Records" },
  { name: "Yves Tumor", genres: ["alternative", "electronic"], country: "USA", labelName: "Warp Records" },
  { name: "King Krule", genres: ["alternative", "rock"], country: "UK", labelName: "XL Recordings" },
  { name: "Little Simz", genres: ["hip-hop"], country: "UK", labelName: "Age 101" },
  { name: "English Teacher", genres: ["indie", "rock", "alternative"], country: "UK", labelName: "Island Records" },
  { name: "Wet Leg", genres: ["indie", "rock"], country: "UK", labelName: "Domino" },
  { name: "Black Country, New Road", genres: ["alternative", "rock"], country: "UK", labelName: "Ninja Tune" },
  { name: "black midi", genres: ["alternative", "rock"], country: "UK", labelName: "Rough Trade" },
  { name: "Squid", genres: ["alternative", "rock"], country: "UK", labelName: "Warp Records" },
  { name: "Shame", genres: ["rock", "alternative"], country: "UK", labelName: "Dead Oceans" },
  { name: "Sports Team", genres: ["indie", "rock"], country: "UK", labelName: "Island Records" },
  { name: "Everything Everything", genres: ["alternative", "rock"], country: "UK", labelName: "AWAL" },
  { name: "Alt-J", genres: ["alternative", "indie"], country: "UK", labelName: "Infectious" },
  { name: "Foals", genres: ["alternative", "rock"], country: "UK", labelName: "Warner" },
  { name: "Glass Animals", genres: ["indie", "electronic", "pop"], country: "UK", labelName: "Wolf Tone" },
  { name: "Metronomy", genres: ["electronic", "pop"], country: "UK", labelName: "Because Music" },
  { name: "Jungle", genres: ["electronic", "pop"], country: "UK", labelName: "AWAL" },
  { name: "Bicep", genres: ["electronic"], country: "UK", labelName: "Ninja Tune" },
  { name: "Four Tet", genres: ["electronic"], country: "UK", labelName: "Text Records" },
  { name: "Floating Points", genres: ["electronic"], country: "UK", labelName: "Ninja Tune" },
  { name: "Caribou", genres: ["electronic", "indie"], country: "Canada", labelName: "City Slang" },
  { name: "Kelela", genres: ["electronic", "pop"], country: "USA", labelName: "Warp Records" },
  { name: "FKA twigs", genres: ["pop", "alternative"], country: "UK", labelName: "Young" },
  { name: "Blood Orange", genres: ["pop", "alternative"], country: "UK", labelName: "Domino" },
  { name: "Frank Ocean", genres: ["hip-hop", "pop"], country: "USA", labelName: "Boys Don't Cry" },
  { name: "Tyler, The Creator", genres: ["hip-hop"], country: "USA", labelName: "Columbia" },
  { name: "Kendrick Lamar", genres: ["hip-hop"], country: "USA", labelName: "pgLang" },
  { name: "Danny Brown", genres: ["hip-hop"], country: "USA", labelName: "Warp Records" },
  { name: "JPEGMAFIA", genres: ["hip-hop", "alternative"], country: "USA", labelName: "AWAL" },
  { name: "Denzel Curry", genres: ["hip-hop"], country: "USA", labelName: "Loma Vista" },
  { name: "Injury Reserve", genres: ["hip-hop", "alternative"], country: "USA", labelName: "Loma Vista" },
  { name: "Earl Sweatshirt", genres: ["hip-hop"], country: "USA", labelName: "Warner" },
  { name: "Aldous Harding", genres: ["indie", "alternative"], country: "New Zealand", labelName: "4AD" },
  { name: "Big Thief", genres: ["indie", "rock"], country: "USA", labelName: "4AD" },
  { name: "Phoebe Bridgers", genres: ["indie", "alternative"], country: "USA", labelName: "Dead Oceans" },
  { name: "boygenius", genres: ["indie", "rock"], country: "USA", labelName: "Interscope" },
  { name: "Snail Mail", genres: ["indie", "rock"], country: "USA", labelName: "Matador" },
  { name: "Soccer Mommy", genres: ["indie", "rock"], country: "USA", labelName: "Loma Vista" },
  { name: "Japanese Breakfast", genres: ["indie", "pop"], country: "USA", labelName: "Dead Oceans" },
  { name: "Mitski", genres: ["indie", "rock", "alternative"], country: "USA", labelName: "Dead Oceans" },
  { name: "Yeah Yeah Yeahs", genres: ["alternative", "rock"], country: "USA", labelName: "Secretly Canadian" },
  { name: "LCD Soundsystem", genres: ["electronic", "rock"], country: "USA", labelName: "DFA" },
  { name: "Arctic Monkeys", genres: ["indie", "rock"], country: "UK", labelName: "Domino" },
  { name: "The Strokes", genres: ["indie", "rock"], country: "USA", labelName: "RCA" },
  { name: "Tame Impala", genres: ["alternative", "rock", "electronic"], country: "Australia", labelName: "Fiction" },
  { name: "Parcels", genres: ["pop", "electronic"], country: "Australia", labelName: "Because Music" },
  { name: "Confidence Man", genres: ["pop", "electronic"], country: "Australia", labelName: "Heavenly" },
  { name: "Romy", genres: ["pop", "electronic"], country: "UK", labelName: "Young" },
  { name: "Christine and the Queens", genres: ["pop", "alternative"], country: "France", labelName: "Because Music" },
  { name: "Rosalía", genres: ["pop", "electronic"], country: "Spain", labelName: "Columbia" },
  { name: "Robyn", genres: ["pop", "electronic"], country: "Sweden", labelName: "Konichiwa" },
  { name: "Charli XCX", genres: ["pop", "electronic"], country: "UK", labelName: "Atlantic" },
  { name: "Obongjayar", genres: ["hip-hop", "alternative"], country: "UK", labelName: "Because Music" },
];

interface SourceSeed {
  name: string;
  type: keyof typeof SOURCE_TYPE_CREDIBILITY;
  url?: string;
}

export const SOURCES: SourceSeed[] = [
  { name: "Artist official site", type: "official_artist_site" },
  { name: "Partisan Records", type: "official_label" },
  { name: "4AD", type: "official_label" },
  { name: "Ninja Tune", type: "official_label" },
  { name: "XL Recordings", type: "official_label" },
  { name: "Domino", type: "official_label" },
  { name: "Official YouTube channel", type: "official_youtube" },
  { name: "Spotify", type: "spotify" },
  { name: "Columbiahalle Berlin", type: "venue" },
  { name: "Melkweg Amsterdam", type: "venue" },
  { name: "Palladium Cologne", type: "venue" },
  { name: "Docks Hamburg", type: "venue" },
  { name: "Brixton Academy London", type: "venue" },
  { name: "Pitchfork", type: "music_publication" },
  { name: "DIY Magazine", type: "music_publication" },
  { name: "The Line of Best Fit", type: "music_publication" },
  { name: "Anonymous fan reupload", type: "unverified_social" },
];

interface EventSeed {
  type: string;
  subtype?: string;
  artist: string;
  title: string;
  description: string;
  publishedAtDays: number; // negative = past, 0 = today, positive = future
  eventDateDays?: number;
  city?: string;
  venue?: string;
  source: string;
}

export const EVENTS: EventSeed[] = [
  // releases
  { type: "release", subtype: "single", artist: "Fontaines D.C.", title: "Favourite", description: "Lead single, released today.", publishedAtDays: 0, source: "Artist official site" },
  { type: "release", subtype: "single", artist: "IDLES", title: "Gift Horse", description: "New single from the upcoming record.", publishedAtDays: -2, source: "Partisan Records" },
  { type: "release", subtype: "single", artist: "Little Simz", title: "Gorilla", description: "Surprise-dropped single with a companion video.", publishedAtDays: -1, source: "Artist official site" },
  { type: "release", subtype: "ep", artist: "Big Thief", title: "Vampire Empire", description: "Four-track EP recorded live in upstate New York.", publishedAtDays: -5, source: "4AD" },
  { type: "release", subtype: "album", artist: "Bicep", title: "Rebirth", description: "Third studio album, out now on Ninja Tune.", publishedAtDays: -7, source: "Ninja Tune" },

  // upcoming releases
  { type: "upcoming_release", artist: "Bon Iver", title: "New EP announced for October", description: "Justin Vernon confirmed a five-track EP, recorded in Wisconsin over the summer.", publishedAtDays: -3, eventDateDays: 21, source: "Artist official site" },
  { type: "upcoming_release", artist: "Black Country, New Road", title: "New album announced", description: "The band's first full-length since their 2022 lineup change, due this winter.", publishedAtDays: -4, eventDateDays: 60, source: "Ninja Tune" },
  { type: "upcoming_release", artist: "Charli XCX", title: "New album teased", description: "Studio photos and a title tease point to a new record early next year.", publishedAtDays: -1, eventDateDays: 90, source: "Artist official site" },

  // concerts
  { type: "concert", artist: "Jamie xx", title: "Jamie xx live in Berlin", description: "Headline show as part of the European tour.", publishedAtDays: -10, eventDateDays: 60, city: "Berlin", venue: "Columbiahalle", source: "Columbiahalle Berlin" },
  { type: "concert", artist: "Fontaines D.C.", title: "Fontaines D.C. live in London", description: "Homecoming-adjacent headline show.", publishedAtDays: -12, eventDateDays: 74, city: "London", venue: "Brixton Academy", source: "Brixton Academy London" },
  { type: "concert", artist: "Bicep", title: "Bicep live in Amsterdam", description: "Extended club set as part of the Rebirth tour.", publishedAtDays: -8, eventDateDays: 21, city: "Amsterdam", venue: "Melkweg", source: "Melkweg Amsterdam" },
  { type: "concert", artist: "Little Simz", title: "Little Simz live in Cologne", description: "First Cologne date in three years.", publishedAtDays: -6, eventDateDays: 47, city: "Cologne", venue: "Palladium", source: "Palladium Cologne" },
  { type: "concert", artist: "English Teacher", title: "English Teacher live in Hamburg", description: "Support slot upgraded to a headline show after their album run.", publishedAtDays: -2, eventDateDays: 33, city: "Hamburg", venue: "Docks", source: "Docks Hamburg" },

  // tours
  { type: "tour", artist: "IDLES", title: "IDLES announce 2027 European tour", description: "17 dates across the UK and mainland Europe, tickets on sale this week.", publishedAtDays: -3, eventDateDays: 150, source: "Partisan Records" },
  { type: "tour", artist: "Fred again..", title: "Fred again.. announces arena tour", description: "First arena run, produced with an expanded live band.", publishedAtDays: -5, eventDateDays: 120, source: "Artist official site" },
  { type: "tour", artist: "Big Thief", title: "Big Thief announce fall tour", description: "North American dates announced alongside the new EP.", publishedAtDays: -5, eventDateDays: 80, source: "4AD" },

  // presales
  { type: "presale", artist: "Jamie xx", title: "Berlin show presale opens", description: "Fan-club presale opens 48 hours before general sale.", publishedAtDays: -9, eventDateDays: 58, city: "Berlin", venue: "Columbiahalle", source: "Columbiahalle Berlin" },
  { type: "presale", artist: "IDLES", title: "Tour presale for fan-club members", description: "Presale code goes out to mailing-list subscribers first.", publishedAtDays: -2, eventDateDays: 148, source: "Partisan Records" },

  // videos
  { type: "video", artist: "Fontaines D.C.", title: "\"Favourite\" — official video", description: "Directed on location in Dublin.", publishedAtDays: 0, source: "Official YouTube channel" },
  { type: "video", artist: "Little Simz", title: "\"Gorilla\" — official video", description: "One-take performance video.", publishedAtDays: -1, source: "Official YouTube channel" },
  { type: "video", artist: "Overmono", title: "Studio session video", description: "Behind-the-desk look at their live setup.", publishedAtDays: -6, source: "Official YouTube channel" },

  // interviews
  { type: "interview", artist: "Bon Iver", title: "On the making of the new EP", description: "Justin Vernon talks through the Wisconsin sessions.", publishedAtDays: -3, source: "Pitchfork" },
  { type: "interview", artist: "IDLES", title: "The band on their new record", description: "A conversation about tone, rhythm section changes, and touring.", publishedAtDays: -4, source: "DIY Magazine" },
  { type: "interview", artist: "Little Simz", title: "In conversation", description: "On self-producing and stepping back from major-label pressure.", publishedAtDays: -7, source: "The Line of Best Fit" },

  // collaborations
  { type: "collaboration", artist: "Fred again..", title: "Surprise collaboration with Jamie xx", description: "A joint track dropped with no prior announcement.", publishedAtDays: -1, source: "Artist official site" },
  { type: "collaboration", artist: "Little Simz", title: "Feature on Obongjayar's new track", description: "A guest verse on the lead single from Obongjayar's next project.", publishedAtDays: -2, source: "Artist official site" },

  // facts
  { type: "fact", subtype: "behind_the_scenes", artist: "Bon Iver", title: "Studio note: recorded to tape", description: "The new sessions were tracked entirely to analogue tape in a converted barn.", publishedAtDays: -3, source: "Artist official site" },
  { type: "fact", subtype: "interesting_fact", artist: "Moderat", title: "The trio's studio is fully modular", description: "Their whole live rig is built around modular synths rather than laptops.", publishedAtDays: -14, source: "Pitchfork" },
  { type: "fact", subtype: "interesting_fact", artist: "IDLES", title: "Unverified repost about IDLES", description: "An unverified fan account claim about the new record — filtered out by the credibility rule below 60.", publishedAtDays: -1, source: "Anonymous fan reupload" },

  // discovery
  { type: "discovery", artist: "English Teacher", title: "Worth checking out", description: "UK post-punk in the same lineage as Fontaines D.C. and IDLES.", publishedAtDays: -2, source: "DIY Magazine" },
  { type: "discovery", artist: "Black Country, New Road", title: "Worth checking out", description: "Shares festival bills and a genre lane with black midi and Squid.", publishedAtDays: -5, source: "The Line of Best Fit" },
  { type: "discovery", artist: "Obongjayar", title: "Worth checking out", description: "Frequent collaborator and label-mate of several artists you follow.", publishedAtDays: -3, source: "The Line of Best Fit" },
];

export const RELATIONS: { from: string; to: string; reasonType: string; note: string }[] = [
  { from: "Fontaines D.C.", to: "English Teacher", reasonType: "same_genre", note: "Both anchor the current UK/Ireland post-punk scene." },
  { from: "IDLES", to: "English Teacher", reasonType: "same_genre", note: "Shared post-punk lineage and shouted, political vocal style." },
  { from: "Black Country, New Road", to: "black midi", reasonType: "shared_festival_lineup", note: "Regularly share festival bills and a former rehearsal space." },
  { from: "black midi", to: "Squid", reasonType: "shared_festival_lineup", note: "Part of the same South London DIY scene." },
  { from: "Fred again..", to: "Overmono", reasonType: "shared_producer", note: "Overlapping production collaborators in UK electronic." },
  { from: "Jamie xx", to: "Overmono", reasonType: "same_label", note: "Both released key records through XL / Young." },
  { from: "Bicep", to: "Moderat", reasonType: "same_genre", note: "Both blend techno with melodic, festival-scale production." },
  { from: "King Krule", to: "Yves Tumor", reasonType: "same_genre", note: "Shared genre-blurring alternative/electronic territory." },
  { from: "Wet Leg", to: "Fontaines D.C.", reasonType: "shared_festival_lineup", note: "Regular festival bill neighbours in 2024–2026." },
  { from: "Shame", to: "IDLES", reasonType: "same_genre", note: "Both came up through the same South London post-punk clubs." },
  { from: "Sports Team", to: "Wet Leg", reasonType: "same_genre", note: "Wry, guitar-forward British indie in the same wave." },
  { from: "Little Simz", to: "Obongjayar", reasonType: "collaboration", note: "Frequent collaborators and label-mates." },
  { from: "Big Thief", to: "Aldous Harding", reasonType: "same_label", note: "Both record for 4AD." },
  { from: "Bon Iver", to: "Big Thief", reasonType: "same_genre", note: "Overlapping indie-folk audiences and shared tourmates." },
];

export interface SeedCatalogSummary {
  artists: number;
  sources: number;
  eventsCreated: number;
  eventsSkipped: number;
  relations: number;
}

export interface PurgeSeedEventsSummary {
  deleted: number;
  notFound: number;
}

/**
 * Removes exactly the MusicEvent rows this file's EVENTS array created —
 * matched by the same (artist slug, type, title) key seedCatalog() dedups
 * on — so a database that's since started pulling real content via
 * src/lib/sources/ can drop the placeholder editorial examples without
 * touching anything a live sync created. Safe by construction: since
 * createEventIfNew() also dedups on that exact key, a real sync could
 * never have inserted a second row under a key a seed event already
 * occupied — there is nothing else this could match. Never touches
 * Artist, MusicSource or ArtistRelation rows (the catalog itself stays,
 * only the example news items go).
 */
export async function purgeSeedEvents(db: PrismaClient): Promise<PurgeSeedEventsSummary> {
  let deleted = 0;
  let notFound = 0;
  for (const e of EVENTS) {
    const artist = await db.artist.findUnique({ where: { slug: slugify(e.artist) } });
    if (!artist) {
      notFound++;
      continue;
    }
    const result = await db.musicEvent.deleteMany({
      where: { artistId: artist.id, type: e.type, title: e.title },
    });
    deleted += result.count;
  }
  return { deleted, notFound };
}

/**
 * Upserts the artist/source/event/relation catalog. Never deletes
 * anything and never touches User, UserArtistPreference, UserPreference,
 * Consent, ConnectedAccount or NewsletterSubscription — safe to run
 * against a database that already has real accounts in it.
 */
export async function seedCatalog(db: PrismaClient): Promise<SeedCatalogSummary> {
  const artistBySlug = new Map<string, { id: string; name: string }>();
  for (const a of ARTISTS) {
    const slug = slugify(a.name);
    const artist = await db.artist.upsert({
      where: { slug },
      create: {
        name: a.name,
        slug,
        genres: JSON.stringify(a.genres),
        country: a.country,
        labelName: a.labelName,
        bio: a.bio,
      },
      update: {
        genres: JSON.stringify(a.genres),
        country: a.country,
        labelName: a.labelName,
        bio: a.bio,
      },
    });
    artistBySlug.set(a.name, artist);
  }

  const sourceByName = new Map<string, { id: string; credibilityScore: number }>();
  for (const s of SOURCES) {
    let source = await db.musicSource.findFirst({ where: { name: s.name } });
    const credibilityScore = SOURCE_TYPE_CREDIBILITY[s.type];
    if (source) {
      source = await db.musicSource.update({
        where: { id: source.id },
        data: { type: s.type, credibilityScore, url: s.url },
      });
    } else {
      source = await db.musicSource.create({
        data: { name: s.name, type: s.type, credibilityScore, url: s.url },
      });
    }
    sourceByName.set(s.name, source);
  }

  let eventsCreated = 0;
  let eventsSkipped = 0;
  for (const e of EVENTS) {
    const artist = artistBySlug.get(e.artist);
    const source = sourceByName.get(e.source);
    if (!artist || !source) {
      throw new Error(`Seed data references unknown artist/source: ${e.artist} / ${e.source}`);
    }
    const existing = await db.musicEvent.findFirst({
      where: { artistId: artist.id, type: e.type, title: e.title },
    });
    if (existing) {
      eventsSkipped++;
      continue;
    }
    await db.musicEvent.create({
      data: {
        type: e.type,
        subtype: e.subtype,
        artistId: artist.id,
        title: e.title,
        description: e.description,
        publishedAt: daysFromNow(e.publishedAtDays),
        eventDate: e.eventDateDays !== undefined ? daysFromNow(e.eventDateDays) : undefined,
        city: e.city,
        venue: e.venue,
        genreTags: JSON.stringify([]),
        sourceId: source.id,
        credibilityScore: source.credibilityScore,
      },
    });
    eventsCreated++;
  }

  let relationCount = 0;
  for (const r of RELATIONS) {
    const from = artistBySlug.get(r.from);
    const to = artistBySlug.get(r.to);
    if (!from || !to) continue;
    await db.artistRelation.upsert({
      where: { fromArtistId_toArtistId: { fromArtistId: from.id, toArtistId: to.id } },
      create: { fromArtistId: from.id, toArtistId: to.id, reasonType: r.reasonType, note: r.note },
      update: { reasonType: r.reasonType, note: r.note },
    });
    relationCount++;
  }

  return {
    artists: ARTISTS.length,
    sources: SOURCES.length,
    eventsCreated,
    eventsSkipped,
    relations: relationCount,
  };
}
