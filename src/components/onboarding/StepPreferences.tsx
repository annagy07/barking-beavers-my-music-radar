"use client";

import { Eyebrow } from "@/components/ui/Container";
import { CONTENT_CATEGORIES, ContentCategoryId } from "@/lib/constants";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StepPreferences({
  contentCategories,
  discoveryLevel,
  onToggleCategory,
  onDiscoveryLevel,
}: {
  contentCategories: ContentCategoryId[];
  discoveryLevel: number;
  onToggleCategory: (id: ContentCategoryId) => void;
  onDiscoveryLevel: (level: number) => void;
}) {
  const { t } = useLocale();
  const s = t.onboarding.preferences;
  const selected = new Set(contentCategories);

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>
      <p className="mt-3 text-ink-soft">{s.body}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CONTENT_CATEGORIES.map((cat) => {
          const active = selected.has(cat.id);
          const label = t.categories[cat.id];
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onToggleCategory(cat.id)}
              className={
                "border p-4 text-left transition-colors " +
                (active
                  ? "border-ink bg-ink text-paper"
                  : "border-line hover:border-ink")
              }
            >
              <p className="font-medium">{label.label}</p>
              <p
                className={
                  "mt-1 text-xs " +
                  (active ? "text-paper/70" : "text-ink-soft")
                }
              >
                {label.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold">{s.discoveryTitle}</h2>
        <p className="mt-1 text-sm text-ink-soft">{s.discoveryBody}</p>
        <div className="mt-5">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={discoveryLevel}
            onChange={(e) => onDiscoveryLevel(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wide text-ink-soft">
            <span>{s.discoveryMin}</span>
            <span>{s.discoveryMax}</span>
          </div>
          <p className="mt-3 text-sm font-medium">
            {discoveryLevel}/5: {t.discoveryLevels[discoveryLevel]}
          </p>
        </div>
      </div>
    </div>
  );
}
