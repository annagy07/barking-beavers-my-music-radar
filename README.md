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
cp .env.example .env             # then fill in DATABASE_POSTGRES_URL
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
2. In the project's **Storage** tab, create/connect a Postgres database and
   connect it to the project — this sets a `DATABASE_...` group of
   variables automatically (the exact names depend on the provider).
   This app reads **`DATABASE_POSTGRES_URL`** specifically:
   - **Prisma Postgres**: creates it for you automatically alongside
     `DATABASE_URL` (a `prisma+postgres://` Accelerate URL this app
     doesn't use — ignore it) — no extra steps needed.
   - **Neon / Supabase / any other Postgres**: add a variable named
     exactly `DATABASE_POSTGRES_URL` yourself under
     **Settings → Environment Variables**, with a normal
     `postgresql://...` connection string as its value.
3. Add `APP_SESSION_SECRET` (any random string) and `NEXT_PUBLIC_APP_URL`
   (your production URL, e.g. `https://your-app.vercel.app`) as environment
   variables. `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`/`RESEND_API_KEY`
   are optional — the app runs in mock mode without them.
4. Deploy. The build script (`prisma generate && prisma migrate deploy &&
   next build`) applies the schema to your new database automatically.
5. Seed it once, from your machine, pointed at the production database:
   ```bash
   DATABASE_POSTGRES_URL="<the same URL you set in Vercel>" npm run seed
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
- **Sign in** (`/login`) — passwordless: enter the email your subscription
  is under, get a single-use magic link (15 min expiry) via the same
  `EmailProvider` the newsletter uses. No password anywhere in the schema.
  Session is still just the lightweight cookie from `src/lib/session.ts` —
  this only adds a way back in in on a browser that never onboarded.
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
- **Scheduled sending** (optional — needs `RESEND_API_KEY`) — a daily
  Vercel Cron (`/api/cron/send-newsletters`, see below) sends the digest to
  every active subscriber whose chosen frequency (weekly/twice-weekly/
  daily) makes them due that day.
- **Privacy controls** — disconnect Spotify, delete imported Spotify taste
  data (separate from disconnecting), pause/resume/unsubscribe newsletter,
  delete account. `/privacy` and `/unsubscribe` placeholders.
- **Live content sync** (optional — see below) — real releases, concerts,
  videos and blog coverage for artists people actually follow, pulled from
  Spotify, Ticketmaster, YouTube and music-blog RSS feeds on a daily
  Vercel Cron, on top of the seeded catalog.

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

## Live content sync (real releases, concerts, videos, blog news)

The seeded catalog covers a fixed set of ~60 artists. To pull **real**
content — for whichever artists people actually follow, not just the seed
list — `src/lib/sources/` has four independent adapters, each normalizing
into the same `MusicEvent` shape the rest of the app already reads from:

- `spotifyReleases.ts` — new singles/albums, via Spotify's Client
  Credentials flow (public catalog data, no extra account setup — reuses
  `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`). Only artists with a
  `spotifyId` (set automatically once they're imported via onboarding's
  Spotify connect) are checked; releases older than 90 days are skipped so
  a first sync doesn't dump an artist's whole back catalog. Also records
  the release's cover art (`MusicEvent.imageUrl`, a Spotify CDN URL) —
  shown as a thumbnail on both `/radar` and in the newsletter.
- `ticketmaster.ts` — upcoming shows, via Ticketmaster's Discovery API —
  free, self-serve, no partner approval needed (unlike Bandsintown/
  Songkick's event APIs, which now require one). Needs
  `TICKETMASTER_API_KEY`. Only keeps results where the artist is an actual
  listed attraction, since Ticketmaster's keyword search can otherwise
  surface loosely-related events. Presale windows are collapsed to one
  "tour presale" row per artist (whichever opens soonest) rather than one
  per venue, since a tour's presale is almost always the same window
  across every date.
- `youtube.ts` — new uploads, via the YouTube Data API. Needs
  `YOUTUBE_API_KEY`. Resolves each artist's channel once (the expensive
  search call) and caches it on `Artist.youtubeChannelId`, then reads new
  uploads via the channel's uploads playlist (1 quota unit instead of 100)
  on every later sync.
- `blogNews.ts` — coverage from ~20 music blogs/magazines' public RSS/Atom
  feeds, no API key needed — genre-diverse (indie, hip-hop, electronic,
  metal, pop) and UK/US/DE/FR/Nordic (Pitchfork, NME, Clash, Rolling
  Stone, Billboard, Mixmag, DJ Mag, Loudwire, Metal Hammer, Consequence,
  BrooklynVegan, Rap-Up, Okayplayer, DIY Magazine, The Line of Best Fit,
  Stereogum, Les Inrockuptibles, GAFFA; German: Musikexpress, Rolling
  Stone DE). This is the only source that can catch things no structured
  API tracks, like merch or album-cycle news. Each feed is fetched once
  per sync (not once per artist), with bounded concurrency
  (FEED_CONCURRENCY), and matched against followed artists' names in the
  title; items older than 14 days are skipped. Recorded as a "fact"
  MusicEvent (subtype "interesting_fact") rather than its own type — it
  rides along under the existing "Interesting facts" category/section
  instead of a separate "Blog coverage" one, since blog matching is
  looser than the other three (title substring match, no structured
  "this is about artist X" field to key off) and didn't earn its own
  bucket. A headline that looks tour/concert-flavored (looksLikeTourNews:
  keyword match, English + German) is recorded as "tour" instead — with
  no self-serve concert API available (Ticketmaster only, Bandsintown is
  partner-only), this is currently the only real source Tour
  announcements has at all; Ticketmaster itself only ever produces
  per-venue "concert"/"presale" rows, never a tour-level announcement.

Each adapter is independent and simply no-ops (or, for blogNews, just logs
a per-feed error and keeps going) if its own env var isn't set — you don't
need all four. All are dedup-safe (skip an event that already exists for
that artist/type/title) and never touch any User-related table.

**Setup:**

1. Add `TICKETMASTER_API_KEY` (instant, free — see the comment in
   `.env.example` for the signup link) and/or `YOUTUBE_API_KEY` (free
   Google Cloud API key) as environment variables — locally in `.env`,
   and in Vercel under Settings → Environment Variables for production.
2. Add `CRON_SECRET` (any random string) the same way. It's required to
   call any `/api/cron/sync-*` route at all — Vercel automatically attaches
   it as a Bearer token to its own scheduled requests once it's set.
3. `vercel.json` already schedules a daily sync for each source, staggered
   a few minutes apart (`sync-spotify` 06:00 UTC, `sync-ticketmaster`
   06:10, `sync-youtube` 06:20, `sync-blognews` 06:30) — Vercel picks this
   up automatically on deploy, no dashboard configuration needed. They're
   separate routes/invocations, not one combined route, because combining
   all four sources across 100+ followed artists in a single Vercel
   function call reliably exceeds its execution time limit; each source
   alone comfortably fits.
4. To trigger a sync immediately instead of waiting for the schedule, call
   any of them the same way:
   ```bash
   curl -X POST -H "Authorization: Bearer <CRON_SECRET>" \
     https://<your-domain>/api/cron/sync-spotify
   ```
   (`sync-ticketmaster`, `sync-youtube`, `sync-blognews` work the same
   way.) Each returns a JSON summary (items created, artists processed,
   any per-artist errors) so you can see it actually pulled something.
   `/api/cron/sync-content` also still exists and runs all four at once —
   fine for a small test account, but expect it to time out at real
   scale; prefer the per-source routes above.

No other code changes needed — the adapter switches automatically.

## Sending the newsletter for real

By default the app runs in dev mode: email "sends" just log to the server
console (`src/lib/email/provider.ts`), and nothing goes out on a schedule —
`/newsletter-preview`'s "Send test email" button is the only way anything
gets sent, and only to the currently signed-in user.

**1. Get real delivery working (Resend):**

1. Create a free account at [resend.com](https://resend.com) (3,000
   emails/month, 100/day on the free tier).
2. **Settings → API Keys → Create API Key**, copy the `re_...` value.
3. Set `RESEND_API_KEY` (the key) and `EMAIL_FROM` as environment
   variables — locally in `.env`, in Vercel under Settings → Environment
   Variables for production.
4. Without a verified sending domain, `EMAIL_FROM` **must** be
   `Barking Beaver <onboarding@resend.dev>` (Resend's fixed sandbox
   sender) — and Resend will only actually deliver to the email address
   your Resend account itself is registered with, not arbitrary
   recipients. To send to real subscribers you'll eventually need to
   verify a domain you control (Resend → Domains → Add Domain, then add
   the DNS records it gives you), after which `EMAIL_FROM` can be any
   address `@your-domain`.
5. `emailProvider` in `src/lib/email/provider.ts` picks Resend up
   automatically once `RESEND_API_KEY` is set — no other code changes
   needed. Test via `/newsletter-preview` → "Send test email".

**2. Turn on scheduled sending:**

`vercel.json` already schedules `/api/cron/send-newsletters` daily at
07:00 UTC (after the content-sync crons, so the digest reflects freshly
synced content) — picked up automatically on deploy, needs the same
`CRON_SECRET` as the sync routes. It sends to every active subscriber
whose `newsletterFrequency` preference makes them due that day (`weekly`
→ Mondays, `twice_weekly` → Mondays and Thursdays, `daily` → every day),
tracked via `NewsletterSubscription.lastSentAt` so re-running it the same
day is a no-op. To trigger it manually:

```bash
curl -X POST -H "Authorization: Bearer <CRON_SECRET>" \
  https://<your-domain>/api/cron/send-newsletters
```

Returns a JSON summary (candidates considered, sent, skipped as not due,
any per-subscriber errors).

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
