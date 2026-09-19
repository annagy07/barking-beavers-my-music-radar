import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { generatePersonalizedRadar } from "@/lib/radar/generateRadar";
import { renderNewsletterHtml } from "@/lib/email/render";
import { isSpotifyConfigured } from "@/lib/spotify";
import { NEWSLETTER_FREQUENCIES } from "@/lib/constants";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { SendTestButton } from "@/components/newsletter/SendTestButton";

export default async function NewsletterPreviewPage() {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect("/onboarding");

  const [radar, preference] = await Promise.all([
    generatePersonalizedRadar(user.id),
    db.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

  const frequencyLabel =
    NEWSLETTER_FREQUENCIES.find((f) => f.id === preference?.newsletterFrequency)
      ?.label ?? "Weekly";

  const html = renderNewsletterHtml(radar, {
    email: user.email,
    frequencyLabel,
    city: preference?.city ?? null,
    unsubscribeUrl: "/unsubscribe",
    preferencesUrl: "/preferences",
  });

  return (
    <>
      <SiteHeader active="/newsletter-preview" />
      <main className="flex-1">
        <Container className="py-12 sm:py-16">
          <Eyebrow>Newsletter preview</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Exactly what lands in your inbox
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-soft">
            This renders the same HTML the {frequencyLabel.toLowerCase()}{" "}
            email would use.{" "}
            {isSpotifyConfigured
              ? ""
              : "Spotify is running in mock mode locally, so imported artists come from a realistic sample library."}{" "}
            No live email provider is required — sending uses a development
            adapter unless RESEND_API_KEY is configured.
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
