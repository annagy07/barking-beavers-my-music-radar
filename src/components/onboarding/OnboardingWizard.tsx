"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WizardShell } from "./WizardShell";
import { StepMethod } from "./StepMethod";
import { StepArtists } from "./StepArtists";
import { StepReview } from "./StepReview";
import { StepPreferences } from "./StepPreferences";
import { StepConcerts } from "./StepConcerts";
import { StepFrequency } from "./StepFrequency";
import { StepEmail } from "./StepEmail";
import { StepConfirm } from "./StepConfirm";
import { StepPreview } from "./StepPreview";
import { SearchArtist } from "./ArtistSearch";
import {
  STEPS,
  STORAGE_KEY,
  StepId,
  WizardArtist,
  WizardState,
  initialWizardState,
} from "@/lib/onboardingState";
import { ContentCategoryId, RelevanceId } from "@/lib/constants";
import { submitOnboarding } from "@/app/onboarding/actions";

const DEFAULT_RELEVANCE_BY_SOURCE: Record<WizardArtist["source"], RelevanceId> = {
  spotify_followed_artist: "essential",
  spotify_top_artist: "interested",
  spotify_saved_music: "occasional",
  manual: "interested",
};

function loadDraft(): { state: WizardState; step: StepId } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<WizardState>(initialWizardState);
  const [step, setStep] = useState<StepId>("method");
  const [hydrated, setHydrated] = useState(false);
  const [spotifyError, setSpotifyError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hydrate from localStorage once on mount. This intentionally sets state
  // from an effect rather than a lazy useState initializer: localStorage
  // isn't available during SSR, so reading it during render would produce a
  // server/client mismatch. Rendering `null` until `hydrated` is true (see
  // below) keeps the first client render identical to the server render.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(draft.state);
      setStep(draft.step);
    }
    setHydrated(true);
  }, []);

  // Handle returning from /api/spotify/authorize.
  useEffect(() => {
    const spotify = searchParams.get("spotify");
    if (!spotify) return;

    if (spotify === "error") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpotifyError(true);
      router.replace("/onboarding");
      return;
    }

    if (spotify === "connected") {
      fetch("/api/spotify/draft")
        .then((res) => res.json())
        .then(
          (data: {
            connected: boolean;
            artists: { artistId: string; name: string; genres: string[]; source: WizardArtist["source"] }[];
          }) => {
            if (!data.connected) return;
            setState((prev) => {
              const existingIds = new Set(prev.artists.map((a) => a.artistId));
              const imported: WizardArtist[] = data.artists
                .filter((a) => !existingIds.has(a.artistId))
                .map((a) => ({
                  artistId: a.artistId,
                  name: a.name,
                  genres: a.genres,
                  source: a.source,
                  relevance: DEFAULT_RELEVANCE_BY_SOURCE[a.source],
                  blocked: false,
                }));
              return {
                ...prev,
                method: "spotify",
                spotifyConnected: true,
                artists: [...prev.artists, ...imported],
              };
            });
            setStep("review");
          },
        )
        .finally(() => router.replace("/onboarding"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Persist on every change, once hydrated (avoids clobbering with initial state).
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step }));
  }, [state, step, hydrated]);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const addArtist = useCallback((artist: SearchArtist, source: WizardArtist["source"] = "manual") => {
    setState((prev) => {
      if (prev.artists.some((a) => a.artistId === artist.id)) return prev;
      return {
        ...prev,
        artists: [
          ...prev.artists,
          {
            artistId: artist.id,
            name: artist.name,
            genres: artist.genres,
            source,
            relevance: DEFAULT_RELEVANCE_BY_SOURCE[source],
            blocked: false,
          },
        ],
      };
    });
  }, []);

  const removeArtist = useCallback((artistId: string) => {
    setState((prev) => ({
      ...prev,
      artists: prev.artists.filter((a) => a.artistId !== artistId),
    }));
  }, []);

  const setRelevance = useCallback((artistId: string, relevance: RelevanceId) => {
    setState((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.artistId === artistId ? { ...a, relevance } : a,
      ),
    }));
  }, []);

  const toggleBlocked = useCallback((artistId: string) => {
    setState((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.artistId === artistId ? { ...a, blocked: !a.blocked } : a,
      ),
    }));
  }, []);

  const toggleCategory = useCallback((id: ContentCategoryId) => {
    setState((prev) => ({
      ...prev,
      contentCategories: prev.contentCategories.includes(id)
        ? prev.contentCategories.filter((c) => c !== id)
        : [...prev.contentCategories, id],
    }));
  }, []);

  const activeArtistCount = state.artists.filter((a) => !a.blocked).length;

  const canContinue = useMemo(() => {
    switch (step) {
      case "artists":
        return activeArtistCount >= 3;
      case "review":
        return activeArtistCount >= 1;
      case "preferences":
        return state.contentCategories.length >= 1;
      case "concerts":
        return state.city.trim().length > 0;
      case "email":
        return /.+@.+\..+/.test(state.email) && state.consent;
      default:
        return true;
    }
  }, [step, activeArtistCount, state.contentCategories, state.city, state.email, state.consent]);

  const stepIndex = STEPS.indexOf(step);

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }
  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  async function handleSubscribe() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitOnboarding({
        artists: state.artists
          .filter((a) => !a.blocked)
          .map((a) => ({
            artistId: a.artistId,
            name: a.name,
            source: a.source,
            relevance: a.relevance,
          })),
        contentCategories: state.contentCategories,
        discoveryLevel: state.discoveryLevel,
        city: state.city,
        concertRadiusKm: state.concertRadiusKm,
        concertLookaheadDays: state.concertLookaheadDays,
        newsletterFrequency: state.newsletterFrequency,
        instantPresaleAlerts: state.instantPresaleAlerts,
        email: state.email,
        consent: state.consent as true,
      });
      if (!result.ok) {
        setSubmitError(result.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      window.localStorage.removeItem(STORAGE_KEY);
      router.push("/radar");
    } catch {
      setSubmitError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  return (
    <WizardShell step={step}>
      {step === "method" && (
        <StepMethod
          error={spotifyError}
          onChooseManual={() => {
            update({ method: "manual" });
            setStep("artists");
          }}
        />
      )}

      {step === "artists" && (
        <StepArtists
          artists={state.artists}
          onAdd={(artist) => addArtist(artist, "manual")}
          onRemove={removeArtist}
        />
      )}

      {step === "review" && (
        <StepReview
          artists={state.artists}
          onAdd={(artist) => addArtist(artist, "manual")}
          onRemove={removeArtist}
          onSetRelevance={setRelevance}
          onToggleBlocked={toggleBlocked}
        />
      )}

      {step === "preferences" && (
        <StepPreferences
          contentCategories={state.contentCategories}
          discoveryLevel={state.discoveryLevel}
          onToggleCategory={toggleCategory}
          onDiscoveryLevel={(discoveryLevel) => update({ discoveryLevel })}
        />
      )}

      {step === "concerts" && (
        <StepConcerts
          city={state.city}
          concertRadiusKm={state.concertRadiusKm}
          concertLookaheadDays={state.concertLookaheadDays}
          onCity={(city) => update({ city })}
          onRadius={(concertRadiusKm) =>
            update({ concertRadiusKm: concertRadiusKm as WizardState["concertRadiusKm"] })
          }
          onLookahead={(concertLookaheadDays) =>
            update({
              concertLookaheadDays: concertLookaheadDays as WizardState["concertLookaheadDays"],
            })
          }
        />
      )}

      {step === "frequency" && (
        <StepFrequency
          newsletterFrequency={state.newsletterFrequency}
          instantPresaleAlerts={state.instantPresaleAlerts}
          onFrequency={(newsletterFrequency) => update({ newsletterFrequency })}
          onPresaleAlerts={(instantPresaleAlerts) => update({ instantPresaleAlerts })}
        />
      )}

      {step === "email" && (
        <StepEmail
          email={state.email}
          consent={state.consent}
          onEmail={(email) => update({ email })}
          onConsent={(consent) => update({ consent })}
        />
      )}

      {step === "confirm" && <StepConfirm state={state} onJump={setStep} />}

      {step === "preview" && (
        <StepPreview
          state={state}
          submitting={submitting}
          submitError={submitError}
          onSubscribe={handleSubscribe}
        />
      )}

      {step !== "method" && step !== "preview" && (
        <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
          <button
            type="button"
            onClick={goBack}
            className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
          >
            ← Back
          </button>
          <Button onClick={goNext} disabled={!canContinue}>
            Continue
          </Button>
        </div>
      )}
    </WizardShell>
  );
}
