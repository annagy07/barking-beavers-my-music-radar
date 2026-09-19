"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Container";
import { ArtistSearch, SearchArtist } from "./ArtistSearch";
import {
  RELEVANCE_TIER_LABEL,
  SOURCE_LABEL,
  WizardArtist,
} from "@/lib/onboardingState";
import { RELEVANCE_LEVELS, RelevanceId } from "@/lib/constants";

const TIERS: RelevanceId[] = ["essential", "interested", "occasional"];

export function StepReview({
  artists,
  onAdd,
  onRemove,
  onSetRelevance,
  onToggleBlocked,
}: {
  artists: WizardArtist[];
  onAdd: (artist: SearchArtist) => void;
  onRemove: (artistId: string) => void;
  onSetRelevance: (artistId: string, relevance: RelevanceId) => void;
  onToggleBlocked: (artistId: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const visible = artists.filter((a) => !a.blocked);
  const hidden = artists.filter((a) => a.blocked);

  return (
    <div>
      <Eyebrow>Step 3</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Review your taste
      </h1>
      <p className="mt-3 text-ink-soft">
        This is how relevant each artist will be to your radar. Change
        anything — you&rsquo;re always in control.
      </p>

      <div className="mt-8 space-y-10">
        {TIERS.map((tier) => {
          const tierArtists = visible.filter((a) => a.relevance === tier);
          if (tierArtists.length === 0) return null;
          return (
            <div key={tier}>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
                {RELEVANCE_TIER_LABEL[tier]}
              </p>
              <ul className="mt-3 divide-y divide-line border border-line">
                {tierArtists.map((artist) => (
                  <li
                    key={artist.artistId}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{artist.name}</p>
                      <p className="text-xs text-ink-soft">
                        {SOURCE_LABEL[artist.source]}
                        {artist.genres.length > 0
                          ? ` · ${artist.genres.slice(0, 2).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex border border-ink">
                        {RELEVANCE_LEVELS.map((level) => (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => onSetRelevance(artist.artistId, level.id)}
                            className={
                              "px-2.5 py-1.5 text-xs font-medium transition-colors " +
                              (artist.relevance === level.id
                                ? "bg-ink text-paper"
                                : "hover:bg-paper-raised")
                            }
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleBlocked(artist.artistId)}
                        className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
                        title="Don't show me this artist"
                      >
                        Hide
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(artist.artistId)}
                        className="text-ink-soft hover:text-accent"
                        aria-label={`Remove ${artist.name}`}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {hidden.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
            Don&rsquo;t show me ({hidden.length})
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {hidden.map((a) => (
              <li
                key={a.artistId}
                className="flex items-center gap-2 border border-line px-3 py-1.5 text-sm text-ink-soft"
              >
                {a.name}
                <button
                  type="button"
                  onClick={() => onToggleBlocked(a.artistId)}
                  className="hover:text-accent"
                >
                  Unhide
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        {showAdd ? (
          <ArtistSearch
            onPick={(artist) => {
              onAdd(artist);
              setShowAdd(false);
            }}
            excludeIds={new Set(artists.map((a) => a.artistId))}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
          >
            + Add another artist manually
          </button>
        )}
      </div>
    </div>
  );
}
