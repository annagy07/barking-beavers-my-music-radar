import type { PrismaClient } from "@prisma/client";
import { SOURCE_TYPE_CREDIBILITY } from "@/lib/constants";

/** Finds or creates a MusicSource by name, refreshing its credibility
 * snapshot from the source type each time (mirrors seedCatalog's pattern). */
export async function getOrCreateSource(
  db: PrismaClient,
  params: { name: string; type: keyof typeof SOURCE_TYPE_CREDIBILITY; url?: string },
) {
  const credibilityScore = SOURCE_TYPE_CREDIBILITY[params.type];
  const existing = await db.musicSource.findFirst({ where: { name: params.name } });
  if (existing) {
    return db.musicSource.update({
      where: { id: existing.id },
      data: { type: params.type, credibilityScore, url: params.url ?? existing.url },
    });
  }
  return db.musicSource.create({
    data: { name: params.name, type: params.type, credibilityScore, url: params.url },
  });
}

export interface NewEventInput {
  type: string;
  subtype?: string;
  artistId: string;
  title: string;
  description: string;
  publishedAt: Date;
  eventDate?: Date;
  city?: string;
  venue?: string;
  sourceId: string;
  sourceUrl?: string;
  credibilityScore: number;
}

/** Creates a MusicEvent unless one already exists for the same artist +
 * type + title (our standing dedup key across all sync sources). Returns
 * whether a new row was created. */
export async function createEventIfNew(
  db: PrismaClient,
  input: NewEventInput,
): Promise<boolean> {
  const existing = await db.musicEvent.findFirst({
    where: { artistId: input.artistId, type: input.type, title: input.title },
  });
  if (existing) return false;

  await db.musicEvent.create({
    data: {
      type: input.type,
      subtype: input.subtype,
      artistId: input.artistId,
      title: input.title,
      description: input.description,
      publishedAt: input.publishedAt,
      eventDate: input.eventDate,
      city: input.city,
      venue: input.venue,
      genreTags: JSON.stringify([]),
      sourceId: input.sourceId,
      sourceUrl: input.sourceUrl,
      credibilityScore: input.credibilityScore,
    },
  });
  return true;
}

export interface SyncResult {
  created: number;
  errors: string[];
}

export function emptyResult(): SyncResult {
  return { created: 0, errors: [] };
}
