import { WhyThis } from "@/components/ui/WhyThis";
import { RadarItem } from "@/lib/radar/types";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function RadarItemCard({ item }: { item: RadarItem }) {
  const meta = [
    item.venue && item.city ? `${item.venue}, ${item.city}` : item.city,
    formatDate(item.eventDate ?? item.publishedAt),
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
          {item.title}
        </h3>
        {meta && <p className="mt-1 text-xs text-ink-soft">{meta}</p>}
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {item.description}
        </p>
        <WhyThis reason={item.reasons[0]} />
      </div>
    </article>
  );
}
