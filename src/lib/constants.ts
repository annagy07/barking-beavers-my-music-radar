// Shared, client-safe constants. No server-only imports here.

export const CONTENT_CATEGORIES = [
  {
    id: "new_singles",
    label: "New singles",
    description: "Freshly released tracks from your artists.",
  },
  {
    id: "albums_eps",
    label: "Albums & EPs",
    description: "Full-length and EP releases.",
  },
  {
    id: "upcoming_releases",
    label: "Upcoming releases",
    description: "Announced records not out yet.",
  },
  {
    id: "concerts",
    label: "Concerts",
    description: "Shows near your chosen city.",
  },
  {
    id: "tour_announcements",
    label: "Tour announcements",
    description: "New tours as they're announced.",
  },
  {
    id: "presales",
    label: "Presales",
    description: "Early ticket windows before general sale.",
  },
  {
    id: "music_videos",
    label: "Music videos",
    description: "New official videos.",
  },
  {
    id: "interviews",
    label: "Interviews",
    description: "What your artists are saying, in their own words.",
  },
  {
    id: "collaborations",
    label: "Collaborations",
    description: "Features, remixes and joint projects.",
  },
  {
    id: "behind_the_scenes",
    label: "Behind-the-scenes stories",
    description: "Studio notes, process, the making-of.",
  },
  {
    id: "interesting_facts",
    label: "Interesting facts",
    description: "Small, credible, worth-knowing details, including coverage from music blogs and magazines.",
  },
  {
    id: "new_artists",
    label: "New artists",
    description: "Explainable discovery, never a black box.",
  },
] as const;

export type ContentCategoryId = (typeof CONTENT_CATEGORIES)[number]["id"];

export const DEFAULT_CONTENT_CATEGORIES: ContentCategoryId[] = [
  "new_singles",
  "albums_eps",
  "upcoming_releases",
  "concerts",
  "tour_announcements",
  "music_videos",
];

export const RELEVANCE_LEVELS = [
  { id: "essential", label: "Essential", description: "Never miss anything." },
  { id: "interested", label: "Interested", description: "Good to know about." },
  { id: "occasional", label: "Occasional", description: "Only the big stuff." },
] as const;

export type RelevanceId = (typeof RELEVANCE_LEVELS)[number]["id"];

// Deterministic base weight per import source. Fully user-overridable —
// these are starting points, not a hidden score.
export const SOURCE_BASE_WEIGHT: Record<string, number> = {
  manual: 50,
  spotify_followed_artist: 40,
  spotify_top_artist: 35,
  spotify_saved_music: 25,
};

export const RELEVANCE_WEIGHT: Record<RelevanceId, number> = {
  essential: 50,
  interested: 32,
  occasional: 18,
};

export const CONCERT_RADII = [25, 50, 100, 250] as const;
export const CONCERT_LOOKAHEAD_DAYS = [30, 90, 180] as const;

export const NEWSLETTER_FREQUENCIES = [
  { id: "weekly", label: "Weekly", description: "One digest, every week." },
  {
    id: "twice_weekly",
    label: "Twice a week",
    description: "Monday and Thursday.",
  },
  { id: "daily", label: "Daily", description: "For the completists." },
] as const;

export type NewsletterFrequencyId = (typeof NEWSLETTER_FREQUENCIES)[number]["id"];

export const DISCOVERY_LEVEL_LABELS: Record<number, string> = {
  1: "Only artists I already know",
  2: "Mostly familiar, a little new",
  3: "Balanced mix",
  4: "Lean toward new",
  5: "Surprise me",
};

export const CITIES = [
  "Berlin",
  "Hamburg",
  "Cologne",
  "Munich",
  "London",
  "Amsterdam",
] as const;

export const SOURCE_TYPE_CREDIBILITY: Record<string, number> = {
  official_artist_site: 100,
  official_label: 95,
  official_youtube: 90,
  spotify: 90,
  venue: 90,
  music_publication: 75,
  unverified_social: 30,
};

export const CREDIBILITY_THRESHOLD = 60;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  release: "New release",
  upcoming_release: "Upcoming release",
  concert: "Concert",
  tour: "Tour announcement",
  presale: "Presale",
  video: "Music video",
  interview: "Interview",
  collaboration: "Collaboration",
  fact: "Interesting fact",
  discovery: "Discovery",
};

// Maps a content category the user opted into to the underlying MusicEvent
// type(s) + optional subtype it unlocks. Kept explicit (no clever inference)
// so the filter logic stays auditable.
export const CATEGORY_TO_EVENT: Record<
  ContentCategoryId,
  { type: string; subtypes?: string[] }
> = {
  new_singles: { type: "release", subtypes: ["single"] },
  albums_eps: { type: "release", subtypes: ["ep", "album"] },
  upcoming_releases: { type: "upcoming_release" },
  concerts: { type: "concert" },
  tour_announcements: { type: "tour" },
  presales: { type: "presale" },
  music_videos: { type: "video" },
  interviews: { type: "interview" },
  collaborations: { type: "collaboration" },
  behind_the_scenes: { type: "fact", subtypes: ["behind_the_scenes"] },
  interesting_facts: { type: "fact", subtypes: ["interesting_fact"] },
  new_artists: { type: "discovery" },
};

export const GENRES = [
  "indie",
  "pop",
  "electronic",
  "hip-hop",
  "alternative",
  "rock",
] as const;
