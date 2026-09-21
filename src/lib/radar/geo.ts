import "server-only";
import { db } from "@/lib/db";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Trims and lowercases so "Berlin", " berlin", "BERLIN" all resolve to the
 * same cache entry instead of geocoding (and paying for) each spelling
 * separately. */
export function normalizeCityKey(city: string): string {
  return city.trim().toLowerCase();
}

/** Great-circle distance in km — accurate enough for a "shows within N km"
 * filter, no need for anything more precise than that. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

async function geocode(city: string): Promise<LatLng | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const location = json.results?.[0]?.geometry?.location;
    if (typeof location?.lat !== "number" || typeof location?.lng !== "number") return null;
    return { lat: location.lat, lng: location.lng };
  } catch {
    return null;
  }
}

/**
 * Resolves lat/lng for each given city string (user-picked preference
 * cities and concert venue cities alike — same free text, same lookup),
 * backed by a persistent cache (CityLocation) so any given city is only
 * ever sent to Google's Geocoding API once, across every user and every
 * radar build from then on. A city that fails to geocode (typo, no API
 * key configured, no results) is simply left out of the returned map
 * rather than cached as a permanent failure — callers treat "missing"
 * the same way the old fixed-table version treated "unknown distance":
 * can't confirm it's in range, so it doesn't match.
 */
export async function resolveCityLocations(cities: string[]): Promise<Map<string, LatLng>> {
  const result = new Map<string, LatLng>();
  const keys = [...new Set(cities.map(normalizeCityKey).filter(Boolean))];
  if (keys.length === 0) return result;

  const cached = await db.cityLocation.findMany({ where: { query: { in: keys } } });
  for (const row of cached) result.set(row.query, { lat: row.lat, lng: row.lng });

  const missing = keys.filter((key) => !result.has(key));
  if (missing.length === 0) return result;

  const resolved = await Promise.all(
    missing.map(async (key) => ({ key, location: await geocode(key) })),
  );
  const toCache = resolved.filter(
    (r): r is { key: string; location: LatLng } => r.location !== null,
  );

  if (toCache.length > 0) {
    await db.cityLocation.createMany({
      data: toCache.map((r) => ({ query: r.key, lat: r.location.lat, lng: r.location.lng })),
      skipDuplicates: true,
    });
    for (const r of toCache) result.set(r.key, r.location);
  }

  return result;
}
