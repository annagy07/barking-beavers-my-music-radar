"use client";

import { Eyebrow } from "@/components/ui/Container";
import { ArtistSearch, SearchArtist } from "./ArtistSearch";
import { WizardArtist } from "@/lib/onboardingState";

export function StepArtists({
  artists,
  onAdd,
  onRemove,
}: {
  artists: WizardArtist[];
  onAdd: (artist: SearchArtist) => void;
  onRemove: (artistId: string) => void;
}) {
  const minReached = artists.length >= 3;

  return (
    <div>
      <Eyebrow>Step 2</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Choose at least three artists
      </h1>
      <p className="mt-3 text-ink-soft">
        Search across indie, pop, electronic, hip-hop, alternative and rock.
        You&rsquo;ll set how relevant each one is on the next screen.
      </p>

      <div className="mt-6">
        <ArtistSearch
          onPick={onAdd}
          excludeIds={new Set(artists.map((a) => a.artistId))}
        />
      </div>

      <div className="mt-6">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          Selected — {artists.length}/3 minimum
        </p>
        {artists.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Nothing yet. Search above to get started.
          </p>
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
                  aria-label={`Remove ${a.name}`}
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
        <p className="mt-6 text-sm text-ink-soft">
          Pick {3 - artists.length} more to continue.
        </p>
      )}
    </div>
  );
}
