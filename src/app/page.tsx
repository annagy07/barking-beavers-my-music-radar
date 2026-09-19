import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BrandLogoImage, BrandMark } from "@/components/ui/BrandMark";

const STEPS = [
  {
    n: "01",
    title: "Tell us what you like",
    body: "Connect Spotify read-only, or hand-pick artists yourself. Either way, you decide what counts.",
  },
  {
    n: "02",
    title: "We scan trusted music sources",
    body: "Official sites, labels, venues and credible publications — weighted by how trustworthy they are, every time.",
  },
  {
    n: "03",
    title: "You receive a personalized digest",
    body: "Releases, shows and stories that match rules you can see and edit — not a feed that never ends.",
  },
];

const CATEGORY_PREVIEW = [
  "New releases",
  "Upcoming releases",
  "Concerts",
  "Tour announcements",
  "Interviews",
  "Videos",
  "Collaborations",
  "Interesting facts",
];

export default function LandingPage() {
  return (
    <>
      <header className="border-b border-line">
        <Container className="flex h-16 items-center justify-between">
          <BrandMark className="text-lg" />
          <Link
            href="/onboarding"
            className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
          >
            Build my radar →
          </Link>
        </Container>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="grain border-b border-line">
          <Container className="py-20 sm:py-28">
            <BrandLogoImage className="mb-8 h-24 sm:h-32" priority />
            <Eyebrow>Not a streaming app. Not a feed.</Eyebrow>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
              Your personal
              <br />
              music <span className="radar-underline">radar.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              No feed. No black-box algorithm. Just the releases, shows and
              stories that matter to you.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <LinkButton href="/onboarding" size="lg">
                Build my music radar
              </LinkButton>
              <Link
                href="/newsletter-preview"
                className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
              >
                See a sample digest →
              </Link>
            </div>
          </Container>
        </section>

        {/* Three steps */}
        <section className="border-b border-line">
          <Container className="py-16 sm:py-20">
            <Eyebrow>How it works</Eyebrow>
            <div className="mt-6 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((step) => (
                <div key={step.n}>
                  <div className="font-display text-3xl text-accent">
                    {step.n}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Categories */}
        <section className="border-b border-line">
          <Container className="py-16 sm:py-20">
            <Eyebrow>What your radar watches</Eyebrow>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything worth knowing. Nothing you didn&rsquo;t ask for.
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
              {CATEGORY_PREVIEW.map((c) => (
                <li
                  key={c}
                  className="bg-paper px-4 py-6 text-sm font-medium sm:px-5 sm:py-8"
                >
                  {c}
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Principles */}
        <section className="border-b border-line">
          <Container className="py-16 sm:py-20">
            <Eyebrow>The deal</Eyebrow>
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-semibold">
                  You control the rules.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Spotify is only an input — an easy way to tell us what you
                  already like. It never drives recommendations on its own,
                  and you can disconnect it or delete the imported taste data
                  any time.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">
                  Every item explains itself.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  &ldquo;Why am I seeing this?&rdquo; sits under everything we
                  send you. No opaque scoring, no engagement games — just
                  transparent, editable rules.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section>
          <Container className="py-20 text-center sm:py-24">
            <h2 className="mx-auto max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Tell us what you care about. We&rsquo;ll make sure you don&rsquo;t
              miss anything relevant.
            </h2>
            <div className="mt-8">
              <LinkButton href="/onboarding" size="lg">
                Build my music radar
              </LinkButton>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
