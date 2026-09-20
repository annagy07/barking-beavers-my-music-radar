import "server-only";
import { db } from "@/lib/db";
import { generatePersonalizedRadar } from "@/lib/radar/generateRadar";
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

/** Builds the same subject/HTML the manual "Send test email" button uses —
 * shared so the scheduled sender and the manual test path can never drift
 * apart in what they actually send. */
export async function buildNewsletterEmail(
  userId: string,
  email: string,
): Promise<{ subject: string; html: string }> {
  const [radar, preference, origin] = await Promise.all([
    generatePersonalizedRadar(userId),
    db.userPreference.findUnique({ where: { userId } }),
    getAppOrigin(),
  ]);

  const frequencyLabel =
    NEWSLETTER_FREQUENCIES.find((f) => f.id === preference?.newsletterFrequency)?.label ??
    "Weekly";

  const html = renderNewsletterHtml(radar, {
    email,
    frequencyLabel,
    city: preference?.city ?? null,
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
  errors: string[];
}

/**
 * Sends the digest to every active subscriber whose chosen frequency
 * (weekly/twice_weekly/daily) makes them due today, based on lastSentAt.
 * Meant to be called once a day (see /api/cron/send-newsletters) — calling
 * it more than once on the same day is still safe, it just does nothing
 * for anyone already sent to today.
 */
export async function sendScheduledNewsletters(
  now: Date = new Date(),
): Promise<SendScheduledSummary> {
  const summary: SendScheduledSummary = { candidates: 0, sent: 0, skippedNotDue: 0, errors: [] };

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
      const { subject, html } = await buildNewsletterEmail(sub.userId, sub.email);
      await emailProvider.sendEmail({ to: sub.email, subject, html });
      await db.newsletterSubscription.update({
        where: { id: sub.id },
        data: { lastSentAt: now },
      });
      summary.sent++;
    } catch (err) {
      summary.errors.push(`${sub.email}: ${(err as Error).message}`);
    }
  }

  return summary;
}
