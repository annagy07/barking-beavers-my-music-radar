import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { UnsubscribeButton } from "@/components/newsletter/UnsubscribeButton";

export default async function UnsubscribePage() {
  const user = await getCurrentUser();
  const subscription = user
    ? await db.newsletterSubscription.findUnique({ where: { userId: user.id } })
    : null;

  return (
    <>
      <main className="flex-1">
        <Container className="max-w-lg py-16 sm:py-20">
          <Eyebrow>Unsubscribe</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Sorry to see you go
          </h1>

          {!user || !subscription ? (
            <p className="mt-4 text-sm text-ink-soft">
              We couldn&rsquo;t find an active subscription for this session.
              If you followed a link from an email, you&rsquo;re most likely
              already unsubscribed.
            </p>
          ) : subscription.status === "unsubscribed" ? (
            <p className="mt-4 text-sm text-ink-soft">
              You&rsquo;re unsubscribed. You won&rsquo;t receive any further
              emails from Wavelength.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-ink-soft">
                One click stops your {subscription.email} newsletter and
                records your withdrawn consent. Your artists and preferences
                stay saved if you come back.
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
