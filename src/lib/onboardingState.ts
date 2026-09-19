import {
  CONCERT_LOOKAHEAD_DAYS,
  CONCERT_RADII,
  ContentCategoryId,
  DEFAULT_CONTENT_CATEGORIES,
  NewsletterFrequencyId,
  RelevanceId,
} from "@/lib/constants";

export type ArtistSource =
  | "manual"
  | "spotify_followed_artist"
  | "spotify_top_artist"
  | "spotify_saved_music";

export interface WizardArtist {
  artistId: string;
  name: string;
  genres: string[];
  source: ArtistSource;
  relevance: RelevanceId;
  blocked: boolean;
}

export interface WizardState {
  method: "spotify" | "manual" | null;
  spotifyConnected: boolean;
  artists: WizardArtist[];
  contentCategories: ContentCategoryId[];
  discoveryLevel: number;
  city: string;
  concertRadiusKm: (typeof CONCERT_RADII)[number];
  concertLookaheadDays: (typeof CONCERT_LOOKAHEAD_DAYS)[number];
  newsletterFrequency: NewsletterFrequencyId;
  instantPresaleAlerts: boolean;
  email: string;
  consent: boolean;
}

export const STEPS = [
  "method",
  "artists",
  "review",
  "preferences",
  "concerts",
  "frequency",
  "email",
  "confirm",
  "preview",
] as const;

export type StepId = (typeof STEPS)[number];

export const initialWizardState: WizardState = {
  method: null,
  spotifyConnected: false,
  artists: [],
  contentCategories: [...DEFAULT_CONTENT_CATEGORIES],
  discoveryLevel: 3,
  city: "",
  concertRadiusKm: 50,
  concertLookaheadDays: 90,
  newsletterFrequency: "weekly",
  instantPresaleAlerts: false,
  email: "",
  consent: false,
};

export const STORAGE_KEY = "mr_onboarding_draft_v1";

export const RELEVANCE_TIER_LABEL: Record<RelevanceId, string> = {
  essential: "Very relevant",
  interested: "Relevant",
  occasional: "Occasional",
};

export const SOURCE_LABEL: Record<ArtistSource, string> = {
  manual: "Added manually",
  spotify_followed_artist: "You follow on Spotify",
  spotify_top_artist: "One of your Spotify top artists",
  spotify_saved_music: "From your saved music on Spotify",
};
