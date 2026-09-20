import { useLocale } from "@/components/i18n/LocaleProvider";

// No "use client" of its own, but always reached through RadarItemCard ->
// RadarSection (a Client Component), so it's safe to use useLocale() here.
export function WhyThis({ reason }: { reason: string }) {
  const { t } = useLocale();
  return (
    <details className="group mt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        {t.radarSections.whyThis}
        <span className="transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <p className="mt-2 max-w-md border-l-2 border-accent/60 pl-3 text-sm leading-relaxed text-ink-soft">
        {reason}
      </p>
    </details>
  );
}
