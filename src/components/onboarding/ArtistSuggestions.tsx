"use client";

import { useEffect, useState } from "react";
import { SearchArtist } from "./ArtistSearch";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface SuggestionHit {
  spotifyId: string | null;
  name: string;
  genres: string[];
  imageUrl: string | null;
}

/** "Because you like X" row under a picked artist — Spotify's related-artists
 * endpoint when available, genre-filtered search otherwise (see
 * suggestSimilarArtists), one-click add straight into the wizard's picked
 * list. Renders nothing once loaded if the seed artist has neither a
 * spotifyId nor genres (e.g. a bare manually-typed name) or Spotify isn't
 * configured, rather than showing an empty, confusing section. */
export function ArtistSuggestions({
  artistId,
  forArtistName,
  genres,
  excludeNames,
  onPick,
}: {
  artistId: string;
  forArtistName: string;
  genres: string[];
  excludeNames: Set<string>;
  onPick: (artist: SearchArtist) => void;
}) {
  const { t } = useLocale();
  const [suggestions, setSuggestions] = useState<SuggestionHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      artistId,
      genres: genres.slice(0, 3).join(","),
      excludeNames: [...excludeNames].join(","),
    });
    // Belt-and-braces on top of the server-side timeouts in
    // suggestSimilarArtists: a visitor on a flaky connection shouldn't have
    // a stalled background request for this card hang around indefinitely
    // while they've already moved on to later steps.
    fetch(`/api/artists/suggestions?${params}`, { signal: AbortSignal.timeout(10_000) })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSuggestions(data.artists ?? []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Fetches exactly once per artist card, keyed only on artistId. Genres
    // and forArtistName were in this list before — harmless in theory since
    // they shouldn't change for an already-picked artist, but suggestions
    // were observed flashing in and then disappearing, consistent with a
    // second, overwriting fetch firing right after the first. Narrowing to
    // artistId alone removes that whole class of re-fetch regardless of
    // what was actually triggering it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  async function pick(hit: SuggestionHit) {
    const key = hit.spotifyId ?? hit.name;
    setPendingKey(key);
    try {
      const res = await fetch("/api/artists/from-spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyId: hit.spotifyId,
          name: hit.name,
          genres: hit.genres,
          imageUrl: hit.imageUrl,
        }),
      });
      const data = await res.json();
      if (data.artist) {
        onPick(data.artist);
        setSuggestions((prev) => prev.filter((s) => (s.spotifyId ?? s.name) !== key));
      }
    } finally {
      setPendingKey(null);
    }
  }

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="mt-2 border-l-2 border-line pl-3">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
        {t.onboarding.artists.suggestionsFor(forArtistName)}
      </p>
      {loading ? (
        <p className="mt-1.5 text-xs text-ink-soft">{t.artistSearch.searching}</p>
      ) : (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((s) => {
            const key = s.spotifyId ?? s.name;
            const pending = pendingKey === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => pick(s)}
                  className="border border-line px-2.5 py-1 text-xs hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  + {s.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
