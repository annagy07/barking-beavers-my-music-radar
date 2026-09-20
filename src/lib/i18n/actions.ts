"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./locale";

export async function setLocale(locale: Locale) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
