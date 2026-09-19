import "server-only";
import { realSpotifyAdapter } from "./real";
import { mockSpotifyAdapter } from "./mock";
import type { SpotifyAdapter } from "./types";

export const isSpotifyConfigured = Boolean(
  process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
);

export const spotifyAdapter: SpotifyAdapter = isSpotifyConfigured
  ? realSpotifyAdapter
  : mockSpotifyAdapter;

export type { SpotifyImportedArtist, SpotifyArtistSource } from "./types";
