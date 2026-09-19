import type { Artist, PrismaClient } from "@prisma/client";
import { createEventIfNew, emptyResult, getOrCreateSource, type SyncResult } from "./shared";

interface BandsintownEvent {
  id: string;
  url: string;
  datetime: string; // ISO
  venue: {
    name: string;
    city: string;
    region?: string;
    country: string;
  };
}

export function isBandsintownConfigured(): boolean {
  return Boolean(process.env.BANDSINTOWN_APP_ID);
}

/** Fetches upcoming confirmed shows for an artist from Bandsintown's public
 * events API (a free app_id, no per-artist auth needed) and records each
 * as a "concert" MusicEvent, with the actual venue as the credited source. */
export async function syncBandsintownForArtist(
  db: PrismaClient,
  artist: Artist,
): Promise<SyncResult> {
  const result = emptyResult();
  const appId = process.env.BANDSINTOWN_APP_ID;
  if (!appId) return result;

  const res = await fetch(
    `https://rest.bandsintown.com/artists/${encodeURIComponent(artist.name)}/events?app_id=${encodeURIComponent(appId)}&date=upcoming`,
    { cache: "no-store" },
  );
  if (res.status === 404) {
    // Bandsintown doesn't recognize this artist name — not an error.
    return result;
  }
  if (!res.ok) {
    result.errors.push(`Bandsintown fetch failed (${res.status}) for ${artist.name}`);
    return result;
  }

  const events = (await res.json()) as BandsintownEvent[];
  if (!Array.isArray(events)) return result;

  for (const event of events) {
    if (!event.venue?.name || !event.venue?.city || !event.datetime) continue;

    const source = await getOrCreateSource(db, {
      name: event.venue.name,
      type: "venue",
      url: event.url,
    });

    const created = await createEventIfNew(db, {
      type: "concert",
      artistId: artist.id,
      title: `${artist.name} live at ${event.venue.name}`,
      description: `Show announced in ${event.venue.city}.`,
      publishedAt: new Date(),
      eventDate: new Date(event.datetime),
      city: event.venue.city,
      venue: event.venue.name,
      sourceId: source.id,
      sourceUrl: event.url,
      credibilityScore: source.credibilityScore,
    });
    if (created) result.created++;
  }

  return result;
}
