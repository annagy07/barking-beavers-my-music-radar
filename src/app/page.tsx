import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BrandLogoImage, BrandMark } from "@/components/ui/BrandMark";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { getSessionUserId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function LandingPage() {
  // getCurrentUser() always falls back to the seeded demo account when
  // there's no session cookie (so reviewers can browse without signing
  // in) — the raw cookie check is what actually distinguishes "signed in"
  // here.
  const signedIn = Boolean(await getSessionUserId());
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <>
      <header className="border-b border-line">
        <Container className="flex h-16 items-center justify-between gap-6">
          <BrandMark className="text-lg" />
          <div className="flex items-center gap-5 font-mono text-xs uppercase tracking-wide">
            {signedIn ? (
              <Link
                href="/radar"
                className="text-ink-soft hover:text-accent"
              >
                {t.nav.myRadar} →
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-ink-soft hover:text-accent"
              >
                {t.nav.login}
              </Link>
            )}
            <Link
              href="/onboarding"
              className="text-ink-soft hover:text-accent"
            >
              {t.nav.buildMyRadar} →
            </Link>
            <LocaleToggle locale={locale} />
          </div>
        </Container>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="grain border-b border-line">
          <Container className="py-20 sm:py-28">
            <BrandLogoImage className="mb-8 h-24 sm:h-32" priority />
            <Eyebrow>{t.landing.kicker}</Eyebrow>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
              {t.landing.headlineLine1}
              <br />
              {t.landing.headlineLine2Prefix}
              <span className="radar-underline">{t.landing.headlineLine2Underlined}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              {t.landing.sub}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <LinkButton href="/onboarding" size="lg">
                {t.landing.ctaBuild}
              </LinkButton>
              <Link
                href="/newsletter-preview"
                className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
              >
                {t.landing.ctaSample} →
              </Link>
            </div>
          </Container>
        </section>

        {/* Three steps */}
        <section className="border-b border-line">
          <Container className="py-16 sm:py-20">
            <Eyebrow>{t.landing.howItWorks}</Eyebrow>
            <div className="mt-6 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {t.landing.steps.map((step, i) => (
                <div key={step.title}>
                  <div className="font-display text-3xl text-accent">
                    {String(i + 1).padStart(2, "0")}
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
            <Eyebrow>{t.landing.watchesKicker}</Eyebrow>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.landing.watchesHeadline}
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
              {t.landing.categoryPreview.map((c) => (
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
            <Eyebrow>{t.landing.dealKicker}</Eyebrow>
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-semibold">
                  {t.landing.controlTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {t.landing.controlBody}
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">
                  {t.landing.explainTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {t.landing.explainBody}
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section>
          <Container className="py-20 text-center sm:py-24">
            <h2 className="mx-auto max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.landing.ctaHeadline}
            </h2>
            <div className="mt-8">
              <LinkButton href="/onboarding" size="lg">
                {t.landing.ctaBuild}
              </LinkButton>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
