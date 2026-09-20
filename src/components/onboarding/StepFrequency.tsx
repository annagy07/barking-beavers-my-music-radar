"use client";

import { Eyebrow } from "@/components/ui/Container";
import { NEWSLETTER_FREQUENCIES, NewsletterFrequencyId } from "@/lib/constants";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StepFrequency({
  newsletterFrequency,
  instantPresaleAlerts,
  onFrequency,
  onPresaleAlerts,
}: {
  newsletterFrequency: NewsletterFrequencyId;
  instantPresaleAlerts: boolean;
  onFrequency: (f: NewsletterFrequencyId) => void;
  onPresaleAlerts: (v: boolean) => void;
}) {
  const { t } = useLocale();
  const s = t.onboarding.frequency;

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>

      <div className="mt-8 grid gap-3">
        {NEWSLETTER_FREQUENCIES.map((f) => {
          const label = t.frequency[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onFrequency(f.id)}
              className={
                "border p-5 text-left transition-colors " +
                (newsletterFrequency === f.id
                  ? "border-ink bg-ink text-paper"
                  : "border-line hover:border-ink")
              }
            >
              <p className="font-display text-lg font-semibold">{label.label}</p>
              <p
                className={
                  "mt-1 text-sm " +
                  (newsletterFrequency === f.id ? "text-paper/70" : "text-ink-soft")
                }
              >
                {label.description}
              </p>
            </button>
          );
        })}
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 border border-line p-5">
        <input
          type="checkbox"
          checked={instantPresaleAlerts}
          onChange={(e) => onPresaleAlerts(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="text-sm">
          <span className="font-medium">{s.presaleLabel}</span>
          <br />
          <span className="text-ink-soft">{s.presaleBody}</span>
        </span>
      </label>
    </div>
  );
}
