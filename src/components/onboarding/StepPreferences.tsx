"use client";

import { Eyebrow } from "@/components/ui/Container";
import {
  CONTENT_CATEGORIES,
  ContentCategoryId,
  DISCOVERY_LEVEL_LABELS,
} from "@/lib/constants";

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
  const selected = new Set(contentCategories);

  return (
    <div>
      <Eyebrow>Step 4</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        What do you want your radar to watch?
      </h1>
      <p className="mt-3 text-ink-soft">
        Only what you select here can ever show up in your digest.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CONTENT_CATEGORIES.map((cat) => {
          const active = selected.has(cat.id);
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
              <p className="font-medium">{cat.label}</p>
              <p
                className={
                  "mt-1 text-xs " +
                  (active ? "text-paper/70" : "text-ink-soft")
                }
              >
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold">
          How adventurous should discovery be?
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Controls the Discovery section only — never your followed artists.
        </p>
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
            <span>1 · Only what I know</span>
            <span>5 · Surprise me</span>
          </div>
          <p className="mt-3 text-sm font-medium">
            {discoveryLevel}/5 — {DISCOVERY_LEVEL_LABELS[discoveryLevel]}
          </p>
        </div>
      </div>
    </div>
  );
}
