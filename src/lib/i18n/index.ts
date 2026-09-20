// Client-safe: no "server-only" import here (unlike locale.ts), so both
// server pages and client components (via LocaleProvider) can read
// dictionaries. Server pages get the active Locale from getLocale()
// (src/lib/i18n/locale.ts) instead.
import { en } from "./dictionaries/en";
import { de } from "./dictionaries/de";
import type { Locale } from "./locale";
import type { Dictionary } from "./types";

export type { Locale } from "./locale";
export type { Dictionary } from "./types";

const DICTIONARIES: Record<Locale, Dictionary> = { en, de };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
