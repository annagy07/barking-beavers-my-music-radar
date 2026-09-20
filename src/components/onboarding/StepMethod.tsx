"use client";

import { Eyebrow } from "@/components/ui/Container";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StepMethod({
  error,
  onChooseManual,
}: {
  error: boolean;
  onChooseManual: () => void;
}) {
  const { t } = useLocale();
  const s = t.onboarding.method;

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>
      <p className="mt-3 text-ink-soft">{s.body}</p>

      {error && (
        <p className="mt-6 border border-accent bg-accent/10 px-4 py-3 text-sm text-ink">
          {s.error}
        </p>
      )}

      <div className="mt-8 grid gap-4">
        <a
          href="/api/spotify/authorize"
          className="group border-2 border-ink bg-ink p-6 text-left text-paper transition-colors hover:bg-accent hover:text-accent-ink hover:border-accent"
        >
          <span className="font-mono text-xs uppercase tracking-wide opacity-70">
            {s.recommended}
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold">
            {s.spotifyTitle}
          </h2>
          <p className="mt-1 text-sm opacity-80">{s.spotifyBody}</p>
        </a>

        <button
          type="button"
          onClick={onChooseManual}
          className="border border-ink p-6 text-left transition-colors hover:border-accent hover:text-accent"
        >
          <h2 className="font-display text-xl font-semibold">
            {s.manualTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{s.manualBody}</p>
        </button>

        <a
          href="/api/spotify/authorize"
          className="block border border-line p-6 text-left transition-colors hover:border-accent hover:text-accent"
        >
          <h2 className="font-display text-xl font-semibold">
            {s.hybridTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{s.hybridBody}</p>
        </a>
      </div>

      <p className="mt-6 text-xs text-ink-soft">{s.mockNotice}</p>
    </div>
  );
}
