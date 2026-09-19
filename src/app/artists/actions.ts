"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { RelevanceId, SOURCE_BASE_WEIGHT } from "@/lib/constants";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

export async function setArtistRelevance(artistId: string, relevance: RelevanceId) {
  const user = await requireUser();
  await db.userArtistPreference.update({
    where: { userId_artistId: { userId: user.id, artistId } },
    data: { relevance },
  });
  revalidatePath("/artists");
  revalidatePath("/radar");
}

export async function setArtistBlocked(artistId: string, blocked: boolean) {
  const user = await requireUser();
  await db.userArtistPreference.update({
    where: { userId_artistId: { userId: user.id, artistId } },
    data: { blocked },
  });
  revalidatePath("/artists");
  revalidatePath("/radar");
}

export async function removeArtistPreference(artistId: string) {
  const user = await requireUser();
  await db.userArtistPreference.delete({
    where: { userId_artistId: { userId: user.id, artistId } },
  });
  revalidatePath("/artists");
  revalidatePath("/radar");
}

export async function addArtistPreference(artistId: string) {
  const user = await requireUser();
  await db.userArtistPreference.upsert({
    where: { userId_artistId: { userId: user.id, artistId } },
    create: {
      userId: user.id,
      artistId,
      source: "manual",
      relevance: "interested",
      baseWeight: SOURCE_BASE_WEIGHT.manual,
    },
    update: { blocked: false },
  });
  revalidatePath("/artists");
  revalidatePath("/radar");
}
