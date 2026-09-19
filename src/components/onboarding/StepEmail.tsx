"use client";

import Link from "next/link";
import { Eyebrow } from "@/components/ui/Container";
import { CONSENT_COPY } from "@/lib/consentCopy";

export function StepEmail({
  email,
  consent,
  onEmail,
  onConsent,
}: {
  email: string;
  consent: boolean;
  onEmail: (v: string) => void;
  onConsent: (v: boolean) => void;
}) {
  return (
    <div>
      <Eyebrow>Step 7</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Where should we send it?
      </h1>
      <p className="mt-3 text-ink-soft">
        Your email is only ever used to send your radar — kept separate from
        any Spotify data.
      </p>

      <div className="mt-8">
        <label className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full border border-ink bg-paper px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 border border-line p-5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => onConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="text-sm">{CONSENT_COPY}</span>
      </label>

      <p className="mt-4 text-xs text-ink-soft">
        By subscribing you agree to our{" "}
        <Link href="/privacy" className="underline hover:text-accent">
          privacy policy
        </Link>
        . You can{" "}
        <Link href="/unsubscribe" className="underline hover:text-accent">
          unsubscribe
        </Link>{" "}
        at any time.
      </p>
    </div>
  );
}
