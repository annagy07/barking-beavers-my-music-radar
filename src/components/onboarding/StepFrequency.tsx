"use client";

import { Eyebrow } from "@/components/ui/Container";
import { NEWSLETTER_FREQUENCIES, NewsletterFrequencyId } from "@/lib/constants";

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
  return (
    <div>
      <Eyebrow>Step 6</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        How often should we reach out?
      </h1>

      <div className="mt-8 grid gap-3">
        {NEWSLETTER_FREQUENCIES.map((f) => (
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
            <p className="font-display text-lg font-semibold">{f.label}</p>
            <p
              className={
                "mt-1 text-sm " +
                (newsletterFrequency === f.id ? "text-paper/70" : "text-ink-soft")
              }
            >
              {f.description}
            </p>
          </button>
        ))}
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 border border-line p-5">
        <input
          type="checkbox"
          checked={instantPresaleAlerts}
          onChange={(e) => onPresaleAlerts(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="text-sm">
          <span className="font-medium">
            Always alert me about presales for essential artists.
          </span>
          <br />
          <span className="text-ink-soft">
            Sent outside your regular schedule so you never miss a window.
          </span>
        </span>
      </label>
    </div>
  );
}
