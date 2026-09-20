"use client";

import { createContext, useContext } from "react";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

// Dictionaries contain functions (e.g. t.artists.removeLabel), which can't
// cross the Server -> Client Component prop boundary (React can only
// serialize plain data there). So this only takes the plain `locale`
// string as a prop and resolves the dictionary itself, client side, from
// the same client-safe dictionaries module the server pages use.
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  return (
    <LocaleContext.Provider value={{ locale, t: dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** For client components nested arbitrarily deep under a page that already
 * resolved the locale server-side (see LocaleProvider in layout.tsx) — reads
 * it from context instead of needing it prop-drilled through every level. */
export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale() must be used within a LocaleProvider");
  return ctx;
}
