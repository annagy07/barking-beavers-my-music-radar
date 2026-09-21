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

// The Release Radar playlist is a separate, explicit opt-in (see
// /api/spotify/playlist/authorize) — requests the base scopes again
// alongside the one new write scope, rather than assuming a prior
// connection, since a user may not have connected Spotify at all yet.
// playlist-modify-private (not -public): the playlist is created private.
const PLAYLIST_SCOPES = [SCOPES, "playlist-modify-private"].join(" ");

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

// A distinct registered redirect URI (add it alongside the one above in
// the Spotify Developer Dashboard) since it's a different callback route —
// Spotify requires the redirect_uri sent at token-exchange time to match
// the one the authorize request used exactly.
function playlistRedirectUri() {
  return (
    process.env.SPOTIFY_PLAYLIST_REDIRECT_URI ??
    "http://localhost:3000/api/spotify/playlist/callback"
  );
}

interface SpotifyArtistObject {
  id: string;
  name: string;
  genres?: string[];
  images?: { url: string }[];
}

// Spotify's error body (e.g. "Insufficient client scope", "User not
// registered in the Developer Dashboard") is far more useful for
// diagnosing a 4xx than the bare status code, so every call below surfaces
// it in the thrown error instead of swallowing it.
async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = (await res.text()).slice(0, 300);
    return text ? ` - ${text}` : "";
  } catch {
    return "";
  }
}

async function spotifyFetch(path: string, accessToken: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify API ${path} failed: ${res.status}${await readErrorBody(res)}`);
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

function tokenRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  // PKCE technically doesn't require a client secret, but Spotify still
  // accepts (and some app configs require) confidential-client auth.
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (secret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId()}:${secret}`).toString("base64")}`;
  }
  return headers;
}

async function exchangeCodeAt(
  code: string,
  codeVerifier: string,
  redirect: string,
): Promise<SpotifyTokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
    client_id: clientId(),
    code_verifier: codeVerifier,
  });
  const res = await fetch(TOKEN_URL, { method: "POST", headers: tokenRequestHeaders(), body });
  if (!res.ok) {
    throw new Error(`Spotify token exchange failed: ${res.status}${await readErrorBody(res)}`);
  }
  const json = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    scope: json.scope,
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

  buildPlaylistAuthorizeUrl({ state, codeChallenge }) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId(),
      scope: PLAYLIST_SCOPES,
      redirect_uri: playlistRedirectUri(),
      state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCode({ code, codeVerifier }): Promise<SpotifyTokenSet> {
    return exchangeCodeAt(code, codeVerifier, redirectUri());
  },

  async exchangePlaylistCode({ code, codeVerifier }): Promise<SpotifyTokenSet> {
    return exchangeCodeAt(code, codeVerifier, playlistRedirectUri());
  },

  async refreshAccessToken(refreshToken): Promise<SpotifyTokenSet> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId(),
    });
    const res = await fetch(TOKEN_URL, { method: "POST", headers: tokenRequestHeaders(), body });
    if (!res.ok) {
      throw new Error(`Spotify token refresh failed: ${res.status}${await readErrorBody(res)}`);
    }
    const json = await res.json();
    return {
      accessToken: json.access_token,
      // Spotify doesn't always return a new refresh token on refresh —
      // when it doesn't, the original one is still valid and stays in use.
      refreshToken: json.refresh_token ?? refreshToken,
      expiresIn: json.expires_in,
      scope: json.scope,
    };
  },

  async createPlaylist({ accessToken, name, description }) {
    const res = await fetch(`${API_BASE}/me/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description, public: false }),
    });
    if (!res.ok) {
      throw new Error(`Spotify create playlist failed: ${res.status}${await readErrorBody(res)}`);
    }
    const json = await res.json();
    return { id: json.id as string };
  },

  async addTracksToPlaylist({ accessToken, playlistId, trackUris }) {
    // Spotify caps this endpoint at 100 URIs per request.
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: batch }),
      });
      if (!res.ok) {
        throw new Error(
          `Spotify add tracks to playlist failed: ${res.status}${await readErrorBody(res)}`,
        );
      }
    }
  },

  async fetchImportedArtists(accessToken) {
    const results: SpotifyImportedArtist[] = [];
    // An artist who's followed is very often also in top artists (and
    // sometimes liked-song credits too) — dedupe across all three calls,
    // not just within the last one, keeping whichever category we saw
    // first: followed > top artist > saved music, the same priority order
    // DEFAULT_RELEVANCE_BY_SOURCE already uses for default relevance.
    const seen = new Set<string>();

    const following = await spotifyFetch(
      "/me/following?type=artist&limit=50",
      accessToken,
    );
    for (const artist of following?.artists?.items ?? []) {
      if (seen.has(artist.id)) continue;
      seen.add(artist.id);
      results.push(toImported(artist, "spotify_followed_artist"));
    }

    const top = await spotifyFetch(
      "/me/top/artists?limit=30&time_range=medium_term",
      accessToken,
    );
    for (const artist of top?.items ?? []) {
      if (seen.has(artist.id)) continue;
      seen.add(artist.id);
      results.push(toImported(artist, "spotify_top_artist"));
    }

    const saved = await spotifyFetch("/me/tracks?limit=50", accessToken);
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
