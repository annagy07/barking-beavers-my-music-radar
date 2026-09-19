import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import Link from "next/link";

const SECTIONS = [
  {
    title: "What we store",
    body: "Only what the product needs to work: the artists you choose or import, your content and concert preferences, your email address, and a record of your consent. We do not store raw Spotify listening history — only the derived list of artists you follow, your top artists, and artists behind your saved tracks.",
  },
  {
    title: "Spotify access",
    body: "We request read-only scopes — user-follow-read, user-top-read and user-library-read. We never request your email from Spotify, never write to your account, and never use Spotify's own recommendation engine.",
  },
  {
    title: "Consent",
    body: "Newsletter consent is recorded as an explicit, timestamped, opt-in event — never pre-checked. Withdrawing consent (unsubscribing) is recorded the same way, and both are kept as a permanent, append-only history.",
  },
  {
    title: "Your controls",
    body: "You can disconnect Spotify, delete the artist data imported from Spotify, pause or unsubscribe from the newsletter, and permanently delete your account and all associated data — all from Settings.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <main className="flex-1">
        <Container className="max-w-2xl py-16 sm:py-20">
          <Eyebrow>Privacy</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Privacy policy
          </h1>
          <p className="mt-4 text-sm text-ink-soft">
            This is a demo MVP. The principles below describe how the product
            is architected to behave — not a substitute for a lawyer-reviewed
            policy in production.
          </p>

          <div className="mt-10 space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="font-display text-xl font-semibold">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm">
            <Link href="/settings" className="underline hover:text-accent">
              Manage your data in Settings
            </Link>
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
