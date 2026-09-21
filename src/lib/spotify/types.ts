export type SpotifyArtistSource =
  | "spotify_followed_artist"
  | "spotify_top_artist"
  | "spotify_saved_music";

export interface SpotifyImportedArtist {
  spotifyId: string;
  name: string;
  genres: string[];
  imageUrl?: string;
  source: SpotifyArtistSource;
}

export interface SpotifyTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
}

export interface SpotifyPlaylist {
  id: string;
}

/**
 * Isolated boundary between the product and Spotify. The base flow
 * (buildAuthorizeUrl/exchangeCode/fetchImportedArtists) only ever reads
 * follows / top artists / saved-track artists — never listening history,
 * never recommendations, never email. The playlist flow
 * (buildPlaylistAuthorizeUrl and the methods below it) is a separate,
 * explicit opt-in that additionally writes a single private playlist — see
 * src/lib/sources/playlistSync.ts. Swappable for a realistic mock when
 * SPOTIFY_CLIENT_ID/SECRET aren't configured, so onboarding stays testable
 * without live credentials.
 */
export interface SpotifyAdapter {
  readonly isMock: boolean;
  buildAuthorizeUrl(params: { state: string; codeChallenge: string }): string;
  exchangeCode(params: {
    code: string;
    codeVerifier: string;
  }): Promise<SpotifyTokenSet>;
  fetchImportedArtists(accessToken: string): Promise<SpotifyImportedArtist[]>;

  buildPlaylistAuthorizeUrl(params: { state: string; codeChallenge: string }): string;
  /** Same exchange as exchangeCode, but against the playlist flow's own
   * registered redirect URI (buildPlaylistAuthorizeUrl's callback route,
   * not the base flow's) — Spotify requires the two to match exactly. */
  exchangePlaylistCode(params: {
    code: string;
    codeVerifier: string;
  }): Promise<SpotifyTokenSet>;
  refreshAccessToken(refreshToken: string): Promise<SpotifyTokenSet>;
  /** POST /me/playlists — not /users/{id}/playlists, which Spotify's
   * February 2026 Web API migration removed for Development Mode apps
   * (it now 403s for every caller). /me/playlists needs no separate user
   * id lookup. */
  createPlaylist(params: {
    accessToken: string;
    name: string;
    description: string;
  }): Promise<SpotifyPlaylist>;
  addTracksToPlaylist(params: {
    accessToken: string;
    playlistId: string;
    trackUris: string[];
  }): Promise<void>;
}
