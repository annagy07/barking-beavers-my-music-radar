import { RadarResult } from "@/lib/radar/types";
import { RadarSection } from "./RadarSection";
import type { Dictionary } from "@/lib/i18n";

const SECTION_ORDER: (keyof RadarResult["sections"])[] = [
  "justReleased",
  "upcoming",
  "liveNearYou",
  "tours",
  "presales",
  "videos",
  "interviews",
  "collaborations",
  "facts",
  "blogNews",
  "discovery",
];

// Rendered from both a Server Component (radar/page.tsx) and a Client
// Component (onboarding's StepPreview.tsx) — the dictionary is threaded in
// as a prop rather than read via useLocale(), since that hook only works
// once inside an actual client boundary, which this file isn't always in.
export function RadarSections({ radar, t }: { radar: RadarResult; t: Dictionary }) {
  if (radar.items.length === 0) {
    return (
      <p className="border border-line bg-paper-raised/60 p-6 text-sm text-ink-soft">
        {t.radarSections.empty}
      </p>
    );
  }

  return (
    <div>
      {SECTION_ORDER.map((key) => (
        <RadarSection
          key={key}
          heading={t.radarSections.headings[key]}
          items={radar.sections[key]}
        />
      ))}
    </div>
  );
}
