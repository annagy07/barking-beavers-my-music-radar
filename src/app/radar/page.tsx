import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { generatePersonalizedRadar } from "@/lib/radar/generateRadar";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { RadarSections } from "@/components/radar/RadarSections";

export default async function RadarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [radar, artistCount, preference] = await Promise.all([
    generatePersonalizedRadar(user.id),
    db.userArtistPreference.count({ where: { userId: user.id, blocked: false } }),
    db.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

  const generated = new Date(radar.generatedAt).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <>
      <SiteHeader active="/radar" />
      <main className="flex-1">
        <Container className="max-w-3xl py-12 sm:py-16">
          <Eyebrow>Your radar</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {radar.items.length > 0
              ? "What's on your radar"
              : "Your radar is quiet right now"}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Generated {generated} · tracking {artistCount} artist
            {artistCount === 1 ? "" : "s"}
            {preference?.city ? ` · ${preference.city}` : ""} ·{" "}
            <Link href="/newsletter-preview" className="underline hover:text-accent">
              see this as an email
            </Link>
          </p>

          <div className="mt-10">
            <RadarSections radar={radar} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
