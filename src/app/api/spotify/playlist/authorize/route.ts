import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { spotifyAdapter } from "@/lib/spotify";
import { createCodeChallenge, createCodeVerifier, createState } from "@/lib/spotify/pkce";
import { connectPlaylistAccount, syncReleaseRadarPlaylistForUser } from "@/lib/sources/playlistSync";

const PKCE_COOKIE = "mr_spotify_playlist_pkce";

// Separate from /api/spotify/authorize (onboarding's read-only connect):
// this is an explicit, additional opt-in requesting one write scope
// (playlist-modify-private) on top of the same base read scopes, started
// from Settings by an already-signed-in user rather than during
// onboarding — so it needs its own PKCE cookie and callback route rather
// than reusing the onboarding one, which assumes no account exists yet.
export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/settings", request.url);
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const cookieStore = await cookies();

  if (spotifyAdapter.isMock) {
    // Mock mode: simulate the full round trip in one hop, same pattern as
    // the onboarding connect flow's mock short-circuit.
    const tokenSet = await spotifyAdapter.exchangePlaylistCode({
      code: "mock-code",
      codeVerifier: "mock-verifier",
    });
    await connectPlaylistAccount(user.id, tokenSet);
    const result = await syncReleaseRadarPlaylistForUser(user.id);
    settingsUrl.searchParams.set("playlist", result.errors.length > 0 ? "error" : "connected");
    return NextResponse.redirect(settingsUrl);
  }

  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const state = createState();

  cookieStore.set(PKCE_COOKIE, JSON.stringify({ codeVerifier, state }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const authorizeUrl = spotifyAdapter.buildPlaylistAuthorizeUrl({ state, codeChallenge });
  return NextResponse.redirect(authorizeUrl);
}
