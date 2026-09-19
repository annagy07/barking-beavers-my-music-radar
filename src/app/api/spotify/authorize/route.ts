import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { spotifyAdapter } from "@/lib/spotify";
import { resolveImportedArtists } from "@/lib/spotify/importArtists";
import { createCodeChallenge, createCodeVerifier, createState } from "@/lib/spotify/pkce";

const PKCE_COOKIE = "mr_spotify_pkce";
const DRAFT_COOKIE = "mr_spotify_draft";

export async function GET(request: NextRequest) {
  const onboardingUrl = new URL("/onboarding", request.url);
  const cookieStore = await cookies();

  if (spotifyAdapter.isMock) {
    // Mock mode: simulate a full round trip (consent screen, redirect,
    // token exchange, artist fetch) in one hop so local dev without Spotify
    // credentials still exercises the same downstream code paths.
    const tokenSet = await spotifyAdapter.exchangeCode({
      code: "mock-code",
      codeVerifier: "mock-verifier",
    });
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
  }

  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const state = createState();

  cookieStore.set(
    PKCE_COOKIE,
    JSON.stringify({ codeVerifier, state }),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 10 },
  );

  const authorizeUrl = spotifyAdapter.buildAuthorizeUrl({
    state,
    codeChallenge,
  });
  return NextResponse.redirect(authorizeUrl);
}
