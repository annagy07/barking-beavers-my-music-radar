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

/**
 * Isolated boundary between the product and Spotify. We only ever read
 * follows / top artists / saved-track artists — never listening history,
 * never recommendations, never email. Swappable for a realistic mock when
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
}
