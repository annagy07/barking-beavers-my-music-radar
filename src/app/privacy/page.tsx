import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <>
      <main className="flex-1">
        <Container className="max-w-2xl py-16 sm:py-20">
          <div className="flex justify-end">
            <LocaleToggle locale={locale} />
          </div>
          <Eyebrow className="mt-6">{t.privacy.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.privacy.title}
          </h1>
          <p className="mt-4 text-sm text-ink-soft">{t.privacy.intro}</p>

          <div className="mt-10 space-y-8">
            {t.privacy.sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-display text-xl font-semibold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm">
            <Link href="/settings" className="underline hover:text-accent">
              {t.privacy.manageLink}
            </Link>
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
