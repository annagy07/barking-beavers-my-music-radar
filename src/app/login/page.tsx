import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LoginForm } from "@/components/login/LoginForm";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);

  const errorCopy: Record<string, string> = {
    missing: t.login.errorMissing,
    expired: t.login.errorExpired,
  };

  return (
    <>
      <main className="flex-1">
        <Container className="max-w-md py-16 sm:py-20">
          <div className="flex justify-end">
            <LocaleToggle locale={locale} />
          </div>
          <Eyebrow className="mt-6">{t.login.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.login.title}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">{t.login.body}</p>

          {error && errorCopy[error] && (
            <p className="mt-4 border border-accent bg-accent/10 px-4 py-3 text-sm">
              {errorCopy[error]}
            </p>
          )}

          <div className="mt-8">
            <LoginForm />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
