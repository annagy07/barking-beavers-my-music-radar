import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { spotifyAdapter } from "@/lib/spotify";
import { connectPlaylistAccount, syncReleaseRadarPlaylistForUser } from "@/lib/sources/playlistSync";

const PKCE_COOKIE = "mr_spotify_playlist_pkce";

export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/settings", request.url);
  const cookieStore = await cookies();

  const user = await getCurrentUser();
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const pkceRaw = cookieStore.get(PKCE_COOKIE)?.value;
  cookieStore.delete(PKCE_COOKIE);

  if (!user || error || !code || !pkceRaw) {
    settingsUrl.searchParams.set("playlist", "error");
    return NextResponse.redirect(settingsUrl);
  }

  const { codeVerifier, state: expectedState } = JSON.parse(pkceRaw) as {
    codeVerifier: string;
    state: string;
  };
  if (state !== expectedState) {
    settingsUrl.searchParams.set("playlist", "error");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokenSet = await spotifyAdapter.exchangePlaylistCode({ code, codeVerifier });
    await connectPlaylistAccount(user.id, tokenSet);
    // Immediate first sync so the playlist (and its initial seed of
    // current releases) exists by the time the user lands back on
    // Settings, rather than waiting for tomorrow's cron.
    const result = await syncReleaseRadarPlaylistForUser(user.id);
    settingsUrl.searchParams.set("playlist", result.errors.length > 0 ? "error" : "connected");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error("Spotify playlist callback failed", err);
    settingsUrl.searchParams.set("playlist", "error");
    return NextResponse.redirect(settingsUrl);
  }
}
