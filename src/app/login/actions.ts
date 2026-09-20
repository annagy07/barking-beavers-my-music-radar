"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email/provider";
import { renderLoginEmailHtml } from "@/lib/email/render";
import { createLoginToken } from "@/lib/auth/loginToken";
import { clearSessionUserId } from "@/lib/session";

/** Always returns the same shape regardless of whether an account exists
 * for that email — otherwise the response itself would leak which emails
 * are registered. */
export async function requestLoginLink(email: string): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  const user = normalized ? await db.user.findUnique({ where: { email: normalized } }) : null;

  if (user) {
    const token = await createLoginToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = `${appUrl}/api/auth/verify?token=${token}`;
    await emailProvider.sendEmail({
      to: normalized,
      subject: "Sign in to Barking Beaver",
      html: renderLoginEmailHtml(link),
    });
  }

  return { ok: true };
}

export async function logOut() {
  await clearSessionUserId();
  redirect("/");
}
