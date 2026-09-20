"use client";

import Link from "next/link";
import { Eyebrow } from "@/components/ui/Container";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StepEmail({
  email,
  consent,
  onEmail,
  onConsent,
}: {
  email: string;
  consent: boolean;
  onEmail: (v: string) => void;
  onConsent: (v: boolean) => void;
}) {
  const { t } = useLocale();
  const s = t.onboarding.email;

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>
      <p className="mt-3 text-ink-soft">{s.body}</p>

      <div className="mt-8">
        <label className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {s.emailLabel}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          placeholder={s.emailPlaceholder}
          className="mt-2 w-full border border-ink bg-paper px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 border border-line p-5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => onConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="text-sm">{t.consentCopy}</span>
      </label>

      <p className="mt-4 text-xs text-ink-soft">
        {s.agreeBefore}
        <Link href="/privacy" className="underline hover:text-accent">
          {s.privacyPolicy}
        </Link>
        {s.agreeMiddle}
        <Link href="/unsubscribe" className="underline hover:text-accent">
          {s.unsubscribe}
        </Link>
        {s.agreeAfter}
      </p>
    </div>
  );
}
