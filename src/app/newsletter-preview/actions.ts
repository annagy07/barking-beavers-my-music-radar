"use server";

import { getCurrentUser } from "@/lib/session";
import { buildNewsletterEmail } from "@/lib/email/sendScheduled";
import { emailProvider } from "@/lib/email/provider";

export async function sendTestNewsletter(): Promise<{ ok: boolean; provider: string }> {
  const user = await getCurrentUser();
  if (!user || !user.email) throw new Error("Not signed in");

  const { subject, html } = await buildNewsletterEmail(user.id, user.email);
  await emailProvider.sendEmail({ to: user.email, subject, html });

  return { ok: true, provider: emailProvider.name };
}
