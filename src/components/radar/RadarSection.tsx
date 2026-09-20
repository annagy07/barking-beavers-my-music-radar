"use client";

import { useState } from "react";
import { RadarItem } from "@/lib/radar/types";
import { RadarItemCard } from "./RadarItemCard";

const COLLAPSED_COUNT = 6;

export function RadarSection({
  heading,
  items,
}: {
  heading: string;
  items: RadarItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hiddenCount = items.length - visible.length;

  return (
    <section className="mt-10 first:mt-0">
      <p className="border-b border-line pb-2 font-mono text-xs uppercase tracking-[0.14em] text-accent">
        {heading}
      </p>
      <div className="mt-5 space-y-6">
        {visible.map((item) => (
          <RadarItemCard key={item.id} item={item} />
        ))}
      </div>
      {items.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-6 font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
        >
          {expanded ? "Show fewer" : `Show ${hiddenCount} more →`}
        </button>
      )}
    </section>
  );
}
