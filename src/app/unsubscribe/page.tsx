import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { UnsubscribeButton } from "@/components/newsletter/UnsubscribeButton";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function UnsubscribePage() {
  const user = await getCurrentUser();
  const subscription = user
    ? await db.newsletterSubscription.findUnique({ where: { userId: user.id } })
    : null;

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <>
      <main className="flex-1">
        <Container className="max-w-lg py-16 sm:py-20">
          <div className="flex justify-end">
            <LocaleToggle locale={locale} />
          </div>
          <Eyebrow className="mt-6">{t.unsubscribe.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.unsubscribe.title}
          </h1>

          {!user || !subscription ? (
            <p className="mt-4 text-sm text-ink-soft">{t.unsubscribe.noSub}</p>
          ) : subscription.status === "unsubscribed" ? (
            <p className="mt-4 text-sm text-ink-soft">{t.unsubscribe.already}</p>
          ) : (
            <>
              <p className="mt-4 text-sm text-ink-soft">
                {t.unsubscribe.oneClickBefore}
                {subscription.email}
                {t.unsubscribe.oneClickAfter}
              </p>
              <div className="mt-6">
                <UnsubscribeButton />
              </div>
            </>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
