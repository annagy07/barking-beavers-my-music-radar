"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, clearSessionUserId } from "@/lib/session";
import { withdrawConsent, grantConsent } from "@/lib/consent";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

/** Stops the connection but keeps already-imported artist preferences —
 * those are now just regular artists the user can keep, edit or remove. */
export async function disconnectSpotify() {
  const user = await requireUser();
  await db.connectedAccount.updateMany({
    where: { userId: user.id, provider: "spotify", disconnectedAt: null },
    data: { disconnectedAt: new Date(), accessToken: null, refreshToken: null },
  });
  revalidatePath("/settings");
}

/** Deletes the derived taste data imported from Spotify — separate from
 * disconnecting the account, per the "delete imported Spotify taste data"
 * privacy control. */
export async function deleteSpotifyTasteData() {
  const user = await requireUser();
  await db.userArtistPreference.deleteMany({
    where: {
      userId: user.id,
      source: { in: ["spotify_followed_artist", "spotify_top_artist", "spotify_saved_music"] },
    },
  });
  revalidatePath("/settings");
  revalidatePath("/artists");
  revalidatePath("/radar");
}

export async function pauseNewsletter() {
  const user = await requireUser();
  await db.newsletterSubscription.update({
    where: { userId: user.id },
    data: { status: "paused" },
  });
  revalidatePath("/settings");
}

export async function resumeNewsletter() {
  const user = await requireUser();
  await db.newsletterSubscription.update({
    where: { userId: user.id },
    data: { status: "active" },
  });
  revalidatePath("/settings");
}

export async function unsubscribeNewsletter() {
  const user = await requireUser();
  await db.newsletterSubscription.update({
    where: { userId: user.id },
    data: { status: "unsubscribed" },
  });
  await withdrawConsent(user.id, "email");
  revalidatePath("/settings");
}

export async function resubscribeNewsletter() {
  const user = await requireUser();
  await db.newsletterSubscription.update({
    where: { userId: user.id },
    data: { status: "active" },
  });
  await grantConsent(user.id, "email");
  revalidatePath("/settings");
}

export async function deleteAccount() {
  const user = await requireUser();
  await db.user.delete({ where: { id: user.id } });
  await clearSessionUserId();
  redirect("/");
}
