"use client";

import { Eyebrow } from "@/components/ui/Container";
import { ArtistSearch, SearchArtist } from "./ArtistSearch";
import { WizardArtist } from "@/lib/onboardingState";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StepArtists({
  artists,
  onAdd,
  onRemove,
}: {
  artists: WizardArtist[];
  onAdd: (artist: SearchArtist) => void;
  onRemove: (artistId: string) => void;
}) {
  const { t } = useLocale();
  const s = t.onboarding.artists;
  const minReached = artists.length >= 3;

  return (
    <div>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {s.title}
      </h1>
      <p className="mt-3 text-ink-soft">{s.body}</p>

      <div className="mt-6">
        <ArtistSearch
          onPick={onAdd}
          excludeIds={new Set(artists.map((a) => a.artistId))}
        />
      </div>

      <div className="mt-6">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {s.selected(artists.length)}
        </p>
        {artists.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">{s.empty}</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {artists.map((a) => (
              <li
                key={a.artistId}
                className="flex items-center gap-2 border border-ink px-3 py-1.5 text-sm"
              >
                {a.name}
                <button
                  type="button"
                  onClick={() => onRemove(a.artistId)}
                  aria-label={s.removeLabel(a.name)}
                  className="text-ink-soft hover:text-accent"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!minReached && (
        <p className="mt-6 text-sm text-ink-soft">{s.pickMore(3 - artists.length)}</p>
      )}
    </div>
  );
}
