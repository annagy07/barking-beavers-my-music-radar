import { NextRequest, NextResponse } from "next/server";

// Server-side proxy so the Google Maps key never reaches the browser.
// Reuses GOOGLE_GEOCODING_API_KEY — that key needs the (legacy) Places API
// enabled alongside the Geocoding API for this to work, see README.
export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim();
  const locale = request.nextUrl.searchParams.get("locale") === "de" ? "de" : "en";

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!input || input.length < 2 || !apiKey) {
    return NextResponse.json({ predictions: [] });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("types", "(cities)");
  url.searchParams.set("language", locale);
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ predictions: [] });
    const json = await res.json();
    const predictions = ((json.predictions ?? []) as { description?: string }[])
      .map((p) => p.description)
      .filter((d): d is string => typeof d === "string")
      .slice(0, 6);
    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ predictions: [] });
  }
}
