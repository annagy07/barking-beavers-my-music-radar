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

/** "Because you like X" row under a picked artist — genre-based Spotify
 * suggestions (see suggestSimilarArtists for why), one-click add straight
 * into the wizard's picked list. Renders nothing once loaded if the seed
 * artist has no genres (e.g. a manually-typed one) or Spotify isn't
 * configured, rather than showing an empty, confusing section. */
export function ArtistSuggestions({
  forArtistName,
  genres,
  excludeNames,
  onPick,
}: {
  forArtistName: string;
  genres: string[];
  excludeNames: Set<string>;
  onPick: (artist: SearchArtist) => void;
}) {
  const { t } = useLocale();
  const [suggestions, setSuggestions] = useState<SuggestionHit[]>([]);
  const [loading, setLoading] = useState(genres.length > 0);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    if (genres.length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      genres: genres.slice(0, 3).join(","),
      excludeNames: [...excludeNames].join(","),
    });
    fetch(`/api/artists/suggestions?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSuggestions(data.artists ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-fetches only when the seed artist changes, not on every exclude-set
    // change from other picks — otherwise adding any artist anywhere would
    // re-fetch (and reshuffle) every other artist's suggestion row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forArtistName, genres.join(",")]);

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
