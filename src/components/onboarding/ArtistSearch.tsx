"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export interface SearchArtist {
  id: string;
  name: string;
  genres: string[];
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
  const [results, setResults] = useState<SearchArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState("");
  const [creating, setCreating] = useState(false);
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

  const visible = results.filter((r) => !excludeIds.has(r.id));
  const showCustomOption =
    query.trim().length > 1 &&
    !loading &&
    !visible.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  async function createCustomArtist(name: string) {
    setCreating(true);
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
        setCustomName("");
      }
    } finally {
      setCreating(false);
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
            {visible.map((artist) => (
              <li key={artist.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(artist);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left text-sm last:border-b-0 hover:bg-accent hover:text-accent-ink"
                >
                  <span className="font-medium">{artist.name}</span>
                  <span className="font-mono text-xs uppercase tracking-wide text-ink-soft group-hover:text-accent-ink">
                    {artist.genres.slice(0, 2).join(", ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {showCustomOption && (
            <button
              type="button"
              disabled={creating}
              onClick={() => {
                setCustomName(query.trim());
                createCustomArtist(query.trim());
              }}
              className="block w-full border-t border-line px-4 py-3 text-left text-sm text-ink-soft hover:bg-accent hover:text-accent-ink disabled:opacity-50"
            >
              {creating
                ? t.artistSearch.adding(customName)
                : t.artistSearch.addManually(query.trim())}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
