import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Lightweight, cookie-based dev session. There is no password: the cookie
// simply names which user record this browser belongs to. That's enough for
// an MVP where the interesting auth problem (Spotify OAuth) is solved
// properly, and account creation happens once, at the end of onboarding.
const SESSION_COOKIE = "mr_uid";
const DEMO_EMAIL = "demo@musicradar.app";

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionUserId(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSessionUserId() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Returns the signed-in user, falling back to the seeded demo account so
 * reviewers can browse /radar, /artists, /preferences straight after
 * `npm run seed` without completing onboarding first. Real visitors who
 * finish onboarding always get their own cookie-backed user.
 */
export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (id) {
    const user = await db.user.findUnique({ where: { id } });
    if (user) return user;
  }
  return db.user.findUnique({ where: { email: DEMO_EMAIL } });
}

export { DEMO_EMAIL };
