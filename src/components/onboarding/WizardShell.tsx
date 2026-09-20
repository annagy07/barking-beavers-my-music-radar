import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandMark } from "@/components/ui/BrandMark";
import { STEPS, StepId } from "@/lib/onboardingState";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";

export function WizardShell({
  step,
  children,
}: {
  step: StepId;
  children: React.ReactNode;
}) {
  const { t, locale } = useLocale();
  const index = STEPS.indexOf(step);
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-line">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/">
            <BrandMark className="text-lg" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              {t.onboarding.stepOfTotal(index + 1, STEPS.length)} · {t.onboarding.stepLabels[step]}
            </span>
            <LocaleToggle locale={locale} />
          </div>
        </Container>
        <div className="h-1 w-full bg-paper-raised">
          <div
            className="h-1 bg-accent transition-all duration-300"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>
      <main className="flex-1">
        <Container className="max-w-2xl py-12 sm:py-16">{children}</Container>
      </main>
    </div>
  );
}
