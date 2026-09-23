import { WhyThis } from "@/components/ui/WhyThis";
import { RadarItem } from "@/lib/radar/types";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { decodeHtmlEntities } from "@/lib/htmlEntities";

function formatDate(iso: string | null, dateLocale: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// No "use client" of its own, but its only caller (RadarSection) is a
// Client Component, so this always ends up bundled and rendered client
// side too — safe to use useLocale() here.
export function RadarItemCard({ item }: { item: RadarItem }) {
  const { t } = useLocale();
  const meta = [
    item.venue && item.city ? `${item.venue}, ${item.city}` : item.city,
    formatDate(item.eventDate ?? item.publishedAt, t.dateLocale),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex gap-4 border-l-2 border-accent py-1 pl-5">
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- external, unoptimizable Spotify CDN URLs
        <img
          src={item.imageUrl}
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 shrink-0 border border-line object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
          {item.artistName}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
            >
              {decodeHtmlEntities(item.title)}
            </a>
          ) : (
            decodeHtmlEntities(item.title)
          )}
        </h3>
        {meta && <p className="mt-1 text-xs text-ink-soft">{meta}</p>}
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {decodeHtmlEntities(item.description)}
        </p>
        <WhyThis reason={item.reasons[0]} />
      </div>
    </article>
  );
}
