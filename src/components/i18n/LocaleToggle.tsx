"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/locale";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-wide">
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
        // Tailwind's reset sets buttons to cursor:default (unlike links),
        // which hid the usual hover affordance here — cursor-pointer
        // restores it for the state that's actually clickable.
        className={clsx(
          locale === "en"
            ? "cursor-default text-accent"
            : "cursor-pointer text-ink-soft hover:text-ink",
        )}
      >
        EN
      </button>
      <span className="text-ink-soft">/</span>
      <button
        type="button"
        onClick={() => switchTo("de")}
        aria-pressed={locale === "de"}
        className={clsx(
          locale === "de"
            ? "cursor-default text-accent"
            : "cursor-pointer text-ink-soft hover:text-ink",
        )}
      >
        DE
      </button>
    </div>
  );
}
