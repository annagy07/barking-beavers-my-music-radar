"use client";

import { Eyebrow } from "@/components/ui/Container";
import {
  CONTENT_CATEGORIES,
  NEWSLETTER_FREQUENCIES,
} from "@/lib/constants";
import { StepId, WizardState } from "@/lib/onboardingState";

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {label}
        </p>
        <div className="mt-1 text-sm">{value}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 font-mono text-xs uppercase tracking-wide text-ink-soft underline hover:text-accent"
      >
        Edit
      </button>
    </div>
  );
}

export function StepConfirm({
  state,
  onJump,
}: {
  state: WizardState;
  onJump: (step: StepId) => void;
}) {
  const activeArtists = state.artists.filter((a) => !a.blocked);
  const categoryLabels = state.contentCategories
    .map((id) => CONTENT_CATEGORIES.find((c) => c.id === id)?.label ?? id)
    .join(", ");
  const frequencyLabel =
    NEWSLETTER_FREQUENCIES.find((f) => f.id === state.newsletterFrequency)
      ?.label ?? state.newsletterFrequency;

  return (
    <div>
      <Eyebrow>Step 8</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Confirm your preferences
      </h1>
      <p className="mt-3 text-ink-soft">
        Everything below is yours to change, today or any day after.
      </p>

      <div className="mt-6">
        <Row
          label="Artists"
          value={`${activeArtists.length} tracked${
            state.artists.length > activeArtists.length
              ? ` · ${state.artists.length - activeArtists.length} hidden`
              : ""
          }`}
          onEdit={() => onJump("review")}
        />
        <Row
          label="Watching"
          value={categoryLabels || "Nothing selected"}
          onEdit={() => onJump("preferences")}
        />
        <Row
          label="Discovery"
          value={`${state.discoveryLevel}/5`}
          onEdit={() => onJump("preferences")}
        />
        <Row
          label="Concerts"
          value={
            state.city
              ? `Within ${state.concertRadiusKm} km of ${state.city}, looking ${state.concertLookaheadDays} days ahead`
              : "No city set"
          }
          onEdit={() => onJump("concerts")}
        />
        <Row
          label="Delivery"
          value={`${frequencyLabel}${
            state.instantPresaleAlerts ? " + instant presale alerts" : ""
          }`}
          onEdit={() => onJump("frequency")}
        />
        <Row
          label="Email"
          value={state.email || "Not set"}
          onEdit={() => onJump("email")}
        />
      </div>
    </div>
  );
}
