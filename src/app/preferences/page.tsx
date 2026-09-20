import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { PreferencesManager } from "@/components/preferences/PreferencesManager";
import { ContentCategoryId, NewsletterFrequencyId } from "@/lib/constants";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function PreferencesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const preference = await db.userPreference.findUnique({
    where: { userId: user.id },
  });
  if (!preference) redirect("/onboarding");

  return (
    <>
      <SiteHeader active="/preferences" />
      <main className="flex-1">
        <Container className="max-w-2xl py-12 sm:py-16">
          <Eyebrow>{t.preferences.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.preferences.title}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">{t.preferences.body}</p>

          <div className="mt-10">
            <PreferencesManager
              initial={{
                contentCategories: JSON.parse(
                  preference.contentCategories,
                ) as ContentCategoryId[],
                discoveryLevel: preference.discoveryLevel,
                city: preference.city ?? "",
                concertRadiusKm: preference.concertRadiusKm,
                concertLookaheadDays: preference.concertLookaheadDays,
                newsletterFrequency:
                  preference.newsletterFrequency as NewsletterFrequencyId,
                instantPresaleAlerts: preference.instantPresaleAlerts,
              }}
            />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
