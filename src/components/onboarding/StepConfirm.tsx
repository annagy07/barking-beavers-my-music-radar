"use client";

import { Eyebrow } from "@/components/ui/Container";
import { StepId, WizardState } from "@/lib/onboardingState";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n";

function Row({
  label,
  value,
  editLabel,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  editLabel: string;
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
        {editLabel}
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
  const { t } = useLocale();
  const s = t.onboarding.confirm;
  const activeArtists = state.artists.filter((a) => !a.blocked);
  const categoryLabels = state.contentCategories
    .map((id: keyof Dictionary["categories"]) => t.categories[id]?.label ?? id)
    .join(", ");
  const frequencyLabel = t.frequency[state.newsletterFrequency]?.label ?? state.newsletterFrequency;

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>
      <p className="mt-3 text-ink-soft">{s.body}</p>

      <div className="mt-6">
        <Row
          label={s.artists}
          value={s.artistsValue(activeArtists.length, state.artists.length - activeArtists.length)}
          editLabel={s.edit}
          onEdit={() => onJump("review")}
        />
        <Row
          label={s.watching}
          value={categoryLabels || s.nothingSelected}
          editLabel={s.edit}
          onEdit={() => onJump("preferences")}
        />
        <Row
          label={s.discovery}
          value={`${state.discoveryLevel}/5`}
          editLabel={s.edit}
          onEdit={() => onJump("preferences")}
        />
        <Row
          label={s.concerts}
          value={
            state.cities.length > 0
              ? s.concertsValue(
                  state.concertRadiusKm,
                  state.cities.map((c) => t.cities[c] ?? c).join(", "),
                  state.concertLookaheadDays,
                )
              : s.noCity
          }
          editLabel={s.edit}
          onEdit={() => onJump("concerts")}
        />
        <Row
          label={s.delivery}
          value={`${frequencyLabel}${state.instantPresaleAlerts ? s.deliveryPresaleSuffix : ""}`}
          editLabel={s.edit}
          onEdit={() => onJump("frequency")}
        />
        <Row
          label={s.email}
          value={state.email || s.notSet}
          editLabel={s.edit}
          onEdit={() => onJump("email")}
        />
      </div>
    </div>
  );
}
