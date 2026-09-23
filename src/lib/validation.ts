import { z } from "zod";
import {
  CONCERT_LOOKAHEAD_DAYS,
  CONCERT_RADII,
  CONTENT_CATEGORIES,
  ContentCategoryId,
} from "@/lib/constants";

const contentCategoryIds = CONTENT_CATEGORIES.map((c) => c.id) as [
  ContentCategoryId,
  ...ContentCategoryId[],
];

export const draftArtistSchema = z.object({
  artistId: z.string().min(1),
  name: z.string().min(1),
  source: z.enum([
    "manual",
    "spotify_followed_artist",
    "spotify_top_artist",
    "spotify_saved_music",
  ]),
  relevance: z.enum(["essential", "interested", "occasional"]),
});

export const onboardingSubmitSchema = z.object({
  artists: z.array(draftArtistSchema).min(3, "Choose at least 3 artists"),
  contentCategories: z
    .array(z.enum(contentCategoryIds))
    .min(1, "Choose at least one category"),
  discoveryLevel: z.number().int().min(1).max(5),
  cities: z.array(z.string().trim().min(1)).min(1, "Choose at least one city"),
  concertRadiusKm: z.number().refine((v) => (CONCERT_RADII as readonly number[]).includes(v)),
  concertLookaheadDays: z
    .number()
    .refine((v) => (CONCERT_LOOKAHEAD_DAYS as readonly number[]).includes(v)),
  newsletterFrequency: z.enum(["weekly", "biweekly", "monthly"]),
  instantPresaleAlerts: z.boolean(),
  email: z.string().trim().email("Enter a valid email"),
  consent: z.literal(true, {
    message: "You must opt in to receive the newsletter",
  }),
});

export type OnboardingSubmitPayload = z.infer<typeof onboardingSubmitSchema>;

export const draftRadarSchema = z.object({
  artists: z
    .array(z.object({ artistId: z.string().min(1), relevance: z.enum(["essential", "interested", "occasional"]) }))
    .min(1),
  contentCategories: z.array(z.enum(contentCategoryIds)),
  discoveryLevel: z.number().int().min(1).max(5),
  cities: z.array(z.string().trim()),
  concertRadiusKm: z.number(),
  concertLookaheadDays: z.number(),
  instantPresaleAlerts: z.boolean(),
});

export type DraftRadarPayload = z.infer<typeof draftRadarSchema>;
