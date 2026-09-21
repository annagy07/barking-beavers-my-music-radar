import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandMark } from "@/components/ui/BrandMark";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { getSessionUserId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export async function SiteHeader({ active }: { active?: string }) {
  // Raw cookie check, not getCurrentUser() — that always falls back to the
  // seeded demo account when there's no cookie, so it can't tell a real
  // signed-in visitor from a signed-out one browsing the demo data.
  const signedIn = Boolean(await getSessionUserId());
  const locale = await getLocale();
  const t = getDictionary(locale);

  const baseNav = [
    { href: "/radar", label: t.nav.radar },
    { href: "/library", label: t.nav.library },
    { href: "/artists", label: t.nav.artists },
    { href: "/preferences", label: t.nav.preferences },
    { href: "/newsletter-preview", label: t.nav.newsletter },
    { href: "/settings", label: t.nav.settings },
  ];
  const nav = signedIn ? baseNav : [...baseNav, { href: "/login", label: t.nav.login }];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/radar" className="shrink-0">
          <BrandMark className="text-lg" />
        </Link>
        <nav className="flex flex-1 items-center gap-5 overflow-x-auto font-mono text-xs uppercase tracking-wide">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "shrink-0 " +
                (active === item.href
                  ? "text-accent"
                  : "text-ink-soft hover:text-ink")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LocaleToggle locale={locale} />
      </Container>
    </header>
  );
}
