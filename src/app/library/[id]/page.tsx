import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getRadarEditionById } from "@/lib/radar/editions";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { RadarSections } from "@/components/radar/RadarSections";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function LibraryEditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const { id } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);

  const radar = await getRadarEditionById(user.id, id);
  if (!radar) {
    return (
      <>
        <SiteHeader active="/library" />
        <main className="flex-1">
          <Container className="max-w-3xl py-12 sm:py-16">
            <Eyebrow>{t.library.eyebrow}</Eyebrow>
            <p className="mt-3 text-sm text-ink-soft">{t.library.notFound}</p>
            <Link href="/library" className="mt-6 inline-block underline hover:text-accent">
              {t.library.backToLibrary}
            </Link>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  const generated = new Date(radar.generatedAt).toLocaleString(t.dateLocale, {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <>
      <SiteHeader active="/library" />
      <main className="flex-1">
        <Container className="max-w-3xl py-12 sm:py-16">
          <Link
            href="/library"
            className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
          >
            ← {t.library.backToLibrary}
          </Link>
          <Eyebrow className="mt-6">{t.library.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.radar.generated(generated)}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">{t.library.itemCount(radar.items.length)}</p>

          <div className="mt-10">
            <RadarSections radar={radar} t={t} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
