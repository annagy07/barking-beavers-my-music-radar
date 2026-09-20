import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandMark } from "@/components/ui/BrandMark";
import { getSessionUserId } from "@/lib/session";

const BASE_NAV = [
  { href: "/radar", label: "Radar" },
  { href: "/artists", label: "Artists" },
  { href: "/preferences", label: "Preferences" },
  { href: "/newsletter-preview", label: "Newsletter" },
  { href: "/settings", label: "Settings" },
];

export async function SiteHeader({ active }: { active?: string }) {
  // Raw cookie check, not getCurrentUser() — that always falls back to the
  // seeded demo account when there's no cookie, so it can't tell a real
  // signed-in visitor from a signed-out one browsing the demo data.
  const signedIn = Boolean(await getSessionUserId());
  const nav = signedIn ? BASE_NAV : [...BASE_NAV, { href: "/login", label: "Log in" }];

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
      </Container>
    </header>
  );
}
