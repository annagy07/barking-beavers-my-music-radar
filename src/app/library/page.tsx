import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listRadarEditions } from "@/lib/radar/editions";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const editions = await listRadarEditions(user.id);

  return (
    <>
      <SiteHeader active="/library" />
      <main className="flex-1">
        <Container className="max-w-3xl py-12 sm:py-16">
          <Eyebrow>{t.library.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.library.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-soft">{t.library.body}</p>

          <div className="mt-10">
            {editions.length === 0 ? (
              <p className="border border-line bg-paper-raised/60 p-6 text-sm text-ink-soft">
                {t.library.empty}
              </p>
            ) : (
              <ul className="divide-y divide-line border border-line">
                {editions.map((edition) => (
                  <li key={edition.id}>
                    <Link
                      href={`/library/${edition.id}`}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-paper-raised"
                    >
                      <span className="font-medium">
                        {new Date(edition.generatedAt).toLocaleDateString(t.dateLocale, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="shrink-0 font-mono text-xs uppercase tracking-wide text-ink-soft">
                        {t.library.itemCount(edition.itemCount)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
