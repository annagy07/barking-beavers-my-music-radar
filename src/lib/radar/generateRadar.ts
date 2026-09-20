import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  CREDIBILITY_THRESHOLD,
  ContentCategoryId,
  RelevanceId,
} from "@/lib/constants";
import { getDistanceKm } from "./geo";
import {
  buildCategoryMatcher,
  explicitArtistMatchScore,
  isFresh,
  isTrustedSource,
  labelForCategory,
  SCORE_CATEGORY_ENABLED,
  SCORE_CONCERT_IN_RADIUS,
  SCORE_FRESH_ITEM,
  SCORE_GENRE_OR_RELATION_MATCH,
  SCORE_TRUSTED_SOURCE,
} from "./scoring";
import type { RadarItem, RadarResult, RadarSections } from "./types";

// Sections hold up to this many items — the /radar page shows the first 6
// and lets you expand to the rest (see RadarSection.tsx); the newsletter
// email, which can't be interactive, always caps at 6 regardless (see
// EMAIL_MAX_PER_SECTION in email/render.ts).
const MAX_PER_SECTION = 15;
const LOOKAHEAD_RELEVANT_TYPES = new Set(["concert", "tour", "presale"]);

function parseGenres(json: string): string[] {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

export interface RadarPreferenceInput {
  contentCategories: ContentCategoryId[];
  discoveryLevel: number;
  city: string | null;
  concertRadiusKm: number;
  concertLookaheadDays: number;
  instantPresaleAlerts: boolean;
}

export interface RadarArtistEntryInput {
  artistId: string;
  relevance: RelevanceId;
  blocked: boolean;
  artist: { name: string; genres: string };
}

/**
 * Core scoring pipeline, independent of persistence. Used both for a real
 * user's saved radar and for the onboarding preview, which scores a draft
 * that hasn't been written to the database yet.
 */
async function buildRadar(
  ownerId: string,
  preference: RadarPreferenceInput,
  artistEntries: RadarArtistEntryInput[],
): Promise<RadarResult> {
  const now = new Date();

  const [events, relations] = await Promise.all([
    db.musicEvent.findMany({
      where: { credibilityScore: { gte: CREDIBILITY_THRESHOLD } },
      include: { artist: true, source: true },
      // A tiebreaker on id matters here: bulk syncs create many rows with
      // the exact same publishedAt (new Date() at sync time), and without
      // a deterministic secondary key Postgres can return ties in a
      // different order on every call — which items fall inside
      // MAX_PER_SECTION then silently changes between an onboarding
      // preview and the live /radar a moment later, with nothing about
      // the underlying data having changed.
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    }),
    db.artistRelation.findMany({ include: { fromArtist: true, toArtist: true } }),
  ]);

  const matchCategory = buildCategoryMatcher(preference.contentCategories);

  const followed = new Map(
    artistEntries.filter((p) => !p.blocked).map((p) => [p.artistId, p] as const),
  );
  const blockedArtistIds = new Set(
    artistEntries.filter((p) => p.blocked).map((p) => p.artistId),
  );

  const followedGenres = new Set(
    artistEntries
      .filter((p) => !p.blocked)
      .flatMap((p) => parseGenres(p.artist.genres)),
  );

  // artistId -> best explainable "why should I care about this new artist"
  const discoveryReason = new Map<string, string>();
  for (const rel of relations) {
    for (const [seedId, targetArtist] of [
      [rel.fromArtistId, rel.toArtist],
      [rel.toArtistId, rel.fromArtist],
    ] as const) {
      const seedPref = followed.get(seedId);
      if (!seedPref) continue;
      if (followed.has(targetArtist.id) || blockedArtistIds.has(targetArtist.id))
        continue;
      if (discoveryReason.has(targetArtist.id)) continue;
      discoveryReason.set(
        targetArtist.id,
        `You like ${seedPref.artist.name}${rel.note ? ` — ${rel.note}` : ""}`,
      );
    }
  }

  const maxDiscoveryItems = Math.max(0, preference.discoveryLevel - 1);
  let discoveryCount = 0;

  const items: RadarItem[] = [];

  for (const event of events) {
    if (blockedArtistIds.has(event.artistId)) continue;

    if (event.type === "discovery") {
      const categoryId = matchCategory("discovery", event.subtype);
      if (!categoryId) continue; // new_artists category disabled
      if (preference.discoveryLevel < 2) continue; // "only artists I already know"
      if (followed.has(event.artistId)) continue; // already tracked, not a discovery
      if (discoveryCount >= maxDiscoveryItems) continue;

      let reason = discoveryReason.get(event.artistId);
      let matched = Boolean(reason);
      if (!matched) {
        const eventGenres = parseGenres(event.artist.genres);
        const overlap = eventGenres.find((g) => followedGenres.has(g));
        if (overlap) {
          reason = `Matches the ${overlap} sound you already follow.`;
          matched = true;
        }
      }
      if (!matched) continue; // never show an unexplainable discovery item

      let score = SCORE_GENRE_OR_RELATION_MATCH + SCORE_CATEGORY_ENABLED;
      const reasons = [
        reason!,
        `You enabled "${labelForCategory(categoryId)}" and set discovery to ${preference.discoveryLevel}/5.`,
      ];
      if (isFresh(event.publishedAt, now)) {
        score += SCORE_FRESH_ITEM;
        reasons.push("Freshly surfaced.");
      }
      if (isTrustedSource(event.credibilityScore)) {
        score += SCORE_TRUSTED_SOURCE;
        reasons.push(`Trusted source: ${event.source.name}.`);
      }

      items.push(toRadarItem(event, score, reasons));
      discoveryCount++;
      continue;
    }

    // Everything else only ever surfaces for artists the user explicitly
    // tracks — discovery is the only door for artists they don't follow.
    const artistPref = followed.get(event.artistId);
    if (!artistPref) continue;

    const categoryId = matchCategory(event.type, event.subtype);
    if (!categoryId) continue; // content type disabled by the user

    if (event.type === "concert") {
      if (!preference.city || !event.city) continue;
      const distance = getDistanceKm(preference.city, event.city);
      if (distance === null || distance > preference.concertRadiusKm) continue;
    }

    if (LOOKAHEAD_RELEVANT_TYPES.has(event.type) && event.eventDate) {
      const daysAhead =
        (event.eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAhead > preference.concertLookaheadDays) continue;
    }

    const relevance = artistPref.relevance;
    let score = explicitArtistMatchScore(relevance) + SCORE_CATEGORY_ENABLED;
    const reasons = [
      `You marked ${event.artist.name} as ${relevance} and enabled "${labelForCategory(categoryId)}".`,
    ];

    if (event.type === "concert") {
      score += SCORE_CONCERT_IN_RADIUS;
      reasons.push(
        `You follow ${event.artist.name} and asked for concerts within ${preference.concertRadiusKm} km of ${preference.city}.`,
      );
    }

    if (event.type === "presale" && preference.instantPresaleAlerts && relevance === "essential") {
      reasons.push(
        "You asked to always be alerted about presales for essential artists.",
      );
    }

    if (isFresh(event.publishedAt, now)) {
      score += SCORE_FRESH_ITEM;
      reasons.push("Published in the last week.");
    }
    if (isTrustedSource(event.credibilityScore)) {
      score += SCORE_TRUSTED_SOURCE;
      reasons.push(`Trusted source: ${event.source.name}.`);
    }

    items.push(toRadarItem(event, score, reasons));
  }

  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const publishedDiff =
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (publishedDiff !== 0) return publishedDiff;
    return a.id.localeCompare(b.id); // stable, deterministic tiebreak
  });

  // Cap per section FIRST, then flatten — capping the flat list to a fixed
  // total first (as this used to) let one dominant category (e.g.
  // hundreds of synced concerts, all scoring well on the concert-radius
  // bonus) fill the whole cap before less flashy categories like
  // interviews or blog news ever got a look in, even when they had
  // qualifying items of their own. Sectioning first guarantees every
  // enabled category gets up to MAX_PER_SECTION items if it has any.
  const sections = buildSections(items);
  const capped = (Object.keys(sections) as (keyof RadarSections)[]).flatMap(
    (key) => sections[key],
  );

  return {
    generatedAt: now.toISOString(),
    userId: ownerId,
    city: preference.city,
    concertRadiusKm: preference.concertRadiusKm,
    items: capped,
    sections,
  };
}

/**
 * Builds the personalized radar for a saved user: loads their preferences
 * and taste graph, filters the eligible (credible, non-blocked, category-
 * enabled, in-range) events, scores what's left with fully transparent
 * deterministic rules, and attaches a plain-language reason to every item.
 */
export async function generatePersonalizedRadar(
  userId: string,
): Promise<RadarResult> {
  const [preference, artistPrefs] = await Promise.all([
    db.userPreference.findUnique({ where: { userId } }),
    db.userArtistPreference.findMany({ where: { userId }, include: { artist: true } }),
  ]);

  if (!preference) {
    return {
      generatedAt: new Date().toISOString(),
      userId,
      city: null,
      concertRadiusKm: 50,
      items: [],
      sections: emptySections(),
    };
  }

  return buildRadar(
    userId,
    {
      contentCategories: JSON.parse(preference.contentCategories) as ContentCategoryId[],
      discoveryLevel: preference.discoveryLevel,
      city: preference.city,
      concertRadiusKm: preference.concertRadiusKm,
      concertLookaheadDays: preference.concertLookaheadDays,
      instantPresaleAlerts: preference.instantPresaleAlerts,
    },
    artistPrefs.map((p) => ({
      artistId: p.artistId,
      relevance: p.relevance as RelevanceId,
      blocked: p.blocked,
      artist: { name: p.artist.name, genres: p.artist.genres },
    })),
  );
}

export interface DraftRadarInput {
  artists: { artistId: string; relevance: RelevanceId }[];
  contentCategories: ContentCategoryId[];
  discoveryLevel: number;
  city: string;
  concertRadiusKm: number;
  concertLookaheadDays: number;
  instantPresaleAlerts: boolean;
}

/** Same pipeline, for the onboarding preview before an account exists. */
export async function generateDraftRadar(
  draft: DraftRadarInput,
): Promise<RadarResult> {
  const artists = await db.artist.findMany({
    where: { id: { in: draft.artists.map((a) => a.artistId) } },
  });
  const artistById = new Map(artists.map((a) => [a.id, a]));

  const artistEntries: RadarArtistEntryInput[] = draft.artists
    .filter((a) => artistById.has(a.artistId))
    .map((a) => {
      const artist = artistById.get(a.artistId)!;
      return {
        artistId: a.artistId,
        relevance: a.relevance,
        blocked: false,
        artist: { name: artist.name, genres: artist.genres },
      };
    });

  return buildRadar(
    "draft",
    {
      contentCategories: draft.contentCategories,
      discoveryLevel: draft.discoveryLevel,
      city: draft.city || null,
      concertRadiusKm: draft.concertRadiusKm,
      concertLookaheadDays: draft.concertLookaheadDays,
      instantPresaleAlerts: draft.instantPresaleAlerts,
    },
    artistEntries,
  );
}

type EventWithRelations = Prisma.MusicEventGetPayload<{
  include: { artist: true; source: true };
}>;

function toRadarItem(
  event: EventWithRelations,
  score: number,
  reasons: string[],
): RadarItem {
  return {
    id: event.id,
    type: event.type,
    subtype: event.subtype,
    artistId: event.artistId,
    artistName: event.artist.name,
    title: event.title,
    description: event.description,
    publishedAt: event.publishedAt.toISOString(),
    eventDate: event.eventDate ? event.eventDate.toISOString() : null,
    city: event.city,
    venue: event.venue,
    imageUrl: event.imageUrl,
    sourceName: event.source.name,
    sourceType: event.source.type,
    sourceUrl: event.sourceUrl,
    credibilityScore: event.credibilityScore,
    score,
    reasons,
  };
}

function emptySections(): RadarSections {
  return {
    justReleased: [],
    upcoming: [],
    liveNearYou: [],
    tours: [],
    presales: [],
    videos: [],
    interviews: [],
    collaborations: [],
    facts: [],
    discovery: [],
    blogNews: [],
  };
}

// Sections where only the single best item per artist should show — an
// artist dropping three singles this week doesn't need three "Just
// Released" cards, just the one that scored highest (items arrive here
// already sorted, so "first seen per artist" is "best seen per artist").
const DEDUPE_ARTIST_SECTIONS = new Set<keyof RadarSections>(["justReleased", "upcoming"]);

function buildSections(items: RadarItem[]): RadarSections {
  const sections = emptySections();
  const byType: Record<string, keyof RadarSections> = {
    release: "justReleased",
    upcoming_release: "upcoming",
    concert: "liveNearYou",
    tour: "tours",
    presale: "presales",
    video: "videos",
    interview: "interviews",
    collaboration: "collaborations",
    fact: "facts",
    discovery: "discovery",
    blog_news: "blogNews",
  };
  const seenArtistIds = new Map<keyof RadarSections, Set<string>>();

  for (const item of items) {
    const key = byType[item.type];
    if (!key) continue;
    if (sections[key].length >= MAX_PER_SECTION) continue;

    if (DEDUPE_ARTIST_SECTIONS.has(key)) {
      const seen = seenArtistIds.get(key) ?? new Set<string>();
      if (seen.has(item.artistId)) continue;
      seen.add(item.artistId);
      seenArtistIds.set(key, seen);
    }

    sections[key].push(item);
  }
  return sections;
}
