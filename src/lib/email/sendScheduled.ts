import "server-only";
import { db } from "@/lib/db";
import { generatePersonalizedRadar } from "@/lib/radar/generateRadar";
import type { RadarResult, RadarSections } from "@/lib/radar/types";
import { saveRadarEdition } from "@/lib/radar/editions";
import { NEWSLETTER_FREQUENCIES } from "@/lib/constants";
import { getAppOrigin } from "@/lib/appUrl";
import { renderNewsletterHtml } from "./render";
import { emailProvider } from "./provider";

// Which UTC weekdays (0=Sun..6=Sat) each frequency is due on. Deterministic
// and explicit, same spirit as the rest of the app's scoring rules — no
// per-user custom day, just a fixed, visible schedule matching the labels
// in constants.ts ("twice_weekly" = "Monday and Thursday").
const FREQUENCY_DAYS: Record<string, number[]> = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  weekly: [1], // Monday
  twice_weekly: [1, 4], // Monday, Thursday
};

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function isDueToday(frequency: string, lastSentAt: Date | null, now: Date): boolean {
  const days = FREQUENCY_DAYS[frequency] ?? FREQUENCY_DAYS.weekly;
  if (!days.includes(now.getUTCDay())) return false;
  if (lastSentAt && isSameUtcDay(lastSentAt, now)) return false;
  return true;
}

/** Drops anything already delivered in a previous scheduled send (see
 * SentDigestItem) from a radar's items/sections, keeping the two in sync —
 * a section that only contained already-seen items just goes empty rather
 * than getting reshuffled. */
function filterOutSentItems(radar: RadarResult, sentIds: Set<string>): RadarResult {
  if (sentIds.size === 0) return radar;

  const items = radar.items.filter((item) => !sentIds.has(item.id));
  const sectionKeys = Object.keys(radar.sections) as (keyof RadarSections)[];
  const sections = sectionKeys.reduce((acc, key) => {
    acc[key] = radar.sections[key].filter((item) => !sentIds.has(item.id));
    return acc;
  }, {} as RadarSections);

  return { ...radar, items, sections };
}

/** Builds the same subject/HTML the manual "Send test email" button uses —
 * shared so the scheduled sender and the manual test path can never drift
 * apart in what they actually send. Pass `radarOverride` to render a
 * pre-built radar (the scheduled sender's already-filtered one) instead of
 * generating a fresh, unfiltered one — the preview page and the manual
 * test-send button rely on the default (nothing filtered out), since
 * neither should be affected by, or count toward, a user's dedup history. */
export async function buildNewsletterEmail(
  userId: string,
  email: string,
  radarOverride?: RadarResult,
): Promise<{ subject: string; html: string }> {
  const [radar, preference, origin] = await Promise.all([
    radarOverride ?? generatePersonalizedRadar(userId),
    db.userPreference.findUnique({ where: { userId } }),
    getAppOrigin(),
  ]);

  const frequencyLabel =
    NEWSLETTER_FREQUENCIES.find((f) => f.id === preference?.newsletterFrequency)?.label ??
    "Weekly";

  const html = renderNewsletterHtml(radar, {
    email,
    frequencyLabel,
    cities: preference ? (JSON.parse(preference.cities) as string[]) : [],
    // Absolute, not relative — a relative href in an email has no page to
    // resolve against, so mail clients guess at a host instead of just
    // failing (see the /login link bug this fixed: a bare path turned
    // into a broken https://api/... URL).
    unsubscribeUrl: `${origin}/unsubscribe`,
    preferencesUrl: `${origin}/preferences`,
    privacyUrl: `${origin}/privacy`,
  });

  return { subject: "Your music radar", html };
}

export interface SendScheduledSummary {
  candidates: number;
  sent: number;
  skippedNotDue: number;
  skippedNoNewContent: number;
  errors: string[];
}

/**
 * Sends the digest to every active subscriber whose chosen frequency
 * (weekly/twice_weekly/daily) makes them due today, based on lastSentAt.
 * Meant to be called once a day (see /api/cron/send-newsletters) — calling
 * it more than once on the same day is still safe, it just does nothing
 * for anyone already sent to today.
 *
 * Each send excludes anything already delivered to that user in an earlier
 * digest (SentDigestItem) — otherwise an item stays in scoring range and
 * would just get resent every cycle until it aged out or got crowded out
 * by newer items. If that leaves nothing new, the send is skipped rather
 * than mailing an empty "nothing new" digest. A successful send also
 * freezes a RadarEdition snapshot of exactly what went out — /radar shows
 * the latest one instead of recomputing live, so the site never drifts
 * from what's actually in the inbox.
 */
export async function sendScheduledNewsletters(
  now: Date = new Date(),
): Promise<SendScheduledSummary> {
  const summary: SendScheduledSummary = {
    candidates: 0,
    sent: 0,
    skippedNotDue: 0,
    skippedNoNewContent: 0,
    errors: [],
  };

  const subscriptions = await db.newsletterSubscription.findMany({
    where: { status: "active" },
    include: { user: { include: { preference: true } } },
  });
  summary.candidates = subscriptions.length;

  for (const sub of subscriptions) {
    const frequency = sub.user.preference?.newsletterFrequency ?? "weekly";
    if (!isDueToday(frequency, sub.lastSentAt, now)) {
      summary.skippedNotDue++;
      continue;
    }

    try {
      const [radar, alreadySent] = await Promise.all([
        generatePersonalizedRadar(sub.userId),
        db.sentDigestItem.findMany({
          where: { userId: sub.userId },
          select: { musicEventId: true },
        }),
      ]);
      const filteredRadar = filterOutSentItems(
        radar,
        new Set(alreadySent.map((row) => row.musicEventId)),
      );

      if (filteredRadar.items.length === 0) {
        // Nothing new since last time — still mark today as handled so a
        // manual re-trigger later today doesn't redo this same check, but
        // don't spend an email on an empty "nothing new" digest.
        await db.newsletterSubscription.update({
          where: { id: sub.id },
          data: { lastSentAt: now },
        });
        summary.skippedNoNewContent++;
        continue;
      }

      const { subject, html } = await buildNewsletterEmail(sub.userId, sub.email, filteredRadar);
      await emailProvider.sendEmail({ to: sub.email, subject, html });
      await db.newsletterSubscription.update({
        where: { id: sub.id },
        data: { lastSentAt: now },
      });
      await db.sentDigestItem.createMany({
        data: filteredRadar.items.map((item) => ({
          userId: sub.userId,
          musicEventId: item.id,
        })),
        skipDuplicates: true,
      });
      await saveRadarEdition(sub.userId, filteredRadar);
      summary.sent++;
    } catch (err) {
      summary.errors.push(`${sub.email}: ${(err as Error).message}`);
    }
  }

  return summary;
}
