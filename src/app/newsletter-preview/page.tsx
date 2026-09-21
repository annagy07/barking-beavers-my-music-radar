import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { buildNewsletterEmail } from "@/lib/email/sendScheduled";
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

  const [{ html }, preference] = await Promise.all([
    buildNewsletterEmail(user.id, user.email),
    db.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

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
