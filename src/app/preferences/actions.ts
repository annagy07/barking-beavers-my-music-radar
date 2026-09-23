"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  CONCERT_LOOKAHEAD_DAYS,
  CONCERT_RADII,
  ContentCategoryId,
} from "@/lib/constants";

const patchSchema = z.object({
  contentCategories: z.array(z.string()).optional(),
  discoveryLevel: z.number().int().min(1).max(5).optional(),
  cities: z.array(z.string().trim()).optional(),
  concertRadiusKm: z
    .number()
    .refine((v) => (CONCERT_RADII as readonly number[]).includes(v))
    .optional(),
  concertLookaheadDays: z
    .number()
    .refine((v) => (CONCERT_LOOKAHEAD_DAYS as readonly number[]).includes(v))
    .optional(),
  newsletterFrequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  instantPresaleAlerts: z.boolean().optional(),
});

export type PreferencePatch = {
  contentCategories?: ContentCategoryId[];
  discoveryLevel?: number;
  cities?: string[];
  concertRadiusKm?: number;
  concertLookaheadDays?: number;
  newsletterFrequency?: "weekly" | "biweekly" | "monthly";
  instantPresaleAlerts?: boolean;
};

export async function updatePreferences(patch: PreferencePatch) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const data = patchSchema.parse(patch);

  await db.userPreference.update({
    where: { userId: user.id },
    data: {
      ...data,
      contentCategories: data.contentCategories
        ? JSON.stringify(data.contentCategories)
        : undefined,
      cities: data.cities ? JSON.stringify(data.cities) : undefined,
    },
  });

  revalidatePath("/preferences");
  revalidatePath("/radar");
  revalidatePath("/settings");
}
