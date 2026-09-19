"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { setSessionUserId } from "@/lib/session";
import { grantConsent } from "@/lib/consent";
import { SOURCE_BASE_WEIGHT } from "@/lib/constants";
import { onboardingSubmitSchema, type OnboardingSubmitPayload } from "@/lib/validation";
import { DRAFT_ID_COOKIE, deleteSpotifyDraft, loadSpotifyDraft } from "@/lib/spotify/draftStore";

export interface OnboardingSubmitResult {
  ok: boolean;
  userId?: string;
  error?: string;
}

export async function submitOnboarding(
  payload: OnboardingSubmitPayload,
): Promise<OnboardingSubmitResult> {
  const parsed = onboardingSubmitSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const data = parsed.data;

  const cookieStore = await cookies();
  const draftId = cookieStore.get(DRAFT_ID_COOKIE)?.value;
  const spotifyDraft = draftId ? await loadSpotifyDraft(draftId) : null;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  const user = existing
    ? existing
    : await db.user.create({ data: { email: data.email } });

  // Dedupe by artistId in case the client sent the same artist twice.
  const seen = new Set<string>();
  for (const artist of data.artists) {
    if (seen.has(artist.artistId)) continue;
    seen.add(artist.artistId);

    await db.userArtistPreference.upsert({
      where: { userId_artistId: { userId: user.id, artistId: artist.artistId } },
      create: {
        userId: user.id,
        artistId: artist.artistId,
        source: artist.source,
        relevance: artist.relevance,
        baseWeight: SOURCE_BASE_WEIGHT[artist.source] ?? 30,
        blocked: false,
        confirmedByUser: true,
      },
      update: {
        source: artist.source,
        relevance: artist.relevance,
        blocked: false,
        confirmedByUser: true,
      },
    });
  }

  await db.userPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      contentCategories: JSON.stringify(data.contentCategories),
      discoveryLevel: data.discoveryLevel,
      city: data.city,
      concertRadiusKm: data.concertRadiusKm,
      concertLookaheadDays: data.concertLookaheadDays,
      newsletterFrequency: data.newsletterFrequency,
      instantPresaleAlerts: data.instantPresaleAlerts,
    },
    update: {
      contentCategories: JSON.stringify(data.contentCategories),
      discoveryLevel: data.discoveryLevel,
      city: data.city,
      concertRadiusKm: data.concertRadiusKm,
      concertLookaheadDays: data.concertLookaheadDays,
      newsletterFrequency: data.newsletterFrequency,
      instantPresaleAlerts: data.instantPresaleAlerts,
    },
  });

  if (spotifyDraft) {
    await db.connectedAccount.upsert({
      where: { userId_provider: { userId: user.id, provider: "spotify" } },
      create: {
        userId: user.id,
        provider: "spotify",
        accessToken: spotifyDraft.accessToken,
        refreshToken: spotifyDraft.refreshToken,
        scope: spotifyDraft.scope,
        connectedAt: spotifyDraft.connectedAt,
      },
      update: {
        accessToken: spotifyDraft.accessToken,
        refreshToken: spotifyDraft.refreshToken,
        scope: spotifyDraft.scope,
        connectedAt: spotifyDraft.connectedAt,
        disconnectedAt: null,
      },
    });
    if (draftId) await deleteSpotifyDraft(draftId);
    cookieStore.delete(DRAFT_ID_COOKIE);
  }

  await grantConsent(user.id, "email");

  await db.newsletterSubscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, email: data.email, status: "active" },
    update: { email: data.email, status: "active" },
  });

  await setSessionUserId(user.id);

  return { ok: true, userId: user.id };
}
