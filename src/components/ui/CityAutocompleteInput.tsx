"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** Free-text city input with a live Google Places suggestion dropdown
 * (via /api/places/autocomplete, which keeps the API key server-side).
 * Committing a value — clicking a suggestion, clicking Add, or pressing
 * Enter — is left entirely to the caller's onAdd, so onboarding's
 * toggle-in-an-array semantics and Preferences' save-immediately semantics
 * don't need duplicating here. */
export function CityAutocompleteInput({
  onAdd,
  placeholder,
  addLabel,
}: {
  onAdd: (city: string) => void;
  placeholder: string;
  addLabel: string;
}) {
  const { locale } = useLocale();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}&locale=${locale}`)
        .then((res) => res.json())
        .then((data: { predictions?: string[] }) => setSuggestions(data.predictions ?? []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [value, locale]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function commit(city: string) {
    const trimmed = city.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="flex gap-2">
      <div className="relative w-full">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(suggestions[0] ?? value);
            }
          }}
          placeholder={placeholder}
          className="w-full border border-ink bg-paper px-4 py-3 text-base outline-none focus:border-accent"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full border border-ink bg-paper">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => commit(s)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-ink hover:text-paper"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={() => commit(value)}
        className="shrink-0 border border-ink px-4 py-3 text-sm hover:bg-ink hover:text-paper"
      >
        {addLabel}
      </button>
    </div>
  );
}
