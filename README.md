# Barking Beaver — your personal music radar

A personalized music discovery + update service. Not a streaming app, not a
recommendation feed: you tell it which artists and categories you care
about, and it builds a transparent, deterministic digest — releases,
concerts, tours, videos, interviews, collaborations and discovery — each
with a visible "why am I seeing this?" explanation. The distribution
channel is email (rendered at `/newsletter-preview`); WhatsApp is
architecturally reserved for later (see `ConnectedAccount`/`NewsletterSubscription`
schema — a `channel` field already models it) but not implemented in V1.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL ·
Zod · React Hook Form (available, forms currently use plain controlled
inputs since the flows are simple) · lightweight cookie-based dev session.

## Quickstart

Needs a Postgres database — any of these work: a free one from
[Neon](https://neon.tech) or [Supabase](https://supabase.com), a Postgres
database created from your Vercel project's Storage tab, or a local
Postgres server.

```bash
npm install
cp .env.example .env             # then fill in DATABASE_URL
npx prisma migrate dev           # applies the schema
npm run seed                     # 60+ artists, 30+ events, sources, relations, demo user
npm run dev
```

Open http://localhost:3000. `/radar`, `/artists`, `/preferences`,
`/settings` and `/newsletter-preview` all work immediately after seeding,
even before you complete onboarding — they fall back to a seeded demo
account (`demo@musicradar.app`) when no session cookie is set, so the app
is reviewable straight away. Complete `/onboarding` to create your own
account (it gets its own cookie and takes over from the demo user).

Other useful commands:

```bash
npm run build     # production build (also applies pending migrations)
npm run start     # run the production build
npm run db:reset  # drop + recreate the database, re-run migrations + seed
npx tsc --noEmit  # typecheck
npx eslint .       # lint
```

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the
   repo) and import it in the Vercel dashboard.
2. In the project's **Storage** tab, create a Postgres database (Neon-backed)
   — this sets `DATABASE_URL` (and a couple of related vars) automatically.
   Using an external Postgres (Neon/Supabase) instead works the same way:
   just add `DATABASE_URL` yourself under **Settings → Environment Variables**.
3. Add `APP_SESSION_SECRET` (any random string) and `NEXT_PUBLIC_APP_URL`
   (your production URL, e.g. `https://your-app.vercel.app`) as environment
   variables. `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`/`RESEND_API_KEY`
   are optional — the app runs in mock mode without them.
4. Deploy. The build script (`prisma generate && prisma migrate deploy &&
   next build`) applies the schema to your new database automatically.
5. Seed it once, from your machine, pointed at the production database:
   ```bash
   DATABASE_URL="<the same URL you set in Vercel>" npm run seed
   ```
   (Re-running the seed script wipes and recreates all data — including any
   real accounts — so only run it once, right after the first deploy.)

## What's implemented

- **Landing page** (`/`) — editorial three-step pitch + category preview.
- **Onboarding** (`/onboarding`) — a 9-step wizard (method → artists →
  review → preferences → concerts → frequency → email → confirm → live
  preview → subscribe), persisted to `localStorage` so it survives the
  full-page redirect to Spotify and back.
- **Spotify import** — Authorization Code + PKCE (`src/lib/spotify/real.ts`),
  behind a swappable adapter (`SpotifyAdapter`) with a realistic mock
  (`src/lib/spotify/mock.ts`) used automatically when
  `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` aren't set. Only
  `user-follow-read`, `user-top-read`, `user-library-read` — no email
  scope, no listening history stored, no Spotify recommendations used.
- **Manual artist selection** — autocomplete search against the seeded
  artist catalog (`/api/artists/search`), with on-the-fly creation of
  artists that aren't in it.
- **Taste review** — relevance tiers (essential/interested/occasional),
  remove, "don't show me" (blocked), add more — all editable again later
  from `/artists`.
- **Deterministic recommendation engine** (`src/lib/radar/`) — no ML, no
  collaborative filtering, no opaque scoring. Every point in the score is a
  named constant (`SCORE_*` in `scoring.ts`) and every item carries a
  plain-language reason. Source credibility gating (`credibilityScore >=
  60`), concert radius via a small city-distance table, discovery via
  explicit `ArtistRelation` edges or genre overlap.
- **Radar dashboard** (`/radar`), **artist management** (`/artists`),
  **preferences** (`/preferences`), **settings** (`/settings`) — all backed
  by Server Actions, editable immediately, no page reloads.
- **Consent ledger** (`Consent` model) — append-only; granting and
  withdrawing both write new timestamped rows rather than mutating one
  field. Newsletter checkbox starts unchecked.
- **Newsletter** — `generatePersonalizedRadar(userId)` → structured JSON →
  `renderNewsletterHtml()` → `/newsletter-preview` (also sendable via a
  swappable `EmailProvider`; defaults to a console-logging dev adapter,
  switches to Resend if `RESEND_API_KEY` is set).
- **Privacy controls** — disconnect Spotify, delete imported Spotify taste
  data (separate from disconnecting), pause/resume/unsubscribe newsletter,
  delete account. `/privacy` and `/unsubscribe` placeholders.

## What's mocked

- **Spotify**, when `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` are unset
  (the default) — `src/lib/spotify/mock.ts` returns a realistic
  followed/top/saved artist library so the full flow works with zero
  configuration.
- **Music metadata / events** — seeded, not fetched live (`prisma/seed.ts`):
  61 artists across indie/pop/electronic/hip-hop/alternative/rock, 32
  events across all 10 supported types, 17 sources with credibility
  weights, 14 explicit artist relations for discovery, 6 cities.
- **Email delivery** — logs to the server console unless `RESEND_API_KEY`
  is set (`src/lib/email/provider.ts`).
- **Concert distances** — a small hardcoded lookup table between the 6
  seed cities (`src/lib/radar/geo.ts`), not a geocoding API.

## To use real Spotify

1. Create an app at https://developer.spotify.com/dashboard.
2. Add `http://localhost:3000/api/spotify/callback` as a Redirect URI.
3. Set `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
   in `.env`.

No other code changes needed — the adapter switches automatically.

## Project structure

```
prisma/schema.prisma       # User, Artist, UserArtistPreference, UserPreference,
                            # MusicEvent, MusicSource, ArtistRelation, Consent,
                            # ConnectedAccount, NewsletterSubscription
prisma/seed.ts              # seed data
src/lib/radar/               # scoring rules + generatePersonalizedRadar/generateDraftRadar
src/lib/spotify/             # OAuth+PKCE, mock adapter, artist import/reconciliation
src/lib/email/               # HTML email renderer + EmailProvider adapter
src/lib/consent.ts           # consent ledger writes
src/app/onboarding/          # wizard route + submit Server Action
src/app/{radar,artists,preferences,settings,newsletter-preview}/
src/components/              # ui/, onboarding/, radar/, artists/, preferences/, settings/, layout/
```
