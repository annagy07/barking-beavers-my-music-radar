import { RadarItem } from "@/lib/radar/types";
import { RadarItemCard } from "./RadarItemCard";

export function RadarSection({
  heading,
  items,
}: {
  heading: string;
  items: RadarItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10 first:mt-0">
      <p className="border-b border-line pb-2 font-mono text-xs uppercase tracking-[0.14em] text-accent">
        {heading}
      </p>
      <div className="mt-5 space-y-6">
        {items.map((item) => (
          <RadarItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
