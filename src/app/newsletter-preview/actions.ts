"use server";

import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { generatePersonalizedRadar } from "@/lib/radar/generateRadar";
import { renderNewsletterHtml } from "@/lib/email/render";
import { emailProvider } from "@/lib/email/provider";
import { NEWSLETTER_FREQUENCIES } from "@/lib/constants";

export async function sendTestNewsletter(): Promise<{ ok: boolean; provider: string }> {
  const user = await getCurrentUser();
  if (!user || !user.email) throw new Error("Not signed in");

  const [radar, preference] = await Promise.all([
    generatePersonalizedRadar(user.id),
    db.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

  const frequencyLabel =
    NEWSLETTER_FREQUENCIES.find((f) => f.id === preference?.newsletterFrequency)
      ?.label ?? "Weekly";

  const html = renderNewsletterHtml(radar, {
    email: user.email,
    frequencyLabel,
    city: preference?.city ?? null,
    unsubscribeUrl: "/unsubscribe",
    preferencesUrl: "/preferences",
  });

  await emailProvider.sendNewsletter({
    to: user.email,
    subject: "Your music radar",
    html,
  });

  return { ok: true, provider: emailProvider.name };
}
