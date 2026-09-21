import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cronAuth";
import { normalizeCityKey, resolveCityLocations } from "@/lib/radar/geo";

// One-off diagnostic: confirms GOOGLE_GEOCODING_API_KEY is set up correctly
// (env var present, API enabled, key restriction covers it, billing
// active) without needing a real concert event to line up with. Safe to
// re-run; delete this route once production looks right.
export async function POST(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const city = typeof body?.city === "string" ? body.city : null;
  if (!city) {
    return NextResponse.json({ error: 'Send a JSON body like {"city":"Vienna"}' }, { status: 400 });
  }

  const configured = Boolean(process.env.GOOGLE_GEOCODING_API_KEY);
  const locations = await resolveCityLocations([city]);
  const location = locations.get(normalizeCityKey(city)) ?? null;

  return NextResponse.json({
    ok: true,
    configured,
    city,
    resolved: location !== null,
    location,
  });
}
