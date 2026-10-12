import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { buildNewsletterEmail } from "@/lib/email/sendScheduled";
import { getLatestRadarEdition } from "@/lib/radar/editions";
import { NEWSLETTER_FREQUENCIES } from "@/lib/constants";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { SendTestButton } from "@/components/newsletter/SendTestButton";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function NewsletterPreviewPage() {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect("/onboarding");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const [latestEdition, preference] = await Promise.all([
    getLatestRadarEdition(user.id),
    db.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

  // Mirrors /radar's own rule: once a real scheduled email has gone out,
  // this shows exactly that frozen edition instead of recomputing live —
  // otherwise the two pages (and the actual inbox) can silently drift
  // apart. Before the first send, there's nothing to mirror yet, so this
  // still falls back to a live, unfiltered preview.
  const isLive = !latestEdition;
  const { html } = await buildNewsletterEmail(user.id, user.email, latestEdition ?? undefined);

  const frequencyId = preference?.newsletterFrequency ?? "weekly";
  const frequencyLabel =
    (t.frequency[frequencyId]?.label ??
      NEWSLETTER_FREQUENCIES.find((f) => f.id === frequencyId)?.label ??
      t.frequency.weekly.label);

  return (
    <>
      <SiteHeader active="/newsletter-preview" />
      <main className="flex-1">
        <Container className="py-12 sm:py-16">
          <Eyebrow>{t.newsletterPreview.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.newsletterPreview.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-soft">
            {t.newsletterPreview.bodyBefore}
            {frequencyLabel.toLowerCase()}
            {t.newsletterPreview.bodyAfter}
          </p>

          {isLive && (
            <p className="mt-4 max-w-xl border border-line bg-paper-raised/60 px-4 py-3 text-sm text-ink-soft">
              {t.radar.liveNotice}
            </p>
          )}

          <div className="mt-8">
            <SendTestButton />
          </div>

          <div className="mt-8 border border-line bg-paper-raised/40 p-2 sm:p-6">
            <div className="mx-auto max-w-[640px]">
              <iframe
                title="Newsletter preview"
                srcDoc={html}
                className="h-[900px] w-full border border-line bg-white"
              />
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
