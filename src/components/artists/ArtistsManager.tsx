"use client";

import { useState, useTransition } from "react";
import { RELEVANCE_LEVELS, RelevanceId } from "@/lib/constants";
import { ArtistSource } from "@/lib/onboardingState";
import { ArtistSearch, SearchArtist } from "@/components/onboarding/ArtistSearch";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  addArtistPreference,
  removeArtistPreference,
  setArtistBlocked,
  setArtistRelevance,
} from "@/app/artists/actions";

interface ManagedArtist {
  artistId: string;
  name: string;
  genres: string[];
  source: ArtistSource;
  relevance: RelevanceId;
  blocked: boolean;
}

export function ArtistsManager({
  initialArtists,
}: {
  initialArtists: ManagedArtist[];
}) {
  const { t } = useLocale();
  const [artists, setArtists] = useState(initialArtists);
  const [, startTransition] = useTransition();

  function updateLocal(artistId: string, patch: Partial<ManagedArtist>) {
    setArtists((prev) =>
      prev.map((a) => (a.artistId === artistId ? { ...a, ...patch } : a)),
    );
  }

  function handleRelevance(artistId: string, relevance: RelevanceId) {
    updateLocal(artistId, { relevance });
    startTransition(() => {
      setArtistRelevance(artistId, relevance);
    });
  }

  function handleBlocked(artistId: string, blocked: boolean) {
    updateLocal(artistId, { blocked });
    startTransition(() => {
      setArtistBlocked(artistId, blocked);
    });
  }

  function handleRemove(artistId: string) {
    setArtists((prev) => prev.filter((a) => a.artistId !== artistId));
    startTransition(() => {
      removeArtistPreference(artistId);
    });
  }

  function handleAdd(artist: SearchArtist) {
    if (artists.some((a) => a.artistId === artist.id)) return;
    setArtists((prev) => [
      ...prev,
      {
        artistId: artist.id,
        name: artist.name,
        genres: artist.genres,
        source: "manual",
        relevance: "interested",
        blocked: false,
      },
    ]);
    startTransition(() => {
      addArtistPreference(artist.id);
    });
  }

  return (
    <div>
      <ul className="divide-y divide-line border border-line">
        {artists.map((artist) => (
          <li
            key={artist.artistId}
            className={
              "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between " +
              (artist.blocked ? "opacity-50" : "")
            }
          >
            <div>
              <p className="font-medium">{artist.name}</p>
              <p className="text-xs text-ink-soft">
                {t.sources[artist.source]}
                {artist.genres.length > 0
                  ? ` · ${artist.genres.slice(0, 2).join(", ")}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex border border-ink">
                {RELEVANCE_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleRelevance(artist.artistId, level.id)}
                    disabled={artist.blocked}
                    className={
                      "px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 " +
                      (artist.relevance === level.id
                        ? "bg-ink text-paper"
                        : "hover:bg-paper-raised")
                    }
                  >
                    {t.relevance[level.id].label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleBlocked(artist.artistId, !artist.blocked)}
                className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
              >
                {artist.blocked ? t.artists.unhide : t.artists.hide}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(artist.artistId)}
                className="text-ink-soft hover:text-accent"
                aria-label={t.artists.removeLabel(artist.name)}
              >
                ×
              </button>
            </div>
          </li>
        ))}
        {artists.length === 0 && (
          <li className="p-6 text-sm text-ink-soft">{t.artists.empty}</li>
        )}
      </ul>

      <div className="mt-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-soft">
          {t.artists.addArtist}
        </p>
        <ArtistSearch
          onPick={handleAdd}
          excludeIds={new Set(artists.map((a) => a.artistId))}
        />
      </div>
    </div>
  );
}
