"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CITIES,
  CONCERT_LOOKAHEAD_DAYS,
  CONCERT_RADII,
  CONTENT_CATEGORIES,
  ContentCategoryId,
  NEWSLETTER_FREQUENCIES,
  NewsletterFrequencyId,
} from "@/lib/constants";
import { PreferencePatch, updatePreferences } from "@/app/preferences/actions";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface PreferencesData {
  contentCategories: ContentCategoryId[];
  discoveryLevel: number;
  city: string;
  concertRadiusKm: number;
  concertLookaheadDays: number;
  newsletterFrequency: NewsletterFrequencyId;
  instantPresaleAlerts: boolean;
}

export function PreferencesManager({ initial }: { initial: PreferencesData }) {
  const { t } = useLocale();
  const [data, setData] = useState(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function save(patch: PreferencePatch) {
    startTransition(async () => {
      await updatePreferences(patch);
      setSavedAt(Date.now());
    });
  }

  function toggleCategory(id: ContentCategoryId) {
    const next = data.contentCategories.includes(id)
      ? data.contentCategories.filter((c) => c !== id)
      : [...data.contentCategories, id];
    if (next.length === 0) return; // must keep at least one
    setData((d) => ({ ...d, contentCategories: next }));
    save({ contentCategories: next });
  }

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  return (
    <div className="space-y-14">
      <section>
        <h2 className="font-display text-xl font-semibold">{t.preferences.watches}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CONTENT_CATEGORIES.map((cat) => {
            const active = data.contentCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={
                  "border p-3 text-left text-sm transition-colors " +
                  (active
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink")
                }
              >
                {t.categories[cat.id].label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">{t.preferences.discoveryLevel}</h2>
        <input
          type="range"
          min={1}
          max={5}
          value={data.discoveryLevel}
          onChange={(e) => {
            const discoveryLevel = Number(e.target.value);
            setData((d) => ({ ...d, discoveryLevel }));
            save({ discoveryLevel });
          }}
          className="mt-4 w-full accent-[var(--color-accent)]"
        />
        <p className="mt-2 text-sm text-ink-soft">
          {data.discoveryLevel}/5: {t.discoveryLevels[data.discoveryLevel]}
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">{t.preferences.concerts}</h2>
        <div className="mt-4">
          <label className="font-mono text-xs uppercase tracking-wide text-ink-soft">
            {t.preferences.cityLabel}
          </label>
          <input
            list="pref-city-options"
            defaultValue={data.city}
            onChange={(e) => {
              const city = e.target.value;
              setData((d) => ({ ...d, city }));
              if (cityDebounce.current) clearTimeout(cityDebounce.current);
              cityDebounce.current = setTimeout(() => save({ city }), 500);
            }}
            className="mt-2 w-full border border-ink bg-paper px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <datalist id="pref-city-options">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="mt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
            {t.preferences.radius}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONCERT_RADII.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => {
                  setData((d) => ({ ...d, concertRadiusKm: km }));
                  save({ concertRadiusKm: km });
                }}
                className={
                  "border px-3 py-1.5 text-sm " +
                  (data.concertRadiusKm === km
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink")
                }
              >
                {km} {t.preferences.km}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
            {t.preferences.lookahead}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONCERT_LOOKAHEAD_DAYS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setData((d) => ({ ...d, concertLookaheadDays: days }));
                  save({ concertLookaheadDays: days });
                }}
                className={
                  "border px-3 py-1.5 text-sm " +
                  (data.concertLookaheadDays === days
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink")
                }
              >
                {days} {t.preferences.days}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">{t.preferences.newsletter}</h2>
        <div className="mt-4 grid gap-2">
          {NEWSLETTER_FREQUENCIES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setData((d) => ({ ...d, newsletterFrequency: f.id }));
                save({ newsletterFrequency: f.id });
              }}
              className={
                "border p-3 text-left text-sm transition-colors " +
                (data.newsletterFrequency === f.id
                  ? "border-ink bg-ink text-paper"
                  : "border-line hover:border-ink")
              }
            >
              {t.frequency[f.id].label}
            </button>
          ))}
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 border border-line p-4">
          <input
            type="checkbox"
            checked={data.instantPresaleAlerts}
            onChange={(e) => {
              const v = e.target.checked;
              setData((d) => ({ ...d, instantPresaleAlerts: v }));
              save({ instantPresaleAlerts: v });
            }}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-sm">{t.preferences.presaleLabel}</span>
        </label>
      </section>

      <p
        className={
          "font-mono text-xs uppercase tracking-wide transition-opacity " +
          (savedAt ? "text-positive opacity-100" : "opacity-0")
        }
      >
        {t.preferences.saved}
      </p>
    </div>
  );
}
