import "server-only";
import { cookies } from "next/headers";

export type Locale = "en" | "de";

// Not httpOnly: the toggle only ever needs to be read back by our own
// server components, but keeping it readable means a future client-side
// tweak (e.g. an instant, no-refresh switch) doesn't need a new cookie.
export const LOCALE_COOKIE = "bb_locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "de" ? "de" : "en";
}
