import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { SettingsManager } from "@/components/settings/SettingsManager";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [spotify, newsletter, artistCount] = await Promise.all([
    db.connectedAccount.findFirst({
      where: { userId: user.id, provider: "spotify" },
    }),
    db.newsletterSubscription.findUnique({ where: { userId: user.id } }),
    db.userArtistPreference.count({
      where: {
        userId: user.id,
        source: { in: ["spotify_followed_artist", "spotify_top_artist", "spotify_saved_music"] },
      },
    }),
  ]);

  return (
    <>
      <SiteHeader active="/settings" />
      <main className="flex-1">
        <Container className="max-w-2xl py-12 sm:py-16">
          <Eyebrow>Settings</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Account &amp; connected services
          </h1>

          <div className="mt-10">
            <SettingsManager
              email={user.email ?? ""}
              spotifyConnected={Boolean(spotify && !spotify.disconnectedAt)}
              spotifyImportedCount={artistCount}
              newsletterStatus={
                (newsletter?.status as "active" | "paused" | "unsubscribed") ??
                "active"
              }
            />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
