import { RadarResult } from "@/lib/radar/types";
import { RadarSection } from "./RadarSection";

const SECTION_HEADINGS: { key: keyof RadarResult["sections"]; heading: string }[] = [
  { key: "justReleased", heading: "Just released" },
  { key: "upcoming", heading: "Upcoming" },
  { key: "liveNearYou", heading: "Live near you" },
  { key: "tours", heading: "Tour announcements" },
  { key: "presales", heading: "Presales" },
  { key: "videos", heading: "Music videos" },
  { key: "interviews", heading: "Interviews" },
  { key: "collaborations", heading: "Collaborations" },
  { key: "facts", heading: "Interesting facts" },
  { key: "blogNews", heading: "Blog coverage" },
  { key: "discovery", heading: "Discovery" },
];

export function RadarSections({ radar }: { radar: RadarResult }) {
  if (radar.items.length === 0) {
    return (
      <p className="border border-line bg-paper-raised/60 p-6 text-sm text-ink-soft">
        Nothing matches your current preferences yet. Try widening your
        concert radius, enabling more categories, or raising your discovery
        level.
      </p>
    );
  }

  return (
    <div>
      {SECTION_HEADINGS.map(({ key, heading }) => (
        <RadarSection key={key} heading={heading} items={radar.sections[key]} />
      ))}
    </div>
  );
}
