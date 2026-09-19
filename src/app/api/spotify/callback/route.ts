import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { spotifyAdapter } from "@/lib/spotify";
import { resolveImportedArtists } from "@/lib/spotify/importArtists";

const PKCE_COOKIE = "mr_spotify_pkce";
const DRAFT_COOKIE = "mr_spotify_draft";

export async function GET(request: NextRequest) {
  const onboardingUrl = new URL("/onboarding", request.url);
  const cookieStore = await cookies();

  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const pkceRaw = cookieStore.get(PKCE_COOKIE)?.value;
  cookieStore.delete(PKCE_COOKIE);

  if (error || !code || !pkceRaw) {
    onboardingUrl.searchParams.set("spotify", "error");
    return NextResponse.redirect(onboardingUrl);
  }

  const { codeVerifier, state: expectedState } = JSON.parse(pkceRaw) as {
    codeVerifier: string;
    state: string;
  };

  if (state !== expectedState) {
    onboardingUrl.searchParams.set("spotify", "error");
    return NextResponse.redirect(onboardingUrl);
  }

  try {
    const tokenSet = await spotifyAdapter.exchangeCode({ code, codeVerifier });
    const imported = await spotifyAdapter.fetchImportedArtists(
      tokenSet.accessToken,
    );
    const drafts = await resolveImportedArtists(imported);

    cookieStore.set(
      DRAFT_COOKIE,
      JSON.stringify({
        provider: "spotify",
        connectedAt: new Date().toISOString(),
        accessToken: tokenSet.accessToken,
        refreshToken: tokenSet.refreshToken,
        scope: tokenSet.scope,
        artists: drafts,
      }),
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 30 },
    );

    onboardingUrl.searchParams.set("spotify", "connected");
    return NextResponse.redirect(onboardingUrl);
  } catch (err) {
    console.error("Spotify callback failed", err);
    onboardingUrl.searchParams.set("spotify", "error");
    return NextResponse.redirect(onboardingUrl);
  }
}
