"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RadarSections } from "@/components/radar/RadarSections";
import { WizardState } from "@/lib/onboardingState";
import { RadarResult } from "@/lib/radar/types";

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
      <Eyebrow>Ready</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Your radar is ready.
      </h1>
      <p className="mt-3 text-ink-soft">
        This is exactly what your first digest would look like, built live
        from the rules you just set.
      </p>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-ink-soft">Scanning your sources…</p>
        ) : radar ? (
          <RadarSections radar={radar} />
        ) : (
          <p className="text-sm text-ink-soft">
            Couldn&rsquo;t build a preview right now — you can still subscribe
            and check /radar afterwards.
          </p>
        )}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        {submitError && (
          <p className="mb-4 border border-accent bg-accent/10 px-4 py-3 text-sm">
            {submitError}
          </p>
        )}
        <Button size="lg" onClick={onSubscribe} disabled={submitting}>
          {submitting ? "Subscribing…" : "Subscribe to my radar"}
        </Button>
        <p className="mt-3 text-xs text-ink-soft">
          You can pause or unsubscribe any time from Settings.
        </p>
      </div>
    </div>
  );
}
