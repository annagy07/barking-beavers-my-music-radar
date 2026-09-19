import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { PreferencesManager } from "@/components/preferences/PreferencesManager";
import { ContentCategoryId, NewsletterFrequencyId } from "@/lib/constants";

export default async function PreferencesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const preference = await db.userPreference.findUnique({
    where: { userId: user.id },
  });
  if (!preference) redirect("/onboarding");

  return (
    <>
      <SiteHeader active="/preferences" />
      <main className="flex-1">
        <Container className="max-w-2xl py-12 sm:py-16">
          <Eyebrow>Your preferences</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Edit your preferences
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Every change here re-shapes your radar immediately.
          </p>

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
