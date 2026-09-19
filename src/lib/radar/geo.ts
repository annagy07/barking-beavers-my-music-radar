// Approximate straight-line distances (km) between the seed cities. This is
// intentionally a small, explicit lookup table rather than a geocoding
// integration — good enough for an MVP radius filter, and transparent about
// its own limits (see getDistanceKm).
const CITY_DISTANCES_KM: Record<string, Record<string, number>> = {
  Berlin: { Hamburg: 290, Cologne: 570, Munich: 590, London: 930, Amsterdam: 650 },
  Hamburg: { Berlin: 290, Cologne: 360, Munich: 610, London: 700, Amsterdam: 460 },
  Cologne: { Berlin: 570, Hamburg: 360, Munich: 570, London: 500, Amsterdam: 220 },
  Munich: { Berlin: 590, Hamburg: 610, Cologne: 570, London: 950, Amsterdam: 800 },
  London: { Berlin: 930, Hamburg: 700, Cologne: 500, Munich: 950, Amsterdam: 360 },
  Amsterdam: { Berlin: 650, Hamburg: 460, Cologne: 220, Munich: 800, London: 360 },
};

/**
 * Returns the distance in km between two cities, or null when we don't have
 * a known distance for that pair (e.g. a freely-typed city outside the seed
 * set). Callers treat "unknown" as "can't confirm it's in range" rather than
 * silently guessing — an exact same-city match always resolves to 0.
 */
export function getDistanceKm(cityA: string, cityB: string): number | null {
  const a = cityA.trim();
  const b = cityB.trim();
  if (a.toLowerCase() === b.toLowerCase()) return 0;
  return CITY_DISTANCES_KM[a]?.[b] ?? null;
}
