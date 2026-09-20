import "server-only";
import { headers } from "next/headers";

/** The site's actual origin (scheme + host), for building absolute links
 * inside emails — a login link or unsubscribe link is useless without one.
 * Derives it from the incoming request's own headers (what Vercel actually
 * routed this request through) rather than trusting NEXT_PUBLIC_APP_URL,
 * which nothing else in the app reads and which silently produces a
 * broken link (no host at all) if it's ever unset or misconfigured. */
export async function getAppOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
