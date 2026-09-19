import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandMark } from "@/components/ui/BrandMark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line py-10">
      <Container className="flex flex-col gap-4 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <BrandMark className="text-base" />
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wide">
          <Link href="/onboarding" className="hover:text-accent">
            Build my radar
          </Link>
          <Link href="/newsletter-preview" className="hover:text-accent">
            Newsletter preview
          </Link>
          <Link href="/privacy" className="hover:text-accent">
            Privacy policy
          </Link>
          <Link href="/unsubscribe" className="hover:text-accent">
            Unsubscribe
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
