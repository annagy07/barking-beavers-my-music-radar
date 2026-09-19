import type { Artist, PrismaClient } from "@prisma/client";
import { createEventIfNew, emptyResult, fetchWithRetry, getOrCreateSource, type SyncResult } from "./shared";

interface TicketmasterVenue {
  name: string;
  city?: { name: string };
  country?: { countryCode: string };
}

interface TicketmasterPresale {
  name?: string;
  startDateTime?: string;
  endDateTime?: string;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: { dateTime?: string; localDate?: string };
  };
  sales?: { presales?: TicketmasterPresale[] };
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: { name: string }[];
  };
}

export function isTicketmasterConfigured(): boolean {
  return Boolean(process.env.TICKETMASTER_API_KEY);
}

function eventDateOf(event: TicketmasterEvent): Date | null {
  const iso = event.dates.start.dateTime ?? event.dates.start.localDate;
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Loose relevance check — Ticketmaster's keyword search can return
 * tangentially-matched results (support acts, festivals, tribute acts), so
 * only keep events where the artist is actually a listed attraction. */
function matchesArtist(event: TicketmasterEvent, artistName: string): boolean {
  const attractions = event._embedded?.attractions ?? [];
  const needle = artistName.toLowerCase();
  return attractions.some((a) => a.name?.toLowerCase().includes(needle));
}

/** Fetches upcoming shows for an artist from Ticketmaster's public
 * Discovery API (self-serve API key, no partner approval needed) and
 * records each as a "concert" MusicEvent, crediting the actual venue as
 * the source. Also records any listed presale window as a "presale"
 * event. */
export async function syncTicketmasterForArtist(
  db: PrismaClient,
  artist: Artist,
): Promise<SyncResult> {
  const result = emptyResult();
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return result;

  const params = new URLSearchParams({
    apikey: apiKey,
    keyword: artist.name,
    classificationName: "music",
    sort: "date,asc",
    size: "10",
  });
  const res = await fetchWithRetry(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    result.errors.push(`Ticketmaster fetch failed (${res.status}) for ${artist.name}`);
    return result;
  }
  const json = await res.json();
  const events = (json._embedded?.events ?? []) as TicketmasterEvent[];

  for (const event of events) {
    if (!matchesArtist(event, artist.name)) continue;

    const venue = event._embedded?.venues?.[0];
    const eventDate = eventDateOf(event);
    if (!venue?.name || !venue.city?.name || !eventDate) continue;

    const source = await getOrCreateSource(db, {
      name: venue.name,
      type: "venue",
      url: event.url,
    });

    const created = await createEventIfNew(db, {
      type: "concert",
      artistId: artist.id,
      title: `${artist.name} live at ${venue.name}`,
      description: `Show announced in ${venue.city.name}.`,
      publishedAt: new Date(),
      eventDate,
      city: venue.city.name,
      venue: venue.name,
      sourceId: source.id,
      sourceUrl: event.url,
      credibilityScore: source.credibilityScore,
    });
    if (created) result.created++;

    for (const presale of event.sales?.presales ?? []) {
      if (!presale.startDateTime) continue;
      const presaleCreated = await createEventIfNew(db, {
        type: "presale",
        artistId: artist.id,
        title: `${presale.name ?? "Presale"}: ${artist.name} at ${venue.name}`,
        description: `Presale window for the ${venue.city.name} show.`,
        publishedAt: new Date(),
        eventDate: new Date(presale.startDateTime),
        city: venue.city.name,
        venue: venue.name,
        sourceId: source.id,
        sourceUrl: event.url,
        credibilityScore: source.credibilityScore,
      });
      if (presaleCreated) result.created++;
    }
  }

  return result;
}
