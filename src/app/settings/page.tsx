import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { SettingsManager } from "@/components/settings/SettingsManager";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ playlist?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const { playlist: playlistStatus } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);

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

  const spotifyConnected = Boolean(spotify && !spotify.disconnectedAt);
  const playlistScoped = Boolean(
    spotifyConnected && spotify?.scope?.includes("playlist-modify-private"),
  );

  return (
    <>
      <SiteHeader active="/settings" />
      <main className="flex-1">
        <Container className="max-w-2xl py-12 sm:py-16">
          <Eyebrow>{t.settings.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.settings.title}
          </h1>

          <div className="mt-10">
            <SettingsManager
              email={user.email ?? ""}
              spotifyConnected={spotifyConnected}
              spotifyImportedCount={artistCount}
              newsletterStatus={
                (newsletter?.status as "active" | "paused" | "unsubscribed") ??
                "active"
              }
              playlistScoped={playlistScoped}
              playlistId={spotify?.playlistId ?? null}
              playlistStatus={playlistStatus === "error" ? "error" : playlistStatus === "connected" ? "connected" : null}
            />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
