import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { ArtistsManager } from "@/components/artists/ArtistsManager";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";

export default async function ArtistsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const preferences = await db.userArtistPreference.findMany({
    where: { userId: user.id },
    include: { artist: true },
    orderBy: { createdAt: "asc" },
  });

  const artists = preferences.map((p) => ({
    artistId: p.artistId,
    name: p.artist.name,
    genres: JSON.parse(p.artist.genres) as string[],
    source: p.source as
      | "manual"
      | "spotify_followed_artist"
      | "spotify_top_artist"
      | "spotify_saved_music",
    relevance: p.relevance as "essential" | "interested" | "occasional",
    blocked: p.blocked,
  }));

  return (
    <>
      <SiteHeader active="/artists" />
      <main className="flex-1">
        <Container className="max-w-3xl py-12 sm:py-16">
          <Eyebrow>{t.artists.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t.artists.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-soft">{t.artists.body}</p>

          <div className="mt-10">
            <ArtistsManager initialArtists={artists} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
