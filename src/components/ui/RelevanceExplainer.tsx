"use client";

import { RELEVANCE_LEVELS } from "@/lib/constants";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** Sits above any relevance picker (onboarding review, /artists) — makes
 * explicit what essential/interested/occasional actually change (ranking
 * priority, not a hard filter) and that the radar is a curated selection
 * rather than an exhaustive archive, so people know to reach for
 * "essential" on anything they really don't want to miss. */
export function RelevanceExplainer() {
  const { t } = useLocale();

  return (
    <div className="mb-8 border border-line bg-paper-raised/60 p-5 text-sm">
      <ul className="space-y-1.5">
        {RELEVANCE_LEVELS.map((level) => (
          <li key={level.id}>
            <span className="font-medium">{t.relevance[level.id].label}:</span>{" "}
            <span className="text-ink-soft">{t.relevance[level.id].description}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-ink-soft">{t.relevanceInfo.note}</p>
    </div>
  );
}
