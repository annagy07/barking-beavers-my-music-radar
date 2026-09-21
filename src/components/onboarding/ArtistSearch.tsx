"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export interface SearchArtist {
  id: string;
  name: string;
  genres: string[];
  country: string | null;
}

/** A raw /api/artists/search result — id is null for a Spotify catalog hit
 * that isn't in our own Artist table yet, resolved into a real local row
 * (via /api/artists/from-spotify) only once actually picked. */
interface SearchHit {
  id: string | null;
  spotifyId: string | null;
  name: string;
  genres: string[];
  imageUrl: string | null;
  country: string | null;
}

export function ArtistSearch({
  onPick,
  excludeIds,
  placeholder,
}: {
  onPick: (artist: SearchArtist) => void;
  excludeIds: Set<string>;
  placeholder?: string;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.artists ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const visible = results.filter((r) => !(r.id && excludeIds.has(r.id)));
  const showCustomOption =
    query.trim().length > 1 &&
    !loading &&
    !visible.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  async function pick(hit: SearchHit) {
    if (hit.id) {
      onPick({ id: hit.id, name: hit.name, genres: hit.genres, country: hit.country });
      setQuery("");
      return;
    }

    // A Spotify-only hit isn't in our catalog yet — create it now, with
    // Spotify's genres and image already in hand, rather than falling
    // back to the bare "add manually" path below.
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
        setQuery("");
      }
    } finally {
      setPendingKey(null);
    }
  }

  async function createCustomArtist(name: string) {
    setPendingKey(name);
    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.artist) {
        onPick({
          id: data.artist.id,
          name: data.artist.name,
          genres: data.artist.genres ?? [],
          country: null,
        });
        setQuery("");
      }
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? t.artistSearch.placeholder}
        className="w-full border border-ink bg-paper px-4 py-3 text-base outline-none placeholder:text-ink-soft/70 focus:border-accent"
      />
      {query.trim().length > 0 && (
        <div className="mt-2 border border-line bg-paper-raised/50">
          {loading && (
            <p className="px-4 py-3 text-sm text-ink-soft">{t.artistSearch.searching}</p>
          )}
          {!loading && visible.length === 0 && !showCustomOption && (
            <p className="px-4 py-3 text-sm text-ink-soft">{t.artistSearch.noMatches}</p>
          )}
          <ul>
            {visible.map((hit) => {
              const key = hit.id ?? hit.spotifyId ?? hit.name;
              const pending = pendingKey === (hit.spotifyId ?? hit.name);
              return (
                <li key={key}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => pick(hit)}
                    className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left text-sm last:border-b-0 hover:bg-accent hover:text-accent-ink disabled:opacity-50"
                  >
                    <span className="font-medium">{hit.name}</span>
                    <span className="font-mono text-xs uppercase tracking-wide text-ink-soft group-hover:text-accent-ink">
                      {hit.genres.slice(0, 2).join(", ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {showCustomOption && (
            <button
              type="button"
              disabled={pendingKey === query.trim()}
              onClick={() => createCustomArtist(query.trim())}
              className="block w-full border-t border-line px-4 py-3 text-left text-sm text-ink-soft hover:bg-accent hover:text-accent-ink disabled:opacity-50"
            >
              {pendingKey === query.trim()
                ? t.artistSearch.adding(query.trim())
                : t.artistSearch.addManually(query.trim())}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
