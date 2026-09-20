"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RadarSections } from "@/components/radar/RadarSections";
import { WizardState } from "@/lib/onboardingState";
import { RadarResult } from "@/lib/radar/types";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StepPreview({
  state,
  submitting,
  submitError,
  onSubscribe,
}: {
  state: WizardState;
  submitting: boolean;
  submitError: string | null;
  onSubscribe: () => void;
}) {
  const { t } = useLocale();
  const s = t.onboarding.preview;
  const [radar, setRadar] = useState<RadarResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/radar/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artists: state.artists
          .filter((a) => !a.blocked)
          .map((a) => ({ artistId: a.artistId, relevance: a.relevance })),
        contentCategories: state.contentCategories,
        discoveryLevel: state.discoveryLevel,
        city: state.city,
        concertRadiusKm: state.concertRadiusKm,
        concertLookaheadDays: state.concertLookaheadDays,
        instantPresaleAlerts: state.instantPresaleAlerts,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRadar(data.radar ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>
      <p className="mt-3 text-ink-soft">{s.body}</p>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-ink-soft">{s.scanning}</p>
        ) : radar ? (
          <RadarSections radar={radar} t={t} />
        ) : (
          <p className="text-sm text-ink-soft">{s.failed}</p>
        )}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        {submitError && (
          <p className="mb-4 border border-accent bg-accent/10 px-4 py-3 text-sm">
            {submitError}
          </p>
        )}
        <Button size="lg" onClick={onSubscribe} disabled={submitting}>
          {submitting ? s.subscribing : s.subscribe}
        </Button>
        <p className="mt-3 text-xs text-ink-soft">{s.note}</p>
      </div>
    </div>
  );
}
