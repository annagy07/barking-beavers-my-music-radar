"use client";

import { Eyebrow } from "@/components/ui/Container";
import { CITIES, CONCERT_LOOKAHEAD_DAYS, CONCERT_RADII } from "@/lib/constants";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StepConcerts({
  city,
  concertRadiusKm,
  concertLookaheadDays,
  onCity,
  onRadius,
  onLookahead,
}: {
  city: string;
  concertRadiusKm: number;
  concertLookaheadDays: number;
  onCity: (city: string) => void;
  onRadius: (km: number) => void;
  onLookahead: (days: number) => void;
}) {
  const { t } = useLocale();
  const s = t.onboarding.concerts;

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>
      <p className="mt-3 text-ink-soft">{s.body}</p>

      <div className="mt-8">
        <label className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {s.cityLabel}
        </label>
        <input
          list="city-options"
          value={city}
          onChange={(e) => onCity(e.target.value)}
          placeholder={s.cityPlaceholder}
          className="mt-2 w-full border border-ink bg-paper px-4 py-3 text-base outline-none focus:border-accent"
        />
        <datalist id="city-options">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="mt-2 flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCity(c)}
              className={
                "border px-3 py-1 text-xs " +
                (city === c
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft hover:border-ink")
              }
            >
              {t.cities[c] ?? c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {s.radius}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONCERT_RADII.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadius(km)}
              className={
                "border px-4 py-2 text-sm " +
                (concertRadiusKm === km
                  ? "border-ink bg-ink text-paper"
                  : "border-line hover:border-ink")
              }
            >
              {km} {s.km}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {s.lookahead}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONCERT_LOOKAHEAD_DAYS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onLookahead(days)}
              className={
                "border px-4 py-2 text-sm " +
                (concertLookaheadDays === days
                  ? "border-ink bg-ink text-paper"
                  : "border-line hover:border-ink")
              }
            >
              {days} {s.days}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
