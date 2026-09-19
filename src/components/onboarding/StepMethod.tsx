"use client";

import { Eyebrow } from "@/components/ui/Container";

export function StepMethod({
  error,
  onChooseManual,
}: {
  error: boolean;
  onChooseManual: () => void;
}) {
  return (
    <div>
      <Eyebrow>Step 1</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        How should we get to know your music taste?
      </h1>
      <p className="mt-3 text-ink-soft">
        Either way, you review and edit everything before we send you
        anything.
      </p>

      {error && (
        <p className="mt-6 border border-accent bg-accent/10 px-4 py-3 text-sm text-ink">
          Couldn&rsquo;t connect to Spotify. Try again, or choose artists
          manually below.
        </p>
      )}

      <div className="mt-8 grid gap-4">
        <a
          href="/api/spotify/authorize"
          className="group border-2 border-ink bg-ink p-6 text-left text-paper transition-colors hover:bg-accent hover:text-accent-ink hover:border-accent"
        >
          <span className="font-mono text-xs uppercase tracking-wide opacity-70">
            Recommended
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold">
            Connect Spotify
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Read-only. We only look at artists you follow, your top artists
            and your saved music — never listening history, never your
            email.
          </p>
        </a>

        <button
          type="button"
          onClick={onChooseManual}
          className="border border-ink p-6 text-left transition-colors hover:border-accent hover:text-accent"
        >
          <h2 className="font-display text-xl font-semibold">
            Choose artists manually
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Search and pick at least three artists yourself. No account
            needed.
          </p>
        </button>

        <a
          href="/api/spotify/authorize"
          className="block border border-line p-6 text-left transition-colors hover:border-accent hover:text-accent"
        >
          <h2 className="font-display text-xl font-semibold">
            Connect Spotify, then customize
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Import as a starting point, then add, remove and re-rank
            anything on the next screen.
          </p>
        </a>
      </div>

      <p className="mt-6 text-xs text-ink-soft">
        No Spotify developer credentials configured locally? Connecting will
        automatically use a realistic mock import so you can still try the
        full flow.
      </p>
    </div>
  );
}
