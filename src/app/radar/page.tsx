import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { generatePersonalizedRadar } from "@/lib/radar/generateRadar";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { RadarSections } from "@/components/radar/RadarSections";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function RadarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const [radar, artistCount, preference] = await Promise.all([
    generatePersonalizedRadar(user.id),
    db.userArtistPreference.count({ where: { userId: user.id, blocked: false } }),
    db.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

  const generated = new Date(radar.generatedAt).toLocaleString(t.dateLocale, {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <>
      <SiteHeader active="/radar" />
      <main className="flex-1">
        <Container className="max-w-3xl py-12 sm:py-16">
          <Eyebrow>{t.radar.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {radar.items.length > 0 ? t.radar.titleHasItems : t.radar.titleEmpty}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            {t.radar.generated(generated)} · {t.radar.tracking(artistCount)}
            {preference?.city ? ` · ${t.cities[preference.city] ?? preference.city}` : ""} ·{" "}
            <Link href="/newsletter-preview" className="underline hover:text-accent">
              {t.radar.seeAsEmail}
            </Link>
          </p>

          <div className="mt-10">
            <RadarSections radar={radar} t={t} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
