import Link from "next/link";
import { Container } from "@/components/ui/Container";

const NAV = [
  { href: "/radar", label: "Radar" },
  { href: "/artists", label: "Artists" },
  { href: "/preferences", label: "Preferences" },
  { href: "/newsletter-preview", label: "Newsletter" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link
          href="/radar"
          className="shrink-0 font-display text-lg font-semibold tracking-tight"
        >
          Wavelength
        </Link>
        <nav className="flex flex-1 items-center gap-5 overflow-x-auto font-mono text-xs uppercase tracking-wide">
          {NAV.map((item) => (
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
