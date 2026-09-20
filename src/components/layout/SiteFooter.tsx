import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandMark } from "@/components/ui/BrandMark";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <footer className="mt-auto border-t border-line py-10">
      <Container className="flex flex-col gap-4 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <BrandMark className="text-base" />
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wide">
          <Link href="/onboarding" className="hover:text-accent">
            {t.footer.buildMyRadar}
          </Link>
          <Link href="/newsletter-preview" className="hover:text-accent">
            {t.footer.newsletterPreview}
          </Link>
          <Link href="/privacy" className="hover:text-accent">
            {t.footer.privacyPolicy}
          </Link>
          <Link href="/unsubscribe" className="hover:text-accent">
            {t.footer.unsubscribe}
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
