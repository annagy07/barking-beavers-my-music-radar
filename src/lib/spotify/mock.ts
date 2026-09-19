import "server-only";
import type { SpotifyAdapter, SpotifyImportedArtist } from "./types";

// Realistic stand-in for what a real Spotify account would return across
// follows / top artists / saved tracks. Used whenever SPOTIFY_CLIENT_ID or
// SPOTIFY_CLIENT_SECRET are missing so the full onboarding flow works
// without live credentials. Names intentionally overlap with prisma/seed.ts
// so the mock import lines up with real mock editorial content.
const MOCK_LIBRARY: SpotifyImportedArtist[] = [
  {
    spotifyId: "mock-fontaines-dc",
    name: "Fontaines D.C.",
    genres: ["post-punk", "indie rock"],
    source: "spotify_followed_artist",
  },
  {
    spotifyId: "mock-bon-iver",
    name: "Bon Iver",
    genres: ["indie folk", "alternative"],
    source: "spotify_followed_artist",
  },
  {
    spotifyId: "mock-idles",
    name: "IDLES",
    genres: ["post-punk", "punk"],
    source: "spotify_followed_artist",
  },
  {
    spotifyId: "mock-the-national",
    name: "The National",
    genres: ["indie rock", "alternative"],
    source: "spotify_followed_artist",
  },
  {
    spotifyId: "mock-jamie-xx",
    name: "Jamie xx",
    genres: ["electronic", "house"],
    source: "spotify_followed_artist",
  },
  {
    spotifyId: "mock-fred-again",
    name: "Fred again..",
    genres: ["electronic", "pop"],
    source: "spotify_top_artist",
  },
  {
    spotifyId: "mock-moderat",
    name: "Moderat",
    genres: ["electronic", "techno"],
    source: "spotify_top_artist",
  },
  {
    spotifyId: "mock-overmono",
    name: "Overmono",
    genres: ["electronic", "uk garage"],
    source: "spotify_top_artist",
  },
  {
    spotifyId: "mock-nilufer-yanya",
    name: "Nilüfer Yanya",
    genres: ["indie rock", "alternative"],
    source: "spotify_top_artist",
  },
  {
    spotifyId: "mock-yves-tumor",
    name: "Yves Tumor",
    genres: ["alternative", "electronic"],
    source: "spotify_saved_music",
  },
  {
    spotifyId: "mock-king-krule",
    name: "King Krule",
    genres: ["alternative", "jazz rap"],
    source: "spotify_saved_music",
  },
  {
    spotifyId: "mock-little-simz",
    name: "Little Simz",
    genres: ["hip-hop", "uk rap"],
    source: "spotify_saved_music",
  },
];

export const mockSpotifyAdapter: SpotifyAdapter = {
  isMock: true,

  buildAuthorizeUrl() {
    // Never actually navigated to — the mock authorize route short-circuits
    // straight to a simulated callback. Kept for interface parity.
    return "/api/spotify/authorize?mock=1";
  },

  async exchangeCode() {
    return {
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresIn: 3600,
      scope: "user-follow-read user-top-read user-library-read",
    };
  },

  async fetchImportedArtists() {
    return MOCK_LIBRARY;
  },
};
