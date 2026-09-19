import "server-only";
import type {
  SpotifyAdapter,
  SpotifyImportedArtist,
  SpotifyTokenSet,
} from "./types";

// Minimal, read-only scopes. We never request user-read-email or anything
// that would let us see listening history beyond "which artists".
const SCOPES = ["user-follow-read", "user-top-read", "user-library-read"].join(
  " ",
);

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

function clientId() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  if (!id) throw new Error("SPOTIFY_CLIENT_ID is not configured");
  return id;
}

function redirectUri() {
  return (
    process.env.SPOTIFY_REDIRECT_URI ??
    "http://localhost:3000/api/spotify/callback"
  );
}

interface SpotifyArtistObject {
  id: string;
  name: string;
  genres?: string[];
  images?: { url: string }[];
}

async function spotifyFetch(path: string, accessToken: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify API ${path} failed: ${res.status}`);
  }
  return res.json();
}

function toImported(
  artist: SpotifyArtistObject,
  source: SpotifyImportedArtist["source"],
): SpotifyImportedArtist {
  return {
    spotifyId: artist.id,
    name: artist.name,
    genres: artist.genres ?? [],
    imageUrl: artist.images?.[0]?.url,
    source,
  };
}

export const realSpotifyAdapter: SpotifyAdapter = {
  isMock: false,

  buildAuthorizeUrl({ state, codeChallenge }) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId(),
      scope: SCOPES,
      redirect_uri: redirectUri(),
      state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCode({ code, codeVerifier }): Promise<SpotifyTokenSet> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: clientId(),
      code_verifier: codeVerifier,
    });
    const secret = process.env.SPOTIFY_CLIENT_SECRET;
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    // PKCE technically doesn't require a client secret, but Spotify still
    // accepts (and some app configs require) confidential-client auth.
    if (secret) {
      headers.Authorization = `Basic ${Buffer.from(
        `${clientId()}:${secret}`,
      ).toString("base64")}`;
    }
    const res = await fetch(TOKEN_URL, { method: "POST", headers, body });
    if (!res.ok) {
      throw new Error(`Spotify token exchange failed: ${res.status}`);
    }
    const json = await res.json();
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresIn: json.expires_in,
      scope: json.scope,
    };
  },

  async fetchImportedArtists(accessToken) {
    const results: SpotifyImportedArtist[] = [];

    const following = await spotifyFetch(
      "/me/following?type=artist&limit=50",
      accessToken,
    );
    for (const artist of following?.artists?.items ?? []) {
      results.push(toImported(artist, "spotify_followed_artist"));
    }

    const top = await spotifyFetch(
      "/me/top/artists?limit=30&time_range=medium_term",
      accessToken,
    );
    for (const artist of top?.items ?? []) {
      results.push(toImported(artist, "spotify_top_artist"));
    }

    const saved = await spotifyFetch("/me/tracks?limit=50", accessToken);
    const seen = new Set(results.map((a) => a.spotifyId));
    for (const item of saved?.items ?? []) {
      for (const artist of item?.track?.artists ?? []) {
        if (seen.has(artist.id)) continue;
        seen.add(artist.id);
        results.push(
          toImported(
            { id: artist.id, name: artist.name },
            "spotify_saved_music",
          ),
        );
      }
    }

    return results;
  },
};
